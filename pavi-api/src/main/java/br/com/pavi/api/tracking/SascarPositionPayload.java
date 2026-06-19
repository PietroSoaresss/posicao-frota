package br.com.pavi.api.tracking;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import java.time.Instant;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SascarPositionPayload(
        Long vehicleId,
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
        @JsonDeserialize(using = SascarInstantDeserializer.class) Instant packetDateUtc,
        @JsonDeserialize(using = SascarInstantDeserializer.class) Instant positionDateUtc,
        Long packetId
) {
}
