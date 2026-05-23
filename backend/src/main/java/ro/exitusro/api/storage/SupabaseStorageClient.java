package ro.exitusro.api.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import ro.exitusro.api.common.exception.BadRequestException;
import ro.exitusro.api.security.SupabaseJwtProperties;

import java.time.Duration;
import java.util.Map;

/**
 * Thin wrapper around Supabase Storage REST API. Uses the service-role key on the
 * server so we can read/write the {@code case-documents} bucket regardless of RLS.
 *
 * Docs: https://supabase.com/docs/reference/api/storage
 */
@Component
@Slf4j
public class SupabaseStorageClient {

    private final WebClient webClient;
    private final String bucket;
    private final boolean enabled;
    private final String serviceKey;

    public SupabaseStorageClient(WebClient.Builder builder, SupabaseJwtProperties props) {
        this.bucket = props.storageBucket();
        this.serviceKey = props.serviceRoleKey();
        this.enabled = StringUtils.hasText(props.url()) && StringUtils.hasText(props.serviceRoleKey());
        if (enabled) {
            this.webClient = builder
                    .baseUrl(props.url() + "/storage/v1")
                    .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + props.serviceRoleKey())
                    .defaultHeader("apikey", props.serviceRoleKey())
                    .build();
        } else {
            this.webClient = null;
            log.warn("Supabase Storage is not configured (SUPABASE_URL / SERVICE_ROLE_KEY missing). "
                    + "File operations will be no-ops.");
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    /** Uploads a byte payload and returns the storage path. */
    public String upload(String path, byte[] content, String contentType) {
        if (!enabled) {
            log.info("[storage-skipped] upload path={} bytes={}", path, content.length);
            return path;
        }
        webClient.post()
                .uri("/object/{bucket}/{path}", bucket, path)
                .header("x-upsert", "true")
                .contentType(MediaType.parseMediaType(contentType))
                .bodyValue(content)
                .retrieve()
                .toBodilessEntity()
                .block(Duration.ofSeconds(20));
        return path;
    }

    public byte[] download(String path) {
        if (!enabled) {
            throw new BadRequestException("Stocare neconfigurata");
        }
        return webClient.get()
                .uri("/object/{bucket}/{path}", bucket, path)
                .retrieve()
                .bodyToMono(byte[].class)
                .block(Duration.ofSeconds(20));
    }

    public String signedUrl(String path, int expiresInSeconds) {
        if (!enabled) return null;
        Map<?, ?> resp = webClient.post()
                .uri("/object/sign/{bucket}/{path}", bucket, path)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("expiresIn", expiresInSeconds))
                .retrieve()
                .bodyToMono(Map.class)
                .block(Duration.ofSeconds(10));
        if (resp == null) return null;
        Object signed = resp.get("signedURL");
        return signed == null ? null : signed.toString();
    }
}
