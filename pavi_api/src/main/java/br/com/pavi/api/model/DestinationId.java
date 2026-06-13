package br.com.pavi.api.model;

import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class DestinationId implements Serializable {
    private Long tripId;
    private Long companyId;

    public DestinationId() {}

    public DestinationId(Long tripId, Long companyId) {
        this.tripId = tripId;
        this.companyId = companyId;
    }

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DestinationId that)) return false;
        return Objects.equals(tripId, that.tripId) && Objects.equals(companyId, that.companyId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(tripId, companyId);
    }
}
