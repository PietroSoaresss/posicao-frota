package br.com.pavi.api.controller;

import br.com.pavi.api.model.Manufacturer;
import br.com.pavi.api.service.ManufacturerService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/manufacturers")
public class ManufacturerController {

    private final ManufacturerService service;

    public ManufacturerController(ManufacturerService service) {
        this.service = service;
    }

    @GetMapping
    public List<Manufacturer> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Manufacturer findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Manufacturer save(@Valid @RequestBody Manufacturer manufacturer) {
        return service.save(manufacturer);
    }

    @PutMapping("/{id}")
    public Manufacturer update(@PathVariable Long id, @Valid @RequestBody Manufacturer manufacturer) {
        return service.update(id, manufacturer);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
