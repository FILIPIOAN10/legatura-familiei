package ro.exitusro.api.cases;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.exitusro.api.audit.AuditService;
import ro.exitusro.api.cases.dto.*;
import ro.exitusro.api.common.enums.AppRole;
import ro.exitusro.api.common.enums.CaseStatus;
import ro.exitusro.api.common.exception.BadRequestException;
import ro.exitusro.api.common.exception.ForbiddenException;
import ro.exitusro.api.common.exception.InvalidStateTransitionException;
import ro.exitusro.api.notification.NotificationService;
import ro.exitusro.api.profile.Profile;
import ro.exitusro.api.profile.ProfileRepository;
import ro.exitusro.api.role.UserRoleRepository;
import ro.exitusro.api.security.CurrentUser;
import ro.exitusro.api.security.SecurityUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CaseService {

    private final CaseRepository caseRepository;
    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final CaseAccessGuard guard;
    private final ObjectMapper objectMapper;

    @PersistenceContext
    private EntityManager entityManager;

    // ----------------- Listing -----------------

    @Transactional(readOnly = true)
    public Page<CaseDto> listForCurrentUser(Pageable pageable) {
        CurrentUser user = SecurityUtils.currentUser();
        Page<CaseEntity> page;

        if (user.isAdmin()) {
            page = caseRepository.findAll(pageable);
        } else if (user.hasRole(AppRole.family)) {
            page = caseRepository.findByCreatedBy(user.getId(), pageable);
        } else if (user.hasRole(AppRole.doctor)) {
            page = caseRepository.findByAssignedDoctor(user.getId(), pageable);
        } else if (user.hasRole(AppRole.civil_officer)) {
            page = caseRepository.findByAssignedCivilOfficer(user.getId(), pageable);
        } else if (user.hasRole(AppRole.funeral_provider)) {
            page = caseRepository.findByAssignedFuneralProvider(user.getId(), pageable);
        } else if (user.hasRole(AppRole.notary)) {
            page = caseRepository.findByAssignedNotary(user.getId(), pageable);
        } else {
            throw new ForbiddenException("Niciun rol valid asociat contului");
        }

        return page.map(c -> CaseDto.fromEntity(c, canUnmaskCnp(user, c)));
    }

    @Transactional(readOnly = true)
    public Page<CaseDto> inbox(Pageable pageable) {
        CurrentUser user = SecurityUtils.currentUser();
        Profile profile = profileRepository.findById(user.getId()).orElse(null);
        String county = profile == null ? null : profile.getCounty();

        if (user.hasRole(AppRole.doctor)) {
            return caseRepository.findInbox(CaseStatus.AWAITING_DOCTOR, county, pageable)
                    .map(c -> CaseDto.fromEntity(c, true));
        }
        if (user.hasRole(AppRole.civil_officer)) {
            return caseRepository.findInboxAnyStatus(
                            List.of(CaseStatus.CMCD_ISSUED, CaseStatus.AWAITING_CIVIL_OFFICER),
                            county, pageable)
                    .map(c -> CaseDto.fromEntity(c, true));
        }
        if (user.isAdmin()) {
            return caseRepository.findAll(pageable).map(c -> CaseDto.fromEntity(c, true));
        }
        throw new ForbiddenException("Inboxul este disponibil doar pentru medic / functionar / admin");
    }

    @Transactional(readOnly = true)
    public CaseDto getById(UUID id) {
        CurrentUser user = SecurityUtils.currentUser();
        CaseEntity c = guard.loadVisible(id, caseRepository, user);
        return CaseDto.fromEntity(c, canUnmaskCnp(user, c));
    }

    // ----------------- Mutations -----------------

    @Transactional
    public CaseDto create(CreateCaseRequest req) {
        CurrentUser user = SecurityUtils.currentUser();
        if (!user.hasRole(AppRole.family) && !user.isAdmin()) {
            throw new ForbiddenException("Doar aparținătorii pot crea dosare");
        }

        CaseEntity entity = CaseEntity.builder()
                .createdBy(user.getId())
                .status(CaseStatus.DRAFT)
                .deceasedFullName(req.deceasedFullName())
                .deceasedCnp(req.deceasedCnp())
                .deceasedDob(req.deceasedDob())
                .deceasedDod(req.deceasedDod())
                .deathLocation(req.deathLocation())
                .deathCauseType(req.deathCauseType() == null
                        ? ro.exitusro.api.common.enums.DeathCauseType.natural
                        : req.deathCauseType())
                .city(req.city())
                .county(req.county())
                .address(req.address())
                .build();

        caseRepository.saveAndFlush(entity);
        entityManager.refresh(entity);

        auditService.log(entity.getId(), "CASE_CREATED",
                Map.of("status", entity.getStatus().name()));

        return CaseDto.fromEntity(entity, true);
    }

    @Transactional
    public CaseDto update(UUID id, UpdateCaseRequest req) {
        CurrentUser user = SecurityUtils.currentUser();
        CaseEntity c = guard.loadVisible(id, caseRepository, user);

        if (!(user.isAdmin() || c.getCreatedBy().equals(user.getId()))) {
            throw new ForbiddenException("Doar creatorul sau adminul poate edita dosarul");
        }
        if (c.getStatus() != CaseStatus.DRAFT && c.getStatus() != CaseStatus.AWAITING_DOCTOR) {
            throw new BadRequestException("Dosarul nu mai poate fi modificat in aceasta stare");
        }

        if (req.deceasedFullName() != null) c.setDeceasedFullName(req.deceasedFullName());
        if (req.deceasedCnp() != null) c.setDeceasedCnp(req.deceasedCnp());
        if (req.deceasedDob() != null) c.setDeceasedDob(req.deceasedDob());
        if (req.deceasedDod() != null) c.setDeceasedDod(req.deceasedDod());
        if (req.deathLocation() != null) c.setDeathLocation(req.deathLocation());
        if (req.deathCauseType() != null) c.setDeathCauseType(req.deathCauseType());
        if (req.city() != null) c.setCity(req.city());
        if (req.county() != null) c.setCounty(req.county());
        if (req.address() != null) c.setAddress(req.address());

        CaseEntity saved = caseRepository.save(c);
        auditService.log(saved.getId(), "CASE_UPDATED", Map.of());
        return CaseDto.fromEntity(saved, true);
    }

    @Transactional
    public CaseDto submitToDoctor(UUID id) {
        CurrentUser user = SecurityUtils.currentUser();
        CaseEntity c = guard.loadVisible(id, caseRepository, user);
        if (!c.getCreatedBy().equals(user.getId()) && !user.isAdmin()) {
            throw new ForbiddenException("Doar creatorul dosarului poate notifica medicul");
        }

        if (c.getAssignedDoctor() == null) {
            findNearestUserWithRole(AppRole.doctor, c.getCounty())
                    .ifPresent(c::setAssignedDoctor);
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("assignedDoctor", c.getAssignedDoctor() == null ? null : c.getAssignedDoctor().toString());
        return transition(c, CaseStatus.AWAITING_DOCTOR, "CASE_SUBMITTED_TO_DOCTOR", payload);
    }

    @Transactional
    public CaseDto markCmcdIssued(UUID id) {
        CurrentUser user = SecurityUtils.currentUser();
        CaseEntity c = guard.loadVisible(id, caseRepository, user);
        if (!user.hasRole(AppRole.doctor) && !user.isAdmin()) {
            throw new ForbiddenException("Doar medicul poate emite CMCD");
        }
        if (c.getAssignedDoctor() == null) {
            c.setAssignedDoctor(user.getId());
        }

        if (c.getAssignedCivilOfficer() == null) {
            findNearestUserWithRole(AppRole.civil_officer, c.getCounty())
                    .ifPresent(c::setAssignedCivilOfficer);
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("doctorId", c.getAssignedDoctor().toString());
        payload.put("civilOfficerId",
                c.getAssignedCivilOfficer() == null ? null : c.getAssignedCivilOfficer().toString());
        return transition(c, CaseStatus.CMCD_ISSUED, "CMCD_ISSUED", payload);
    }

    @Transactional
    public CaseDto markDeathCertIssued(UUID id) {
        CurrentUser user = SecurityUtils.currentUser();
        CaseEntity c = guard.loadVisible(id, caseRepository, user);
        if (!user.hasRole(AppRole.civil_officer) && !user.isAdmin()) {
            throw new ForbiddenException("Doar functionarul de stare civila poate elibera certificatul");
        }
        if (c.getAssignedCivilOfficer() == null) {
            c.setAssignedCivilOfficer(user.getId());
        }
        return transition(c, CaseStatus.DEATH_CERT_ISSUED, "DEATH_CERT_ISSUED",
                Map.of("officerId", user.getId().toString()));
    }

    @Transactional
    public CaseDto transition(UUID id, TransitionRequest req) {
        CurrentUser user = SecurityUtils.currentUser();
        CaseEntity c = guard.loadVisible(id, caseRepository, user);

        boolean allowed = user.isAdmin()
                || Objects.equals(c.getCreatedBy(), user.getId())
                || Objects.equals(c.getAssignedDoctor(), user.getId())
                || Objects.equals(c.getAssignedCivilOfficer(), user.getId())
                || Objects.equals(c.getAssignedFuneralProvider(), user.getId())
                || Objects.equals(c.getAssignedNotary(), user.getId());
        if (!allowed) {
            throw new ForbiddenException("Tranzitia nu este permisa pentru rolul curent");
        }
        return transition(c, req.targetStatus(), "STATE_TRANSITION",
                Map.of("reason", req.reason() == null ? "" : req.reason()));
    }

    @Transactional
    public CaseDto assign(UUID id, AssignmentRequest req) {
        CurrentUser user = SecurityUtils.currentUser();
        CaseEntity c = guard.loadVisible(id, caseRepository, user);

        boolean isOwner = c.getCreatedBy().equals(user.getId());
        boolean allowed = user.isAdmin() || isOwner;
        if (!allowed) {
            throw new ForbiddenException("Doar creatorul sau adminul pot atribui");
        }

        if (!userRoleRepository.existsByUserIdAndRole(req.userId(), req.role())) {
            throw new BadRequestException("Utilizatorul nu are rolul cerut");
        }

        switch (req.role()) {
            case doctor -> c.setAssignedDoctor(req.userId());
            case civil_officer -> c.setAssignedCivilOfficer(req.userId());
            case funeral_provider -> c.setAssignedFuneralProvider(req.userId());
            case notary -> c.setAssignedNotary(req.userId());
            default -> throw new BadRequestException("Rolul nu poate fi atribuit unui dosar");
        }
        CaseEntity saved = caseRepository.save(c);

        auditService.log(saved.getId(), "ASSIGNMENT",
                Map.of("role", req.role().name(), "userId", req.userId().toString()));

        String title = switch (req.role()) {
            case doctor -> "Ati primit un dosar nou pentru emiterea CMCD";
            case civil_officer -> "Dosar nou pentru validare stare civila";
            case funeral_provider -> "Solicitare casa funerara";
            case notary -> "Dosar nou pentru succesiune";
            default -> "Atribuire dosar";
        };
        notificationService.notify(req.userId(), saved.getId(),
                "case.assigned", title, "Dosar " + saved.getCaseNumber(), null);

        return CaseDto.fromEntity(saved, true);
    }

    // ----------------- Internals -----------------

    private CaseDto transition(CaseEntity c, CaseStatus next, String auditAction, Map<String, Object> extra) {
        CaseStatus from = c.getStatus();
        if (!from.canTransitionTo(next)) {
            throw new InvalidStateTransitionException(from, next);
        }

        c.setStatus(next);
        CaseEntity saved = caseRepository.save(c);

        Map<String, Object> payload = new HashMap<>(extra);
        payload.put("from", from.name());
        payload.put("to", next.name());
        auditService.log(saved.getId(), auditAction, payload);

        notifyOnTransition(saved, from, next);
        return CaseDto.fromEntity(saved, true);
    }

    private void notifyOnTransition(CaseEntity c, CaseStatus from, CaseStatus to) {
        switch (to) {
            case AWAITING_DOCTOR -> {
                if (c.getAssignedDoctor() != null) {
                    notificationService.notify(c.getAssignedDoctor(), c.getId(),
                            "case.awaiting_doctor",
                            "Dosar nou de constatare deces",
                            "Dosar " + c.getCaseNumber() + " - constatare deces solicitata.",
                            null);
                }
            }
            case CMCD_ISSUED -> {
                notificationService.notify(c.getCreatedBy(), c.getId(),
                        "case.cmcd_issued",
                        "CMCD emis",
                        "Certificatul medical constatator al decesului a fost emis pentru dosarul " + c.getCaseNumber(),
                        null);
                if (c.getAssignedCivilOfficer() != null) {
                    notificationService.notify(c.getAssignedCivilOfficer(), c.getId(),
                            "case.awaiting_civil_officer",
                            "Dosar nou la Starea Civila",
                            "Dosar " + c.getCaseNumber() + " disponibil pentru validare.",
                            null);
                }
            }
            case DEATH_CERT_ISSUED -> notificationService.notify(c.getCreatedBy(), c.getId(),
                    "case.death_cert_issued",
                    "Certificat de deces eliberat",
                    "Certificatul de deces a fost eliberat pentru dosarul " + c.getCaseNumber(),
                    null);
            default -> { /* no-op for other transitions */ }
        }
    }

    private Optional<UUID> findNearestUserWithRole(AppRole role, String county) {
        if (county == null) return Optional.empty();
        List<UUID> candidates = userRoleRepository.findUserIdsByRoleAndCounty(role, county);
        return candidates.isEmpty() ? Optional.empty() : Optional.of(candidates.get(0));
    }

    private boolean canUnmaskCnp(CurrentUser user, CaseEntity c) {
        if (user.isAdmin()) return true;
        if (user.getId().equals(c.getCreatedBy())) return true;
        if (user.getId().equals(c.getAssignedDoctor())) return true;
        if (user.getId().equals(c.getAssignedCivilOfficer())) return true;
        if (user.getId().equals(c.getAssignedNotary())) return true;
        return false;
    }
}
