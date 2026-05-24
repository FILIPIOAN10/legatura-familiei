package ro.exitusro.backend.cases.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record IssueCmcdRequest(
        @JsonProperty("cause_main") @NotBlank String causeMain,
        @JsonProperty("cause_secondary") String causeSecondary,
        String icd10
) {}
