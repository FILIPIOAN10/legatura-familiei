package ro.exitusro.api.task;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import ro.exitusro.api.common.enums.AppRole;
import ro.exitusro.api.common.enums.TaskStatus;
import ro.exitusro.api.common.hibernate.AppRoleType;
import ro.exitusro.api.common.hibernate.TaskStatusType;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "case_id", nullable = false)
    private UUID caseId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description")
    private String description;

    @Type(AppRoleType.class)
    @Column(name = "role_responsible", columnDefinition = "app_role")
    private AppRole roleResponsible;

    @Type(TaskStatusType.class)
    @Column(name = "status", nullable = false, columnDefinition = "task_status")
    @Builder.Default
    private TaskStatus status = TaskStatus.todo;

    @Column(name = "legal_deadline")
    private OffsetDateTime legalDeadline;

    @Column(name = "legal_reference")
    private String legalReference;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "completed_by")
    private UUID completedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
