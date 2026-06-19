package br.com.pavi.api.tracking;

import java.time.Instant;

public record TrackingPositionResponse(
        Long packetId,
        Long sascarVehicleId,
        String licensePlate,
        Double latitude,
        Double longitude,
        Integer speed,
        Integer ignition,
        Integer direction,
        Long odometer,
        String city,
        String state,
        String street,
        Instant packetDateUtc,
        Instant positionDateUtc,
        Instant ingestedAt
) {
    static TrackingPositionResponse from(TrackingPosition position) {
        if (position == null) {
            return null;
        }

        return new TrackingPositionResponse(
                position.getPacketId(),
                position.getSascarVehicleId(),
                position.getLicensePlate(),
                position.getLatitude(),
                position.getLongitude(),
                position.getSpeed(),
                position.getIgnition(),
                position.getDirection(),
                position.getOdometer(),
                position.getCity(),
                position.getState(),
                position.getStreet(),
                position.getPacketDateUtc(),
                position.getPositionDateUtc(),
                position.getIngestedAt()
        );
    }
}
