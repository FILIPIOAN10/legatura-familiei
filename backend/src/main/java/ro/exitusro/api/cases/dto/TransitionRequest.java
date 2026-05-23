package ro.exitusro.api.cases.dto;

import jakarta.validation.constraints.NotNull;
import ro.exitusro.api.common.enums.CaseStatus;

public record TransitionRequest(
        @NotNull CaseStatus targetStatus,
        String reason
) {
}
