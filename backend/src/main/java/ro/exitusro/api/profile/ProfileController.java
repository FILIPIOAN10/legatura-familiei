package ro.exitusro.api.profile;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ro.exitusro.api.profile.dto.ProfileDto;
import ro.exitusro.api.profile.dto.UpdateProfileRequest;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService service;

    @GetMapping("/me")
    public ProfileDto me() {
        return service.me();
    }

    @PutMapping("/me")
    public ProfileDto updateMe(@Valid @RequestBody UpdateProfileRequest req) {
        return service.update(req);
    }

    @GetMapping("/{id}")
    public ProfileDto byId(@PathVariable UUID id) {
        return service.getById(id);
    }
}
