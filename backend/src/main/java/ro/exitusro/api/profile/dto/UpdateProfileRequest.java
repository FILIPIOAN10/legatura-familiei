package ro.exitusro.api.profile.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 2, max = 200) String fullName,
        @Pattern(regexp = "^[0-9]{13}$", message = "CNP trebuie sa contina 13 cifre") String cnp,
        @Size(max = 50) String phone,
        @Size(max = 100) String county,
        @Size(max = 100) String city,
        @Size(max = 500) String address
) {
}
