package ro.exitusro.api.document.dto;

import jakarta.validation.constraints.NotBlank;

public record IssueDeathCertRequest(
        @NotBlank String officerName,
        String registrationNumber
) {
}
