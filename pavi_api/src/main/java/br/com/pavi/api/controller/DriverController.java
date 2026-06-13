package br.com.pavi.api.controller;

import br.com.pavi.api.model.Driver;
import br.com.pavi.api.service.DriverService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/drivers")
public class DriverController {

    private final DriverService service;

    public DriverController(DriverService service) {
        this.service = service;
    }

    @GetMapping
    public List<Driver> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Driver findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Driver save(@Valid @RequestBody Driver driver) {
        return service.save(driver);
    }

    @PutMapping("/{id}")
    public Driver update(@PathVariable Long id, @Valid @RequestBody Driver driver) {
        return service.update(id, driver);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
