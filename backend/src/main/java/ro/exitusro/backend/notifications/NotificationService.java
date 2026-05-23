package ro.exitusro.backend.notifications;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.exitusro.backend.cases.CaseEntity;
import ro.exitusro.backend.user.Role;

@Service
public class NotificationService {

    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public NotificationEntity push(Role audience, String title, String body, String type, CaseEntity caseRef) {
        NotificationEntity n = new NotificationEntity(audience, title, body, type, caseRef);
        return repository.save(n);
    }
}
