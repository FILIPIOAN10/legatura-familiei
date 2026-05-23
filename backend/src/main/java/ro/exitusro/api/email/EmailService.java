package ro.exitusro.api.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * Sends transactional emails via Resend. If no API key is configured (e.g. local dev),
 * messages are logged instead of dispatched.
 */
@Service
@Slf4j
public class EmailService {

    private final WebClient webClient;
    private final String apiKey;
    private final String from;

    public EmailService(WebClient.Builder builder,
                        @Value("${exitusro.resend.api-key}") String apiKey,
                        @Value("${exitusro.resend.from}") String from) {
        this.apiKey = apiKey;
        this.from = from;
        this.webClient = builder.baseUrl("https://api.resend.com").build();
    }

    public void send(String to, String subject, String htmlOrText) {
        if (!StringUtils.hasText(apiKey)) {
            log.info("[email-skipped] to={} subject={}", to, subject);
            return;
        }

        Map<String, Object> payload = Map.of(
                "from", from,
                "to", List.of(to),
                "subject", subject,
                "html", "<div style='font-family:Inter,Arial,sans-serif;line-height:1.6;color:#1e3a5f'>"
                        + htmlOrText + "</div>"
        );

        webClient.post()
                .uri("/emails")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .onStatus(s -> s.isError(),
                        resp -> resp.bodyToMono(String.class).flatMap(body -> {
                            log.warn("Resend error: {}", body);
                            return Mono.empty();
                        }))
                .bodyToMono(String.class)
                .subscribe(
                        body -> log.debug("Resend ok: {}", body),
                        err -> log.warn("Resend send failed", err)
                );
    }
}
