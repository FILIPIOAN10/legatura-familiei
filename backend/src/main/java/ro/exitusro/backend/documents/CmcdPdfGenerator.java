package ro.exitusro.backend.documents;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;
import ro.exitusro.backend.cases.CaseEntity;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Generates a placeholder CMCD (Certificat Medical Constatator al Decesului) PDF
 * from the data captured on the case at sign-time. The layout mimics the official
 * Romanian form; values come from the case entity, with sensible "DUMMY" fallbacks
 * where data is missing — this is a demo document, not a legally binding one.
 */
@Component
public class CmcdPdfGenerator {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy", new Locale("ro", "RO"));
    private static final DateTimeFormatter DATE_TIME_FMT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm", new Locale("ro", "RO"));

    public byte[] generate(CaseEntity c) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 48, 48, 56, 48);
            PdfWriter.getInstance(doc, out);
            doc.open();

            writeHeader(doc);
            writeMeta(doc, c);
            writeDeceasedSection(doc, c);
            writeCmcdSection(doc, c);
            writeSignature(doc, c);
            writeFooter(doc);

            doc.close();
            return out.toByteArray();
        } catch (DocumentException | java.io.IOException e) {
            throw new IllegalStateException("Failed to generate CMCD PDF", e);
        }
    }

    public String suggestedFilename(CaseEntity c) {
        String name = (c.getDeceasedFullName() != null ? c.getDeceasedFullName() : "pacient")
                .trim()
                .replaceAll("[^A-Za-z0-9ăâîșțĂÂÎȘȚ ]", "")
                .replaceAll("\\s+", "_");
        if (name.isBlank()) name = "pacient";
        return "CMCD_" + name + ".pdf";
    }

    public String suggestedTitle(CaseEntity c) {
        String name = c.getDeceasedFullName() != null && !c.getDeceasedFullName().isBlank()
                ? c.getDeceasedFullName()
                : "pacient";
        return "CMCD - " + name;
    }

    private void writeHeader(Document doc) throws DocumentException {
        Font title = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(20, 30, 60));
        Font subtitle = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);

        Paragraph p1 = new Paragraph("CERTIFICAT MEDICAL CONSTATATOR AL DECESULUI", title);
        p1.setAlignment(Element.ALIGN_CENTER);
        doc.add(p1);

        Paragraph p2 = new Paragraph("(CMCD) — document generat electronic prin platforma ExitusRO", subtitle);
        p2.setAlignment(Element.ALIGN_CENTER);
        p2.setSpacingAfter(6f);
        doc.add(p2);

        Paragraph notice = new Paragraph(
                "DEMO / DUMMY DATA — acest exemplar este generat automat în scop de testare " +
                        "și NU reprezintă un document oficial.",
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, new Color(140, 0, 0))
        );
        notice.setAlignment(Element.ALIGN_CENTER);
        notice.setSpacingAfter(14f);
        doc.add(notice);
    }

    private void writeMeta(Document doc, CaseEntity c) throws DocumentException {
        PdfPTable t = baseTable();
        addRow(t, "Număr dosar", safe(c.getCaseNumber()));
        addRow(t, "Data și ora emiterii",
                c.getCmcdIssuedAt() != null
                        ? DATE_TIME_FMT.format(c.getCmcdIssuedAt().atZone(ZoneId.of("Europe/Bucharest")))
                        : "—");
        addRow(t, "Unitate emitentă", "Spitalul Demo / Cabinet medical (DUMMY)");
        addRow(t, "Cod unic verificare",
                "CMCD-" + safe(c.getCaseNumber()).replace("DEMO-", "") + "-" +
                        Integer.toHexString(c.getId().hashCode()).toUpperCase());
        doc.add(t);
        doc.add(spacer());
    }

    private void writeDeceasedSection(Document doc, CaseEntity c) throws DocumentException {
        doc.add(sectionTitle("I. Date de identificare a decedatului"));
        PdfPTable t = baseTable();
        addRow(t, "Nume și prenume", safe(c.getDeceasedFullName()));
        addRow(t, "CNP", safe(c.getDeceasedCnp(), "DUMMY-CNP"));
        addRow(t, "Data nașterii",
                c.getDeceasedDob() != null ? DATE_FMT.format(c.getDeceasedDob()) : "—");
        addRow(t, "Data și ora decesului",
                c.getDeceasedDod() != null
                        ? DATE_TIME_FMT.format(c.getDeceasedDod().atZone(ZoneId.of("Europe/Bucharest")))
                        : "—");
        addRow(t, "Locul decesului", safe(c.getDeathLocation(), "Spitalul Demo"));
        addRow(t, "Domiciliu (oraș / județ)",
                safe(c.getCity()) + (c.getCounty() != null ? ", " + c.getCounty() : ""));
        addRow(t, "Adresă", safe(c.getAddress(), "Strada Demo nr. 1"));
        doc.add(t);
        doc.add(spacer());
    }

    private void writeCmcdSection(Document doc, CaseEntity c) throws DocumentException {
        doc.add(sectionTitle("II. Constatări medicale"));
        PdfPTable t = baseTable();
        addRow(t, "Tip cauză deces",
                c.getDeathCauseType() != null ? c.getDeathCauseType().value().toUpperCase() : "—");
        addRow(t, "Cauza principală (Ia)", safe(c.getCmcdCauseMain(), "—"));
        addRow(t, "Cauza secundară / antecedentă",
                safe(c.getCmcdCauseSecondary(), "—"));
        addRow(t, "Cod ICD-10", safe(c.getCmcdIcd10(), "—"));
        doc.add(t);
        doc.add(spacer());
    }

    private void writeSignature(Document doc, CaseEntity c) throws DocumentException {
        doc.add(sectionTitle("III. Medicul constatator"));
        PdfPTable t = baseTable();
        String medicName = c.getCmcdIssuedBy() != null && c.getCmcdIssuedBy().getFullName() != null
                ? c.getCmcdIssuedBy().getFullName()
                : "Medic Demo";
        String medicEmail = c.getCmcdIssuedBy() != null ? c.getCmcdIssuedBy().getEmail() : "medic@exitusro.ro";
        addRow(t, "Nume medic", medicName);
        addRow(t, "Email / identificator", safe(medicEmail));
        addRow(t, "Cod parafă", "PARAFA-DEMO-" + Math.abs(medicName.hashCode() % 1_000_000));
        addRow(t, "Semnătură electronică",
                "✓ Semnat digital prin ExitusRO la " +
                        (c.getCmcdIssuedAt() != null
                                ? DATE_TIME_FMT.format(c.getCmcdIssuedAt().atZone(ZoneId.of("Europe/Bucharest")))
                                : "—"));
        doc.add(t);
        doc.add(spacer());
    }

    private void writeFooter(Document doc) throws DocumentException {
        Font small = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY);
        Paragraph p = new Paragraph(
                "Document generat automat de platforma ExitusRO. Conține date de tip DUMMY " +
                        "folosite exclusiv pentru testarea fluxului. Pentru validare se trimite " +
                        "către Oficiul Stării Civile prin SIIEASC.",
                small
        );
        p.setAlignment(Element.ALIGN_CENTER);
        p.setSpacingBefore(20f);
        doc.add(p);
    }

    private static PdfPTable baseTable() throws DocumentException {
        PdfPTable t = new PdfPTable(new float[]{1.2f, 2.8f});
        t.setWidthPercentage(100f);
        return t;
    }

    private static Paragraph sectionTitle(String text) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, new Color(20, 30, 60));
        Paragraph p = new Paragraph(text, f);
        p.setSpacingBefore(6f);
        p.setSpacingAfter(4f);
        return p;
    }

    private static Paragraph spacer() {
        Paragraph p = new Paragraph(" ");
        p.setSpacingAfter(6f);
        return p;
    }

    private static void addRow(PdfPTable t, String label, String value) {
        Font lf = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.DARK_GRAY);
        Font vf = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
        PdfPCell l = new PdfPCell(new Phrase(label, lf));
        PdfPCell v = new PdfPCell(new Phrase(value != null ? value : "—", vf));
        l.setBackgroundColor(new Color(245, 247, 252));
        l.setPadding(6f);
        v.setPadding(6f);
        l.setBorderColor(new Color(220, 224, 232));
        v.setBorderColor(new Color(220, 224, 232));
        t.addCell(l);
        t.addCell(v);
    }

    private static String safe(String v) {
        return v != null && !v.isBlank() ? v : "—";
    }

    private static String safe(String v, String fallback) {
        return v != null && !v.isBlank() ? v : fallback;
    }
}
