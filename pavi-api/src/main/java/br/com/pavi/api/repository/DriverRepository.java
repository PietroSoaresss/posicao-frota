package br.com.pavi.api.repository;

import br.com.pavi.api.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DriverRepository extends JpaRepository<Driver, Long> {
    List<Driver> findByCityId(Long cityId);
}
