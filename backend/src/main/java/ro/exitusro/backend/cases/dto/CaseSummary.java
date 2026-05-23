package ro.exitusro.backend.cases.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import ro.exitusro.backend.cases.CaseEntity;

import java.time.Instant;

public record CaseSummary(
        String id,
        @JsonProperty("case_number") String caseNumber,
        String status,
        @JsonProperty("deceased_full_name") String deceasedFullName,
        @JsonProperty("deceased_dod") Instant deceasedDod,
        String city,
        String county,
        @JsonProperty("created_at") Instant createdAt
) {
    public static CaseSummary from(CaseEntity c) {
        return new CaseSummary(
                c.getId(),
                c.getCaseNumber(),
                c.getStatus().name(),
                c.getDeceasedFullName(),
                c.getDeceasedDod(),
                c.getCity(),
                c.getCounty(),
                c.getCreatedAt()
        );
    }
}
