package ro.exitusro.api.cases;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;
import ro.exitusro.api.common.enums.CaseStatus;
import ro.exitusro.api.common.enums.DeathCauseType;
import ro.exitusro.api.common.hibernate.CaseStatusType;
import ro.exitusro.api.common.hibernate.DeathCauseTypeType;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "cases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "case_number", nullable = false, unique = true, insertable = false, updatable = false)
    private String caseNumber;

    @Type(CaseStatusType.class)
    @Column(name = "status", nullable = false, columnDefinition = "case_status")
    @Builder.Default
    private CaseStatus status = CaseStatus.DRAFT;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "deceased_full_name", nullable = false)
    private String deceasedFullName;

    @Column(name = "deceased_cnp")
    private String deceasedCnp;

    @Column(name = "deceased_dob")
    private LocalDate deceasedDob;

    @Column(name = "deceased_dod", nullable = false)
    private OffsetDateTime deceasedDod;

    @Column(name = "death_location")
    private String deathLocation;

    @Type(DeathCauseTypeType.class)
    @Column(name = "death_cause_type", nullable = false, columnDefinition = "death_cause_type")
    @Builder.Default
    private DeathCauseType deathCauseType = DeathCauseType.natural;

    @Column(name = "city")
    private String city;

    @Column(name = "county")
    private String county;

    @Column(name = "address")
    private String address;

    @Column(name = "assigned_doctor")
    private UUID assignedDoctor;

    @Column(name = "assigned_civil_officer")
    private UUID assignedCivilOfficer;

    @Column(name = "assigned_funeral_provider")
    private UUID assignedFuneralProvider;

    @Column(name = "assigned_notary")
    private UUID assignedNotary;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
