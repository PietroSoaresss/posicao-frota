package br.com.pavi.api.repository;

import br.com.pavi.api.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByStatus(String status);
    List<Trip> findByDriverId(Long driverId);
    List<Trip> findByStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate startDate, LocalDate endDate);

    @Query("""
            select t
            from Trip t
            where t.positionDate = :positionDate
            order by t.horse.plate asc, t.id asc
            """)
    List<Trip> findByPositionDate(@Param("positionDate") LocalDate positionDate);

    @Query("""
            select t
            from Trip t
            where t.positionDate between :startDate and :endDate
            order by t.positionDate desc, t.horse.plate asc, t.id asc
            """)
    List<Trip> findByPositionDateBetween(@Param("startDate") LocalDate startDate,
                                         @Param("endDate") LocalDate endDate);
}
