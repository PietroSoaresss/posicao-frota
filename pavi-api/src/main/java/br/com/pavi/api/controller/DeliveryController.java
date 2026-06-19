package br.com.pavi.api.controller;

import br.com.pavi.api.model.Delivery;
import br.com.pavi.api.service.DeliveryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/deliveries")
public class DeliveryController {

    private final DeliveryService service;

    public DeliveryController(DeliveryService service) {
        this.service = service;
    }

    @GetMapping
    public List<Delivery> find(@RequestParam(required = false) Long tripId,
                               @RequestParam(required = false) String status) {
        if (tripId != null) return service.findByTripId(tripId);
        if (status != null) return service.findByStatus(status);
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Delivery findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Delivery save(@Valid @RequestBody Delivery delivery) {
        return service.save(delivery);
    }

    @PutMapping("/{id}")
    public Delivery update(@PathVariable Long id, @Valid @RequestBody Delivery delivery) {
        return service.update(id, delivery);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}