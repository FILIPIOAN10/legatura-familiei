package ro.exitusro.backend.cases.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.time.LocalDate;

public record CreateCaseRequest(
        @JsonProperty("deceased_full_name") @NotBlank String deceasedFullName,
        @JsonProperty("deceased_cnp") String deceasedCnp,
        @JsonProperty("deceased_dob") LocalDate deceasedDob,
        @JsonProperty("deceased_dod") Instant deceasedDod,
        @JsonProperty("death_location") String deathLocation,
        @JsonProperty("death_cause_type") @NotBlank String deathCauseType,
        String city,
        String county,
        String address
) {}
