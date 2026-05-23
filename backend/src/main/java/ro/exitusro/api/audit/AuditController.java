package ro.exitusro.api.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository repository;

    @GetMapping("/case/{caseId}")
    public List<AuditLogEntity> byCase(@PathVariable UUID caseId) {
        return repository.findByCaseIdOrderByCreatedAtDesc(caseId);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<AuditLogEntity> all(Pageable pageable) {
        return repository.findAllByOrderByCreatedAtDesc(pageable);
    }
}
