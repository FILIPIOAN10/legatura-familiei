package ro.exitusro.backend.cases;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ro.exitusro.backend.cases.dto.CreateCaseRequest;
import ro.exitusro.backend.cases.dto.IssueCmcdRequest;
import ro.exitusro.backend.cases.dto.RequestCorrectionsRequest;
import ro.exitusro.backend.cases.dto.ScheduleFuneralRequest;
import ro.exitusro.backend.documents.CmcdPdfGenerator;
import ro.exitusro.backend.documents.DocumentEntity;
import ro.exitusro.backend.documents.DocumentRepository;
import ro.exitusro.backend.documents.DocumentStorage;
import ro.exitusro.backend.notifications.NotificationService;
import ro.exitusro.backend.user.Role;
import ro.exitusro.backend.user.UserAccount;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.Year;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class CaseService {

    private static final Logger log = LoggerFactory.getLogger(CaseService.class);

    private final CaseRepository repository;
    private final NotificationService notifications;
    private final DocumentRepository documents;
    private final DocumentStorage documentStorage;
    private final CmcdPdfGenerator cmcdPdf;
    private final AtomicInteger sequence = new AtomicInteger(0);
    private final SecureRandom random = new SecureRandom();

    public CaseService(CaseRepository repository,
                       NotificationService notifications,
                       DocumentRepository documents,
                       DocumentStorage documentStorage,
                       CmcdPdfGenerator cmcdPdf) {
        this.repository = repository;
        this.notifications = notifications;
        this.documents = documents;
        this.documentStorage = documentStorage;
        this.cmcdPdf = cmcdPdf;
        // Initialise sequence from existing data so case numbers remain monotonic across restarts.
        long existing = repository.count();
        this.sequence.set((int) existing);
    }

    @Transactional
    public CaseEntity create(CreateCaseRequest req, UserAccount actor) {
        if (actor.getRole() != Role.FAMILY && actor.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(FORBIDDEN, "Only family members can open a new case");
        }
        DeathCauseType cause = DeathCauseType.fromValue(req.deathCauseType());
        String caseNumber = nextCaseNumber();
        CaseEntity c = new CaseEntity(caseNumber, actor);
        c.setDeceasedFullName(req.deceasedFullName().trim());
        c.setDeceasedCnp(req.deceasedCnp());
        c.setDeceasedDob(req.deceasedDob());
        c.setDeceasedDod(req.deceasedDod() != null ? req.deceasedDod() : java.time.Instant.now());
        c.setDeathLocation(req.deathLocation());
        c.setDeathCauseType(cause);
        c.setCity(req.city());
        c.setCounty(req.county());
        c.setAddress(req.address());
        c.addAudit("Dosar deschis de aparținător", actor);

        CaseEntity saved = repository.save(c);

        notifications.push(
                Role.DOCTOR,
                "Caz nou de constatat",
                "Aparținătorul a deschis dosarul " + saved.getCaseNumber() + " pentru " +
                        saved.getDeceasedFullName() + ". Eliberați CMCD.",
                "case_assigned",
                saved
        );
        notifications.push(
                Role.FAMILY,
                "Dosar deschis",
                "Dosarul " + saved.getCaseNumber() + " a fost creat. Medicul a fost notificat.",
                "case_opened",
                saved
        );

        return saved;
    }

    public CaseEntity findOrThrow(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Case not found"));
    }

    @Transactional
    public CaseEntity issueCmcd(String caseId, IssueCmcdRequest req, UserAccount actor) {
        if (actor.getRole() != Role.DOCTOR && actor.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(FORBIDDEN, "Only doctors can issue CMCD");
        }
        CaseEntity c = findOrThrow(caseId);
        if (c.getStatus() != CaseStatus.AWAITING_DOCTOR) {
            throw new ResponseStatusException(CONFLICT, "Case is not awaiting doctor (current status: " + c.getStatus() + ")");
        }
        c.setCmcd(req.causeMain(), req.causeSecondary(), req.icd10(), actor);
        c.setStatus(CaseStatus.CMCD_ISSUED);
        c.addAudit("CMCD emis de medic — cauză: " + req.causeMain(), actor);

        generateAndStoreCmcdPdf(c, actor);

        notifications.push(Role.FAMILY,
                "CMCD a fost emis",
                "Medicul a emis Certificatul Medical pentru dosarul " + c.getCaseNumber() +
                        ". Trimis automat la Starea Civilă.",
                "cmcd_issued", c);
        notifications.push(Role.CIVIL_OFFICER,
                "CMCD nou de validat",
                "Dosarul " + c.getCaseNumber() + " (" + c.getDeceasedFullName() + ") așteaptă validare.",
                "civil_pending", c);
        return c;
    }

    /**
     * Generates a CMCD PDF (with demo/dummy data) and saves it in the case's
     * document safe so the civil officer can download it for verification.
     * Failures are logged but never block CMCD issuance — the document is a
     * convenience for the demo flow, not a hard requirement.
     */
    private void generateAndStoreCmcdPdf(CaseEntity c, UserAccount actor) {
        try {
            byte[] pdf = cmcdPdf.generate(c);
            String filename = cmcdPdf.suggestedFilename(c);
            String title = cmcdPdf.suggestedTitle(c);

            DocumentStorage.Stored stored = documentStorage.storeBytes(
                    pdf, c.getId(), filename, "application/pdf");

            DocumentEntity doc = new DocumentEntity(c, "cmcd", title);
            doc.setStoragePath(stored.path());
            doc.setMimeType(stored.mimeType());
            doc.setSizeBytes(stored.size());
            doc.setSigned(true);
            doc.setUploadedBy(actor);
            documents.save(doc);

            c.addAudit("CMCD PDF generat automat și adăugat în Seif", actor);
        } catch (Exception ex) {
            log.error("Failed to auto-generate CMCD PDF for case {}: {}", c.getCaseNumber(), ex.getMessage(), ex);
            c.addAudit("Atenție: generarea automată a PDF-ului CMCD a eșuat (" + ex.getMessage() + ")", actor);
        }
    }

    @Transactional
    public CaseEntity validateAndIssueCert(String caseId, UserAccount actor) {
        if (actor.getRole() != Role.CIVIL_OFFICER && actor.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(FORBIDDEN, "Only civil officers can issue death certificates");
        }
        CaseEntity c = findOrThrow(caseId);
        if (c.getStatus() != CaseStatus.CMCD_ISSUED && c.getStatus() != CaseStatus.AWAITING_CIVIL_OFFICER) {
            throw new ResponseStatusException(CONFLICT, "Case is not ready for certificate issuance (current status: " + c.getStatus() + ")");
        }
        String certNumber = generateCertificateNumber();
        c.setCertificate(certNumber, actor);
        c.setStatus(CaseStatus.DEATH_CERT_ISSUED);
        c.addAudit("Certificat de deces " + certNumber + " emis de Starea Civilă", actor);

        notifications.push(Role.FAMILY,
                "Certificat de deces emis",
                "Certificatul " + certNumber + " este disponibil în dosarul " + c.getCaseNumber() +
                        ". Puteți contacta o casă funerară.",
                "death_cert", c);
        notifications.push(Role.FUNERAL_PROVIDER,
                "Familie disponibilă pentru servicii funerare",
                "Familia " + c.getDeceasedFullName() + " (dosar " + c.getCaseNumber() +
                        ") poate fi contactată — certificat emis.",
                "funeral_lead", c);
        return c;
    }

    @Transactional
    public CaseEntity requestCorrections(String caseId, RequestCorrectionsRequest req, UserAccount actor) {
        if (actor.getRole() != Role.CIVIL_OFFICER && actor.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(FORBIDDEN, "Only civil officers can request corrections");
        }
        CaseEntity c = findOrThrow(caseId);
        if (c.getStatus() != CaseStatus.CMCD_ISSUED && c.getStatus() != CaseStatus.AWAITING_CIVIL_OFFICER) {
            throw new ResponseStatusException(CONFLICT, "Corrections can only be requested for cases pending civil officer review");
        }
        c.setStatus(CaseStatus.AWAITING_DOCTOR);
        c.addAudit("Corecții solicitate de Starea Civilă: " + req.reason(), actor);

        notifications.push(Role.DOCTOR,
                "Corecții solicitate",
                "Pentru dosarul " + c.getCaseNumber() + ": " + req.reason(),
                "corrections", c);
        return c;
    }

    @Transactional
    public CaseEntity scheduleFuneral(String caseId, ScheduleFuneralRequest req, UserAccount actor) {
        if (actor.getRole() != Role.FUNERAL_PROVIDER && actor.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(FORBIDDEN, "Only funeral providers can schedule funerals");
        }
        CaseEntity c = findOrThrow(caseId);
        if (c.getStatus() != CaseStatus.DEATH_CERT_ISSUED) {
            throw new ResponseStatusException(CONFLICT, "Funeral can only be scheduled after the death certificate is issued");
        }
        c.setFuneral(req.date(), req.location(), actor);
        c.setStatus(CaseStatus.FUNERAL_SCHEDULED);
        c.addAudit("Înmormântare programată: " + req.date() + " — " + req.location(), actor);

        notifications.push(Role.FAMILY,
                "Înmormântare programată",
                "Casa funerară a programat serviciul pentru " + req.date() + " la " + req.location() + ".",
                "funeral_scheduled", c);
        return c;
    }

    @Transactional
    public CaseEntity completeFuneral(String caseId, UserAccount actor) {
        if (actor.getRole() != Role.FUNERAL_PROVIDER && actor.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(FORBIDDEN, "Only funeral providers can mark funerals complete");
        }
        CaseEntity c = findOrThrow(caseId);
        if (c.getStatus() != CaseStatus.FUNERAL_SCHEDULED) {
            throw new ResponseStatusException(CONFLICT, "Funeral is not in scheduled state");
        }
        c.setStatus(CaseStatus.FUNERAL_COMPLETED);
        c.markFuneralCompleted();
        c.addAudit("Înmormântare finalizată", actor);
        return c;
    }

    @Transactional
    public CaseEntity archive(String caseId, UserAccount actor) {
        if (actor.getRole() != Role.CIVIL_OFFICER && actor.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(FORBIDDEN, "Only civil officers can archive cases");
        }
        CaseEntity c = findOrThrow(caseId);
        c.setStatus(CaseStatus.ARCHIVED);
        c.markArchived();
        c.addAudit("Dosar arhivat oficial de Starea Civilă", actor);

        notifications.push(Role.FAMILY,
                "Dosar arhivat",
                "Dosarul " + c.getCaseNumber() + " a fost arhivat oficial. Rămâne disponibil pentru consultare.",
                "archived", c);
        return c;
    }

    private String nextCaseNumber() {
        int n = sequence.incrementAndGet();
        return String.format("DEMO-%d-%04d", LocalDate.now().getYear(), n);
    }

    private String generateCertificateNumber() {
        int year = Year.now().getValue();
        int suffix = 100000 + random.nextInt(900000);
        return "RO-" + year + "-" + suffix;
    }
}
