package ro.exitusro.api.legal;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Lightweight catalog of Romanian laws referenced across the platform.
 * Public-readable; meant to power the /legal-library screen.
 */
@RestController
@RequestMapping("/api/v1/public/legal")
public class LegalLibraryController {

    public record LegalEntry(String code, String title, String summary, String url, List<String> tags) {
    }

    private static final List<LegalEntry> ENTRIES = List.of(
            new LegalEntry(
                    "L. 119/1996",
                    "Legea privind actele de stare civila",
                    "Reglementeaza intocmirea actelor de stare civila, inclusiv certificatul de deces (art. 35).",
                    "https://legislatie.just.ro/Public/DetaliiDocument/8810",
                    List.of("stare-civila", "deces", "certificat")
            ),
            new LegalEntry(
                    "L. 102/2014",
                    "Legea cimitirelor, crematoriilor umane si serviciilor funerare",
                    "Termenul minim/maxim de 24-72h intre deces si inhumare/incinerare.",
                    "https://legislatie.just.ro/Public/DetaliiDocument/159875",
                    List.of("funerar", "inhumare", "incinerare")
            ),
            new LegalEntry(
                    "L. 263/2010",
                    "Legea privind sistemul unitar de pensii publice",
                    "Ajutor de inmormantare, pensie de urmas.",
                    "https://legislatie.just.ro/Public/DetaliiDocument/124530",
                    List.of("pensii", "ajutor-inmormantare", "urmas")
            ),
            new LegalEntry(
                    "Codul civil",
                    "Mostenirea (art. 953 si urm.)",
                    "Devolutiunea legala si testamentara, acceptare / renuntare.",
                    "https://legislatie.just.ro/Public/DetaliiDocument/109884",
                    List.of("succesiune", "mostenire")
            ),
            new LegalEntry(
                    "L. 36/1995",
                    "Legea notarilor publici si a activitatii notariale",
                    "Procedura succesorala notariala, certificat de mostenitor.",
                    "https://legislatie.just.ro/Public/DetaliiDocument/5849",
                    List.of("notariat", "succesiune")
            ),
            new LegalEntry(
                    "C. fiscal, art. 111",
                    "Impozit pe veniturile din transferul proprietatilor imobiliare din patrimoniul personal",
                    "Termenul de 2 ani pentru dezbaterea succesorala fara impozit de 1%.",
                    "https://legislatie.just.ro/Public/DetaliiDocument/171282",
                    List.of("fiscal", "succesiune", "imobiliar")
            ),
            new LegalEntry(
                    "C. muncii, art. 56",
                    "Incetarea de drept a contractului individual de munca",
                    "La data decesului salariatului CIM inceteaza de drept.",
                    "https://legislatie.just.ro/Public/DetaliiDocument/40006",
                    List.of("munca", "angajator")
            )
    );

    @GetMapping
    public List<LegalEntry> list(@RequestParam(required = false) String q) {
        if (q == null || q.isBlank()) return ENTRIES;
        String needle = q.toLowerCase(java.util.Locale.ROOT);
        return ENTRIES.stream()
                .filter(e -> (e.title() + " " + e.summary() + " " + e.code()).toLowerCase().contains(needle))
                .toList();
    }
}
