package br.com.pavi.api.tracking;

public record TrackingStatusResponse(
        boolean enabled,
        boolean running,
        long syncIntervalMs,
        int historyRetentionDays,
        TrackingSyncResult lastSync
) {
}
