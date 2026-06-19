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
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

        List<Trip> activeTrips = tripRepository.findByStartDateLessThanEqualAndEndDateGreaterThanEqual(today, today);
        return latestTripsByHorse(activeTrips).stream()
                .map(trip -> toResponse(trip, trailFrom, now))
                .toList();
    }

    public Optional<TrackingPositionResponse> latestPosition(String plate) {
        String normalizedPlate = TrackingSyncService.normalizePlate(plate);
        if (!isSearchablePlate(normalizedPlate)) {
            return Optional.empty();
        }
        return positionRepository.findTopByLicensePlateStartingWithOrderByPacketDateUtcDesc(normalizedPlate)
                .map(TrackingPositionResponse::from);
    }

    public List<TrackingPositionResponse> trail(String plate, Instant from, Instant to) {
        Instant end = to == null ? clock.instant() : to;
        Instant start = from == null ? end.minus(24, ChronoUnit.HOURS) : from;
        String normalizedPlate = TrackingSyncService.normalizePlate(plate);
        if (!isSearchablePlate(normalizedPlate)) {
            return List.of();
        }
        return positionRepository.findByLicensePlateStartingWithAndPacketDateUtcBetweenOrderByPacketDateUtcAsc(
                        normalizedPlate,
                        start,
                        end
                )
                .stream()
                .map(TrackingPositionResponse::from)
                .toList();
    }

    private TrackingTripResponse toResponse(Trip trip, Instant trailFrom, Instant now) {
        String plate = TrackingSyncService.normalizePlate(trip.getHorse().getPlate());
        TrackingPosition latest = findLatestPosition(plate).orElse(null);
        List<TrackingPositionResponse> trail = findTrail(plate, trailFrom, now)
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

    private Optional<TrackingPosition> findLatestPosition(String normalizedPlate) {
        if (!isSearchablePlate(normalizedPlate)) {
            return Optional.empty();
        }
        return positionRepository.findTopByLicensePlateStartingWithOrderByPacketDateUtcDesc(normalizedPlate);
    }

    private List<TrackingPosition> findTrail(String normalizedPlate, Instant from, Instant to) {
        if (!isSearchablePlate(normalizedPlate)) {
            return List.of();
        }
        return positionRepository.findByLicensePlateStartingWithAndPacketDateUtcBetweenOrderByPacketDateUtcAsc(
                normalizedPlate,
                from,
                to
        );
    }

    private boolean isSearchablePlate(String normalizedPlate) {
        return normalizedPlate != null && normalizedPlate.length() == 7;
    }

    private List<Trip> latestTripsByHorse(List<Trip> trips) {
        Map<Long, Trip> byHorse = new LinkedHashMap<>();
        trips.stream()
                .filter(trip -> trip.getHorse() != null && trip.getHorse().getId() != null)
                .sorted(latestPositionFirstComparator())
                .forEach(trip -> byHorse.putIfAbsent(trip.getHorse().getId(), trip));
        return new ArrayList<>(byHorse.values());
    }

    private Comparator<Trip> latestPositionFirstComparator() {
        return Comparator
                .comparing(this::effectivePositionDate, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(Trip::getId, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private LocalDate effectivePositionDate(Trip trip) {
        return trip.getPositionDate() != null ? trip.getPositionDate() : trip.getStartDate();
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
