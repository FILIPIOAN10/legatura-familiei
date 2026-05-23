package ro.exitusro.backend.cases.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record ScheduleFuneralRequest(
        @NotNull Instant date,
        @NotBlank String location
) {}
