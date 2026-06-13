package br.com.pavi.api.tracking;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(
        name = "tracking_position",
        indexes = {
                @Index(name = "idx_tracking_position_plate_packet_date", columnList = "license_plate, packet_date_utc"),
                @Index(name = "idx_tracking_position_vehicle", columnList = "sascar_vehicle_id"),
                @Index(name = "idx_tracking_position_packet_date", columnList = "packet_date_utc")
        },
        uniqueConstraints = @UniqueConstraint(name = "uk_tracking_position_packet_id", columnNames = "packet_id")
)
public class TrackingPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "packet_id", nullable = false)
    private Long packetId;

    @Column(name = "sascar_vehicle_id")
    private Long sascarVehicleId;

    @Column(name = "license_plate", nullable = false, length = 16)
    private String licensePlate;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private Integer speed;
    private Integer ignition;
    private Integer direction;
    private Long odometer;
    private String city;
    private String state;
    private String street;

    @Column(name = "packet_date_utc", nullable = false)
    private Instant packetDateUtc;

    @Column(name = "position_date_utc")
    private Instant positionDateUtc;

    @Column(name = "ingested_at", nullable = false)
    private Instant ingestedAt;

    @Column(name = "raw_payload", columnDefinition = "TEXT")
    private String rawPayload;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPacketId() { return packetId; }
    public void setPacketId(Long packetId) { this.packetId = packetId; }
    public Long getSascarVehicleId() { return sascarVehicleId; }
    public void setSascarVehicleId(Long sascarVehicleId) { this.sascarVehicleId = sascarVehicleId; }
    public String getLicensePlate() { return licensePlate; }
    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public Integer getSpeed() { return speed; }
    public void setSpeed(Integer speed) { this.speed = speed; }
    public Integer getIgnition() { return ignition; }
    public void setIgnition(Integer ignition) { this.ignition = ignition; }
    public Integer getDirection() { return direction; }
    public void setDirection(Integer direction) { this.direction = direction; }
    public Long getOdometer() { return odometer; }
    public void setOdometer(Long odometer) { this.odometer = odometer; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }
    public Instant getPacketDateUtc() { return packetDateUtc; }
    public void setPacketDateUtc(Instant packetDateUtc) { this.packetDateUtc = packetDateUtc; }
    public Instant getPositionDateUtc() { return positionDateUtc; }
    public void setPositionDateUtc(Instant positionDateUtc) { this.positionDateUtc = positionDateUtc; }
    public Instant getIngestedAt() { return ingestedAt; }
    public void setIngestedAt(Instant ingestedAt) { this.ingestedAt = ingestedAt; }
    public String getRawPayload() { return rawPayload; }
    public void setRawPayload(String rawPayload) { this.rawPayload = rawPayload; }
}
