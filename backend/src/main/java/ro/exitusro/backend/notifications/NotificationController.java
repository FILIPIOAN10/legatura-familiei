package ro.exitusro.backend.notifications;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ro.exitusro.backend.notifications.dto.NotificationResponse;
import ro.exitusro.backend.security.CurrentUser;
import ro.exitusro.backend.user.UserAccount;

import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository repository;

    public NotificationController(NotificationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public Map<String, List<NotificationResponse>> list(@CurrentUser UserAccount user) {
        List<NotificationResponse> items = repository
                .findByAudienceOrderByCreatedAtDesc(user.getRole())
                .stream()
                .map(NotificationResponse::from)
                .toList();
        return Map.of("notifications", items);
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public ResponseEntity<Map<String, Object>> markRead(@PathVariable String id,
                                                        @CurrentUser UserAccount user) {
        NotificationEntity n = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Notification not found"));
        if (n.getAudience() != null && n.getAudience() != user.getRole()) {
            throw new ResponseStatusException(NOT_FOUND, "Notification not found");
        }
        n.markRead();
        repository.save(n);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
