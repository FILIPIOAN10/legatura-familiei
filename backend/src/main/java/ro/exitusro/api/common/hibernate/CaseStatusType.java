package ro.exitusro.api.common.hibernate;

import ro.exitusro.api.common.PostgresEnumType;
import ro.exitusro.api.common.enums.CaseStatus;

public class CaseStatusType extends PostgresEnumType<CaseStatus> {
    public CaseStatusType() {
        super(CaseStatus.class);
    }
}
