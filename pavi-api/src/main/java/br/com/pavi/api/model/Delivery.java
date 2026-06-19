package br.com.pavi.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "delivery")
@JsonIgnoreProperties({"hibernateLazyInitializer"})
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "trip_id", nullable = true)
    private Trip trip;

    @NotNull(message = "deliveryValue is required")
    private BigDecimal deliveryValue;

    @NotBlank(message = "deliveryStatus is required")
    private String deliveryStatus;

    @NotNull(message = "date is required")
    private LocalDate date;

    private LocalDate paymentDate;
    private LocalDate deadline;
    private String deliveryType;
    private String boarding;
    private String cte;
    private String complementaryCte;
    private BigDecimal icms;
    private String complementaryIcms;
    private BigDecimal tollValue;
    private String tollStatus;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(columnDefinition = "TEXT")
    private String complementaryDelivery;

    // --- Getters e Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public BigDecimal getDeliveryValue() { return deliveryValue; }
    public void setDeliveryValue(BigDecimal deliveryValue) { this.deliveryValue = deliveryValue; }
    public String getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }
    public String getDeliveryType() { return deliveryType; }
    public void setDeliveryType(String deliveryType) { this.deliveryType = deliveryType; }
    public String getBoarding() { return boarding; }
    public void setBoarding(String boarding) { this.boarding = boarding; }
    public String getCte() { return cte; }
    public void setCte(String cte) { this.cte = cte; }
    public String getComplementaryCte() { return complementaryCte; }
    public void setComplementaryCte(String complementaryCte) { this.complementaryCte = complementaryCte; }
    public BigDecimal getIcms() { return icms; }
    public void setIcms(BigDecimal icms) { this.icms = icms; }
    public String getComplementaryIcms() { return complementaryIcms; }
    public void setComplementaryIcms(String complementaryIcms) { this.complementaryIcms = complementaryIcms; }
    public BigDecimal getTollValue() { return tollValue; }
    public void setTollValue(BigDecimal tollValue) { this.tollValue = tollValue; }
    public String getTollStatus() { return tollStatus; }
    public void setTollStatus(String tollStatus) { this.tollStatus = tollStatus; }
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
    public String getComplementaryDelivery() { return complementaryDelivery; }
    public void setComplementaryDelivery(String complementaryDelivery) { this.complementaryDelivery = complementaryDelivery; }
}
