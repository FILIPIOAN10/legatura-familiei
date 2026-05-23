package ro.exitusro.backend.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Email @NotBlank @Size(max = 190) String email,
        @NotBlank @Size(min = 3, max = 100)
        @Pattern(regexp = "^[a-zA-Z0-9_.-]+$", message = "Username may only contain letters, digits, '.', '_', '-'")
        String username,
        @JsonProperty("full_name") @NotBlank @Size(max = 190) String fullName,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank String role
) {}
