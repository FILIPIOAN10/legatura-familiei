package ro.exitusro.backend.documents;

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
import ro.exitusro.backend.user.UserAccount;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "documents")
public class DocumentEntity {

    public enum ValidationStatus {
        PENDING,
        VALIDATED,
        NEEDS_CORRECTION
    }

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

    // Civil-officer review state.
    @Enumerated(EnumType.STRING)
    @Column(name = "validation_status", nullable = false, length = 30)
    private ValidationStatus validationStatus = ValidationStatus.PENDING;

    @Column(name = "validated_at")
    private Instant validatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "validated_by")
    private UserAccount validatedBy;

    @Column(name = "correction_reason", length = 1000)
    private String correctionReason;

    @Column(name = "correction_requested_at")
    private Instant correctionRequestedAt;

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
    public ValidationStatus getValidationStatus() { return validationStatus; }
    public Instant getValidatedAt() { return validatedAt; }
    public UserAccount getValidatedBy() { return validatedBy; }
    public String getCorrectionReason() { return correctionReason; }
    public Instant getCorrectionRequestedAt() { return correctionRequestedAt; }

    public void setTitle(String title) { this.title = title; }
    public void setStoragePath(String storagePath) { this.storagePath = storagePath; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }
    public void setSigned(boolean signed) { this.signed = signed; }
    public void setUploadedBy(UserAccount uploadedBy) { this.uploadedBy = uploadedBy; }

    public void markValidated(UserAccount officer) {
        this.validationStatus = ValidationStatus.VALIDATED;
        this.validatedAt = Instant.now();
        this.validatedBy = officer;
        this.correctionReason = null;
        this.correctionRequestedAt = null;
    }

    public void markNeedsCorrection(UserAccount officer, String reason) {
        this.validationStatus = ValidationStatus.NEEDS_CORRECTION;
        this.correctionReason = reason;
        this.correctionRequestedAt = Instant.now();
        this.validatedBy = officer;
        this.validatedAt = null;
    }

    public void resetValidation() {
        this.validationStatus = ValidationStatus.PENDING;
        this.validatedAt = null;
        this.validatedBy = null;
        this.correctionReason = null;
        this.correctionRequestedAt = null;
    }
}
