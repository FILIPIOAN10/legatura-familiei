package ro.exitusro.backend.cases;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ro.exitusro.backend.user.UserAccount;

import java.util.List;

public interface CaseRepository extends JpaRepository<CaseEntity, String> {

    List<CaseEntity> findByOpenedByOrderByCreatedAtDesc(UserAccount openedBy);

    List<CaseEntity> findByStatusInOrderByCreatedAtDesc(List<CaseStatus> statuses);

    long countByCreatedAtBetween(java.time.Instant from, java.time.Instant to);

    @Query("select c from CaseEntity c order by c.createdAt desc")
    List<CaseEntity> findAllOrdered();
}
