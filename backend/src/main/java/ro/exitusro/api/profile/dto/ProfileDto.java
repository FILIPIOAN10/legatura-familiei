package ro.exitusro.api.profile.dto;

import ro.exitusro.api.common.enums.AppRole;
import ro.exitusro.api.profile.Profile;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ProfileDto(
        UUID id,
        String fullName,
        String cnpMasked,
        String phone,
        String county,
        String city,
        String address,
        List<AppRole> roles,
        OffsetDateTime createdAt
) {
    public static ProfileDto fromEntity(Profile p, List<AppRole> roles, boolean unmaskCnp) {
        String cnp = p.getCnp();
        String masked = cnp == null ? null : (unmaskCnp ? cnp : maskCnp(cnp));
        return new ProfileDto(
                p.getId(),
                p.getFullName(),
                masked,
                p.getPhone(),
                p.getCounty(),
                p.getCity(),
                p.getAddress(),
                roles,
                p.getCreatedAt()
        );
    }

    private static String maskCnp(String cnp) {
        if (cnp.length() < 4) return "****";
        return "*".repeat(cnp.length() - 4) + cnp.substring(cnp.length() - 4);
    }
}
