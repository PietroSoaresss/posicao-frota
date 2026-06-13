package br.com.pavi.api.controller;

import br.com.pavi.api.model.Trip;
import br.com.pavi.api.service.TripService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/trips")
public class TripController {

    private final TripService service;

    public TripController(TripService service) {
        this.service = service;
    }

    @GetMapping
    public List<Trip> find(@RequestParam(required = false) String status,
                           @RequestParam(required = false) Long driverId) {
        if (status != null) {
            return service.findByStatus(status);
        }
        if (driverId != null) {
            return service.findByDriverId(driverId);
        }
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Trip findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Trip save(@Valid @RequestBody Trip trip) {
        return service.save(trip);
    }

    @PutMapping("/{id}")
    public Trip update(@PathVariable Long id, @Valid @RequestBody Trip trip) {
        return service.update(id, trip);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
