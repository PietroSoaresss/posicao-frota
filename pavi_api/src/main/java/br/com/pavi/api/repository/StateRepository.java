package br.com.pavi.api.repository;

import br.com.pavi.api.model.State;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StateRepository extends JpaRepository<State, Long> {
}
