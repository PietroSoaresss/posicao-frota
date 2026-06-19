package br.com.pavi.api.model;

import br.com.pavi.api.auth.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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

    private LocalDate positionDate;

    private Long copiedFromId;

    private BigDecimal freightValue;

    @NotNull(message = "tollValue is required")
    private BigDecimal tollValue;

    @NotBlank(message = "status is required")
    private String status;

    private Integer distance;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private String originLocation;

    private String tnf;

    @Column(columnDefinition = "TEXT")
    private String destinationAgenda;

    private String shipper;

    private BigDecimal paviValue;

    private String tollPurchase;

    private String guidePayment;

    private String substitutionStates;

    private BigDecimal secondLegEmissionValue;

    private String secondLegGuidePayment;

    @NotNull(message = "driver is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @NotNull(message = "horse is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "horse_id")
    private Vehicle horse;

    @NotNull(message = "trailer is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "trailer_id", nullable = true)
    private Vehicle trailer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manager_id", nullable = true)
    private User manager;

    @Valid
    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Origin> origins = new ArrayList<>();

    @Valid
    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Destination> destinations = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public LocalDate getPositionDate() { return positionDate; }
    public void setPositionDate(LocalDate positionDate) { this.positionDate = positionDate; }
    public Long getCopiedFromId() { return copiedFromId; }
    public void setCopiedFromId(Long copiedFromId) { this.copiedFromId = copiedFromId; }
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
    public String getOriginLocation() { return originLocation; }
    public void setOriginLocation(String originLocation) { this.originLocation = originLocation; }
    public String getTnf() { return tnf; }
    public void setTnf(String tnf) { this.tnf = tnf; }
    public String getDestinationAgenda() { return destinationAgenda; }
    public void setDestinationAgenda(String destinationAgenda) { this.destinationAgenda = destinationAgenda; }
    public String getShipper() { return shipper; }
    public void setShipper(String shipper) { this.shipper = shipper; }
    public BigDecimal getPaviValue() { return paviValue; }
    public void setPaviValue(BigDecimal paviValue) { this.paviValue = paviValue; }
    public String getTollPurchase() { return tollPurchase; }
    public void setTollPurchase(String tollPurchase) { this.tollPurchase = tollPurchase; }
    public String getGuidePayment() { return guidePayment; }
    public void setGuidePayment(String guidePayment) { this.guidePayment = guidePayment; }
    public String getSubstitutionStates() { return substitutionStates; }
    public void setSubstitutionStates(String substitutionStates) { this.substitutionStates = substitutionStates; }
    public BigDecimal getSecondLegEmissionValue() { return secondLegEmissionValue; }
    public void setSecondLegEmissionValue(BigDecimal secondLegEmissionValue) { this.secondLegEmissionValue = secondLegEmissionValue; }
    public String getSecondLegGuidePayment() { return secondLegGuidePayment; }
    public void setSecondLegGuidePayment(String secondLegGuidePayment) { this.secondLegGuidePayment = secondLegGuidePayment; }
    public Driver getDriver() { return driver; }
    public void setDriver(Driver driver) { this.driver = driver; }
    public Vehicle getHorse() { return horse; }
    public void setHorse(Vehicle horse) { this.horse = horse; }
    public Vehicle getTrailer() { return trailer; }
    public void setTrailer(Vehicle trailer) { this.trailer = trailer; }
    public User getManager() { return manager; }
    public void setManager(User manager) { this.manager = manager; }
    public List<Origin> getOrigins() { return origins; }
    public void setOrigins(List<Origin> origins) { this.origins = origins; }
    public List<Destination> getDestinations() { return destinations; }
    public void setDestinations(List<Destination> destinations) { this.destinations = destinations; }
}
