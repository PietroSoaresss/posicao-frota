package br.com.pavi.api.tracking;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
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
                "tqv-2g102",
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

        ArgumentCaptor<TrackingPosition> positionCaptor = ArgumentCaptor.forClass(TrackingPosition.class);
        verify(repository).save(positionCaptor.capture());

        assertThat(result.received()).isEqualTo(2);
        assertThat(result.inserted()).isEqualTo(1);
        assertThat(result.duplicates()).isEqualTo(1);
        assertThat(result.ignored()).isZero();
        assertThat(result.status()).isEqualTo("ok");
        assertThat(positionCaptor.getValue().getLicensePlate()).isEqualTo("TQV2G10");
    }

    @Test
    void normalizePlateKeepsOnlyTheFirstSevenAlphanumericCharacters() {
        assertThat(TrackingSyncService.normalizePlate("TQV2G102")).isEqualTo("TQV2G10");
        assertThat(TrackingSyncService.normalizePlate(" abc-1d23 ")).isEqualTo("ABC1D23");
        assertThat(TrackingSyncService.normalizePlate(null)).isEmpty();
    }
}
