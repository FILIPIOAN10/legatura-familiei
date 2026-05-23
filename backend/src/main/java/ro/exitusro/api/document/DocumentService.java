package ro.exitusro.api.document;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ro.exitusro.api.audit.AuditService;
import ro.exitusro.api.cases.CaseAccessGuard;
import ro.exitusro.api.cases.CaseEntity;
import ro.exitusro.api.cases.CaseRepository;
import ro.exitusro.api.cases.CaseService;
import ro.exitusro.api.cases.dto.CaseDto;
import ro.exitusro.api.common.enums.AppRole;
import ro.exitusro.api.common.enums.DocumentType;
import ro.exitusro.api.common.exception.BadRequestException;
import ro.exitusro.api.common.exception.ForbiddenException;
import ro.exitusro.api.common.exception.NotFoundException;
import ro.exitusro.api.document.dto.DocumentDto;
import ro.exitusro.api.document.dto.IssueCmcdRequest;
import ro.exitusro.api.document.dto.IssueDeathCertRequest;
import ro.exitusro.api.document.pdf.PdfGenerationService;
import ro.exitusro.api.security.CurrentUser;
import ro.exitusro.api.security.SecurityUtils;
import ro.exitusro.api.storage.SupabaseStorageClient;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private static final int SIGNED_URL_TTL = 60 * 60; // 1 hour

    private final DocumentRepository documentRepository;
    private final CaseRepository caseRepository;
    private final CaseAccessGuard guard;
    private final CaseService caseService;
    private final PdfGenerationService pdfService;
    private final SupabaseStorageClient storage;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<DocumentDto> listForCase(UUID caseId) {
        CurrentUser user = SecurityUtils.currentUser();
        guard.loadVisible(caseId, caseRepository, user);

        return documentRepository.findByCaseIdOrderByIssuedAtDesc(caseId).stream()
                .map(d -> DocumentDto.fromEntity(d,
                        d.getStoragePath() == null ? null : storage.signedUrl(d.getStoragePath(), SIGNED_URL_TTL)))
                .toList();
    }

    @Transactional
    public DocumentDto upload(UUID caseId, DocumentType type, String title, MultipartFile file) {
        CurrentUser user = SecurityUtils.currentUser();
        CaseEntity c = guard.loadVisible(caseId, caseRepository, user);

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Fisier lipsa");
        }

        String path = "cases/" + c.getId() + "/" + UUID.randomUUID() + "_" + safeName(file.getOriginalFilename());
        try {
            storage.upload(path, file.getBytes(),
                    file.getContentType() == null ? "application/octet-stream" : file.getContentType());
        } catch (IOException e) {
            throw new BadRequestException("Eroare la citirea fisierului");
        }

        DocumentEntity entity = DocumentEntity.builder()
                .caseId(caseId)
                .type(type)
                .title(title != null ? title : file.getOriginalFilename())
                .storagePath(path)
                .uploadedBy(user.getId())
                .signed(false)
                .build();
        DocumentEntity saved = documentRepository.save(entity);

        auditService.log(caseId, "DOCUMENT_UPLOADED",
                Map.of("type", type.name(), "documentId", saved.getId().toString()));

        return DocumentDto.fromEntity(saved, storage.signedUrl(path, SIGNED_URL_TTL));
    }

    /**
     * Doctor issues the CMCD: generates the PDF, stores it, attaches a document
     * row, then transitions the case to CMCD_ISSUED.
     */
    @Transactional
    public DocumentDto issueCmcd(UUID caseId, IssueCmcdRequest req) {
        CurrentUser user = SecurityUtils.currentUser();
        CaseEntity c = guard.loadVisible(caseId, caseRepository, user);

        if (!user.hasRole(AppRole.doctor) && !user.isAdmin()) {
            throw new ForbiddenException("Doar medicul poate emite CMCD");
        }
        if (c.getDeathCauseType() == ro.exitusro.api.common.enums.DeathCauseType.violent) {
            throw new BadRequestException(
                    "Cazurile de deces violent se transmit IML; CMCD nu poate fi emis aici.");
        }

        byte[] pdf = pdfService.generateCmcd(c, req.doctorName(), req.parafa(),
                req.icdCode(), req.causeDescription());

        String path = "cases/" + c.getId() + "/cmcd_" + System.currentTimeMillis() + ".pdf";
        storage.upload(path, pdf, "application/pdf");

        DocumentEntity entity = DocumentEntity.builder()
                .caseId(caseId)
                .type(DocumentType.cmcd)
                .title("Certificat Medical Constatator al Decesului")
                .storagePath(path)
                .uploadedBy(user.getId())
                .signed(true)
                .signatureMeta(objectMapper.valueToTree(Map.of(
                        "method", "mock-electronic-signature",
                        "parafa", req.parafa(),
                        "signedAt", java.time.OffsetDateTime.now().toString()
                )))
                .build();
        DocumentEntity saved = documentRepository.save(entity);

        auditService.log(caseId, "CMCD_DOCUMENT_GENERATED",
                Map.of("documentId", saved.getId().toString(), "icd", req.icdCode() == null ? "" : req.icdCode()));

        // advance state machine
        CaseDto updated = caseService.markCmcdIssued(caseId);
        log.info("CMCD issued for case {} -> {}", updated.caseNumber(), updated.status());

        return DocumentDto.fromEntity(saved, storage.signedUrl(path, SIGNED_URL_TTL));
    }

    /**
     * Civil officer issues the death certificate + burial permit.
     */
    @Transactional
    public List<DocumentDto> issueDeathCertificate(UUID caseId, IssueDeathCertRequest req) {
        CurrentUser user = SecurityUtils.currentUser();
        CaseEntity c = guard.loadVisible(caseId, caseRepository, user);

        if (!user.hasRole(AppRole.civil_officer) && !user.isAdmin()) {
            throw new ForbiddenException("Doar functionarul de stare civila poate emite certificatul");
        }

        // require an existing CMCD
        documentRepository.findFirstByCaseIdAndTypeOrderByIssuedAtDesc(caseId, DocumentType.cmcd)
                .orElseThrow(() -> new BadRequestException(
                        "Nu se poate elibera certificatul de deces fara CMCD valid."));

        byte[] certPdf = pdfService.generateDeathCertificate(c, req.officerName(), req.registrationNumber());
        String certPath = "cases/" + c.getId() + "/death_cert_" + System.currentTimeMillis() + ".pdf";
        storage.upload(certPath, certPdf, "application/pdf");

        DocumentEntity cert = documentRepository.save(DocumentEntity.builder()
                .caseId(caseId)
                .type(DocumentType.death_certificate)
                .title("Certificat de deces")
                .storagePath(certPath)
                .uploadedBy(user.getId())
                .signed(true)
                .signatureMeta(objectMapper.valueToTree(Map.of(
                        "method", "mock-electronic-signature",
                        "officer", req.officerName(),
                        "signedAt", java.time.OffsetDateTime.now().toString()
                )))
                .build());

        byte[] permitPdf = pdfService.generateBurialPermit(c, req.officerName());
        String permitPath = "cases/" + c.getId() + "/burial_permit_" + System.currentTimeMillis() + ".pdf";
        storage.upload(permitPath, permitPdf, "application/pdf");

        DocumentEntity permit = documentRepository.save(DocumentEntity.builder()
                .caseId(caseId)
                .type(DocumentType.burial_permit)
                .title("Adeverinta de inhumare/incinerare")
                .storagePath(permitPath)
                .uploadedBy(user.getId())
                .signed(true)
                .signatureMeta(objectMapper.valueToTree(Map.of(
                        "method", "mock-electronic-signature",
                        "officer", req.officerName(),
                        "signedAt", java.time.OffsetDateTime.now().toString()
                )))
                .build());

        auditService.log(caseId, "DEATH_CERTIFICATE_GENERATED",
                Map.of("certId", cert.getId().toString(), "permitId", permit.getId().toString()));

        caseService.markDeathCertIssued(caseId);

        return List.of(
                DocumentDto.fromEntity(cert, storage.signedUrl(certPath, SIGNED_URL_TTL)),
                DocumentDto.fromEntity(permit, storage.signedUrl(permitPath, SIGNED_URL_TTL))
        );
    }

    @Transactional(readOnly = true)
    public byte[] download(UUID documentId) {
        CurrentUser user = SecurityUtils.currentUser();
        DocumentEntity d = documentRepository.findById(documentId)
                .orElseThrow(() -> new NotFoundException("Document inexistent"));
        guard.loadVisible(d.getCaseId(), caseRepository, user);
        if (d.getStoragePath() == null) {
            throw new BadRequestException("Documentul nu are continut stocat");
        }
        return storage.download(d.getStoragePath());
    }

    @Transactional(readOnly = true)
    public DocumentDto getById(UUID documentId) {
        CurrentUser user = SecurityUtils.currentUser();
        DocumentEntity d = documentRepository.findById(documentId)
                .orElseThrow(() -> new NotFoundException("Document inexistent"));
        guard.loadVisible(d.getCaseId(), caseRepository, user);
        return DocumentDto.fromEntity(d,
                d.getStoragePath() == null ? null : storage.signedUrl(d.getStoragePath(), SIGNED_URL_TTL));
    }

    private String safeName(String name) {
        if (name == null) return "file";
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
