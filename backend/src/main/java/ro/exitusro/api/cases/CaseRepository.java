package ro.exitusro.api.cases;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ro.exitusro.api.common.enums.CaseStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaseRepository extends JpaRepository<CaseEntity, UUID>, JpaSpecificationExecutor<CaseEntity> {

    Optional<CaseEntity> findByCaseNumber(String caseNumber);

    Page<CaseEntity> findByCreatedBy(UUID createdBy, Pageable pageable);

    Page<CaseEntity> findByAssignedDoctor(UUID assignedDoctor, Pageable pageable);

    Page<CaseEntity> findByAssignedCivilOfficer(UUID assignedCivilOfficer, Pageable pageable);

    Page<CaseEntity> findByAssignedFuneralProvider(UUID providerId, Pageable pageable);

    Page<CaseEntity> findByAssignedNotary(UUID notaryId, Pageable pageable);

    @Query("""
            select c from CaseEntity c
            where c.status = :status
              and (:county is null or lower(c.county) = lower(:county))
            """)
    Page<CaseEntity> findInbox(@Param("status") CaseStatus status,
                               @Param("county") String county,
                               Pageable pageable);

    @Query("""
            select c from CaseEntity c
            where c.status in :statuses
              and (:county is null or lower(c.county) = lower(:county))
            """)
    Page<CaseEntity> findInboxAnyStatus(@Param("statuses") List<CaseStatus> statuses,
                                        @Param("county") String county,
                                        Pageable pageable);
}
