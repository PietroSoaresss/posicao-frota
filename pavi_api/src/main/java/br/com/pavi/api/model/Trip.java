package br.com.pavi.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trip")
@JsonIgnoreProperties({"hibernateLazyInitializer"})
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "startDate is required")
    private LocalDate startDate;

    @NotNull(message = "endDate is required")
    private LocalDate endDate;

    @NotNull(message = "freightValue is required")
    private BigDecimal freightValue;

    @NotNull(message = "tollValue is required")
    private BigDecimal tollValue;

    @NotBlank(message = "status is required")
    private String status;

    private Integer distance;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @NotNull(message = "driver is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @NotNull(message = "horse is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "horse_id")
    private Vehicle horse;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "trailer_id", nullable = true)
    private Vehicle trailer;

    @Valid
    @NotEmpty(message = "origins must contain at least one item")
    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Origin> origins = new ArrayList<>();

    @Valid
    @NotEmpty(message = "destinations must contain at least one item")
    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Destination> destinations = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public BigDecimal getFreightValue() { return freightValue; }
    public void setFreightValue(BigDecimal freightValue) { this.freightValue = freightValue; }
    public BigDecimal getTollValue() { return tollValue; }
    public void setTollValue(BigDecimal tollValue) { this.tollValue = tollValue; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getDistance() { return distance; }
    public void setDistance(Integer distance) { this.distance = distance; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Driver getDriver() { return driver; }
    public void setDriver(Driver driver) { this.driver = driver; }
    public Vehicle getHorse() { return horse; }
    public void setHorse(Vehicle horse) { this.horse = horse; }
    public Vehicle getTrailer() { return trailer; }
    public void setTrailer(Vehicle trailer) { this.trailer = trailer; }
    public List<Origin> getOrigins() { return origins; }
    public void setOrigins(List<Origin> origins) { this.origins = origins; }
    public List<Destination> getDestinations() { return destinations; }
    public void setDestinations(List<Destination> destinations) { this.destinations = destinations; }
}
