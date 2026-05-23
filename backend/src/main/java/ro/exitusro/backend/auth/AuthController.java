package ro.exitusro.backend.auth;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ro.exitusro.backend.auth.dto.LoginRequest;
import ro.exitusro.backend.auth.dto.UserResponse;
import ro.exitusro.backend.config.AppProperties;
import ro.exitusro.backend.security.CurrentUser;
import ro.exitusro.backend.security.JwtService;
import ro.exitusro.backend.user.UserAccount;
import ro.exitusro.backend.user.UserRepository;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AppProperties props;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt, AppProperties props) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.props = props;
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest req, HttpServletResponse response) {
        UserAccount user = users.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid credentials"));

        if (!user.isEnabled() || !encoder.matches(req.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid credentials");
        }

        String token = jwt.issueToken(user);
        addAuthCookies(response, token);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        clearAuthCookies(response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@CurrentUser UserAccount current) {
        if (current == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Not authenticated");
        }
        return ResponseEntity.ok(UserResponse.from(current));
    }

    private void addAuthCookies(HttpServletResponse response, String token) {
        AppProperties.Jwt cfg = props.getJwt();
        long maxAge = jwt.expirationSeconds();

        ResponseCookie jwtCookie = ResponseCookie.from(cfg.getCookieName(), token)
                .httpOnly(true)
                .secure(cfg.isSecure())
                .sameSite(cfg.getSameSite())
                .path("/")
                .maxAge(maxAge)
                .build();

        // Non-HttpOnly marker cookie so the SPA can detect login state client-side
        // without exposing the JWT to JS.
        ResponseCookie markerCookie = ResponseCookie.from(cfg.getAuthPresentCookie(), "1")
                .httpOnly(false)
                .secure(cfg.isSecure())
                .sameSite(cfg.getSameSite())
                .path("/")
                .maxAge(maxAge)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, jwtCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, markerCookie.toString());
    }

    private void clearAuthCookies(HttpServletResponse response) {
        AppProperties.Jwt cfg = props.getJwt();

        ResponseCookie expiredJwt = ResponseCookie.from(cfg.getCookieName(), "")
                .httpOnly(true)
                .secure(cfg.isSecure())
                .sameSite(cfg.getSameSite())
                .path("/")
                .maxAge(0)
                .build();

        ResponseCookie expiredMarker = ResponseCookie.from(cfg.getAuthPresentCookie(), "")
                .httpOnly(false)
                .secure(cfg.isSecure())
                .sameSite(cfg.getSameSite())
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, expiredJwt.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, expiredMarker.toString());
    }
}
