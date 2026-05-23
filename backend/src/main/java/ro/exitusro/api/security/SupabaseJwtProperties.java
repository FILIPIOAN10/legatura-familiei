package ro.exitusro.api.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "exitusro.supabase")
public record SupabaseJwtProperties(
        String url,
        String jwtSecret,
        String serviceRoleKey,
        String storageBucket
) {
}
