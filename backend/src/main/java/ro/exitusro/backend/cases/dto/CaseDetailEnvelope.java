package ro.exitusro.backend.cases.dto;

import ro.exitusro.backend.documents.dto.DocumentSummary;

import java.util.List;

/**
 * Shape returned by GET /api/cases/{id} — matches the SPA's expectations.
 */
public record CaseDetailEnvelope(
        CaseDetail caseField,
        List<DocumentSummary> documents,
        List<CaseTask> tasks,
        List<CaseDetail.AuditEntryDto> audit
) {
    @com.fasterxml.jackson.annotation.JsonProperty("case")
    public CaseDetail caseField() { return caseField; }
}
