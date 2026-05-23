package ro.exitusro.api.document.dto;

import com.fasterxml.jackson.databind.JsonNode;
import ro.exitusro.api.common.enums.DocumentType;
import ro.exitusro.api.document.DocumentEntity;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DocumentDto(
        UUID id,
        UUID caseId,
        DocumentType type,
        String title,
        String storagePath,
        UUID uploadedBy,
        boolean signed,
        JsonNode signatureMeta,
        OffsetDateTime issuedAt,
        JsonNode metadata,
        String signedUrl
) {
    public static DocumentDto fromEntity(DocumentEntity d, String signedUrl) {
        return new DocumentDto(
                d.getId(),
                d.getCaseId(),
                d.getType(),
                d.getTitle(),
                d.getStoragePath(),
                d.getUploadedBy(),
                d.isSigned(),
                d.getSignatureMeta(),
                d.getIssuedAt(),
                d.getMetadata(),
                signedUrl
        );
    }
}
