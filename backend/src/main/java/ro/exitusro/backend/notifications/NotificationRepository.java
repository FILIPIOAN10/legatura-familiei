package ro.exitusro.backend.notifications;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.exitusro.backend.user.Role;

import java.util.List;

public interface NotificationRepository extends JpaRepository<NotificationEntity, String> {
    List<NotificationEntity> findByAudienceOrderByCreatedAtDesc(Role audience);
}
