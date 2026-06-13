package br.com.pavi.api.controller;

import br.com.pavi.api.model.VehicleModel;
import br.com.pavi.api.service.VehicleModelService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vehicle-models")
public class VehicleModelController {

    private final VehicleModelService service;

    public VehicleModelController(VehicleModelService service) {
        this.service = service;
    }

    @GetMapping
    public List<VehicleModel> findAll(@RequestParam(required = false) Long manufacturerId) {
        if (manufacturerId != null) {
            return service.findByManufacturerId(manufacturerId);
        }
        return service.findAll();
    }

    @GetMapping("/{id}")
    public VehicleModel findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public VehicleModel save(@Valid @RequestBody VehicleModel vehicleModel) {
        return service.save(vehicleModel);
    }

    @PutMapping("/{id}")
    public VehicleModel update(@PathVariable Long id, @Valid @RequestBody VehicleModel vehicleModel) {
        return service.update(id, vehicleModel);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
