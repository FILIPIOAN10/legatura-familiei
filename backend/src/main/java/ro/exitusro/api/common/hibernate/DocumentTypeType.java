package ro.exitusro.api.common.hibernate;

import ro.exitusro.api.common.PostgresEnumType;
import ro.exitusro.api.common.enums.DocumentType;

public class DocumentTypeType extends PostgresEnumType<DocumentType> {
    public DocumentTypeType() {
        super(DocumentType.class);
    }
}
