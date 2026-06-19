package br.com.pavi.api.service;

import br.com.pavi.api.exception.ResourceNotFoundException;
import br.com.pavi.api.model.State;
import br.com.pavi.api.repository.StateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class StateService {

    private final StateRepository repository;

    public StateService(StateRepository repository) {
        this.repository = repository;
    }

    public List<State> findAll() {
        return repository.findAll();
    }

    public State findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("State not found: " + id));
    }

    public State save(State state) {
        return repository.save(state);
    }

    public State update(Long id, State data) {
        State existing = findById(id);
        existing.setName(data.getName());
        existing.setAbbreviation(data.getAbbreviation());
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
