package ro.exitusro.api.cases.dto;

import jakarta.validation.constraints.NotNull;
import ro.exitusro.api.common.enums.AppRole;

import java.util.UUID;

public record AssignmentRequest(
        @NotNull AppRole role,
        @NotNull UUID userId
) {
}
