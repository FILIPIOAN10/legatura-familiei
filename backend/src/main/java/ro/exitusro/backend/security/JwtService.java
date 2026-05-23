package ro.exitusro.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import ro.exitusro.backend.config.AppProperties;
import ro.exitusro.backend.user.UserAccount;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.Optional;

@Service
public class JwtService {

    private final AppProperties props;
    private final SecretKey key;

    public JwtService(AppProperties props) {
        this.props = props;
        byte[] decoded = Decoders.BASE64.decode(props.getJwt().getSecret());
        if (decoded.length < 32) {
            throw new IllegalStateException(
                "app.jwt.secret must decode to at least 32 bytes (256 bits) for HS256. " +
                "Provide a Base64-encoded random value via JWT_SECRET env var or application.yml."
            );
        }
        this.key = Keys.hmacShaKeyFor(decoded);
    }

    public String issueToken(UserAccount user) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(props.getJwt().getExpirationMinutes() * 60L);
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claims(Map.of(
                        "email", user.getEmail(),
                        "role", user.getRole().value()
                ))
                .signWith(key)
                .compact();
    }

    public Optional<Claims> parse(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(claims);
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public long expirationSeconds() {
        return props.getJwt().getExpirationMinutes() * 60L;
    }
}
