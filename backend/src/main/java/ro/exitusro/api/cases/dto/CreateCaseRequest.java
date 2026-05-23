package ro.exitusro.api.cases.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import ro.exitusro.api.common.enums.DeathCauseType;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CreateCaseRequest(
        @NotBlank @Size(max = 200) String deceasedFullName,
        @Pattern(regexp = "^[0-9]{13}$", message = "CNP trebuie sa contina 13 cifre") String deceasedCnp,
        LocalDate deceasedDob,
        @NotNull OffsetDateTime deceasedDod,
        @Size(max = 500) String deathLocation,
        DeathCauseType deathCauseType,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 100) String county,
        @Size(max = 500) String address
) {
}
