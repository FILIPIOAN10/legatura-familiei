package ro.exitusro.api.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ro.exitusro.api.common.enums.DocumentType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<DocumentEntity, UUID> {

    List<DocumentEntity> findByCaseIdOrderByIssuedAtDesc(UUID caseId);

    Optional<DocumentEntity> findFirstByCaseIdAndTypeOrderByIssuedAtDesc(UUID caseId, DocumentType type);
}
