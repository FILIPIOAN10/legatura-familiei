package ro.exitusro.backend.cases.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import ro.exitusro.backend.cases.AuditEntry;
import ro.exitusro.backend.cases.CaseEntity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CaseDetail(
        String id,
        @JsonProperty("case_number") String caseNumber,
        String status,
        @JsonProperty("deceased_full_name") String deceasedFullName,
        @JsonProperty("deceased_cnp") String deceasedCnp,
        @JsonProperty("deceased_dob") LocalDate deceasedDob,
        @JsonProperty("deceased_dod") Instant deceasedDod,
        @JsonProperty("death_location") String deathLocation,
        @JsonProperty("death_cause_type") String deathCauseType,
        String city,
        String county,
        String address,
        @JsonProperty("created_at") Instant createdAt,
        Cmcd cmcd,
        @JsonProperty("certificate_number") String certificateNumber,
        @JsonProperty("cert_issued_at") Instant certIssuedAt,
        Funeral funeral,
        @JsonProperty("documents_submitted_at") Instant documentsSubmittedAt,
        @JsonProperty("selected_provider") SelectedProvider selectedProvider,
        List<AuditEntryDto> audit
) {
    public static CaseDetail from(CaseEntity c) {
        Cmcd cmcd = c.getCmcdIssuedAt() == null ? null : new Cmcd(
                c.getCmcdCauseMain(),
                c.getCmcdCauseSecondary(),
                c.getCmcdIcd10(),
                c.getCmcdIssuedAt()
        );
        Funeral funeral = c.getFuneralDate() == null ? null : new Funeral(
                c.getFuneralDate(),
                c.getFuneralLocation(),
                c.getFuneralCompletedAt()
        );
        SelectedProvider selectedProvider = c.getSelectedProviderId() == null ? null : new SelectedProvider(
                c.getSelectedProviderId(),
                c.getSelectedProviderName(),
                c.getSelectedProviderPhone(),
                c.getSelectedProviderAt()
        );
        return new CaseDetail(
                c.getId(),
                c.getCaseNumber(),
                c.getStatus().name(),
                c.getDeceasedFullName(),
                c.getDeceasedCnp(),
                c.getDeceasedDob(),
                c.getDeceasedDod(),
                c.getDeathLocation(),
                c.getDeathCauseType() != null ? c.getDeathCauseType().value() : null,
                c.getCity(),
                c.getCounty(),
                c.getAddress(),
                c.getCreatedAt(),
                cmcd,
                c.getCertificateNumber(),
                c.getCertIssuedAt(),
                funeral,
                c.getDocumentsSubmittedAt(),
                selectedProvider,
                c.getAudit().stream().map(AuditEntryDto::from).toList()
        );
    }

    public record Cmcd(
            @JsonProperty("cause_main") String causeMain,
            @JsonProperty("cause_secondary") String causeSecondary,
            String icd10,
            @JsonProperty("issued_at") Instant issuedAt
    ) {}

    public record Funeral(
            Instant date,
            String location,
            @JsonProperty("completed_at") Instant completedAt
    ) {}

    public record SelectedProvider(
            String id,
            String name,
            String phone,
            @JsonProperty("selected_at") Instant selectedAt
    ) {}

    public record AuditEntryDto(
            Long id,
            String action,
            @JsonProperty("actor_name") String actorName,
            @JsonProperty("created_at") Instant createdAt
    ) {
        public static AuditEntryDto from(AuditEntry a) {
            return new AuditEntryDto(
                    a.getId(),
                    a.getAction(),
                    a.getActor() != null ? a.getActor().getFullName() : null,
                    a.getCreatedAt()
            );
        }
    }
}
