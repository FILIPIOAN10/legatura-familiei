package ro.exitusro.backend.documents;

import org.junit.jupiter.api.Test;
import ro.exitusro.backend.cases.CaseEntity;
import ro.exitusro.backend.cases.DeathCauseType;
import ro.exitusro.backend.user.Role;
import ro.exitusro.backend.user.UserAccount;

import java.time.Instant;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class CmcdPdfGeneratorTest {

    private final CmcdPdfGenerator generator = new CmcdPdfGenerator();

    @Test
    void generates_a_valid_pdf_with_case_data() {
        UserAccount doctor = new UserAccount(
                "medic@exitusro.ro", "medic", "Dr. Demo Test", "x", Role.DOCTOR);
        UserAccount family = new UserAccount(
                "apartinator@exitusro.ro", "fam", "Familie Demo", "x", Role.FAMILY);

        CaseEntity c = new CaseEntity("DEMO-2026-0001", family);
        c.setDeceasedFullName("Ion Popescu");
        c.setDeceasedCnp("1900101000001");
        c.setDeceasedDob(LocalDate.of(1950, 3, 15));
        c.setDeceasedDod(Instant.parse("2026-05-23T18:30:00Z"));
        c.setDeathLocation("Spital Județean Demo");
        c.setDeathCauseType(DeathCauseType.NATURAL);
        c.setCity("București");
        c.setCounty("București");
        c.setAddress("Str. Demo 1");
        c.setCmcd("Insuficiență cardiacă acută", "Hipertensiune", "I50.9", doctor);

        byte[] pdf = generator.generate(c);

        assertThat(pdf).isNotNull();
        assertThat(pdf.length).isGreaterThan(1000);
        // PDF files always start with the "%PDF-" magic header
        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-");

        assertThat(generator.suggestedFilename(c)).isEqualTo("CMCD_Ion_Popescu.pdf");
        assertThat(generator.suggestedTitle(c)).isEqualTo("CMCD - Ion Popescu");
    }

    @Test
    void handles_missing_optional_fields_with_dummy_values() {
        UserAccount family = new UserAccount(
                "f@x.ro", "f", "F", "x", Role.FAMILY);
        CaseEntity c = new CaseEntity("DEMO-2026-0002", family);
        c.setDeceasedFullName("Pacient Anonim");
        c.setDeceasedDod(Instant.now());
        c.setDeathCauseType(DeathCauseType.UNKNOWN);

        byte[] pdf = generator.generate(c);
        assertThat(pdf.length).isGreaterThan(500);
        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-");
    }
}
