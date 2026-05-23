package ro.exitusro.api.task;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ro.exitusro.api.common.enums.TaskStatus;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService service;

    @GetMapping("/cases/{caseId}/tasks")
    public List<TaskEntity> list(@PathVariable UUID caseId) {
        return service.listForCase(caseId);
    }

    @PostMapping("/cases/{caseId}/tasks")
    public TaskEntity create(@PathVariable UUID caseId, @RequestBody TaskEntity body) {
        body.setCaseId(caseId);
        return service.create(body);
    }

    @PatchMapping("/tasks/{id}/status")
    public TaskEntity updateStatus(@PathVariable UUID id, @RequestParam TaskStatus status) {
        return service.updateStatus(id, status);
    }
}
