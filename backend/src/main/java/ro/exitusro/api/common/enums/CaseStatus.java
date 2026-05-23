package ro.exitusro.api.common.enums;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum CaseStatus {
    DRAFT,
    AWAITING_DOCTOR,
    CMCD_ISSUED,
    AWAITING_CIVIL_OFFICER,
    DEATH_CERT_ISSUED,
    FUNERAL_SCHEDULED,
    FUNERAL_COMPLETED,
    SUCCESSION_OPEN,
    SUCCESSION_CLOSED,
    ARCHIVED;

    /**
     * State-machine transitions. Each key lists the legal next states.
     * Enforced server-side in CaseService.
     */
    private static final Map<CaseStatus, Set<CaseStatus>> ALLOWED = Map.ofEntries(
            Map.entry(DRAFT, EnumSet.of(AWAITING_DOCTOR, ARCHIVED)),
            Map.entry(AWAITING_DOCTOR, EnumSet.of(CMCD_ISSUED, ARCHIVED)),
            Map.entry(CMCD_ISSUED, EnumSet.of(AWAITING_CIVIL_OFFICER, ARCHIVED)),
            Map.entry(AWAITING_CIVIL_OFFICER, EnumSet.of(DEATH_CERT_ISSUED, CMCD_ISSUED, ARCHIVED)),
            Map.entry(DEATH_CERT_ISSUED, EnumSet.of(FUNERAL_SCHEDULED, ARCHIVED)),
            Map.entry(FUNERAL_SCHEDULED, EnumSet.of(FUNERAL_COMPLETED, ARCHIVED)),
            Map.entry(FUNERAL_COMPLETED, EnumSet.of(SUCCESSION_OPEN, ARCHIVED)),
            Map.entry(SUCCESSION_OPEN, EnumSet.of(SUCCESSION_CLOSED, ARCHIVED)),
            Map.entry(SUCCESSION_CLOSED, EnumSet.of(ARCHIVED)),
            Map.entry(ARCHIVED, EnumSet.noneOf(CaseStatus.class))
    );

    public boolean canTransitionTo(CaseStatus next) {
        return ALLOWED.getOrDefault(this, EnumSet.noneOf(CaseStatus.class)).contains(next);
    }
}
