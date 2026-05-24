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
 * Generates a placeholder Certificat de Deces (death certificate) PDF using the
 * data captured on the case after the civil officer has validated and issued
 * the certificate. Same DEMO disclaimer as the CMCD generator — this is a
 * convenience document for the demo flow, not a legally binding act.
 */
@Component
public class DeathCertificatePdfGenerator {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy", new Locale("ro", "RO"));
    private static final DateTimeFormatter DATE_TIME_FMT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm", new Locale("ro", "RO"));

    public byte[] generate(CaseEntity c) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 48, 48, 56, 48);
            PdfWriter.getInstance(doc, out);
            doc.open();

            writeHeader(doc, c);
            writeDeceasedSection(doc, c);
            writeDeathSection(doc, c);
            writeIssuanceSection(doc, c);
            writeFooter(doc);

            doc.close();
            return out.toByteArray();
        } catch (DocumentException | java.io.IOException e) {
            throw new IllegalStateException("Failed to generate Death Certificate PDF", e);
        }
    }

    public String suggestedFilename(CaseEntity c) {
        String number = c.getCertificateNumber() != null ? c.getCertificateNumber() : "DEMO";
        String safe = number.replaceAll("[^A-Za-z0-9_-]", "_");
        return "CertificatDeces_" + safe + ".pdf";
    }

    public String suggestedTitle(CaseEntity c) {
        String number = c.getCertificateNumber() != null ? c.getCertificateNumber() : "—";
        return "Certificat de deces " + number;
    }

    private void writeHeader(Document doc, CaseEntity c) throws DocumentException {
        Font title = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(20, 30, 60));
        Font subtitle = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);

        Paragraph p1 = new Paragraph("CERTIFICAT DE DECES", title);
        p1.setAlignment(Element.ALIGN_CENTER);
        doc.add(p1);

        Paragraph p2 = new Paragraph(
                "Seria și numărul: " + safe(c.getCertificateNumber(), "RO-DEMO-000000"),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, new Color(20, 30, 60)));
        p2.setAlignment(Element.ALIGN_CENTER);
        p2.setSpacingAfter(4f);
        doc.add(p2);

        Paragraph p3 = new Paragraph(
                "emis prin platforma ExitusRO / SIIEASC",
                subtitle);
        p3.setAlignment(Element.ALIGN_CENTER);
        p3.setSpacingAfter(6f);
        doc.add(p3);

        Paragraph notice = new Paragraph(
                "DEMO / DUMMY DATA — acest exemplar este generat automat în scop de testare " +
                        "și NU reprezintă un document oficial.",
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, new Color(140, 0, 0))
        );
        notice.setAlignment(Element.ALIGN_CENTER);
        notice.setSpacingAfter(16f);
        doc.add(notice);
    }

    private void writeDeceasedSection(Document doc, CaseEntity c) throws DocumentException {
        doc.add(sectionTitle("I. Persoana decedată"));
        PdfPTable t = baseTable();
        addRow(t, "Nume și prenume", safe(c.getDeceasedFullName()));
        addRow(t, "CNP", safe(c.getDeceasedCnp(), "DUMMY-CNP"));
        addRow(t, "Data nașterii",
                c.getDeceasedDob() != null ? DATE_FMT.format(c.getDeceasedDob()) : "—");
        addRow(t, "Domiciliu",
                safe(c.getAddress(), "Strada Demo nr. 1") +
                        ", " + safe(c.getCity()) +
                        (c.getCounty() != null ? ", jud. " + c.getCounty() : ""));
        doc.add(t);
        doc.add(spacer());
    }

    private void writeDeathSection(Document doc, CaseEntity c) throws DocumentException {
        doc.add(sectionTitle("II. Date despre deces"));
        PdfPTable t = baseTable();
        addRow(t, "Data și ora decesului",
                c.getDeceasedDod() != null
                        ? DATE_TIME_FMT.format(c.getDeceasedDod().atZone(ZoneId.of("Europe/Bucharest")))
                        : "—");
        addRow(t, "Locul decesului", safe(c.getDeathLocation(), "Spitalul Demo"));
        addRow(t, "Cauza decesului (din CMCD)",
                safe(c.getCmcdCauseMain(), "—"));
        addRow(t, "Tip cauză",
                c.getDeathCauseType() != null ? c.getDeathCauseType().value().toUpperCase() : "—");
        addRow(t, "Medic constatator",
                c.getCmcdIssuedBy() != null && c.getCmcdIssuedBy().getFullName() != null
                        ? c.getCmcdIssuedBy().getFullName()
                        : "Medic Demo");
        doc.add(t);
        doc.add(spacer());
    }

    private void writeIssuanceSection(Document doc, CaseEntity c) throws DocumentException {
        doc.add(sectionTitle("III. Emiterea actului de stare civilă"));
        PdfPTable t = baseTable();
        String officer = c.getCertIssuedBy() != null && c.getCertIssuedBy().getFullName() != null
                ? c.getCertIssuedBy().getFullName()
                : "Funcționar Demo";
        addRow(t, "Funcționar Stare Civilă", officer);
        addRow(t, "Email / identificator",
                c.getCertIssuedBy() != null ? c.getCertIssuedBy().getEmail() : "functionar@exitusro.ro");
        addRow(t, "Data emiterii",
                c.getCertIssuedAt() != null
                        ? DATE_TIME_FMT.format(c.getCertIssuedAt().atZone(ZoneId.of("Europe/Bucharest")))
                        : "—");
        addRow(t, "Înregistrare SIIEASC",
                "SIIEASC-" + safe(c.getCertificateNumber(), "DEMO").replace("RO-", ""));
        addRow(t, "Dosar asociat", safe(c.getCaseNumber()));
        addRow(t, "Semnătură electronică",
                "✓ Semnat digital prin SIIEASC la " +
                        (c.getCertIssuedAt() != null
                                ? DATE_TIME_FMT.format(c.getCertIssuedAt().atZone(ZoneId.of("Europe/Bucharest")))
                                : "—"));
        doc.add(t);
        doc.add(spacer());
    }

    private void writeFooter(Document doc) throws DocumentException {
        Font small = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY);
        Paragraph p = new Paragraph(
                "Document generat automat de platforma ExitusRO după validarea în SIIEASC " +
                        "(Sistemul Informatic Integrat pentru Emiterea Actelor de Stare Civilă). " +
                        "Conține date de tip DUMMY folosite exclusiv pentru testarea fluxului.",
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
