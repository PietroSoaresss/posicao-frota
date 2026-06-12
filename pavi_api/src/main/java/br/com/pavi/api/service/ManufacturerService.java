package br.com.pavi.api.service;

import br.com.pavi.api.exception.ResourceNotFoundException;
import br.com.pavi.api.model.Manufacturer;
import br.com.pavi.api.repository.ManufacturerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ManufacturerService {

    private final ManufacturerRepository repository;

    public ManufacturerService(ManufacturerRepository repository) {
        this.repository = repository;
    }

    public List<Manufacturer> findAll() {
        return repository.findAll();
    }

    public Manufacturer findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Manufacturer not found: " + id));
    }

    public Manufacturer save(Manufacturer manufacturer) {
        return repository.save(manufacturer);
    }

    public Manufacturer update(Long id, Manufacturer data) {
        Manufacturer existing = findById(id);
        existing.setName(data.getName());
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
