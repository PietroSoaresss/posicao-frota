package br.com.pavi.api.service;

import br.com.pavi.api.exception.ResourceNotFoundException;
import br.com.pavi.api.model.Vehicle;
import br.com.pavi.api.model.VehicleModel;
import br.com.pavi.api.repository.VehicleModelRepository;
import br.com.pavi.api.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VehicleService {

    private final VehicleRepository repository;
    private final VehicleModelRepository vehicleModelRepository;

    public VehicleService(VehicleRepository repository,
                          VehicleModelRepository vehicleModelRepository) {
        this.repository = repository;
        this.vehicleModelRepository = vehicleModelRepository;
    }

    public List<Vehicle> findAll() {
        return repository.findAll();
    }

    public Vehicle findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + id));
    }

    public List<Vehicle> findByType(String type) {
        return repository.findByType(type);
    }

    public Vehicle save(Vehicle vehicle) {
        vehicle.setVehicleModel(resolveVehicleModel(vehicle));
        return repository.save(vehicle);
    }

    public Vehicle update(Long id, Vehicle data) {
        Vehicle existing = findById(id);
        existing.setPlate(data.getPlate());
        existing.setType(data.getType());
        existing.setChassis(data.getChassis());
        existing.setRenavam(data.getRenavam());
        existing.setModelYear(data.getModelYear());
        existing.setManufacturingYear(data.getManufacturingYear());
        existing.setVehicleModel(resolveVehicleModel(data));
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private VehicleModel resolveVehicleModel(Vehicle vehicle) {
        Long vehicleModelId = ValidationUtils.requiredReferenceId("vehicleModel",
                vehicle.getVehicleModel() == null ? null : vehicle.getVehicleModel().getId());
        return vehicleModelRepository.findById(vehicleModelId)
                .orElseThrow(() -> new ResourceNotFoundException("VehicleModel not found: " + vehicleModelId));
    }
}
