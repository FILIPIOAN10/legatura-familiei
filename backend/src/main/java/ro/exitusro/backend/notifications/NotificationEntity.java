package ro.exitusro.backend.notifications;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import ro.exitusro.backend.cases.CaseEntity;
import ro.exitusro.backend.user.Role;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class NotificationEntity {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    /** Role audience (e.g. doctor, family). Either this or recipientUserId is set. */
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Role audience;

    @Column(nullable = false, length = 250)
    private String title;

    @Column(nullable = false, length = 2000)
    private String body;

    /** Free-form notification type identifier (e.g. "case_assigned", "cmcd_issued"). */
    @Column(nullable = false, length = 50)
    private String type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id")
    private CaseEntity caseEntity;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected NotificationEntity() {}

    public NotificationEntity(Role audience, String title, String body, String type, CaseEntity caseEntity) {
        this.audience = audience;
        this.title = title;
        this.body = body;
        this.type = type;
        this.caseEntity = caseEntity;
    }

    public String getId() { return id; }
    public Role getAudience() { return audience; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public String getType() { return type; }
    public CaseEntity getCaseEntity() { return caseEntity; }
    public Instant getReadAt() { return readAt; }
    public Instant getCreatedAt() { return createdAt; }

    public void markRead() {
        if (this.readAt == null) this.readAt = Instant.now();
    }
}
