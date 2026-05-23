package ro.exitusro.api.task;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.exitusro.api.cases.CaseAccessGuard;
import ro.exitusro.api.cases.CaseRepository;
import ro.exitusro.api.common.enums.TaskStatus;
import ro.exitusro.api.common.exception.NotFoundException;
import ro.exitusro.api.notification.NotificationService;
import ro.exitusro.api.security.CurrentUser;
import ro.exitusro.api.security.SecurityUtils;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final CaseRepository caseRepository;
    private final CaseAccessGuard guard;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<TaskEntity> listForCase(UUID caseId) {
        CurrentUser user = SecurityUtils.currentUser();
        guard.loadVisible(caseId, caseRepository, user);
        return taskRepository.findByCaseIdOrderByLegalDeadlineAsc(caseId);
    }

    @Transactional
    public TaskEntity create(TaskEntity task) {
        CurrentUser user = SecurityUtils.currentUser();
        guard.loadVisible(task.getCaseId(), caseRepository, user);
        return taskRepository.save(task);
    }

    @Transactional
    public TaskEntity updateStatus(UUID taskId, TaskStatus status) {
        CurrentUser user = SecurityUtils.currentUser();
        TaskEntity t = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Sarcina inexistenta"));
        guard.loadVisible(t.getCaseId(), caseRepository, user);
        t.setStatus(status);
        if (status == TaskStatus.done) {
            t.setCompletedAt(OffsetDateTime.now());
            t.setCompletedBy(user.getId());
        }
        return taskRepository.save(t);
    }

    /**
     * Hourly scan: alert assignees when a legal deadline is within 24h, 12h or 1h.
     * Mirrors the {@code deadlineWatcher} Edge Function described in the product spec.
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void deadlineWatcher() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime in24h = now.plusHours(24);

        var pending = taskRepository.findByStatusInAndLegalDeadlineBefore(
                List.of(TaskStatus.todo, TaskStatus.in_progress), in24h);

        for (TaskEntity task : pending) {
            if (task.getLegalDeadline() == null) continue;
            long hoursLeft = java.time.Duration.between(now, task.getLegalDeadline()).toHours();
            if (hoursLeft < 0) continue;

            String window;
            if (hoursLeft <= 1) window = "T-1h";
            else if (hoursLeft <= 12) window = "T-12h";
            else window = "T-24h";

            var c = caseRepository.findById(task.getCaseId()).orElse(null);
            if (c == null) continue;

            notificationService.notify(c.getCreatedBy(), c.getId(),
                    "task.deadline." + window,
                    "Termen legal apropiat: " + task.getTitle(),
                    "Termen: " + task.getLegalDeadline() + ". " +
                            (task.getLegalReference() == null ? "" : task.getLegalReference()),
                    null);
        }
        log.debug("Deadline watcher processed {} tasks", pending.size());
    }
}
