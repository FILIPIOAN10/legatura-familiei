package ro.exitusro.backend.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import ro.exitusro.backend.user.UserAccount;

public record UserResponse(
        Long id,
        String email,
        String username,
        @JsonProperty("full_name") String fullName,
        String role
) {
    public static UserResponse from(UserAccount u) {
        return new UserResponse(
                u.getId(),
                u.getEmail(),
                u.getUsername(),
                u.getFullName(),
                u.getRole().value()
        );
    }
}
