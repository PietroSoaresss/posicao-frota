package br.com.pavi.api.repository;

import br.com.pavi.api.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByStatus(String status);
    List<Trip> findByDriverId(Long driverId);
    List<Trip> findByStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate startDate, LocalDate endDate);
}
