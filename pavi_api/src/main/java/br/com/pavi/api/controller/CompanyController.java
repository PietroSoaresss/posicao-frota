package br.com.pavi.api.controller;

import br.com.pavi.api.model.Company;
import br.com.pavi.api.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/companies")
public class CompanyController {

    private final CompanyService service;

    public CompanyController(CompanyService service) {
        this.service = service;
    }

    @GetMapping
    public List<Company> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Company findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Company save(@Valid @RequestBody Company company) {
        return service.save(company);
    }

    @PutMapping("/{id}")
    public Company update(@PathVariable Long id, @Valid @RequestBody Company company) {
        return service.update(id, company);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
