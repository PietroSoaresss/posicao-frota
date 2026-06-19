package br.com.pavi.api.controller;

import br.com.pavi.api.model.City;
import br.com.pavi.api.service.CityService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cities")
public class CityController {

    private final CityService service;

    public CityController(CityService service) {
        this.service = service;
    }

    @GetMapping
    public List<City> findAll(@RequestParam(required = false) Long stateId) {
        if (stateId != null) {
            return service.findByStateId(stateId);
        }
        return service.findAll();
    }

    @GetMapping("/{id}")
    public City findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public City save(@Valid @RequestBody City city) {
        return service.save(city);
    }

    @PutMapping("/{id}")
    public City update(@PathVariable Long id, @Valid @RequestBody City city) {
        return service.update(id, city);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
