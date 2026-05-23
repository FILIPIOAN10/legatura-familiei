package ro.exitusro.api.document.dto;

import jakarta.validation.constraints.NotBlank;

public record IssueCmcdRequest(
        @NotBlank String doctorName,
        @NotBlank String parafa,
        String icdCode,
        String causeDescription
) {
}
