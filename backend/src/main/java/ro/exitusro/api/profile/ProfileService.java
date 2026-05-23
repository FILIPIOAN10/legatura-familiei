package ro.exitusro.api.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.exitusro.api.common.enums.AppRole;
import ro.exitusro.api.common.exception.NotFoundException;
import ro.exitusro.api.profile.dto.ProfileDto;
import ro.exitusro.api.profile.dto.UpdateProfileRequest;
import ro.exitusro.api.role.UserRoleEntity;
import ro.exitusro.api.role.UserRoleRepository;
import ro.exitusro.api.security.CurrentUser;
import ro.exitusro.api.security.SecurityUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;

    @Transactional(readOnly = true)
    public ProfileDto me() {
        CurrentUser user = SecurityUtils.currentUser();
        Profile p = profileRepository.findById(user.getId())
                .orElseThrow(() -> new NotFoundException("Profilul nu a fost gasit"));
        List<AppRole> roles = userRoleRepository.findByUserId(user.getId())
                .stream().map(UserRoleEntity::getRole).toList();
        return ProfileDto.fromEntity(p, roles, true);
    }

    @Transactional
    public ProfileDto update(UpdateProfileRequest req) {
        CurrentUser user = SecurityUtils.currentUser();
        Profile p = profileRepository.findById(user.getId())
                .orElseGet(() -> Profile.builder().id(user.getId()).build());

        if (req.fullName() != null) p.setFullName(req.fullName());
        if (req.cnp() != null) p.setCnp(req.cnp());
        if (req.phone() != null) p.setPhone(req.phone());
        if (req.county() != null) p.setCounty(req.county());
        if (req.city() != null) p.setCity(req.city());
        if (req.address() != null) p.setAddress(req.address());

        Profile saved = profileRepository.save(p);
        List<AppRole> roles = userRoleRepository.findByUserId(user.getId())
                .stream().map(UserRoleEntity::getRole).toList();
        return ProfileDto.fromEntity(saved, roles, true);
    }

    @Transactional(readOnly = true)
    public ProfileDto getById(UUID id) {
        CurrentUser current = SecurityUtils.currentUser();
        Profile p = profileRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Profil inexistent"));
        List<AppRole> roles = userRoleRepository.findByUserId(id)
                .stream().map(UserRoleEntity::getRole).toList();
        boolean canUnmask = current.isAdmin() || current.getId().equals(id);
        return ProfileDto.fromEntity(p, roles, canUnmask);
    }
}
