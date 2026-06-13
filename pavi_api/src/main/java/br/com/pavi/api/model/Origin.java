package br.com.pavi.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "origin")
@JsonIgnoreProperties({"hibernateLazyInitializer", "trip"})
public class Origin {

    @EmbeddedId
    private OriginId id = new OriginId();

    @Positive(message = "origins[].order must be greater than zero")
    @Column(name = "ordering")
    private int order;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tripId")
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("companyId")
    @JoinColumn(name = "company_id")
    @NotNull(message = "origins[].company is required")
    private Company company;

    public OriginId getId() { return id; }
    public void setId(OriginId id) { this.id = id; }
    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
}
