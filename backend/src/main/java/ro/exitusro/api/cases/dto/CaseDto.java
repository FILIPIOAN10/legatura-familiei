package ro.exitusro.api.cases.dto;

import ro.exitusro.api.cases.CaseEntity;
import ro.exitusro.api.common.enums.CaseStatus;
import ro.exitusro.api.common.enums.DeathCauseType;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CaseDto(
        UUID id,
        String caseNumber,
        CaseStatus status,
        UUID createdBy,
        String deceasedFullName,
        String deceasedCnpMasked,
        LocalDate deceasedDob,
        OffsetDateTime deceasedDod,
        String deathLocation,
        DeathCauseType deathCauseType,
        String city,
        String county,
        String address,
        UUID assignedDoctor,
        UUID assignedCivilOfficer,
        UUID assignedFuneralProvider,
        UUID assignedNotary,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static CaseDto fromEntity(CaseEntity c, boolean unmaskCnp) {
        String cnp = c.getDeceasedCnp();
        String masked = cnp == null
                ? null
                : (unmaskCnp ? cnp : (cnp.length() > 4
                    ? "*".repeat(cnp.length() - 4) + cnp.substring(cnp.length() - 4)
                    : "****"));
        return new CaseDto(
                c.getId(),
                c.getCaseNumber(),
                c.getStatus(),
                c.getCreatedBy(),
                c.getDeceasedFullName(),
                masked,
                c.getDeceasedDob(),
                c.getDeceasedDod(),
                c.getDeathLocation(),
                c.getDeathCauseType(),
                c.getCity(),
                c.getCounty(),
                c.getAddress(),
                c.getAssignedDoctor(),
                c.getAssignedCivilOfficer(),
                c.getAssignedFuneralProvider(),
                c.getAssignedNotary(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
