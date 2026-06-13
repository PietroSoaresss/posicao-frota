package br.com.pavi.api.service;

import br.com.pavi.api.exception.ResourceNotFoundException;
import br.com.pavi.api.model.Manufacturer;
import br.com.pavi.api.model.VehicleModel;
import br.com.pavi.api.repository.ManufacturerRepository;
import br.com.pavi.api.repository.VehicleModelRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VehicleModelService {

    private final VehicleModelRepository repository;
    private final ManufacturerRepository manufacturerRepository;

    public VehicleModelService(VehicleModelRepository repository, ManufacturerRepository manufacturerRepository) {
        this.repository = repository;
        this.manufacturerRepository = manufacturerRepository;
    }

    public List<VehicleModel> findAll() {
        return repository.findAll();
    }

    public VehicleModel findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("VehicleModel not found: " + id));
    }

    public List<VehicleModel> findByManufacturerId(Long manufacturerId) {
        return repository.findByManufacturerId(manufacturerId);
    }

    public VehicleModel save(VehicleModel vehicleModel) {
        vehicleModel.setManufacturer(resolveManufacturer(vehicleModel));
        return repository.save(vehicleModel);
    }

    public VehicleModel update(Long id, VehicleModel data) {
        VehicleModel existing = findById(id);
        existing.setName(data.getName());
        existing.setManufacturer(resolveManufacturer(data));
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private Manufacturer resolveManufacturer(VehicleModel vehicleModel) {
        Long manufacturerId = ValidationUtils.requiredReferenceId("manufacturer",
                vehicleModel.getManufacturer() == null ? null : vehicleModel.getManufacturer().getId());
        return manufacturerRepository.findById(manufacturerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manufacturer not found: " + manufacturerId));
    }
}
