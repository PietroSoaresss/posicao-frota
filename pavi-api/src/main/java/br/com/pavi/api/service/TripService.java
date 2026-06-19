package br.com.pavi.api.service;

import br.com.pavi.api.exception.ResourceNotFoundException;
import br.com.pavi.api.auth.User;
import br.com.pavi.api.auth.UserRepository;
import br.com.pavi.api.model.Company;
import br.com.pavi.api.model.Destination;
import br.com.pavi.api.model.DestinationId;
import br.com.pavi.api.model.Driver;
import br.com.pavi.api.model.Origin;
import br.com.pavi.api.model.OriginId;
import br.com.pavi.api.model.Trip;
import br.com.pavi.api.model.Vehicle;
import br.com.pavi.api.repository.CompanyRepository;
import br.com.pavi.api.repository.DriverRepository;
import br.com.pavi.api.repository.TripRepository;
import br.com.pavi.api.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class TripService {

    private final TripRepository repository;
    private final CompanyRepository companyRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public TripService(TripRepository repository,
                       CompanyRepository companyRepository,
                       DriverRepository driverRepository,
                       VehicleRepository vehicleRepository,
                       UserRepository userRepository) {
        this.repository = repository;
        this.companyRepository = companyRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    public List<Trip> findAll() {
        List<Trip> trips = repository.findAll();
        trips.forEach(this::normalizePositionDates);
        trips.sort(fleetPositionComparator());
        return trips;
    }

    public Trip findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found: " + id));
    }

    public List<Trip> findByStatus(String status) {
        return repository.findByStatus(status);
    }

    public List<Trip> findByDriverId(Long driverId) {
        return repository.findByDriverId(driverId);
    }

    public List<Trip> findByPositionDate(LocalDate positionDate) {
        List<Trip> trips = repository.findByPositionDate(positionDate);
        if (trips.isEmpty()) {
            trips = repository.findAll().stream()
                    .filter(trip -> positionDate.equals(effectivePositionDate(trip)))
                    .toList();
        }
        trips.forEach(this::normalizePositionDates);
        return trips.stream().sorted(fleetPositionComparator()).toList();
    }

    public List<Trip> findByPositionDateBetween(LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate == null ? LocalDate.now().minusMonths(6) : startDate;
        LocalDate end = endDate == null ? LocalDate.now() : endDate;
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("startDate must be before or equal to endDate");
        }

        List<Trip> trips = repository.findByPositionDateBetween(start, end);
        List<Trip> missingLegacyRows = repository.findAll().stream()
                .filter(trip -> trip.getPositionDate() == null)
                .filter(trip -> {
                    LocalDate positionDate = effectivePositionDate(trip);
                    return positionDate != null && !positionDate.isBefore(start) && !positionDate.isAfter(end);
                })
                .toList();

        if (!missingLegacyRows.isEmpty()) {
            List<Trip> merged = new ArrayList<>(trips);
            merged.addAll(missingLegacyRows);
            trips = merged;
        }

        trips.forEach(this::normalizePositionDates);
        return trips.stream().sorted(fleetPositionComparator()).toList();
    }

    public Trip save(Trip trip) {
        normalizePositionDates(trip);
        resolveReferences(trip);
        return repository.save(trip);
    }

    public Trip update(Long id, Trip data) {
        normalizePositionDates(data);
        Trip existing = findById(id);
        existing.setStartDate(data.getStartDate());
        existing.setEndDate(data.getEndDate());
        existing.setPositionDate(data.getPositionDate());
        existing.setCopiedFromId(data.getCopiedFromId());
        existing.setFreightValue(data.getFreightValue());
        existing.setTollValue(data.getTollValue());
        existing.setStatus(data.getStatus());
        existing.setDistance(data.getDistance());
        existing.setNotes(data.getNotes());
        existing.setOriginLocation(data.getOriginLocation());
        existing.setTnf(data.getTnf());
        existing.setDestinationAgenda(data.getDestinationAgenda());
        existing.setShipper(data.getShipper());
        existing.setPaviValue(data.getPaviValue());
        existing.setTollPurchase(data.getTollPurchase());
        existing.setGuidePayment(data.getGuidePayment());
        existing.setSubstitutionStates(data.getSubstitutionStates());
        existing.setSecondLegEmissionValue(data.getSecondLegEmissionValue());
        existing.setSecondLegGuidePayment(data.getSecondLegGuidePayment());
        existing.setDriver(data.getDriver());
        existing.setHorse(data.getHorse());
        existing.setTrailer(data.getTrailer());
        existing.setManager(data.getManager());
        mergeOrigins(existing, data.getOrigins());
        mergeDestinations(existing, data.getDestinations());

        resolveReferences(existing);
        return repository.save(existing);
    }

    public List<Trip> createDailySnapshot(LocalDate targetDate) {
        LocalDate date = targetDate == null ? LocalDate.now() : targetDate;
        List<Trip> existingRows = findByPositionDate(date);
        List<Trip> sourceRows = findLatestFleetRowsBefore(date);
        if (existingRows.isEmpty() && sourceRows.isEmpty()) {
            throw new IllegalArgumentException("No previous fleet position found to copy");
        }

        Set<Long> existingHorseIds = existingRows.stream()
                .map(Trip::getHorse)
                .filter(Objects::nonNull)
                .map(Vehicle::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<Trip> snapshots = sourceRows.stream()
                .filter(source -> source.getHorse() != null && source.getHorse().getId() != null)
                .filter(source -> !existingHorseIds.contains(source.getHorse().getId()))
                .map(source -> copyForPositionDate(source, date))
                .map(this::save)
                .toList();

        List<Trip> result = new ArrayList<>(existingRows);
        result.addAll(snapshots);
        return latestRowsByHorse(result).stream().sorted(fleetPositionComparator()).toList();
    }

    public void delete(Long id) {
        Trip existing = findById(id);
        repository.delete(existing);
    }

    private void resolveReferences(Trip trip) {
        normalizePositionDates(trip);
        normalizeMonetaryValues(trip);
        trip.setDriver(resolveDriver(trip.getDriver()));
        trip.setHorse(resolveVehicle("horse", trip.getHorse()));
        trip.setTrailer(resolveVehicle("trailer", trip.getTrailer()));
        trip.setManager(resolveManager(trip.getManager()));

        if (trip.getOrigins() == null) {
            trip.setOrigins(new ArrayList<>());
        }
        for (int index = 0; index < trip.getOrigins().size(); index++) {
            Origin origin = trip.getOrigins().get(index);
            origin.setTrip(trip);
            origin.setCompany(resolveCompany("origins[" + index + "].company", origin.getCompany()));
        }

        if (trip.getDestinations() == null) {
            trip.setDestinations(new ArrayList<>());
        }

        for (int index = 0; index < trip.getDestinations().size(); index++) {
            Destination destination = trip.getDestinations().get(index);
            destination.setTrip(trip);
            destination.setCompany(resolveCompany("destinations[" + index + "].company", destination.getCompany()));
        }
    }

    private void mergeOrigins(Trip trip, List<Origin> incomingOrigins) {
        if (incomingOrigins == null) {
            trip.getOrigins().clear();
            return;
        }

        List<Origin> mergedOrigins = new ArrayList<>();
        for (Origin incomingOrigin : incomingOrigins) {
            Long companyId = ValidationUtils.requiredReferenceId("origins[].company",
                    incomingOrigin.getCompany() == null ? null : incomingOrigin.getCompany().getId());

            Origin target = trip.getOrigins().stream()
                    .filter(origin -> origin.getCompany() != null && companyId.equals(origin.getCompany().getId()))
                    .findFirst()
                    .orElseGet(Origin::new);

            target.setId(new OriginId(trip.getId(), companyId));
            target.setOrder(incomingOrigin.getOrder());
            target.setTrip(trip);
            target.setCompany(incomingOrigin.getCompany());
            mergedOrigins.add(target);
        }

        trip.getOrigins().removeIf(origin -> !mergedOrigins.contains(origin));
        mergedOrigins.stream()
                .filter(origin -> !trip.getOrigins().contains(origin))
                .forEach(trip.getOrigins()::add);
    }

    private void mergeDestinations(Trip trip, List<Destination> incomingDestinations) {
        if (incomingDestinations == null) {
            trip.getDestinations().clear();
            return;
        }

        List<Destination> mergedDestinations = new ArrayList<>();
        for (Destination incomingDestination : incomingDestinations) {
            Long companyId = ValidationUtils.requiredReferenceId("destinations[].company",
                    incomingDestination.getCompany() == null ? null : incomingDestination.getCompany().getId());

            Destination target = trip.getDestinations().stream()
                    .filter(destination -> destination.getCompany() != null && companyId.equals(destination.getCompany().getId()))
                    .findFirst()
                    .orElseGet(Destination::new);

            target.setId(new DestinationId(trip.getId(), companyId));
            target.setOrder(incomingDestination.getOrder());
            target.setTrip(trip);
            target.setCompany(incomingDestination.getCompany());
            mergedDestinations.add(target);
        }

        trip.getDestinations().removeIf(destination -> !mergedDestinations.contains(destination));
        mergedDestinations.stream()
                .filter(destination -> !trip.getDestinations().contains(destination))
                .forEach(trip.getDestinations()::add);
    }

    private Driver resolveDriver(Driver driver) {
        Long driverId = ValidationUtils.requiredReferenceId("driver",
                driver == null ? null : driver.getId());
        return driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found: " + driverId));
    }

    private Vehicle resolveVehicle(String fieldName, Vehicle vehicle) {
        Long vehicleId = ValidationUtils.requiredReferenceId(fieldName,
                vehicle == null ? null : vehicle.getId());
        return vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + vehicleId));
    }

    private Company resolveCompany(String fieldName, Company company) {
        Long companyId = ValidationUtils.requiredReferenceId(fieldName,
                company == null ? null : company.getId());
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + companyId));
    }

    private User resolveManager(User manager) {
        if (manager == null || manager.getId() == null) {
            return null;
        }
        return userRepository.findById(manager.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found: " + manager.getId()));
    }

    private Trip copyForPositionDate(Trip source, LocalDate positionDate) {
        Trip copy = new Trip();
        copy.setPositionDate(positionDate);
        copy.setCopiedFromId(source.getId());
        copy.setStartDate(positionDate);
        copy.setEndDate(positionDate);
        copy.setFreightValue(source.getFreightValue());
        copy.setTollValue(source.getTollValue());
        copy.setStatus(source.getStatus());
        copy.setDistance(source.getDistance());
        copy.setNotes(source.getNotes());
        copy.setOriginLocation(source.getOriginLocation());
        copy.setTnf(source.getTnf());
        copy.setDestinationAgenda(source.getDestinationAgenda());
        copy.setShipper(source.getShipper());
        copy.setPaviValue(source.getPaviValue());
        copy.setTollPurchase(source.getTollPurchase());
        copy.setGuidePayment(source.getGuidePayment());
        copy.setSubstitutionStates(source.getSubstitutionStates());
        copy.setSecondLegEmissionValue(source.getSecondLegEmissionValue());
        copy.setSecondLegGuidePayment(source.getSecondLegGuidePayment());
        copy.setDriver(source.getDriver());
        copy.setHorse(source.getHorse());
        copy.setTrailer(source.getTrailer());
        copy.setManager(source.getManager());

        List<Origin> origins = source.getOrigins().stream()
                .map(origin -> {
                    Origin copiedOrigin = new Origin();
                    copiedOrigin.setOrder(origin.getOrder());
                    copiedOrigin.setCompany(origin.getCompany());
                    return copiedOrigin;
                })
                .toList();
        copy.setOrigins(new ArrayList<>(origins));

        List<Destination> destinations = source.getDestinations().stream()
                .map(destination -> {
                    Destination copiedDestination = new Destination();
                    copiedDestination.setOrder(destination.getOrder());
                    copiedDestination.setCompany(destination.getCompany());
                    return copiedDestination;
                })
                .toList();
        copy.setDestinations(new ArrayList<>(destinations));

        return copy;
    }

    private List<Trip> findLatestFleetRowsBefore(LocalDate targetDate) {
        List<Trip> rows = repository.findAll().stream()
                .peek(this::normalizePositionDates)
                .filter(trip -> {
                    LocalDate positionDate = effectivePositionDate(trip);
                    return positionDate != null && positionDate.isBefore(targetDate);
                })
                .toList();
        return latestRowsByHorse(rows);
    }

    private List<Trip> latestRowsByHorse(List<Trip> rows) {
        Map<Long, Trip> byHorse = new LinkedHashMap<>();
        rows.stream()
                .filter(trip -> trip.getHorse() != null && trip.getHorse().getId() != null)
                .sorted(latestPositionFirstComparator())
                .forEach(trip -> byHorse.putIfAbsent(trip.getHorse().getId(), trip));
        return new ArrayList<>(byHorse.values());
    }

    private LocalDate effectivePositionDate(Trip trip) {
        return trip.getPositionDate() != null ? trip.getPositionDate() : trip.getStartDate();
    }

    private void normalizePositionDates(Trip trip) {
        if (trip.getPositionDate() == null) {
            trip.setPositionDate(trip.getStartDate() != null ? trip.getStartDate() : LocalDate.now());
        }
        if (trip.getStartDate() == null) {
            trip.setStartDate(trip.getPositionDate());
        }
        if (trip.getEndDate() == null) {
            trip.setEndDate(trip.getPositionDate());
        }
    }

    private void normalizeMonetaryValues(Trip trip) {
        if (trip.getFreightValue() == null) {
            trip.setFreightValue(BigDecimal.ZERO);
        }
    }

    private Comparator<Trip> latestPositionFirstComparator() {
        return Comparator
                .comparing(this::effectivePositionDate, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(Trip::getId, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private Comparator<Trip> fleetPositionComparator() {
        return Comparator
                .comparing(Trip::getPositionDate, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(trip -> trip.getHorse() == null ? "" : trip.getHorse().getPlate(),
                        Comparator.nullsLast(String::compareToIgnoreCase))
                .thenComparing(Trip::getId, Comparator.nullsLast(Long::compareTo));
    }
}
