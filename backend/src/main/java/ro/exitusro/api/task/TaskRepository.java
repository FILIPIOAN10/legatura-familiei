package ro.exitusro.api.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ro.exitusro.api.common.enums.TaskStatus;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, UUID> {

    List<TaskEntity> findByCaseIdOrderByLegalDeadlineAsc(UUID caseId);

    List<TaskEntity> findByStatusInAndLegalDeadlineBefore(List<TaskStatus> statuses, OffsetDateTime cutoff);
}
