package ro.exitusro.api.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.exitusro.api.common.exception.ForbiddenException;
import ro.exitusro.api.common.exception.NotFoundException;
import ro.exitusro.api.email.EmailService;
import ro.exitusro.api.security.CurrentUser;
import ro.exitusro.api.security.SecurityUtils;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository repository;
    private final EmailService emailService;

    @Transactional
    public NotificationEntity notify(UUID userId, UUID caseId, String type,
                                     String title, String body, String emailAddress) {
        NotificationEntity n = NotificationEntity.builder()
                .userId(userId)
                .caseId(caseId)
                .type(type)
                .title(title)
                .body(body)
                .build();
        NotificationEntity saved = repository.save(n);

        if (emailAddress != null && !emailAddress.isBlank()) {
            try {
                emailService.send(emailAddress, title, body == null ? title : body);
            } catch (Exception ex) {
                log.warn("Failed to send email to {}: {}", emailAddress, ex.getMessage());
            }
        }
        return saved;
    }

    @Transactional
    public void notifyMany(List<UUID> userIds, UUID caseId, String type, String title, String body) {
        for (UUID uid : userIds) {
            notify(uid, caseId, type, title, body, null);
        }
    }

    @Transactional(readOnly = true)
    public Page<NotificationEntity> myInbox(Pageable pageable) {
        CurrentUser user = SecurityUtils.currentUser();
        return repository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
    }

    @Transactional(readOnly = true)
    public long myUnreadCount() {
        CurrentUser user = SecurityUtils.currentUser();
        return repository.countByUserIdAndReadAtIsNull(user.getId());
    }

    @Transactional
    public NotificationEntity markRead(UUID notificationId) {
        CurrentUser user = SecurityUtils.currentUser();
        NotificationEntity n = repository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("Notificare inexistenta"));
        if (!n.getUserId().equals(user.getId())) {
            throw new ForbiddenException("Notificarea nu va apartine");
        }
        n.setReadAt(OffsetDateTime.now());
        return repository.save(n);
    }

    @Transactional
    public void markAllRead() {
        CurrentUser user = SecurityUtils.currentUser();
        var unread = repository.findByUserIdOrderByCreatedAtDesc(user.getId(), Pageable.unpaged())
                .stream().filter(n -> n.getReadAt() == null).toList();
        OffsetDateTime now = OffsetDateTime.now();
        unread.forEach(n -> n.setReadAt(now));
        repository.saveAll(unread);
    }
}
