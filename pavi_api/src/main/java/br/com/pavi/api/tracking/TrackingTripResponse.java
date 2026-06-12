package br.com.pavi.api.tracking;

import java.time.LocalDate;
import java.util.List;

public record TrackingTripResponse(
        Long tripId,
        String tripCode,
        String status,
        LocalDate startDate,
        LocalDate endDate,
        String driverName,
        String horsePlate,
        String trailerPlate,
        String originLabel,
        String destinationLabel,
        TrackingPositionResponse latestPosition,
        List<TrackingPositionResponse> trail,
        boolean stale,
        boolean missingPosition
) {
}
