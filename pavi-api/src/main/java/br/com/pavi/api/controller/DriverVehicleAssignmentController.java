package br.com.pavi.api.controller;

import br.com.pavi.api.model.DriverVehicleAssignment;
import br.com.pavi.api.service.DriverVehicleAssignmentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/driver-vehicle-assignments")
public class DriverVehicleAssignmentController {

    private final DriverVehicleAssignmentService service;

    public DriverVehicleAssignmentController(DriverVehicleAssignmentService service) {
        this.service = service;
    }

    @GetMapping
    public List<DriverVehicleAssignment> findAll(@RequestParam(required = false) Long driverId,
                                                 @RequestParam(required = false) Long vehicleId) {
        return service.findAll(driverId, vehicleId);
    }

    @GetMapping("/{id}")
    public DriverVehicleAssignment findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public DriverVehicleAssignment save(@Valid @RequestBody DriverVehicleAssignment assignment) {
        return service.save(assignment);
    }

    @PutMapping("/{id}")
    public DriverVehicleAssignment update(@PathVariable Long id, @Valid @RequestBody DriverVehicleAssignment assignment) {
        return service.update(id, assignment);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
