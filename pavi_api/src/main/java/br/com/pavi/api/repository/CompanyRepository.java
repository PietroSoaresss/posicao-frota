package br.com.pavi.api.repository;

import br.com.pavi.api.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    List<Company> findByCityId(Long cityId);
}
