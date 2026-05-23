package ro.exitusro.api.cases.dto;

import jakarta.validation.constraints.Size;
import ro.exitusro.api.common.enums.DeathCauseType;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record UpdateCaseRequest(
        @Size(max = 200) String deceasedFullName,
        String deceasedCnp,
        LocalDate deceasedDob,
        OffsetDateTime deceasedDod,
        String deathLocation,
        DeathCauseType deathCauseType,
        String city,
        String county,
        String address
) {
}
