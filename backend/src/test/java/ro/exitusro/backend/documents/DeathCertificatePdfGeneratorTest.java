package ro.exitusro.backend.documents;

import org.junit.jupiter.api.Test;
import ro.exitusro.backend.cases.CaseEntity;
import ro.exitusro.backend.cases.DeathCauseType;
import ro.exitusro.backend.user.Role;
import ro.exitusro.backend.user.UserAccount;

import java.time.Instant;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class DeathCertificatePdfGeneratorTest {

    private final DeathCertificatePdfGenerator generator = new DeathCertificatePdfGenerator();

    @Test
    void generates_a_valid_pdf_with_certificate_data() {
        UserAccount officer = new UserAccount(
                "functionar@exitusro.ro", "func", "Funcționar Demo", "x", Role.CIVIL_OFFICER);
        UserAccount doctor = new UserAccount(
                "medic@exitusro.ro", "medic", "Dr. Demo", "x", Role.DOCTOR);
        UserAccount family = new UserAccount(
                "f@exitusro.ro", "f", "F", "x", Role.FAMILY);

        CaseEntity c = new CaseEntity("DEMO-2026-0042", family);
        c.setDeceasedFullName("Maria Ionescu");
        c.setDeceasedCnp("2900101000002");
        c.setDeceasedDob(LocalDate.of(1948, 7, 21));
        c.setDeceasedDod(Instant.parse("2026-05-24T07:15:00Z"));
        c.setDeathLocation("Spital Clinic Județean");
        c.setDeathCauseType(DeathCauseType.NATURAL);
        c.setCity("Cluj-Napoca");
        c.setCounty("Cluj");
        c.setAddress("Str. Demo 99");
        c.setCmcd("Stop cardio-respirator", null, "I46.9", doctor);
        c.setCertificate("RO-2026-271581", officer);

        byte[] pdf = generator.generate(c);

        assertThat(pdf.length).isGreaterThan(1000);
        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-");
        assertThat(generator.suggestedFilename(c)).isEqualTo("CertificatDeces_RO-2026-271581.pdf");
        assertThat(generator.suggestedTitle(c)).isEqualTo("Certificat de deces RO-2026-271581");
    }
}
