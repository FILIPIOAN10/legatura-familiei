package ro.exitusro.backend.cases;

/**
 * Lifecycle states of a death case file. Names match the labels used by the SPA.
 */
public enum CaseStatus {
    AWAITING_DOCTOR,
    CMCD_ISSUED,
    AWAITING_CIVIL_OFFICER,
    DEATH_CERT_ISSUED,
    FUNERAL_SCHEDULED,
    FUNERAL_COMPLETED,
    ARCHIVED
}
