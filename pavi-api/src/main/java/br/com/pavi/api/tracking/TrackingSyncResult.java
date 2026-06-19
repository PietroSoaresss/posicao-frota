package br.com.pavi.api.tracking;

import java.time.Instant;

public record TrackingSyncResult(
        String status,
        Instant startedAt,
        Instant finishedAt,
        int received,
        int inserted,
        int duplicates,
        int ignored,
        String message
) {
    static TrackingSyncResult skipped(Instant at, String message) {
        return new TrackingSyncResult("skipped", at, at, 0, 0, 0, 0, message);
    }
}
