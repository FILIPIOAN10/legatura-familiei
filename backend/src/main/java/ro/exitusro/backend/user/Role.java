package ro.exitusro.backend.user;

/**
 * Application roles. Stored lowercase in DB so the frontend can use them as-is in JSON.
 */
public enum Role {
    FAMILY("family"),
    DOCTOR("doctor"),
    CIVIL_OFFICER("civil_officer"),
    FUNERAL_PROVIDER("funeral_provider"),
    NOTARY("notary"),
    ADMIN("admin");

    private final String value;

    Role(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public String authority() {
        return "ROLE_" + name();
    }

    public static Role fromValue(String value) {
        for (Role r : values()) {
            if (r.value.equalsIgnoreCase(value)) return r;
        }
        throw new IllegalArgumentException("Unknown role: " + value);
    }
}
