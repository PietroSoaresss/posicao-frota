package br.com.pavi.api.auth;

import br.com.pavi.api.repository.ManufacturerRepository;
import br.com.pavi.api.repository.StateRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class NoProductionSeedTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StateRepository stateRepository;

    @Autowired
    private ManufacturerRepository manufacturerRepository;

    @Test
    void applicationDoesNotCreateDefaultUsersOrReferenceDataOnStartup() {
        assertTrue(userRepository.findByUsername("admin").isEmpty());
        assertEquals(0, stateRepository.count());
        assertEquals(0, manufacturerRepository.count());
    }
}
