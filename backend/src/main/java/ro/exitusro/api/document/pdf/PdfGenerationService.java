package ro.exitusro.api.document.pdf;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ro.exitusro.api.cases.CaseEntity;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Generates legal PDF documents (CMCD, death certificate, burial permit).
 * For the MVP these are visually formatted but contain mock signatures; real
 * e-signature integration (certSIGN / DigiSign) is a Phase 2 concern.
 */
@Service
@Slf4j
public class PdfGenerationService {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMMM yyyy", new Locale("ro", "RO"));
    private static final DateTimeFormatter DATETIME_FMT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm", new Locale("ro", "RO"));

    private static final Color NAVY = new Color(30, 58, 95);
    private static final Color SOFT_GREY = new Color(120, 130, 140);

    private static final Font TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, NAVY);
    private static final Font H2 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, NAVY);
    private static final Font BODY = FontFactory.getFont(FontFactory.HELVETICA, 11, Color.BLACK);
    private static final Font LABEL = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, NAVY);
    private static final Font META = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, SOFT_GREY);

    public byte[] generateCmcd(CaseEntity c, String doctorName, String parafa,
                                String icdCode, String causeDescription) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 50, 50, 60, 50);
            PdfWriter.getInstance(doc, out);
            doc.open();

            doc.add(new Paragraph("CERTIFICAT MEDICAL CONSTATATOR AL DECESULUI", TITLE));
            doc.add(new Paragraph("(CMCD)", META));
            doc.add(Chunk.NEWLINE);
            doc.add(new Paragraph("Nr. dosar: " + c.getCaseNumber(), META));
            doc.add(Chunk.NEWLINE);

            doc.add(sectionHeader("Date persoana decedata"));
            doc.add(kv("Nume si prenume", c.getDeceasedFullName()));
            doc.add(kv("CNP", c.getDeceasedCnp()));
            doc.add(kv("Data nasterii",
                    c.getDeceasedDob() == null ? "-" : c.getDeceasedDob().format(DATE_FMT)));
            doc.add(kv("Data si ora decesului", c.getDeceasedDod().format(DATETIME_FMT)));
            doc.add(kv("Locul decesului",
                    nullToDash(c.getDeathLocation()) + ", " + nullToDash(c.getCity()) + ", " + nullToDash(c.getCounty())));
            doc.add(Chunk.NEWLINE);

            doc.add(sectionHeader("Cauza decesului"));
            doc.add(kv("Tip", c.getDeathCauseType() == null ? "-" : c.getDeathCauseType().name()));
            doc.add(kv("Cod ICD-10", nullToDash(icdCode)));
            doc.add(kv("Descriere", nullToDash(causeDescription)));
            doc.add(Chunk.NEWLINE);

            doc.add(sectionHeader("Medic constatator"));
            doc.add(kv("Nume", nullToDash(doctorName)));
            doc.add(kv("Parafa", nullToDash(parafa)));
            doc.add(Chunk.NEWLINE);
            doc.add(Chunk.NEWLINE);

            doc.add(new Paragraph("Semnatura electronica: [SEMNAT ELECTRONIC - mock MVP]", META));
            doc.add(new Paragraph(
                    "Document generat de ExitusRO la " + java.time.OffsetDateTime.now().format(DATETIME_FMT), META));
            doc.add(new Paragraph("Temei legal: L. 119/1996 privind actele de stare civila, art. 35.", META));

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Eroare la generarea PDF CMCD", e);
        }
    }

    public byte[] generateDeathCertificate(CaseEntity c, String officerName, String registrationNumber) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 50, 50, 60, 50);
            PdfWriter.getInstance(doc, out);
            doc.open();

            doc.add(new Paragraph("CERTIFICAT DE DECES", TITLE));
            doc.add(new Paragraph("Eliberat in baza Legii nr. 119/1996", META));
            doc.add(Chunk.NEWLINE);
            doc.add(new Paragraph("Nr. inregistrare: " + nullToDash(registrationNumber), LABEL));
            doc.add(new Paragraph("Nr. dosar electronic: " + c.getCaseNumber(), META));
            doc.add(Chunk.NEWLINE);

            doc.add(sectionHeader("Date persoana decedata"));
            doc.add(kv("Nume si prenume", c.getDeceasedFullName()));
            doc.add(kv("CNP", c.getDeceasedCnp()));
            doc.add(kv("Data nasterii",
                    c.getDeceasedDob() == null ? "-" : c.getDeceasedDob().format(DATE_FMT)));
            doc.add(kv("Data decesului", c.getDeceasedDod().format(DATETIME_FMT)));
            doc.add(kv("Locul decesului",
                    nullToDash(c.getCity()) + ", jud. " + nullToDash(c.getCounty())));
            doc.add(Chunk.NEWLINE);

            doc.add(sectionHeader("Functionar Stare Civila"));
            doc.add(kv("Nume", nullToDash(officerName)));
            doc.add(Chunk.NEWLINE);
            doc.add(Chunk.NEWLINE);

            doc.add(new Paragraph("Semnatura electronica: [SEMNAT ELECTRONIC - mock MVP]", META));
            doc.add(new Paragraph(
                    "Document generat de ExitusRO la " + java.time.OffsetDateTime.now().format(DATETIME_FMT), META));

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Eroare la generarea certificatului de deces", e);
        }
    }

    public byte[] generateBurialPermit(CaseEntity c, String officerName) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 50, 50, 60, 50);
            PdfWriter.getInstance(doc, out);
            doc.open();
            doc.add(new Paragraph("ADEVERINTA DE INHUMARE / INCINERARE", TITLE));
            doc.add(Chunk.NEWLINE);
            doc.add(new Paragraph("Nr. dosar: " + c.getCaseNumber(), META));
            doc.add(Chunk.NEWLINE);
            doc.add(sectionHeader("Persoana decedata"));
            doc.add(kv("Nume si prenume", c.getDeceasedFullName()));
            doc.add(kv("Data decesului", c.getDeceasedDod().format(DATETIME_FMT)));
            doc.add(kv("Locul decesului",
                    nullToDash(c.getCity()) + ", jud. " + nullToDash(c.getCounty())));
            doc.add(Chunk.NEWLINE);
            doc.add(new Paragraph(
                    "Se elibereaza prezenta adeverinta pentru a servi la inhumarea/incinerarea persoanei sus-numite, "
                            + "in conditiile Legii nr. 102/2014 privind cimitirele, crematoriile umane si serviciile funerare.",
                    BODY));
            doc.add(Chunk.NEWLINE);
            doc.add(kv("Functionar Stare Civila", nullToDash(officerName)));
            doc.add(new Paragraph(
                    "Document generat de ExitusRO la " + java.time.OffsetDateTime.now().format(DATETIME_FMT), META));
            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Eroare la generarea adeverintei", e);
        }
    }

    private Paragraph sectionHeader(String text) {
        Paragraph p = new Paragraph(text, H2);
        p.setSpacingBefore(8f);
        p.setSpacingAfter(4f);
        return p;
    }

    private Paragraph kv(String key, String value) {
        Paragraph p = new Paragraph();
        p.add(new Chunk(key + ": ", LABEL));
        p.add(new Chunk(nullToDash(value), BODY));
        p.setSpacingAfter(2f);
        return p;
    }

    private String nullToDash(String v) {
        return v == null || v.isBlank() ? "-" : v;
    }
}
