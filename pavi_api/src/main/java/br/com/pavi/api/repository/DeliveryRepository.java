package br.com.pavi.api.repository;

import br.com.pavi.api.model.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    List<Delivery> findByTripId(Long tripId);
    List<Delivery> findByDeliveryStatus(String status);
}