package ro.exitusro.backend.cases.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Aparținător confirms uploaded documents and notifies the civil officer.
 * Status transitions CMCD_ISSUED → AWAITING_CIVIL_OFFICER.
 */
public record SubmitDocumentsRequest(
        boolean marriageCertificateApplicable,
        @Size(max = 1000) String notes
) {
    public SubmitDocumentsRequest {
        notes = notes == null ? null : notes.trim();
    }
}
