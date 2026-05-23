package ro.exitusro.api.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    @GetMapping
    public Page<NotificationEntity> list(Pageable pageable) {
        return service.myInbox(pageable);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount() {
        return Map.of("unread", service.myUnreadCount());
    }

    @PostMapping("/{id}/read")
    public NotificationEntity markRead(@PathVariable UUID id) {
        return service.markRead(id);
    }

    @PostMapping("/read-all")
    public Map<String, Boolean> markAllRead() {
        service.markAllRead();
        return Map.of("ok", true);
    }
}
