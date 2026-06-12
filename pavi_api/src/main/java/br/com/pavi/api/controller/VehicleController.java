package br.com.pavi.api.controller;

import br.com.pavi.api.model.Vehicle;
import br.com.pavi.api.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vehicles")
public class VehicleController {

    private final VehicleService service;

    public VehicleController(VehicleService service) {
        this.service = service;
    }

    @GetMapping
    public List<Vehicle> findAll(@RequestParam(required = false) String type) {
        if (type != null) {
            return service.findByType(type);
        }
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Vehicle findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Vehicle save(@Valid @RequestBody Vehicle vehicle) {
        return service.save(vehicle);
    }

    @PutMapping("/{id}")
    public Vehicle update(@PathVariable Long id, @Valid @RequestBody Vehicle vehicle) {
        return service.update(id, vehicle);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
