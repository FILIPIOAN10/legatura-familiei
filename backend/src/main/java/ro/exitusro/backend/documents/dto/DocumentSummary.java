package ro.exitusro.backend.documents.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import ro.exitusro.backend.documents.DocumentEntity;

import java.time.Instant;

public record DocumentSummary(
        String id,
        String type,
        String title,
        boolean signed,
        boolean validated,
        @JsonProperty("validated_at") Instant validatedAt,
        @JsonProperty("validation_note") String validationNote,
        @JsonProperty("issued_at") Instant issuedAt,
        @JsonProperty("storage_path") String storagePath
) {
    public static DocumentSummary from(DocumentEntity d) {
        // Expose a URL-style identifier rather than the on-disk path so the SPA
        // never sees server filesystem layout. The actual download goes through
        // /api/documents/{id}/download-url then /content.
        String virtualPath = d.getStoragePath() != null
                ? "/api/documents/" + d.getId() + "/content"
                : null;
        return new DocumentSummary(
                d.getId(),
                d.getType(),
                d.getTitle(),
                d.isSigned(),
                d.isValidated(),
                d.getValidatedAt(),
                d.getValidationNote(),
                d.getIssuedAt(),
                virtualPath
        );
    }
}
