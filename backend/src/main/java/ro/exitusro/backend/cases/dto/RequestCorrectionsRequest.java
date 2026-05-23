package ro.exitusro.backend.cases.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RequestCorrectionsRequest(
        @NotBlank @Size(min = 3, max = 1000) String reason
) {}
