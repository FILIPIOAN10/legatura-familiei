package ro.exitusro.api.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntity, UUID> {
    List<AuditLogEntity> findByCaseIdOrderByCreatedAtDesc(UUID caseId);

    Page<AuditLogEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
