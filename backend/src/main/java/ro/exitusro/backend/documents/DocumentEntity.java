package ro.exitusro.backend.documents;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import ro.exitusro.backend.cases.CaseEntity;
import ro.exitusro.backend.user.UserAccount;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "documents")
public class DocumentEntity {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "case_id", nullable = false)
    private CaseEntity caseEntity;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false, length = 250)
    private String title;

    @Column(name = "storage_path", length = 500)
    private String storagePath;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(nullable = false)
    private boolean signed = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private UserAccount uploadedBy;

    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt = Instant.now();

    // Validation by civil officer (or any reviewer) — independent of `signed`,
    // which is reserved for the issuing professional (e.g. doctor for CMCD).
    @Column(nullable = false)
    private boolean validated = false;

    @Column(name = "validated_at")
    private Instant validatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "validated_by")
    private UserAccount validatedBy;

    /**
     * If the reviewer needs additional info from the family, the note is stored
     * here. A non-null/non-blank value flags the document as "needs clarification".
     * Cleared when the document is later validated.
     */
    @Column(name = "validation_note", length = 1000)
    private String validationNote;

    protected DocumentEntity() {}

    public DocumentEntity(CaseEntity caseEntity, String type, String title) {
        this.caseEntity = caseEntity;
        this.type = type;
        this.title = title;
    }

    public String getId() { return id; }
    public CaseEntity getCaseEntity() { return caseEntity; }
    public String getType() { return type; }
    public String getTitle() { return title; }
    public String getStoragePath() { return storagePath; }
    public String getMimeType() { return mimeType; }
    public Long getSizeBytes() { return sizeBytes; }
    public boolean isSigned() { return signed; }
    public UserAccount getUploadedBy() { return uploadedBy; }
    public Instant getIssuedAt() { return issuedAt; }

    public boolean isValidated() { return validated; }
    public Instant getValidatedAt() { return validatedAt; }
    public UserAccount getValidatedBy() { return validatedBy; }
    public String getValidationNote() { return validationNote; }

    public void setTitle(String title) { this.title = title; }
    public void setStoragePath(String storagePath) { this.storagePath = storagePath; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }
    public void setSigned(boolean signed) { this.signed = signed; }
    public void setUploadedBy(UserAccount uploadedBy) { this.uploadedBy = uploadedBy; }

    public void markValidated(UserAccount actor) {
        this.validated = true;
        this.validatedAt = Instant.now();
        this.validatedBy = actor;
        this.validationNote = null;
    }

    public void requestClarification(UserAccount actor, String note) {
        this.validated = false;
        this.validatedAt = null;
        this.validatedBy = actor;
        this.validationNote = note;
    }
}
