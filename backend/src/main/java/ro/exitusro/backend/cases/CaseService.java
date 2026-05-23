package ro.exitusro.backend.cases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ro.exitusro.backend.cases.dto.CreateCaseRequest;
import ro.exitusro.backend.cases.dto.IssueCmcdRequest;
import ro.exitusro.backend.cases.dto.RequestCorrectionsRequest;
import ro.exitusro.backend.cases.dto.ScheduleFuneralRequest;
import ro.exitusro.backend.cases.dto.SelectFuneralProviderRequest;
import ro.exitusro.backend.cases.dto.SubmitDocumentsRequest;
import ro.exitusro.backend.documents.DocumentEntity;
import ro.exitusro.backend.documents.DocumentRepository;
import ro.exitusro.backend.notifications.NotificationService;
import ro.exitusro.backend.user.Role;
import ro.exitusro.backend.user.UserAccount;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class CaseService {

    /** Documents the family must upload before notifying the civil officer. */
    private static final Set<String> REQUIRED_DOC_TYPES = Set.of(
            "id_card_deceased",
            "birth_certificate",
            "id_card_declarant"
    );

    private final CaseRepository repository;
    private final DocumentRepository documents;
    private final NotificationService notifications;
    private final AtomicInteger sequence = new AtomicInteger(0);
    private final SecureRandom random = new SecureRandom();

    public CaseService(CaseRepository repository,
                       DocumentRepository documents,
                       NotificationService notifications) {
        this.repository = repository;
        this.documents = documents;
        this.notifications = notifications;
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

        // Only the family is notified at this point — the civil officer is notified
        // after the family confirms the supporting documents are uploaded.
        notifications.push(Role.FAMILY,
                "CMCD a fost emis",
                "Medicul a emis Certificatul Medical pentru dosarul " + c.getCaseNumber() +
                        ". Încărcați actele necesare (CI/BI decedat, certificat naștere, " +
                        "certificat căsătorie dacă e cazul, CI declarant) și apoi confirmați " +
                        "pentru a notifica funcționarul de stare civilă.",
                "cmcd_issued", c);
        return c;
    }

    @Transactional
    public CaseEntity submitFamilyDocuments(String caseId, SubmitDocumentsRequest req, UserAccount actor) {
        CaseEntity c = findOrThrow(caseId);
        if (actor.getRole() != Role.ADMIN) {
            if (actor.getRole() != Role.FAMILY) {
                throw new ResponseStatusException(FORBIDDEN, "Only family members can submit documents");
            }
            if (c.getOpenedBy() == null || !c.getOpenedBy().getId().equals(actor.getId())) {
                throw new ResponseStatusException(FORBIDDEN, "Not your case");
            }
        }
        if (c.getStatus() != CaseStatus.CMCD_ISSUED) {
            throw new ResponseStatusException(CONFLICT,
                    "Documentele pot fi confirmate doar după emiterea CMCD-ului (status curent: " + c.getStatus() + ")");
        }

        List<DocumentEntity> uploaded = documents.findByCaseEntityOrderByIssuedAtDesc(c);
        Set<String> uploadedTypes = uploaded.stream()
                .map(DocumentEntity::getType)
                .collect(Collectors.toSet());

        for (String required : REQUIRED_DOC_TYPES) {
            if (!uploadedTypes.contains(required)) {
                throw new ResponseStatusException(BAD_REQUEST,
                        "Document obligatoriu lipsă: " + humanDocLabel(required));
            }
        }
        if (req.marriageCertificateApplicable() && !uploadedTypes.contains("marriage_certificate")) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Document obligatoriu lipsă: " + humanDocLabel("marriage_certificate"));
        }

        c.setStatus(CaseStatus.AWAITING_CIVIL_OFFICER);
        c.markDocumentsSubmitted();
        c.addAudit("Acte aparținător încărcate și confirmate. Notificat funcționar Stare Civilă.", actor);

        notifications.push(Role.CIVIL_OFFICER,
                "Dosar nou de înregistrat în SIIEASC",
                "Dosarul " + c.getCaseNumber() + " (" + c.getDeceasedFullName() +
                        ") are CMCD-ul și actele aparținătorului încărcate. Validați și înregistrați decesul.",
                "civil_pending", c);
        notifications.push(Role.FAMILY,
                "Acte trimise la Starea Civilă",
                "Funcționarul de stare civilă a fost notificat și va emite certificatul de deces.",
                "family_docs_submitted", c);
        return c;
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
                        ". Puteți căuta și alege o casă funerară.",
                "death_cert", c);
        return c;
    }

    @Transactional
    public CaseEntity selectFuneralProvider(String caseId, SelectFuneralProviderRequest req, UserAccount actor) {
        CaseEntity c = findOrThrow(caseId);
        if (actor.getRole() != Role.ADMIN) {
            if (actor.getRole() != Role.FAMILY) {
                throw new ResponseStatusException(FORBIDDEN, "Only family members can choose a funeral provider");
            }
            if (c.getOpenedBy() == null || !c.getOpenedBy().getId().equals(actor.getId())) {
                throw new ResponseStatusException(FORBIDDEN, "Not your case");
            }
        }
        if (c.getStatus() != CaseStatus.DEATH_CERT_ISSUED) {
            throw new ResponseStatusException(CONFLICT,
                    "Casa funerară poate fi aleasă doar după emiterea certificatului de deces (status curent: " + c.getStatus() + ")");
        }
        if (c.getSelectedProviderId() != null) {
            throw new ResponseStatusException(CONFLICT, "Casa funerară a fost deja aleasă pentru acest dosar");
        }

        c.setSelectedProvider(req.providerId(), req.providerName(), req.providerPhone());
        c.addAudit("Casă funerară aleasă de aparținător: " + req.providerName(), actor);

        notifications.push(Role.FAMILY,
                "Casă funerară aleasă",
                req.providerName() + " a fost notificată și vă va contacta pentru programarea serviciului.",
                "funeral_chosen", c);
        notifications.push(Role.FUNERAL_PROVIDER,
                "Familie nouă v-a ales",
                "Familia " + c.getDeceasedFullName() + " (dosar " + c.getCaseNumber() +
                        ") v-a ales drept casă funerară. Contactați familia pentru programare.",
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

    private static String humanDocLabel(String type) {
        return switch (type) {
            case "id_card_deceased" -> "CI/BI decedat";
            case "birth_certificate" -> "Certificat de naștere decedat";
            case "marriage_certificate" -> "Certificat de căsătorie";
            case "id_card_declarant" -> "CI declarant";
            default -> type;
        };
    }
}
