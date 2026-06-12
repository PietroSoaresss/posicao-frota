package br.com.pavi.api.repository;

import br.com.pavi.api.model.City;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CityRepository extends JpaRepository<City, Long> {
    List<City> findByStateId(Long stateId);
}
