package ro.exitusro.api.document;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ro.exitusro.api.common.enums.DocumentType;
import ro.exitusro.api.document.dto.DocumentDto;
import ro.exitusro.api.document.dto.IssueCmcdRequest;
import ro.exitusro.api.document.dto.IssueDeathCertRequest;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService service;

    @GetMapping("/cases/{caseId}/documents")
    public List<DocumentDto> list(@PathVariable UUID caseId) {
        return service.listForCase(caseId);
    }

    @PostMapping(value = "/cases/{caseId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DocumentDto upload(@PathVariable UUID caseId,
                              @RequestParam("type") DocumentType type,
                              @RequestParam(value = "title", required = false) String title,
                              @RequestPart("file") MultipartFile file) {
        return service.upload(caseId, type, title, file);
    }

    @PostMapping("/cases/{caseId}/cmcd")
    public DocumentDto issueCmcd(@PathVariable UUID caseId,
                                 @Valid @RequestBody IssueCmcdRequest req) {
        return service.issueCmcd(caseId, req);
    }

    @PostMapping("/cases/{caseId}/death-certificate")
    public List<DocumentDto> issueDeathCertificate(@PathVariable UUID caseId,
                                                   @Valid @RequestBody IssueDeathCertRequest req) {
        return service.issueDeathCertificate(caseId, req);
    }

    @GetMapping("/documents/{id}")
    public DocumentDto get(@PathVariable UUID id) {
        return service.getById(id);
    }

    @GetMapping("/documents/{id}/download")
    public ResponseEntity<ByteArrayResource> download(@PathVariable UUID id) {
        DocumentDto d = service.getById(id);
        byte[] bytes = service.download(id);
        ByteArrayResource resource = new ByteArrayResource(bytes);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(d.title() + ".pdf").build().toString())
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(bytes.length)
                .body(resource);
    }
}
