package ro.exitusro.api.cases;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ro.exitusro.api.cases.dto.*;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cases")
@RequiredArgsConstructor
public class CaseController {

    private final CaseService service;

    @GetMapping
    public Page<CaseDto> list(Pageable pageable) {
        return service.listForCurrentUser(pageable);
    }

    @GetMapping("/inbox")
    public Page<CaseDto> inbox(Pageable pageable) {
        return service.inbox(pageable);
    }

    @GetMapping("/{id}")
    public CaseDto get(@PathVariable UUID id) {
        return service.getById(id);
    }

    @PostMapping
    public ResponseEntity<CaseDto> create(@Valid @RequestBody CreateCaseRequest req) {
        CaseDto created = service.create(req);
        return ResponseEntity.created(URI.create("/api/v1/cases/" + created.id())).body(created);
    }

    @PatchMapping("/{id}")
    public CaseDto update(@PathVariable UUID id, @Valid @RequestBody UpdateCaseRequest req) {
        return service.update(id, req);
    }

    @PostMapping("/{id}/submit-to-doctor")
    public CaseDto submitToDoctor(@PathVariable UUID id) {
        return service.submitToDoctor(id);
    }

    @PostMapping("/{id}/mark-cmcd-issued")
    public CaseDto markCmcdIssued(@PathVariable UUID id) {
        return service.markCmcdIssued(id);
    }

    @PostMapping("/{id}/mark-death-cert-issued")
    public CaseDto markDeathCertIssued(@PathVariable UUID id) {
        return service.markDeathCertIssued(id);
    }

    @PostMapping("/{id}/transition")
    public CaseDto transition(@PathVariable UUID id, @Valid @RequestBody TransitionRequest req) {
        return service.transition(id, req);
    }

    @PostMapping("/{id}/assign")
    public CaseDto assign(@PathVariable UUID id, @Valid @RequestBody AssignmentRequest req) {
        return service.assign(id, req);
    }
}
