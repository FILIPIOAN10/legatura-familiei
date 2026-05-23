package ro.exitusro.api.common.hibernate;

import ro.exitusro.api.common.PostgresEnumType;
import ro.exitusro.api.common.enums.AppRole;

public class AppRoleType extends PostgresEnumType<AppRole> {
    public AppRoleType() {
        super(AppRole.class);
    }
}
