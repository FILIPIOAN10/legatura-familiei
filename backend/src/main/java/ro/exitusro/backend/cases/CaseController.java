package ro.exitusro.backend.cases;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ro.exitusro.backend.cases.dto.CaseDetail;
import ro.exitusro.backend.cases.dto.CaseDetailEnvelope;
import ro.exitusro.backend.cases.dto.CaseSummary;
import ro.exitusro.backend.cases.dto.CaseTask;
import ro.exitusro.backend.cases.dto.CreateCaseRequest;
import ro.exitusro.backend.cases.dto.IssueCmcdRequest;
import ro.exitusro.backend.cases.dto.RequestCorrectionsRequest;
import ro.exitusro.backend.cases.dto.ScheduleFuneralRequest;
import ro.exitusro.backend.documents.DocumentRepository;
import ro.exitusro.backend.documents.dto.DocumentSummary;
import ro.exitusro.backend.security.CurrentUser;
import ro.exitusro.backend.user.Role;
import ro.exitusro.backend.user.UserAccount;

import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.FORBIDDEN;

@RestController
@RequestMapping("/api/cases")
public class CaseController {

    private final CaseRepository repository;
    private final CaseService service;
    private final DocumentRepository documents;

    public CaseController(CaseRepository repository, CaseService service, DocumentRepository documents) {
        this.repository = repository;
        this.service = service;
        this.documents = documents;
    }

    @GetMapping
    public Map<String, List<CaseSummary>> list(@CurrentUser UserAccount user) {
        List<CaseEntity> entities = switch (user.getRole()) {
            case FAMILY -> repository.findByOpenedByOrderByCreatedAtDesc(user);
            case ADMIN, CIVIL_OFFICER, DOCTOR, FUNERAL_PROVIDER, NOTARY -> repository.findAllOrdered();
        };
        List<CaseSummary> summaries = entities.stream().map(CaseSummary::from).toList();
        return Map.of("cases", summaries);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody CreateCaseRequest req,
                                                      @CurrentUser UserAccount user) {
        CaseEntity created = service.create(req, user);
        return ResponseEntity.status(201).body(Map.of("case", CaseSummary.from(created)));
    }

    @GetMapping("/{id}")
    public CaseDetailEnvelope get(@PathVariable String id, @CurrentUser UserAccount user) {
        CaseEntity c = service.findOrThrow(id);
        ensureCanRead(c, user);
        List<DocumentSummary> docs = documents.findByCaseEntityOrderByIssuedAtDesc(c)
                .stream().map(DocumentSummary::from).toList();
        List<CaseTask> tasks = CaseTaskCalculator.compute(c);
        CaseDetail detail = CaseDetail.from(c);
        return new CaseDetailEnvelope(detail, docs, tasks, detail.audit());
    }

    @PostMapping("/{id}/cmcd")
    public Map<String, Object> issueCmcd(@PathVariable String id,
                                          @Valid @RequestBody IssueCmcdRequest req,
                                          @CurrentUser UserAccount user) {
        service.issueCmcd(id, req, user);
        return Map.of("ok", true);
    }

    @PostMapping("/{id}/death-certificate")
    public Map<String, Object> issueDeathCertificate(@PathVariable String id,
                                                     @CurrentUser UserAccount user) {
        CaseEntity c = service.validateAndIssueCert(id, user);
        return Map.of("ok", true, "certificate_number", c.getCertificateNumber());
    }

    @PostMapping("/{id}/corrections")
    public Map<String, Object> requestCorrections(@PathVariable String id,
                                                  @Valid @RequestBody RequestCorrectionsRequest req,
                                                  @CurrentUser UserAccount user) {
        service.requestCorrections(id, req, user);
        return Map.of("ok", true);
    }

    @PostMapping("/{id}/funeral")
    public Map<String, Object> scheduleFuneral(@PathVariable String id,
                                               @Valid @RequestBody ScheduleFuneralRequest req,
                                               @CurrentUser UserAccount user) {
        service.scheduleFuneral(id, req, user);
        return Map.of("ok", true);
    }

    @PostMapping("/{id}/funeral/complete")
    public Map<String, Object> completeFuneral(@PathVariable String id,
                                               @CurrentUser UserAccount user) {
        service.completeFuneral(id, user);
        return Map.of("ok", true);
    }

    @PostMapping("/{id}/archive")
    public Map<String, Object> archive(@PathVariable String id, @CurrentUser UserAccount user) {
        service.archive(id, user);
        return Map.of("ok", true);
    }

    private void ensureCanRead(CaseEntity c, UserAccount user) {
        Role role = user.getRole();
        if (role == Role.ADMIN) return;
        if (role == Role.FAMILY) {
            if (c.getOpenedBy() != null && c.getOpenedBy().getId().equals(user.getId())) return;
            throw new ResponseStatusException(FORBIDDEN, "You do not have access to this case");
        }
        // Professional roles can see all cases; in a real deployment this would be
        // narrowed (e.g. doctor sees only assigned cases, civil officer only own jurisdiction).
    }
}
