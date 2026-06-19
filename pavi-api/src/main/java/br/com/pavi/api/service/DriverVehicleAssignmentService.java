package br.com.pavi.api.service;

import br.com.pavi.api.exception.ResourceNotFoundException;
import br.com.pavi.api.model.Driver;
import br.com.pavi.api.model.DriverVehicleAssignment;
import br.com.pavi.api.model.Vehicle;
import br.com.pavi.api.repository.DriverRepository;
import br.com.pavi.api.repository.DriverVehicleAssignmentRepository;
import br.com.pavi.api.repository.VehicleRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class DriverVehicleAssignmentService {

    private final DriverVehicleAssignmentRepository repository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;

    public DriverVehicleAssignmentService(DriverVehicleAssignmentRepository repository,
                                          DriverRepository driverRepository,
                                          VehicleRepository vehicleRepository) {
        this.repository = repository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public List<DriverVehicleAssignment> findAll(Long driverId, Long vehicleId) {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "startDate", "id"))
                .stream()
                .filter(assignment -> driverId == null || assignment.getDriver().getId().equals(driverId))
                .filter(assignment -> vehicleId == null || matchesVehicle(assignment, vehicleId))
                .toList();
    }

    public DriverVehicleAssignment findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DriverVehicleAssignment not found: " + id));
    }

    public DriverVehicleAssignment save(DriverVehicleAssignment assignment) {
        assignment.setDriver(resolveDriver(assignment));
        assignment.setHorse(resolveHorse(assignment));
        assignment.setTrailer(resolveTrailer(assignment));
        assignment.setVehicle(assignment.getHorse());
        validatePeriod(assignment.getStartDate(), assignment.getEndDate());
        return repository.save(assignment);
    }

    public DriverVehicleAssignment update(Long id, DriverVehicleAssignment data) {
        DriverVehicleAssignment existing = findById(id);
        existing.setDriver(resolveDriver(data));
        existing.setHorse(resolveHorse(data));
        existing.setTrailer(resolveTrailer(data));
        existing.setVehicle(existing.getHorse());
        existing.setStartDate(data.getStartDate());
        existing.setEndDate(data.getEndDate());
        validatePeriod(existing.getStartDate(), existing.getEndDate());
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private Driver resolveDriver(DriverVehicleAssignment assignment) {
        Long driverId = ValidationUtils.requiredReferenceId("driver",
                assignment.getDriver() == null ? null : assignment.getDriver().getId());
        return driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found: " + driverId));
    }

    private Vehicle resolveHorse(DriverVehicleAssignment assignment) {
        Long vehicleId = assignment.getHorse() == null ? null : assignment.getHorse().getId();
        if (vehicleId == null && assignment.getVehicle() != null) {
            vehicleId = assignment.getVehicle().getId();
        }
        Long resolvedVehicleId = ValidationUtils.requiredReferenceId("horse", vehicleId);
        return vehicleRepository.findById(resolvedVehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + resolvedVehicleId));
    }

    private Vehicle resolveTrailer(DriverVehicleAssignment assignment) {
        Long vehicleId = ValidationUtils.requiredReferenceId("trailer",
                assignment.getTrailer() == null ? null : assignment.getTrailer().getId());
        return vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + vehicleId));
    }

    private boolean matchesVehicle(DriverVehicleAssignment assignment, Long vehicleId) {
        return vehicleId.equals(idOf(assignment.getVehicle()))
                || vehicleId.equals(idOf(assignment.getHorse()))
                || vehicleId.equals(idOf(assignment.getTrailer()));
    }

    private Long idOf(Vehicle vehicle) {
        return vehicle == null ? null : vehicle.getId();
    }

    private void validatePeriod(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) {
            throw new IllegalArgumentException("startDate is required");
        }
        if (endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("endDate cannot be before startDate");
        }
    }
}
