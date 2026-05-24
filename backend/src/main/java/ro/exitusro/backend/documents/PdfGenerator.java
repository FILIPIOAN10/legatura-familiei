package ro.exitusro.backend.documents;

import org.springframework.stereotype.Component;
import ro.exitusro.backend.cases.CaseEntity;
import ro.exitusro.backend.user.UserAccount;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Produces dummy demo PDFs for CMCD and the death certificate. */
@Component
public class PdfGenerator {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter
            .ofPattern("dd MMM yyyy, HH:mm", Locale.forLanguageTag("ro"))
            .withZone(ZoneId.of("Europe/Bucharest"));

    public byte[] cmcd(CaseEntity c, UserAccount doctor) {
        List<String> lines = new ArrayList<>();
        lines.add("Certificat Medical Constatator al Decesului (CMCD)");
        lines.add("Ord. MS 1147/2012");
        lines.add("");
        lines.add("Dosar: " + nullSafe(c.getCaseNumber()));
        lines.add("Decedat: " + nullSafe(c.getDeceasedFullName()));
        if (c.getDeceasedCnp() != null && !c.getDeceasedCnp().isBlank()) {
            lines.add("CNP: " + c.getDeceasedCnp());
        }
        if (c.getDeceasedDob() != null) {
            lines.add("Data nasterii: " + c.getDeceasedDob());
        }
        if (c.getDeceasedDod() != null) {
            lines.add("Data decesului: " + DATE_FMT.format(c.getDeceasedDod()));
        }
        if (c.getDeathLocation() != null) {
            lines.add("Locul decesului: " + c.getDeathLocation());
        }
        if (c.getCity() != null || c.getCounty() != null) {
            lines.add("Localitate: " + nullSafe(c.getCity()) + ", " + nullSafe(c.getCounty()));
        }
        lines.add("");
        lines.add("Cauza principala a decesului:");
        lines.add("  " + nullSafe(c.getCmcdCauseMain()));
        if (c.getCmcdCauseSecondary() != null && !c.getCmcdCauseSecondary().isBlank()) {
            lines.add("Cauza secundara:");
            lines.add("  " + c.getCmcdCauseSecondary());
        }
        if (c.getCmcdIcd10() != null && !c.getCmcdIcd10().isBlank()) {
            lines.add("Cod ICD-10: " + c.getCmcdIcd10());
        }
        lines.add("");
        lines.add("Medic constatator: " + (doctor != null ? nullSafe(doctor.getFullName()) : "-"));
        if (c.getCmcdIssuedAt() != null) {
            lines.add("Emis la: " + DATE_FMT.format(c.getCmcdIssuedAt()));
        }
        lines.add("");
        lines.add("Semnat electronic (mock).");

        return SimplePdfWriter.generate("CMCD - " + nullSafe(c.getDeceasedFullName()), lines);
    }

    public byte[] deathCertificate(CaseEntity c, UserAccount officer) {
        List<String> lines = new ArrayList<>();
        lines.add("Certificat de deces");
        lines.add("L. 119/1996 art. 35");
        lines.add("");
        lines.add("Numar certificat: " + nullSafe(c.getCertificateNumber()));
        lines.add("Dosar: " + nullSafe(c.getCaseNumber()));
        lines.add("");
        lines.add("Decedat: " + nullSafe(c.getDeceasedFullName()));
        if (c.getDeceasedCnp() != null && !c.getDeceasedCnp().isBlank()) {
            lines.add("CNP: " + c.getDeceasedCnp());
        }
        if (c.getDeceasedDob() != null) {
            lines.add("Data nasterii: " + c.getDeceasedDob());
        }
        if (c.getDeceasedDod() != null) {
            lines.add("Data decesului: " + DATE_FMT.format(c.getDeceasedDod()));
        }
        if (c.getCity() != null || c.getCounty() != null) {
            lines.add("Localitate: " + nullSafe(c.getCity()) + ", " + nullSafe(c.getCounty()));
        }
        lines.add("");
        lines.add("Inregistrat in SIIEASC.");
        lines.add("Functionar Stare Civila: " + (officer != null ? nullSafe(officer.getFullName()) : "-"));
        if (c.getCertIssuedAt() != null) {
            lines.add("Emis la: " + DATE_FMT.format(c.getCertIssuedAt()));
        }
        lines.add("");
        lines.add("Semnatura electronica (mock).");

        return SimplePdfWriter.generate("Certificat deces " + nullSafe(c.getCertificateNumber()), lines);
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }
}
