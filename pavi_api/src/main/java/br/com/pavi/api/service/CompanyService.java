package br.com.pavi.api.service;

import br.com.pavi.api.exception.ResourceNotFoundException;
import br.com.pavi.api.model.City;
import br.com.pavi.api.model.Company;
import br.com.pavi.api.repository.CityRepository;
import br.com.pavi.api.repository.CompanyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CompanyService {

    private final CompanyRepository repository;
    private final CityRepository cityRepository;

    public CompanyService(CompanyRepository repository,
                          CityRepository cityRepository) {
        this.repository = repository;
        this.cityRepository = cityRepository;
    }

    public List<Company> findAll() {
        return repository.findAll();
    }

    public Company findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + id));
    }

    public List<Company> findByCityId(Long cityId) {
        return repository.findByCityId(cityId);
    }

    public Company save(Company company) {
        company.setCity(resolveCity(company));
        return repository.save(company);
    }

    public Company update(Long id, Company data) {
        Company existing = findById(id);
        existing.setCorporateName(data.getCorporateName());
        existing.setCnpj(data.getCnpj());
        existing.setZipCode(data.getZipCode());
        existing.setNeighborhood(data.getNeighborhood());
        existing.setStreet(data.getStreet());
        existing.setComplement(data.getComplement());
        existing.setNumber(data.getNumber());
        existing.setCity(resolveCity(data));
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private City resolveCity(Company company) {
        Long cityId = ValidationUtils.requiredReferenceId("city",
                company.getCity() == null ? null : company.getCity().getId());
        return cityRepository.findById(cityId)
                .orElseThrow(() -> new ResourceNotFoundException("City not found: " + cityId));
    }
}
