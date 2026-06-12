package br.com.pavi.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "destination")
@JsonIgnoreProperties({"hibernateLazyInitializer", "trip"})
public class Destination {

    @EmbeddedId
    private DestinationId id = new DestinationId();

    @Positive(message = "destinations[].order must be greater than zero")
    @Column(name = "ordering")
    private int order;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tripId")
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("companyId")
    @JoinColumn(name = "company_id")
    @NotNull(message = "destinations[].company is required")
    private Company company;

    public DestinationId getId() { return id; }
    public void setId(DestinationId id) { this.id = id; }
    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
}
