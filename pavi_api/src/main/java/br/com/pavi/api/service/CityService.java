package br.com.pavi.api.service;

import br.com.pavi.api.exception.ResourceNotFoundException;
import br.com.pavi.api.model.City;
import br.com.pavi.api.model.State;
import br.com.pavi.api.repository.CityRepository;
import br.com.pavi.api.repository.StateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CityService {

    private final CityRepository repository;
    private final StateRepository stateRepository;

    public CityService(CityRepository repository, StateRepository stateRepository) {
        this.repository = repository;
        this.stateRepository = stateRepository;
    }

    public List<City> findAll() {
        return repository.findAll();
    }

    public City findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("City not found: " + id));
    }

    public List<City> findByStateId(Long stateId) {
        return repository.findByStateId(stateId);
    }

    public City save(City city) {
        city.setState(resolveState(city));
        return repository.save(city);
    }

    public City update(Long id, City data) {
        City existing = findById(id);
        existing.setName(data.getName());
        existing.setState(resolveState(data));
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private State resolveState(City city) {
        Long stateId = ValidationUtils.requiredReferenceId("state",
                city.getState() == null ? null : city.getState().getId());
        return stateRepository.findById(stateId)
                .orElseThrow(() -> new ResourceNotFoundException("State not found: " + stateId));
    }
}
