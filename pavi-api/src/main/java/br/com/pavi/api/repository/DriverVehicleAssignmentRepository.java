package br.com.pavi.api.repository;

import br.com.pavi.api.model.DriverVehicleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverVehicleAssignmentRepository extends JpaRepository<DriverVehicleAssignment, Long> {
}
