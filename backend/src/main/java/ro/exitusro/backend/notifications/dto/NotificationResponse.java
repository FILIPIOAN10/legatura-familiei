package ro.exitusro.backend.notifications.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import ro.exitusro.backend.notifications.NotificationEntity;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record NotificationResponse(
        String id,
        String audience,
        String title,
        String body,
        String type,
        @JsonProperty("case_id") String caseId,
        @JsonProperty("read_at") Instant readAt,
        @JsonProperty("created_at") Instant createdAt
) {
    public static NotificationResponse from(NotificationEntity n) {
        return new NotificationResponse(
                n.getId(),
                n.getAudience() != null ? n.getAudience().value() : null,
                n.getTitle(),
                n.getBody(),
                n.getType(),
                n.getCaseEntity() != null ? n.getCaseEntity().getId() : null,
                n.getReadAt(),
                n.getCreatedAt()
        );
    }
}
