package br.com.pavi.api.tracking;

import br.com.pavi.api.model.Company;
import br.com.pavi.api.model.Destination;
import br.com.pavi.api.model.Origin;
import br.com.pavi.api.model.Trip;
import br.com.pavi.api.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class TrackingQueryService {

    private final TripRepository tripRepository;
    private final TrackingPositionRepository positionRepository;
    private final Clock clock;

    @Autowired
    public TrackingQueryService(TripRepository tripRepository,
                                TrackingPositionRepository positionRepository) {
        this(tripRepository, positionRepository, Clock.systemUTC());
    }

    TrackingQueryService(TripRepository tripRepository,
                         TrackingPositionRepository positionRepository,
                         Clock clock) {
        this.tripRepository = tripRepository;
        this.positionRepository = positionRepository;
        this.clock = clock;
    }

    public List<TrackingTripResponse> activeTrips() {
        LocalDate today = LocalDate.now(clock);
        Instant now = clock.instant();
        Instant trailFrom = now.minus(24, ChronoUnit.HOURS);

        return tripRepository.findByStartDateLessThanEqualAndEndDateGreaterThanEqual(today, today)
                .stream()
                .map(trip -> toResponse(trip, trailFrom, now))
                .toList();
    }

    public Optional<TrackingPositionResponse> latestPosition(String plate) {
        return positionRepository.findTopByLicensePlateOrderByPacketDateUtcDesc(TrackingSyncService.normalizePlate(plate))
                .map(TrackingPositionResponse::from);
    }

    public List<TrackingPositionResponse> trail(String plate, Instant from, Instant to) {
        Instant end = to == null ? clock.instant() : to;
        Instant start = from == null ? end.minus(24, ChronoUnit.HOURS) : from;
        return positionRepository.findByLicensePlateAndPacketDateUtcBetweenOrderByPacketDateUtcAsc(
                        TrackingSyncService.normalizePlate(plate),
                        start,
                        end
                )
                .stream()
                .map(TrackingPositionResponse::from)
                .toList();
    }

    private TrackingTripResponse toResponse(Trip trip, Instant trailFrom, Instant now) {
        String plate = TrackingSyncService.normalizePlate(trip.getHorse().getPlate());
        TrackingPosition latest = positionRepository.findTopByLicensePlateOrderByPacketDateUtcDesc(plate).orElse(null);
        List<TrackingPositionResponse> trail = positionRepository
                .findByLicensePlateAndPacketDateUtcBetweenOrderByPacketDateUtcAsc(plate, trailFrom, now)
                .stream()
                .map(TrackingPositionResponse::from)
                .toList();
        boolean missing = latest == null;
        boolean stale = latest != null && latest.getPacketDateUtc().isBefore(now.minus(30, ChronoUnit.MINUTES));

        return new TrackingTripResponse(
                trip.getId(),
                "P-" + String.format("%04d", trip.getId()),
                trip.getStatus(),
                trip.getStartDate(),
                trip.getEndDate(),
                trip.getDriver().getName(),
                plate,
                trip.getTrailer() == null ? null : TrackingSyncService.normalizePlate(trip.getTrailer().getPlate()),
                firstOriginLabel(trip),
                lastDestinationLabel(trip),
                TrackingPositionResponse.from(latest),
                trail,
                stale,
                missing
        );
    }

    private String firstOriginLabel(Trip trip) {
        return trip.getOrigins().stream()
                .min(Comparator.comparingInt(Origin::getOrder))
                .map(origin -> companyLabel(origin.getCompany()))
                .orElse("-");
    }

    private String lastDestinationLabel(Trip trip) {
        return trip.getDestinations().stream()
                .max(Comparator.comparingInt(Destination::getOrder))
                .map(destination -> companyLabel(destination.getCompany()))
                .orElse("-");
    }

    private String companyLabel(Company company) {
        String city = company.getCity() == null ? "" : company.getCity().getName();
        if (city.isBlank()) {
            return company.getCorporateName();
        }
        return company.getCorporateName() + " - " + city;
    }
}
