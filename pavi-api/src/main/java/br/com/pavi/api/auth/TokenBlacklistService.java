package br.com.pavi.api.auth;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * In-memory JWT blacklist keyed by jti. Entries are kept until their original
 * token expiry, then swept. Single-instance scope: a horizontal deployment
 * would need a shared store (Redis, DB).
 */
@Service
public class TokenBlacklistService {

    private final ConcurrentMap<String, Long> revokedJtiToExpiry = new ConcurrentHashMap<>();

    public void revoke(String jti, Date expiresAt) {
        if (jti == null || expiresAt == null) {
            return;
        }
        revokedJtiToExpiry.put(jti, expiresAt.getTime());
    }

    public boolean isRevoked(String jti) {
        if (jti == null) {
            return false;
        }
        Long expiresAtMs = revokedJtiToExpiry.get(jti);
        if (expiresAtMs == null) {
            return false;
        }
        if (expiresAtMs <= System.currentTimeMillis()) {
            revokedJtiToExpiry.remove(jti);
            return false;
        }
        return true;
    }

    @Scheduled(fixedDelay = 15L * 60L * 1000L)
    void purgeExpired() {
        long now = System.currentTimeMillis();
        revokedJtiToExpiry.entrySet().removeIf(entry -> entry.getValue() <= now);
    }
}
