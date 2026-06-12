package br.com.pavi.api.service;

import br.com.pavi.api.exception.ResourceNotFoundException;
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

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class TripService {

    private final TripRepository repository;
    private final CompanyRepository companyRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;

    public TripService(TripRepository repository,
                       CompanyRepository companyRepository,
                       DriverRepository driverRepository,
                       VehicleRepository vehicleRepository) {
        this.repository = repository;
        this.companyRepository = companyRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public List<Trip> findAll() {
        return repository.findAll();
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

    public Trip save(Trip trip) {
        resolveReferences(trip, trip.getOrigins(), trip.getDestinations());
        return repository.save(trip);
    }

    public Trip update(Long id, Trip data) {
        Trip existing = findById(id);
        existing.setStartDate(data.getStartDate());
        existing.setEndDate(data.getEndDate());
        existing.setFreightValue(data.getFreightValue());
        existing.setTollValue(data.getTollValue());
        existing.setStatus(data.getStatus());
        existing.setDistance(data.getDistance());
        existing.setNotes(data.getNotes());
        existing.setDriver(data.getDriver());
        existing.setHorse(data.getHorse());
        existing.setTrailer(data.getTrailer());

        resolveReferences(existing, data.getOrigins(), data.getDestinations());
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void resolveReferences(Trip trip, List<Origin> incomingOrigins, List<Destination> incomingDestinations) {
        trip.setDriver(resolveDriver(trip.getDriver()));
        trip.setHorse(resolveVehicle("horse", trip.getHorse()));
        if (trip.getTrailer() != null) {
            trip.setTrailer(resolveVehicle("trailer", trip.getTrailer()));
        }

        syncOrigins(trip, incomingOrigins);
        syncDestinations(trip, incomingDestinations);
    }

    private void syncOrigins(Trip trip, List<Origin> origins) {
        List<Origin> incomingOrigins = origins == null
                ? null
                : new ArrayList<>(origins);
        if (incomingOrigins == null || incomingOrigins.isEmpty()) {
            throw new IllegalArgumentException("origins must contain at least one item");
        }

        trip.getOrigins().clear();
        for (int index = 0; index < incomingOrigins.size(); index++) {
            trip.getOrigins().add(resolveOrigin(trip, incomingOrigins.get(index), index));
        }
    }

    private Origin resolveOrigin(Trip trip, Origin incomingOrigin, int index) {
        Long companyId = ValidationUtils.requiredReferenceId(
                "origins[" + index + "].company",
                incomingOrigin.getCompany() == null ? null : incomingOrigin.getCompany().getId()
        );

        Origin origin = new Origin();
        origin.setId(new OriginId(trip.getId(), companyId));
        origin.setOrder(incomingOrigin.getOrder());
        origin.setTrip(trip);
        origin.setCompany(resolveCompany("origins[" + index + "].company", incomingOrigin.getCompany()));
        return origin;
    }

    private void syncDestinations(Trip trip, List<Destination> destinations) {
        List<Destination> incomingDestinations = destinations == null
                ? null
                : new ArrayList<>(destinations);
        if (incomingDestinations == null || incomingDestinations.isEmpty()) {
            throw new IllegalArgumentException("destinations must contain at least one item");
        }

        trip.getDestinations().clear();
        for (int index = 0; index < incomingDestinations.size(); index++) {
            trip.getDestinations().add(resolveDestination(trip, incomingDestinations.get(index), index));
        }
    }

    private Destination resolveDestination(Trip trip, Destination incomingDestination, int index) {
        Long companyId = ValidationUtils.requiredReferenceId(
                "destinations[" + index + "].company",
                incomingDestination.getCompany() == null ? null : incomingDestination.getCompany().getId()
        );

        Destination destination = new Destination();
        destination.setId(new DestinationId(trip.getId(), companyId));
        destination.setOrder(incomingDestination.getOrder());
        destination.setTrip(trip);
        destination.setCompany(resolveCompany("destinations[" + index + "].company", incomingDestination.getCompany()));
        return destination;
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

}
