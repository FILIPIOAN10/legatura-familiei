package ro.exitusro.backend.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds the four demo accounts the platform launches with.
 * Idempotent — re-runs are safe because we look up by email first.
 *
 * <p>Default password for every account: <b>password123</b>. Change it before going to production.
 */
@Component
public class UserSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(UserSeeder.class);

    private static final String DEFAULT_PASSWORD = "password123";

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public UserSeeder(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        List<SeedUser> seeds = List.of(
                new SeedUser(
                        "apartinator@exitusro.ro",
                        "apartinator",
                        "Maria Ionescu",
                        Role.FAMILY
                ),
                new SeedUser(
                        "medic@exitusro.ro",
                        "medic",
                        "Dr. Andrei Popescu",
                        Role.DOCTOR
                ),
                new SeedUser(
                        "functionar@exitusro.ro",
                        "functionar",
                        "Elena Vasilescu (Stare Civilă)",
                        Role.CIVIL_OFFICER
                ),
                new SeedUser(
                        "casa.funerara@exitusro.ro",
                        "casa_funerara",
                        "Casa Funerară Liniștea",
                        Role.FUNERAL_PROVIDER
                )
        );

        int created = 0;
        for (SeedUser s : seeds) {
            if (users.existsByEmailIgnoreCase(s.email)) continue;
            UserAccount u = new UserAccount(
                    s.email,
                    s.username,
                    s.fullName,
                    encoder.encode(DEFAULT_PASSWORD),
                    s.role
            );
            users.save(u);
            created++;
            log.info("Seeded user {} ({})", s.email, s.role.value());
        }
        if (created == 0) {
            log.info("All seed users already present; skipping.");
        } else {
            log.info("Seeded {} user(s). Default password for every account: {}",
                    created, DEFAULT_PASSWORD);
        }
    }

    private record SeedUser(String email, String username, String fullName, Role role) {}
}
