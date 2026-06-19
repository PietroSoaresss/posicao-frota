package br.com.pavi.api.tracking;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class TrackingSyncService {

    private final TrackingPositionRepository repository;
    private final SascarPositionClient client;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final SascarProperties properties;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private volatile TrackingSyncResult lastSync;

    @Autowired
    public TrackingSyncService(TrackingPositionRepository repository,
                               SascarPositionClient client,
                               ObjectMapper objectMapper,
                               SascarProperties properties) {
        this(repository, client, objectMapper, Clock.systemUTC(), properties);
    }

    TrackingSyncService(TrackingPositionRepository repository,
                        SascarPositionClient client,
                        ObjectMapper objectMapper,
                        Clock clock) {
        this(repository, client, objectMapper, clock, SascarProperties.enabledForTests());
    }

    TrackingSyncService(TrackingPositionRepository repository,
                        SascarPositionClient client,
                        ObjectMapper objectMapper,
                        Clock clock,
                        SascarProperties properties) {
        this.repository = repository;
        this.client = client;
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.properties = properties;
        Instant now = clock.instant();
        this.lastSync = TrackingSyncResult.skipped(now, "No synchronization has run yet");
    }

    @Scheduled(fixedDelayString = "${sascar.sync-interval-ms:120000}")
    public void scheduledSync() {
        if (properties.isEnabled()) {
            syncNow();
        }
    }

    @Transactional
    public TrackingSyncResult syncNow() {
        Instant startedAt = clock.instant();
        if (!properties.isEnabled()) {
            lastSync = TrackingSyncResult.skipped(startedAt, "Sascar integration is disabled");
            return lastSync;
        }

        if (!running.compareAndSet(false, true)) {
            lastSync = TrackingSyncResult.skipped(startedAt, "Synchronization is already running");
            return lastSync;
        }

        try {
            List<SascarPositionPayload> packets = client.fetchLatestPositions();
            int inserted = 0;
            int duplicates = 0;
            int ignored = 0;

            for (SascarPositionPayload packet : packets) {
                if (!isValid(packet)) {
                    ignored++;
                    continue;
                }

                if (repository.existsByPacketId(packet.packetId())) {
                    duplicates++;
                    continue;
                }

                repository.save(toEntity(packet));
                inserted++;
            }

            purgeOldHistory();
            lastSync = new TrackingSyncResult(
                    "ok",
                    startedAt,
                    clock.instant(),
                    packets.size(),
                    inserted,
                    duplicates,
                    ignored,
                    "Synchronization completed"
            );
            return lastSync;
        } catch (RuntimeException e) {
            lastSync = new TrackingSyncResult(
                    "error",
                    startedAt,
                    clock.instant(),
                    0,
                    0,
                    0,
                    0,
                    e.getMessage()
            );
            throw e;
        } finally {
            running.set(false);
        }
    }

    public TrackingStatusResponse status() {
        return new TrackingStatusResponse(
                properties.isEnabled(),
                running.get(),
                properties.getSyncIntervalMs(),
                properties.getHistoryRetentionDays(),
                lastSync
        );
    }

    private TrackingPosition toEntity(SascarPositionPayload packet) {
        TrackingPosition position = new TrackingPosition();
        position.setPacketId(packet.packetId());
        position.setSascarVehicleId(packet.vehicleId());
        position.setLicensePlate(normalizePlate(packet.licensePlate()));
        position.setLatitude(packet.latitude());
        position.setLongitude(packet.longitude());
        position.setSpeed(packet.speed());
        position.setIgnition(packet.ignition());
        position.setDirection(packet.direction());
        position.setOdometer(packet.odometer());
        position.setCity(packet.city());
        position.setState(packet.state());
        position.setStreet(packet.street());
        position.setPacketDateUtc(packet.packetDateUtc());
        position.setPositionDateUtc(packet.positionDateUtc());
        position.setIngestedAt(clock.instant());
        position.setRawPayload(toRawPayload(packet));
        return position;
    }

    private String toRawPayload(SascarPositionPayload packet) {
        try {
            return objectMapper.findAndRegisterModules().writeValueAsString(packet);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private void purgeOldHistory() {
        if (properties.getHistoryRetentionDays() <= 0) {
            return;
        }
        repository.deleteByPacketDateUtcBefore(clock.instant().minus(properties.getHistoryRetentionDays(), ChronoUnit.DAYS));
    }

    private static boolean isValid(SascarPositionPayload packet) {
        return packet != null
                && packet.packetId() != null
                && packet.licensePlate() != null
                && !packet.licensePlate().isBlank()
                && packet.latitude() != null
                && packet.longitude() != null
                && packet.latitude() >= -90
                && packet.latitude() <= 90
                && packet.longitude() >= -180
                && packet.longitude() <= 180
                && packet.packetDateUtc() != null;
    }

    static String normalizePlate(String plate) {
        if (plate == null) {
            return "";
        }
        String normalized = plate.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        return normalized.length() <= 7 ? normalized : normalized.substring(0, 7);
    }
}
