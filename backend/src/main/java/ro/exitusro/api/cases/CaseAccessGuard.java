package ro.exitusro.api.cases;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ro.exitusro.api.common.enums.AppRole;
import ro.exitusro.api.common.enums.CaseStatus;
import ro.exitusro.api.common.exception.ForbiddenException;
import ro.exitusro.api.common.exception.NotFoundException;
import ro.exitusro.api.profile.Profile;
import ro.exitusro.api.profile.ProfileRepository;
import ro.exitusro.api.security.CurrentUser;

import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Server-side authorization mirroring the Supabase RLS policies. We deliberately
 * do NOT rely on RLS here because we connect with a non-RLS DB user; access
 * decisions must be made in the service layer.
 */
@Component
@RequiredArgsConstructor
public class CaseAccessGuard {

    private static final Set<CaseStatus> DOCTOR_INBOX_STATUSES = Set.of(CaseStatus.AWAITING_DOCTOR);
    private static final Set<CaseStatus> OFFICER_INBOX_STATUSES =
            Set.of(CaseStatus.CMCD_ISSUED, CaseStatus.AWAITING_CIVIL_OFFICER);

    private final ProfileRepository profileRepository;

    @Transactional(readOnly = true)
    public CaseEntity loadVisible(UUID caseId, CaseRepository repo, CurrentUser user) {
        CaseEntity c = repo.findById(caseId)
                .orElseThrow(() -> new NotFoundException("Dosarul nu a fost gasit"));
        if (!canView(c, user)) {
            throw new ForbiddenException("Nu aveti acces la acest dosar");
        }
        return c;
    }

    public boolean canView(CaseEntity c, CurrentUser user) {
        if (user.isAdmin()) return true;
        UUID uid = user.getId();

        if (Objects.equals(c.getCreatedBy(), uid)) return true;
        if (Objects.equals(c.getAssignedDoctor(), uid)) return true;
        if (Objects.equals(c.getAssignedCivilOfficer(), uid)) return true;
        if (Objects.equals(c.getAssignedFuneralProvider(), uid)) return true;
        if (Objects.equals(c.getAssignedNotary(), uid)) return true;

        if (user.hasRole(AppRole.doctor) && DOCTOR_INBOX_STATUSES.contains(c.getStatus())
                && sameCounty(uid, c.getCounty())) return true;

        if (user.hasRole(AppRole.civil_officer) && OFFICER_INBOX_STATUSES.contains(c.getStatus())
                && sameCounty(uid, c.getCounty())) return true;

        return false;
    }

    private boolean sameCounty(UUID userId, String county) {
        if (county == null) return false;
        return profileRepository.findById(userId)
                .map(Profile::getCounty)
                .map(c -> c.equalsIgnoreCase(county))
                .orElse(false);
    }
}
