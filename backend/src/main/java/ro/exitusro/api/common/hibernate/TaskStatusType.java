package ro.exitusro.api.common.hibernate;

import ro.exitusro.api.common.PostgresEnumType;
import ro.exitusro.api.common.enums.TaskStatus;

public class TaskStatusType extends PostgresEnumType<TaskStatus> {
    public TaskStatusType() {
        super(TaskStatus.class);
    }
}
