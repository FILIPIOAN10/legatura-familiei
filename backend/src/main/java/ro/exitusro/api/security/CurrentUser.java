package ro.exitusro.api.security;

import lombok.Getter;
import ro.exitusro.api.common.enums.AppRole;

import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

@Getter
public class CurrentUser {

    private final UUID id;
    private final String email;
    private final Set<AppRole> roles;

    public CurrentUser(UUID id, String email, Set<AppRole> roles) {
        this.id = id;
        this.email = email;
        this.roles = roles == null ? EnumSet.noneOf(AppRole.class) : EnumSet.copyOf(roles);
    }

    public boolean hasRole(AppRole role) {
        return roles.contains(role);
    }

    public boolean isAdmin() {
        return hasRole(AppRole.admin);
    }
}
