package ro.exitusro.backend.cases;

import ro.exitusro.backend.cases.dto.CaseTask;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

/**
 * Computes the canonical task list shown on the case detail page based on the
 * case status and date of death. These tasks are not stored — they're derived.
 */
public final class CaseTaskCalculator {

    private static final Set<CaseStatus> CMCD_DONE = Set.of(
            CaseStatus.CMCD_ISSUED,
            CaseStatus.AWAITING_CIVIL_OFFICER,
            CaseStatus.DEATH_CERT_ISSUED,
            CaseStatus.FUNERAL_SCHEDULED,
            CaseStatus.FUNERAL_COMPLETED,
            CaseStatus.ARCHIVED
    );

    private static final Set<CaseStatus> CERT_DONE = Set.of(
            CaseStatus.DEATH_CERT_ISSUED,
            CaseStatus.FUNERAL_SCHEDULED,
            CaseStatus.FUNERAL_COMPLETED,
            CaseStatus.ARCHIVED
    );

    private static final Set<CaseStatus> FUNERAL_DONE = Set.of(
            CaseStatus.FUNERAL_SCHEDULED,
            CaseStatus.FUNERAL_COMPLETED,
            CaseStatus.ARCHIVED
    );

    private CaseTaskCalculator() {}

    public static List<CaseTask> compute(CaseEntity c) {
        Instant dod = c.getDeceasedDod();
        Instant deadlineCmcd = dod != null ? dod.plus(48, ChronoUnit.HOURS) : null;
        Instant deadlineCert = dod != null ? dod.plus(72, ChronoUnit.HOURS) : null;

        return List.of(
                new CaseTask(
                        c.getId() + "-t1",
                        "Eliberare CMCD de către medic",
                        "Ord. MS 1147/2012",
                        deadlineCmcd,
                        CMCD_DONE.contains(c.getStatus()) ? "done" : "todo"
                ),
                new CaseTask(
                        c.getId() + "-t2",
                        "Declarare la Starea Civilă & emitere certificat de deces",
                        "L. 119/1996 art. 35",
                        deadlineCert,
                        CERT_DONE.contains(c.getStatus()) ? "done" : "todo"
                ),
                new CaseTask(
                        c.getId() + "-t3",
                        "Programare servicii funerare",
                        "L. 102/2014",
                        null,
                        FUNERAL_DONE.contains(c.getStatus()) ? "done" : "todo"
                )
        );
    }
}
