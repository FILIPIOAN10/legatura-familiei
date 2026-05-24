package ro.exitusro.backend.documents;

import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import ro.exitusro.backend.cases.CaseEntity;
import ro.exitusro.backend.cases.CaseRepository;
import ro.exitusro.backend.documents.dto.DocumentSummary;
import ro.exitusro.backend.security.CurrentUser;
import ro.exitusro.backend.user.Role;
import ro.exitusro.backend.user.UserAccount;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentRepository documents;
    private final CaseRepository cases;
    private final DocumentStorage storage;

    public DocumentController(DocumentRepository documents, CaseRepository cases, DocumentStorage storage) {
        this.documents = documents;
        this.cases = cases;
        this.storage = storage;
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("case_id") String caseId,
            @RequestParam("type") String type,
            @RequestParam("title") String title,
            @CurrentUser UserAccount user) throws IOException {

        if (file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "File is empty");
        }
        if (file.getSize() > 25L * 1024 * 1024) {
            throw new ResponseStatusException(BAD_REQUEST, "File exceeds 25 MB limit");
        }
        CaseEntity c = cases.findById(caseId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Case not found"));
        ensureCanWrite(c, user);

        DocumentStorage.Stored stored = storage.store(file, caseId);
        DocumentEntity doc = new DocumentEntity(c, type, title);
        doc.setStoragePath(stored.path());
        doc.setMimeType(stored.mimeType());
        doc.setSizeBytes(stored.size());
        doc.setUploadedBy(user);
        documents.save(doc);
        c.addAudit("Document încărcat: " + title, user);

        return ResponseEntity.status(201).body(Map.of(
                "ok", true,
                "document_id", doc.getId()
        ));
    }

    @GetMapping("/{id}/download-url")
    public Map<String, String> downloadUrl(@PathVariable String id, @CurrentUser UserAccount user) {
        DocumentEntity doc = documents.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Document not found"));
        ensureCanRead(doc.getCaseEntity(), user);
        return Map.of(
                "url", "/api/documents/" + id + "/content",
                "title", doc.getTitle()
        );
    }

    @GetMapping("/{id}/content")
    public ResponseEntity<FileSystemResource> content(@PathVariable String id,
                                                      @CurrentUser UserAccount user) throws IOException {
        DocumentEntity doc = documents.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Document not found"));
        ensureCanRead(doc.getCaseEntity(), user);
        if (doc.getStoragePath() == null) {
            throw new ResponseStatusException(NOT_FOUND, "Document has no file attached");
        }
        Path path = storage.resolve(doc.getStoragePath());
        if (!Files.exists(path)) {
            throw new ResponseStatusException(NOT_FOUND, "File missing on disk");
        }
        String encoded = URLEncoder.encode(doc.getTitle(), StandardCharsets.UTF_8).replace("+", "%20");
        MediaType type = doc.getMimeType() != null
                ? MediaType.parseMediaType(doc.getMimeType())
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(type)
                .contentLength(Files.size(path))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + encoded)
                .body(new FileSystemResource(path));
    }

    private void ensureCanRead(CaseEntity c, UserAccount user) {
        Role role = user.getRole();
        if (role == Role.ADMIN) return;
        if (role == Role.FAMILY) {
            if (c.getOpenedBy() != null && c.getOpenedBy().getId().equals(user.getId())) return;
            throw new ResponseStatusException(FORBIDDEN, "No access to this document");
        }
    }

    private void ensureCanWrite(CaseEntity c, UserAccount user) {
        Role role = user.getRole();
        if (role == Role.ADMIN || role == Role.FAMILY || role == Role.DOCTOR) {
            if (role == Role.FAMILY && c.getOpenedBy() != null
                    && !c.getOpenedBy().getId().equals(user.getId())) {
                throw new ResponseStatusException(FORBIDDEN, "Not your case");
            }
            return;
        }
        throw new ResponseStatusException(FORBIDDEN, "Role cannot upload documents");
    }
}
