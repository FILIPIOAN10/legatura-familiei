package ro.exitusro.api.common.hibernate;

import ro.exitusro.api.common.PostgresEnumType;
import ro.exitusro.api.common.enums.DeathCauseType;

public class DeathCauseTypeType extends PostgresEnumType<DeathCauseType> {
    public DeathCauseTypeType() {
        super(DeathCauseType.class);
    }
}
