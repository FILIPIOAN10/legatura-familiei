package ro.exitusro.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import ro.exitusro.api.common.enums.AppRole;
import ro.exitusro.api.role.UserRoleRepository;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Validates Supabase-issued JWTs (HS256, signed with the project's JWT secret).
 * Extracts the user id from the {@code sub} claim and loads the user's roles from {@code user_roles}.
 */
@Component
@Slf4j
public class SupabaseJwtFilter extends OncePerRequestFilter {

    private static final String BEARER = "Bearer ";

    private final SecretKey signingKey;
    private final UserRoleRepository userRoleRepository;

    public SupabaseJwtFilter(SupabaseJwtProperties props, UserRoleRepository userRoleRepository) {
        if (!StringUtils.hasText(props.jwtSecret())) {
            throw new IllegalStateException(
                    "exitusro.supabase.jwt-secret is not set. Get it from Supabase Dashboard -> Project Settings -> API -> JWT Secret.");
        }
        this.signingKey = Keys.hmacShaKeyFor(props.jwtSecret().getBytes(StandardCharsets.UTF_8));
        this.userRoleRepository = userRoleRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith(BEARER)) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(BEARER.length()).trim();
        try {
            Jws<Claims> parsed = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token);
            Claims claims = parsed.getPayload();

            UUID userId = UUID.fromString(claims.getSubject());
            String email = claims.get("email", String.class);

            Set<AppRole> roles = loadRoles(userId);
            CurrentUser principal = new CurrentUser(userId, email, roles);

            List<SimpleGrantedAuthority> authorities = roles.stream()
                    .map(r -> new SimpleGrantedAuthority(r.authority()))
                    .toList();

            AbstractAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(principal, token, authorities);
            auth.setDetails(claims);
            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Rejected JWT: {}", ex.getMessage());
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }

    private Set<AppRole> loadRoles(UUID userId) {
        Set<AppRole> roles = EnumSet.noneOf(AppRole.class);
        userRoleRepository.findByUserId(userId).forEach(r -> roles.add(r.getRole()));
        return roles;
    }
}
