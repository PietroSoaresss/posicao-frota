package br.com.pavi.api.auth;

import br.com.pavi.api.model.City;
import br.com.pavi.api.model.Manufacturer;
import br.com.pavi.api.model.State;
import br.com.pavi.api.model.VehicleModel;
import br.com.pavi.api.repository.CityRepository;
import br.com.pavi.api.repository.ManufacturerRepository;
import br.com.pavi.api.repository.StateRepository;
import br.com.pavi.api.repository.VehicleModelRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Profile("!test")
public class ReferenceDataBootstrap implements CommandLineRunner {

    private static final List<String> USER_COLORS = List.of(
            "#2563EB", "#16A34A", "#F97316", "#7C3AED", "#DC2626", "#0891B2", "#CA8A04", "#DB2777"
    );

    private final StateRepository stateRepository;
    private final CityRepository cityRepository;
    private final ManufacturerRepository manufacturerRepository;
    private final VehicleModelRepository vehicleModelRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ReferenceDataBootstrap(StateRepository stateRepository,
                                  CityRepository cityRepository,
                                  ManufacturerRepository manufacturerRepository,
                                  VehicleModelRepository vehicleModelRepository,
                                  UserRepository userRepository,
                                  PasswordEncoder passwordEncoder) {
        this.stateRepository = stateRepository;
        this.cityRepository = cityRepository;
        this.manufacturerRepository = manufacturerRepository;
        this.vehicleModelRepository = vehicleModelRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedDefaultAdmin();
        assignMissingUserColors();
        seedStatesAndCities();
        seedManufacturersAndModels();
    }

    private void seedDefaultAdmin() {
        if (userRepository.count() > 0) {
            return;
        }

        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin"));
        admin.setRole("ADMIN");
        admin.setColor("#2563EB");
        userRepository.save(admin);
    }

    private void assignMissingUserColors() {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            if (user.getColor() == null || user.getColor().isBlank()) {
                int index = Math.floorMod(user.getUsername() == null ? 0 : user.getUsername().hashCode(), USER_COLORS.size());
                user.setColor(USER_COLORS.get(index));
            }
        }
        userRepository.saveAll(users);
    }

    private void seedStatesAndCities() {
        if (stateRepository.count() == 0) {
            stateRepository.saveAll(List.of(
                    state("São Paulo", "SP"),
                    state("Minas Gerais", "MG"),
                    state("Paraná", "PR"),
                    state("Rio de Janeiro", "RJ"),
                    state("Goiás", "GO")
            ));
        }

        if (cityRepository.count() > 0) {
            return;
        }

        Map<String, State> statesByUf = new HashMap<>();
        for (State state : stateRepository.findAll()) {
            statesByUf.put(state.getAbbreviation(), state);
        }

        cityRepository.saveAll(List.of(
                city("São Paulo", statesByUf.get("SP")),
                city("Campinas", statesByUf.get("SP")),
                city("Belo Horizonte", statesByUf.get("MG")),
                city("Uberlândia", statesByUf.get("MG")),
                city("Curitiba", statesByUf.get("PR")),
                city("Rio de Janeiro", statesByUf.get("RJ")),
                city("Goiânia", statesByUf.get("GO"))
        ));
    }

    private void seedManufacturersAndModels() {
        if (manufacturerRepository.count() == 0) {
            manufacturerRepository.saveAll(List.of(
                    manufacturer("Volvo"),
                    manufacturer("Scania"),
                    manufacturer("Mercedes-Benz"),
                    manufacturer("Iveco"),
                    manufacturer("Randon")
            ));
        }

        if (vehicleModelRepository.count() > 0) {
            return;
        }

        Map<String, Manufacturer> manufacturersByName = new HashMap<>();
        for (Manufacturer manufacturer : manufacturerRepository.findAll()) {
            manufacturersByName.put(manufacturer.getName(), manufacturer);
        }

        vehicleModelRepository.saveAll(List.of(
                vehicleModel("FH 540", manufacturersByName.get("Volvo")),
                vehicleModel("FH 460", manufacturersByName.get("Volvo")),
                vehicleModel("R 450", manufacturersByName.get("Scania")),
                vehicleModel("Actros 2651", manufacturersByName.get("Mercedes-Benz")),
                vehicleModel("S-Way 480", manufacturersByName.get("Iveco")),
                vehicleModel("SR Graneleiro", manufacturersByName.get("Randon"))
        ));
    }

    private State state(String name, String abbreviation) {
        State state = new State();
        state.setName(name);
        state.setAbbreviation(abbreviation);
        return state;
    }

    private City city(String name, State state) {
        City city = new City();
        city.setName(name);
        city.setState(state);
        return city;
    }

    private Manufacturer manufacturer(String name) {
        Manufacturer manufacturer = new Manufacturer();
        manufacturer.setName(name);
        return manufacturer;
    }

    private VehicleModel vehicleModel(String name, Manufacturer manufacturer) {
        VehicleModel vehicleModel = new VehicleModel();
        vehicleModel.setName(name);
        vehicleModel.setManufacturer(manufacturer);
        return vehicleModel;
    }
}
