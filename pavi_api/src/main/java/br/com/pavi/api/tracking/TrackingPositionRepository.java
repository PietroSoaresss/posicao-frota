package br.com.pavi.api.tracking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrackingPositionRepository extends JpaRepository<TrackingPosition, Long> {
    boolean existsByPacketId(Long packetId);

    Optional<TrackingPosition> findTopByLicensePlateOrderByPacketDateUtcDesc(String licensePlate);

    List<TrackingPosition> findByLicensePlateAndPacketDateUtcBetweenOrderByPacketDateUtcAsc(
            String licensePlate,
            Instant from,
            Instant to
    );

    @Transactional
    long deleteByPacketDateUtcBefore(Instant threshold);
}
