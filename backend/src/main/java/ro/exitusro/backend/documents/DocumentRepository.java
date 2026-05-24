package ro.exitusro.backend.documents;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.exitusro.backend.cases.CaseEntity;

import java.util.List;

public interface DocumentRepository extends JpaRepository<DocumentEntity, String> {
    List<DocumentEntity> findByCaseEntityOrderByIssuedAtDesc(CaseEntity caseEntity);
}
