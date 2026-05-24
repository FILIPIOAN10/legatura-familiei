package ro.exitusro.backend.documents;

import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import ro.exitusro.backend.cases.CaseEntity;
import ro.exitusro.backend.cases.CaseRepository;
import ro.exitusro.backend.documents.dto.RequestDocumentCorrectionRequest;
import ro.exitusro.backend.notifications.NotificationService;
import ro.exitusro.backend.security.CurrentUser;
import ro.exitusro.backend.user.Role;
import ro.exitusro.backend.user.UserAccount;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentRepository documents;
    private final CaseRepository cases;
    private final DocumentStorage storage;
    private final NotificationService notifications;

    public DocumentController(DocumentRepository documents,
                              CaseRepository cases,
                              DocumentStorage storage,
                              NotificationService notifications) {
        this.documents = documents;
        this.cases = cases;
        this.storage = storage;
        this.notifications = notifications;
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("case_id") String caseId,
            @RequestParam("type") String type,
            @RequestParam("title") String title,
            @CurrentUser UserAccount user) throws IOException {

        if (file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "File is empty");
        }
        if (file.getSize() > 25L * 1024 * 1024) {
            throw new ResponseStatusException(BAD_REQUEST, "File exceeds 25 MB limit");
        }
        CaseEntity c = cases.findById(caseId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Case not found"));
        ensureCanWrite(c, user);

        DocumentStorage.Stored stored = storage.store(file, caseId);
        DocumentEntity doc = new DocumentEntity(c, type, title);
        doc.setStoragePath(stored.path());
        doc.setMimeType(stored.mimeType());
        doc.setSizeBytes(stored.size());
        doc.setUploadedBy(user);
        documents.save(doc);
        c.addAudit("Document încărcat: " + title, user);

        return ResponseEntity.status(201).body(Map.of(
                "ok", true,
                "document_id", doc.getId()
        ));
    }

    @GetMapping("/{id}/download-url")
    public Map<String, String> downloadUrl(@PathVariable String id, @CurrentUser UserAccount user) {
        DocumentEntity doc = documents.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Document not found"));
        ensureCanRead(doc.getCaseEntity(), user);
        return Map.of(
                "url", "/api/documents/" + id + "/content",
                "title", doc.getTitle()
        );
    }

    @GetMapping("/{id}/content")
    public ResponseEntity<FileSystemResource> content(@PathVariable String id,
                                                      @CurrentUser UserAccount user) throws IOException {
        DocumentEntity doc = documents.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Document not found"));
        ensureCanRead(doc.getCaseEntity(), user);
        if (doc.getStoragePath() == null) {
            throw new ResponseStatusException(NOT_FOUND, "Document has no file attached");
        }
        Path path = storage.resolve(doc.getStoragePath());
        if (!Files.exists(path)) {
            throw new ResponseStatusException(NOT_FOUND, "File missing on disk");
        }
        String encoded = URLEncoder.encode(doc.getTitle(), StandardCharsets.UTF_8).replace("+", "%20");
        MediaType type = doc.getMimeType() != null
                ? MediaType.parseMediaType(doc.getMimeType())
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(type)
                .contentLength(Files.size(path))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + encoded)
                .body(new FileSystemResource(path));
    }

    /** Civil officer marks a single document as VALIDATED after downloading + reviewing it. */
    @PostMapping("/{id}/validate")
    public Map<String, Object> validateDocument(@PathVariable String id,
                                                @CurrentUser UserAccount user) {
        DocumentEntity doc = documents.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Document not found"));
        ensureCivilOfficerOrAdmin(user);
        doc.markValidated(user);
        documents.save(doc);
        doc.getCaseEntity().addAudit("Document validat: " + doc.getTitle(), user);
        return Map.of("ok", true, "validation_status", doc.getValidationStatus().name());
    }

    /**
     * Civil officer asks the family to fix one document. If the case was
     * already at AWAITING_CIVIL_OFFICER we roll it back to CMCD_ISSUED so the
     * family sees the upload checklist again with the rejected document
     * flagged inline.
     */
    @PostMapping("/{id}/request-correction")
    public Map<String, Object> requestCorrection(@PathVariable String id,
                                                 @Valid @RequestBody RequestDocumentCorrectionRequest req,
                                                 @CurrentUser UserAccount user) {
        DocumentEntity doc = documents.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Document not found"));
        ensureCivilOfficerOrAdmin(user);
        doc.markNeedsCorrection(user, req.reason());
        documents.save(doc);
        CaseEntity c = doc.getCaseEntity();
        if (c.getStatus() == ro.exitusro.backend.cases.CaseStatus.AWAITING_CIVIL_OFFICER) {
            c.setStatus(ro.exitusro.backend.cases.CaseStatus.CMCD_ISSUED);
        }
        c.addAudit("Lămuriri cerute pe " + doc.getTitle() + ": " + req.reason(), user);

        notifications.push(Role.FAMILY,
                "Lămuriri pentru documentul " + doc.getTitle(),
                "Funcționarul de Stare Civilă a cerut lămuriri: " + req.reason() +
                        ". Re-încărcați documentul corect din dosarul " + c.getCaseNumber() + ".",
                "doc_correction", c);

        return Map.of(
                "ok", true,
                "validation_status", doc.getValidationStatus().name(),
                "case_status", c.getStatus().name()
        );
    }

    private void ensureCanRead(CaseEntity c, UserAccount user) {
        Role role = user.getRole();
        if (role == Role.ADMIN) return;
        if (role == Role.FAMILY) {
            if (c.getOpenedBy() != null && c.getOpenedBy().getId().equals(user.getId())) return;
            throw new ResponseStatusException(FORBIDDEN, "No access to this document");
        }
    }

    private void ensureCanWrite(CaseEntity c, UserAccount user) {
        Role role = user.getRole();
        if (role == Role.ADMIN || role == Role.FAMILY || role == Role.DOCTOR) {
            if (role == Role.FAMILY && c.getOpenedBy() != null
                    && !c.getOpenedBy().getId().equals(user.getId())) {
                throw new ResponseStatusException(FORBIDDEN, "Not your case");
            }
            return;
        }
        throw new ResponseStatusException(FORBIDDEN, "Role cannot upload documents");
    }

    private void ensureCivilOfficerOrAdmin(UserAccount user) {
        Role role = user.getRole();
        if (role != Role.CIVIL_OFFICER && role != Role.ADMIN) {
            throw new ResponseStatusException(FORBIDDEN, "Only civil officers can review documents");
        }
    }
}
