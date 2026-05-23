package ro.exitusro.backend.cases.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;

public record CaseTask(
        String id,
        String title,
        @JsonProperty("legal_reference") String legalReference,
        @JsonProperty("legal_deadline") Instant legalDeadline,
        String status
) {}
