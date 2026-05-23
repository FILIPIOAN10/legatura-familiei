package ro.exitusro.api.common.enums;

public enum AppRole {
    family,
    doctor,
    civil_officer,
    funeral_provider,
    notary,
    admin;

    public String authority() {
        return "ROLE_" + name().toUpperCase();
    }
}
