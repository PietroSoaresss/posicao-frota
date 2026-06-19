package br.com.pavi.api.service;

import br.com.pavi.api.exception.ResourceNotFoundException;
import br.com.pavi.api.model.City;
import br.com.pavi.api.model.Driver;
import br.com.pavi.api.repository.CityRepository;
import br.com.pavi.api.repository.DriverRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class DriverService {

    private final DriverRepository repository;
    private final CityRepository cityRepository;

    public DriverService(DriverRepository repository,
                         CityRepository cityRepository) {
        this.repository = repository;
        this.cityRepository = cityRepository;
    }

    public List<Driver> findAll() {
        return repository.findAll();
    }

    public Driver findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found: " + id));
    }

    public List<Driver> findByCityId(Long cityId) {
        return repository.findByCityId(cityId);
    }

    public Driver save(Driver driver) {
        driver.setCity(resolveCity(driver));
        return repository.save(driver);
    }

    public Driver update(Long id, Driver data) {
        Driver existing = findById(id);
        existing.setName(data.getName());
        existing.setSex(data.getSex());
        existing.setLicenseNumber(data.getLicenseNumber());
        existing.setBirthDate(data.getBirthDate());
        existing.setLicenseExpiration(data.getLicenseExpiration());
        existing.setCity(resolveCity(data));
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private City resolveCity(Driver driver) {
        Long cityId = ValidationUtils.requiredReferenceId("city",
                driver.getCity() == null ? null : driver.getCity().getId());
        return cityRepository.findById(cityId)
                .orElseThrow(() -> new ResourceNotFoundException("City not found: " + cityId));
    }
}
