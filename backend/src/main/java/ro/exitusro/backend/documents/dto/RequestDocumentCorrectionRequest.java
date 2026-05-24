package ro.exitusro.backend.documents.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Civil officer asks the family to fix a specific document. */
public record RequestDocumentCorrectionRequest(
        @NotBlank @Size(min = 3, max = 1000) String reason
) {}
