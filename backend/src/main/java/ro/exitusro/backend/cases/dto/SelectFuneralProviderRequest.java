package ro.exitusro.backend.cases.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Aparținător selects a funeral provider after the death certificate has been issued.
 */
public record SelectFuneralProviderRequest(
        @NotBlank @Size(max = 80) @JsonProperty("provider_id") String providerId,
        @NotBlank @Size(max = 190) @JsonProperty("provider_name") String providerName,
        @Size(max = 40) @JsonProperty("provider_phone") String providerPhone
) {}
