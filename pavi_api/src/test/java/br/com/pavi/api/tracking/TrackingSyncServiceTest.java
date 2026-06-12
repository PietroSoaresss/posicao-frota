package br.com.pavi.api.tracking;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TrackingSyncServiceTest {

    private final TrackingPositionRepository repository = mock(TrackingPositionRepository.class);
    private final SascarPositionClient client = mock(SascarPositionClient.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Clock clock = Clock.fixed(Instant.parse("2026-06-09T13:00:00Z"), ZoneOffset.UTC);

    @Test
    void syncNormalizesPlateAndSkipsDuplicatePacketIds() {
        TrackingSyncService service = new TrackingSyncService(repository, client, objectMapper, clock);
        SascarPositionPayload packet = new SascarPositionPayload(
                123L,
                "abc-1d23",
                -23.55,
                -46.63,
                72,
                1,
                180,
                987654L,
                "Sao Paulo",
                "SP",
                "Av Paulista",
                Instant.parse("2026-06-09T12:34:56Z"),
                Instant.parse("2026-06-09T12:34:50Z"),
                456789L
        );

        when(client.fetchLatestPositions()).thenReturn(List.of(packet, packet));
        when(repository.existsByPacketId(456789L)).thenReturn(false, true);
        when(repository.save(org.mockito.ArgumentMatchers.any(TrackingPosition.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        TrackingSyncResult result = service.syncNow();

        assertThat(result.received()).isEqualTo(2);
        assertThat(result.inserted()).isEqualTo(1);
        assertThat(result.duplicates()).isEqualTo(1);
        assertThat(result.ignored()).isZero();
        assertThat(result.status()).isEqualTo("ok");
    }
}
