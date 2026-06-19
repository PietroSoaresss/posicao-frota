package br.com.pavi.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitFilter extends OncePerRequestFilter {

    private final int maxRequests;
    private final long windowMillis;
    private final boolean trustForwardedFor;
    private final ConcurrentMap<String, RateWindow> windows = new ConcurrentHashMap<>();

    @Autowired
    public RateLimitFilter(
            @Value("${app.rate-limit.max-requests:120}") int maxRequests,
            @Value("${app.rate-limit.window-millis:60000}") long windowMillis,
            @Value("${app.rate-limit.trust-forwarded-for:false}") boolean trustForwardedFor
    ) {
        this.maxRequests = Math.max(maxRequests, 1);
        this.windowMillis = Math.max(windowMillis, 1000);
        this.trustForwardedFor = trustForwardedFor;
    }

    RateLimitFilter(int maxRequests, Duration window) {
        this(maxRequests, window, false);
    }

    RateLimitFilter(int maxRequests, Duration window, boolean trustForwardedFor) {
        this.maxRequests = Math.max(maxRequests, 1);
        this.windowMillis = Math.max(window.toMillis(), 1000);
        this.trustForwardedFor = trustForwardedFor;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return HttpMethod.OPTIONS.matches(request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {
        long now = System.currentTimeMillis();
        String clientKey = clientKey(request);
        RateWindow window = windows.computeIfAbsent(clientKey, ignored -> new RateWindow(now));

        RateDecision decision = window.consume(now, maxRequests, windowMillis);
        writeRateLimitHeaders(response, decision);

        if (!decision.allowed()) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("""
                    {"message":"Muitas requisições. Tente novamente em instantes."}
                    """);
            return;
        }

        chain.doFilter(request, response);
    }

    private String clientKey(HttpServletRequest request) {
        if (trustForwardedFor) {
            String forwardedFor = request.getHeader("X-Forwarded-For");
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                // Trust ONLY the leftmost hop set by our edge proxy (ALB / Nginx).
                // Enable via app.rate-limit.trust-forwarded-for=true only when running
                // behind a proxy that rewrites the header.
                return forwardedFor.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }

    private void writeRateLimitHeaders(HttpServletResponse response, RateDecision decision) {
        response.setHeader("X-RateLimit-Limit", String.valueOf(maxRequests));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(decision.remaining()));

        if (!decision.allowed()) {
            response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(decision.retryAfterSeconds()));
        }
    }

    private static final class RateWindow {
        private long startedAtMillis;
        private int used;

        private RateWindow(long startedAtMillis) {
            this.startedAtMillis = startedAtMillis;
        }

        private synchronized RateDecision consume(long now, int maxRequests, long windowMillis) {
            if (now - startedAtMillis >= windowMillis) {
                startedAtMillis = now;
                used = 0;
            }

            if (used >= maxRequests) {
                long retryAfterMillis = Math.max(windowMillis - (now - startedAtMillis), 1000);
                return new RateDecision(false, 0, Math.ceilDiv(retryAfterMillis, 1000));
            }

            used++;
            return new RateDecision(true, maxRequests - used, 0);
        }
    }

    private record RateDecision(boolean allowed, int remaining, long retryAfterSeconds) {
    }
}
