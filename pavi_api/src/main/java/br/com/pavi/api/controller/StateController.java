package br.com.pavi.api.controller;

import br.com.pavi.api.model.State;
import br.com.pavi.api.service.StateService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/states")
public class StateController {

    private final StateService service;

    public StateController(StateService service) {
        this.service = service;
    }

    @GetMapping
    public List<State> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public State findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public State save(@Valid @RequestBody State state) {
        return service.save(state);
    }

    @PutMapping("/{id}")
    public State update(@PathVariable Long id, @Valid @RequestBody State state) {
        return service.update(id, state);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
