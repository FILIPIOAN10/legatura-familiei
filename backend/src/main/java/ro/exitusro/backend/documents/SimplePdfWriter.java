package ro.exitusro.backend.documents;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

/**
 * Minimal hand-rolled PDF generator for the demo certificates we mint
 * server-side (CMCD, death certificate). Keeps the build dependency-free —
 * no PDFBox, no iText. The output is a single A4 page rendered in Helvetica
 * (a built-in PDF Type1 font, so no font embedding is required).
 *
 * Diacritics are stripped because we encode the text as WinAnsi (ISO-8859-1
 * compatible). For the dummy demo content this is acceptable.
 */
public final class SimplePdfWriter {

    private static final int PAGE_WIDTH = 595;   // A4 width in points
    private static final int PAGE_HEIGHT = 842;  // A4 height in points

    private SimplePdfWriter() {}

    public static byte[] generate(String title, List<String> lines) {
        StringBuilder content = new StringBuilder();

        // Header band
        content.append("q\n");
        content.append("0.07 0.13 0.36 rg\n");
        content.append("0 ").append(PAGE_HEIGHT - 80).append(" ").append(PAGE_WIDTH).append(" 80 re f\n");
        content.append("Q\n");

        // Title (white on the navy band)
        content.append("BT\n");
        content.append("1 1 1 rg\n");
        content.append("/F1 22 Tf\n");
        content.append("50 ").append(PAGE_HEIGHT - 50).append(" Td\n");
        content.append("(").append(escape(asciify(title))).append(") Tj\n");
        content.append("ET\n");

        // Body text
        int y = PAGE_HEIGHT - 140;
        content.append("BT\n");
        content.append("0 0 0 rg\n");
        content.append("/F1 11 Tf\n");
        content.append("50 ").append(y).append(" Td\n");
        boolean first = true;
        for (String raw : lines) {
            String line = asciify(raw);
            if (line.length() > 95) line = line.substring(0, 95);
            if (!first) {
                content.append("0 -16 Td\n");
            }
            content.append("(").append(escape(line)).append(") Tj\n");
            first = false;
        }
        content.append("ET\n");

        // Footer disclaimer
        content.append("BT\n");
        content.append("0.4 0.4 0.4 rg\n");
        content.append("/F1 8 Tf\n");
        content.append("50 50 Td\n");
        content.append("(Document generat automat - exemplu pentru demo. Nu inlocuieste actul oficial.) Tj\n");
        content.append("ET\n");

        byte[] contentBytes = content.toString().getBytes(StandardCharsets.ISO_8859_1);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        List<Long> offsets = new ArrayList<>();

        // Header — high-bit chars hint binary content for older readers
        write(baos, "%PDF-1.4\n");
        baos.write(0x25); baos.write(0xE2); baos.write(0xE3); baos.write(0xCF); baos.write(0xD3);
        baos.write('\n');

        offsets.add((long) baos.size());
        write(baos, "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

        offsets.add((long) baos.size());
        write(baos, "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

        offsets.add((long) baos.size());
        write(baos,
                "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "
                        + PAGE_WIDTH + " " + PAGE_HEIGHT
                        + "] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n");

        offsets.add((long) baos.size());
        write(baos, "4 0 obj\n<< /Length " + contentBytes.length + " >>\nstream\n");
        baos.writeBytes(contentBytes);
        write(baos, "\nendstream\nendobj\n");

        offsets.add((long) baos.size());
        write(baos, "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n");

        long xrefStart = baos.size();
        write(baos, "xref\n");
        write(baos, "0 " + (offsets.size() + 1) + "\n");
        write(baos, "0000000000 65535 f \n");
        for (Long off : offsets) {
            write(baos, String.format("%010d 00000 n \n", off));
        }
        write(baos,
                "trailer\n<< /Size " + (offsets.size() + 1) + " /Root 1 0 R >>\n"
                        + "startxref\n" + xrefStart + "\n%%EOF\n");

        return baos.toByteArray();
    }

    private static String escape(String s) {
        // Inside a literal string the '(' ')' and '\' must be escaped.
        return s.replace("\\", "\\\\")
                .replace("(", "\\(")
                .replace(")", "\\)");
    }

    private static String asciify(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFD);
        // Drop combining marks. The result is plain ASCII for our demo content.
        return n.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    }

    private static void write(ByteArrayOutputStream baos, String s) {
        baos.writeBytes(s.getBytes(StandardCharsets.ISO_8859_1));
    }
}
