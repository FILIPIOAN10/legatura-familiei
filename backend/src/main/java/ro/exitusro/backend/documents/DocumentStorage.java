package ro.exitusro.backend.documents;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Component
public class DocumentStorage {

    private final Path root;

    public DocumentStorage(@Value("${app.documents.storage-dir:./var/documents}") String storageDir) throws IOException {
        this.root = Paths.get(storageDir).toAbsolutePath().normalize();
        Files.createDirectories(this.root);
    }

    /** Stores the upload under {caseId}/{uuid}{ext} and returns the storage path. */
    public Stored store(MultipartFile file, String caseId) throws IOException {
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0 && dot < original.length() - 1) ext = original.substring(dot);

        Path caseDir = root.resolve(caseId);
        Files.createDirectories(caseDir);
        String name = UUID.randomUUID() + ext;
        Path target = caseDir.resolve(name);
        try (var in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }
        return new Stored(target.toString(), file.getContentType(), file.getSize());
    }

    /**
     * Persists a byte payload (e.g. a generated PDF) under {caseId}/{uuid}{ext}.
     * Returns the same Stored record shape as {@link #store(MultipartFile, String)}.
     */
    public Stored storeBytes(byte[] data, String caseId, String extWithDot, String mimeType) throws IOException {
        Path caseDir = root.resolve(caseId);
        Files.createDirectories(caseDir);
        String ext = extWithDot == null ? "" : extWithDot;
        String name = UUID.randomUUID() + ext;
        Path target = caseDir.resolve(name);
        Files.write(target, data);
        return new Stored(target.toString(), mimeType, data.length);
    }

    public Path resolve(String storagePath) {
        Path p = Paths.get(storagePath).toAbsolutePath().normalize();
        if (!p.startsWith(root)) {
            throw new IllegalArgumentException("Path is outside storage root");
        }
        return p;
    }

    public record Stored(String path, String mimeType, long size) {}
}
