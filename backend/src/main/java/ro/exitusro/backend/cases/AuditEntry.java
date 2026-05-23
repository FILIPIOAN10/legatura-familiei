package ro.exitusro.backend.cases;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import ro.exitusro.backend.user.UserAccount;

import java.time.Instant;

@Entity
@Table(name = "case_audit")
public class AuditEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "case_id", nullable = false)
    private CaseEntity caseEntity;

    @Column(nullable = false, length = 500)
    private String action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private UserAccount actor;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected AuditEntry() {}

    public AuditEntry(CaseEntity caseEntity, String action, UserAccount actor) {
        this.caseEntity = caseEntity;
        this.action = action;
        this.actor = actor;
    }

    public Long getId() { return id; }
    public CaseEntity getCaseEntity() { return caseEntity; }
    public String getAction() { return action; }
    public UserAccount getActor() { return actor; }
    public Instant getCreatedAt() { return createdAt; }
}
