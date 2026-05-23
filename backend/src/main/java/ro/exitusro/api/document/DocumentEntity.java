package ro.exitusro.api.document;

import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import ro.exitusro.api.common.enums.DocumentType;
import ro.exitusro.api.common.hibernate.DocumentTypeType;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "case_id", nullable = false)
    private UUID caseId;

    @Type(DocumentTypeType.class)
    @Column(name = "type", nullable = false, columnDefinition = "document_type")
    private DocumentType type;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "storage_path")
    private String storagePath;

    @Column(name = "uploaded_by")
    private UUID uploadedBy;

    @Column(name = "signed", nullable = false)
    @Builder.Default
    private boolean signed = false;

    @Type(JsonBinaryType.class)
    @Column(name = "signature_meta", columnDefinition = "jsonb")
    private JsonNode signatureMeta;

    @CreationTimestamp
    @Column(name = "issued_at", nullable = false, updatable = false)
    private OffsetDateTime issuedAt;

    @Type(JsonBinaryType.class)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private JsonNode metadata;
}
