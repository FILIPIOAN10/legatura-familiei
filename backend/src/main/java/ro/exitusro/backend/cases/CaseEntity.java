package ro.exitusro.backend.cases;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import ro.exitusro.backend.user.UserAccount;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "cases")
public class CaseEntity {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(name = "case_number", nullable = false, unique = true, length = 40)
    private String caseNumber;

    @Column(name = "deceased_full_name", nullable = false, length = 190)
    private String deceasedFullName;

    @Column(name = "deceased_cnp", length = 20)
    private String deceasedCnp;

    @Column(name = "deceased_dob")
    private LocalDate deceasedDob;

    @Column(name = "deceased_dod", nullable = false)
    private Instant deceasedDod;

    @Column(name = "death_location", length = 190)
    private String deathLocation;

    @Enumerated(EnumType.STRING)
    @Column(name = "death_cause_type", nullable = false, length = 20)
    private DeathCauseType deathCauseType;

    @Column(length = 120)
    private String city;

    @Column(length = 120)
    private String county;

    @Column(length = 500)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private CaseStatus status = CaseStatus.AWAITING_DOCTOR;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "opened_by", nullable = false)
    private UserAccount openedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // CMCD details
    @Column(name = "cmcd_cause_main", length = 500)
    private String cmcdCauseMain;
    @Column(name = "cmcd_cause_secondary", length = 500)
    private String cmcdCauseSecondary;
    @Column(name = "cmcd_icd10", length = 30)
    private String cmcdIcd10;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cmcd_issued_by")
    private UserAccount cmcdIssuedBy;
    @Column(name = "cmcd_issued_at")
    private Instant cmcdIssuedAt;

    // Death certificate
    @Column(name = "certificate_number", length = 40)
    private String certificateNumber;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cert_issued_by")
    private UserAccount certIssuedBy;
    @Column(name = "cert_issued_at")
    private Instant certIssuedAt;

    // Funeral
    @Column(name = "funeral_date")
    private Instant funeralDate;
    @Column(name = "funeral_location", length = 250)
    private String funeralLocation;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funeral_provider_id")
    private UserAccount funeralProvider;
    @Column(name = "funeral_completed_at")
    private Instant funeralCompletedAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    // Family confirms supporting documents are uploaded → notifies civil officer.
    @Column(name = "documents_submitted_at")
    private Instant documentsSubmittedAt;

    // Family-selected funeral provider (lookup mirror; provider data lives in the static catalog).
    @Column(name = "selected_provider_id", length = 80)
    private String selectedProviderId;
    @Column(name = "selected_provider_name", length = 190)
    private String selectedProviderName;
    @Column(name = "selected_provider_phone", length = 40)
    private String selectedProviderPhone;
    @Column(name = "selected_provider_at")
    private Instant selectedProviderAt;

    @OneToMany(mappedBy = "caseEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<AuditEntry> audit = new ArrayList<>();

    protected CaseEntity() {}

    public CaseEntity(String caseNumber, UserAccount openedBy) {
        this.caseNumber = caseNumber;
        this.openedBy = openedBy;
    }

    public String getId() { return id; }
    public String getCaseNumber() { return caseNumber; }
    public String getDeceasedFullName() { return deceasedFullName; }
    public String getDeceasedCnp() { return deceasedCnp; }
    public LocalDate getDeceasedDob() { return deceasedDob; }
    public Instant getDeceasedDod() { return deceasedDod; }
    public String getDeathLocation() { return deathLocation; }
    public DeathCauseType getDeathCauseType() { return deathCauseType; }
    public String getCity() { return city; }
    public String getCounty() { return county; }
    public String getAddress() { return address; }
    public CaseStatus getStatus() { return status; }
    public UserAccount getOpenedBy() { return openedBy; }
    public Instant getCreatedAt() { return createdAt; }

    public String getCmcdCauseMain() { return cmcdCauseMain; }
    public String getCmcdCauseSecondary() { return cmcdCauseSecondary; }
    public String getCmcdIcd10() { return cmcdIcd10; }
    public UserAccount getCmcdIssuedBy() { return cmcdIssuedBy; }
    public Instant getCmcdIssuedAt() { return cmcdIssuedAt; }

    public String getCertificateNumber() { return certificateNumber; }
    public UserAccount getCertIssuedBy() { return certIssuedBy; }
    public Instant getCertIssuedAt() { return certIssuedAt; }

    public Instant getFuneralDate() { return funeralDate; }
    public String getFuneralLocation() { return funeralLocation; }
    public UserAccount getFuneralProvider() { return funeralProvider; }
    public Instant getFuneralCompletedAt() { return funeralCompletedAt; }
    public Instant getArchivedAt() { return archivedAt; }

    public Instant getDocumentsSubmittedAt() { return documentsSubmittedAt; }
    public String getSelectedProviderId() { return selectedProviderId; }
    public String getSelectedProviderName() { return selectedProviderName; }
    public String getSelectedProviderPhone() { return selectedProviderPhone; }
    public Instant getSelectedProviderAt() { return selectedProviderAt; }

    public List<AuditEntry> getAudit() { return audit; }

    public void setDeceasedFullName(String v) { this.deceasedFullName = v; }
    public void setDeceasedCnp(String v) { this.deceasedCnp = v; }
    public void setDeceasedDob(LocalDate v) { this.deceasedDob = v; }
    public void setDeceasedDod(Instant v) { this.deceasedDod = v; }
    public void setDeathLocation(String v) { this.deathLocation = v; }
    public void setDeathCauseType(DeathCauseType v) { this.deathCauseType = v; }
    public void setCity(String v) { this.city = v; }
    public void setCounty(String v) { this.county = v; }
    public void setAddress(String v) { this.address = v; }
    public void setStatus(CaseStatus v) { this.status = v; }

    public void setCmcd(String causeMain, String causeSecondary, String icd10, UserAccount issuedBy) {
        this.cmcdCauseMain = causeMain;
        this.cmcdCauseSecondary = causeSecondary;
        this.cmcdIcd10 = icd10;
        this.cmcdIssuedBy = issuedBy;
        this.cmcdIssuedAt = Instant.now();
    }

    public void setCertificate(String number, UserAccount issuedBy) {
        this.certificateNumber = number;
        this.certIssuedBy = issuedBy;
        this.certIssuedAt = Instant.now();
    }

    public void setFuneral(Instant date, String location, UserAccount provider) {
        this.funeralDate = date;
        this.funeralLocation = location;
        this.funeralProvider = provider;
    }

    public void markFuneralCompleted() { this.funeralCompletedAt = Instant.now(); }
    public void markArchived() { this.archivedAt = Instant.now(); }

    public void markDocumentsSubmitted() { this.documentsSubmittedAt = Instant.now(); }

    public void setSelectedProvider(String providerId, String name, String phone) {
        this.selectedProviderId = providerId;
        this.selectedProviderName = name;
        this.selectedProviderPhone = phone;
        this.selectedProviderAt = Instant.now();
    }

    public void addAudit(String action, UserAccount actor) {
        AuditEntry e = new AuditEntry(this, action, actor);
        this.audit.add(e);
    }
}
