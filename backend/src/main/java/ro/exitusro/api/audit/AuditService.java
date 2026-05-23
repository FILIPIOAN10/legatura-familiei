package ro.exitusro.api.audit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.exitusro.api.security.SecurityUtils;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository repository;
    private final ObjectMapper objectMapper;

    @Transactional
    public AuditLogEntity log(UUID caseId, String action, Map<String, Object> payload) {
        UUID actorId = SecurityUtils.currentUserOrNull() != null
                ? SecurityUtils.currentUserOrNull().getId()
                : null;

        JsonNode payloadNode = payload == null
                ? objectMapper.createObjectNode()
                : objectMapper.valueToTree(payload);

        AuditLogEntity entry = AuditLogEntity.builder()
                .caseId(caseId)
                .actorId(actorId)
                .action(action)
                .payload(payloadNode)
                .build();
        return repository.save(entry);
    }
}
