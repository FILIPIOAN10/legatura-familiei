package ro.exitusro.backend.cases;

public enum DeathCauseType {
    NATURAL("natural"),
    VIOLENT("violent"),
    SUSPECT("suspect"),
    UNKNOWN("unknown");

    private final String value;

    DeathCauseType(String value) { this.value = value; }

    public String value() { return value; }

    public static DeathCauseType fromValue(String value) {
        for (DeathCauseType t : values()) {
            if (t.value.equalsIgnoreCase(value)) return t;
        }
        throw new IllegalArgumentException("Unknown death cause type: " + value);
    }
}
