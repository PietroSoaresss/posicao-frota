package br.com.pavi.api;

import br.com.pavi.api.auth.User;
import br.com.pavi.api.auth.UserRepository;
import br.com.pavi.api.model.City;
import br.com.pavi.api.model.Company;
import br.com.pavi.api.model.Driver;
import br.com.pavi.api.model.Manufacturer;
import br.com.pavi.api.model.State;
import br.com.pavi.api.model.Vehicle;
import br.com.pavi.api.model.VehicleModel;
import br.com.pavi.api.repository.CityRepository;
import br.com.pavi.api.repository.CompanyRepository;
import br.com.pavi.api.repository.DeliveryRepository;
import br.com.pavi.api.repository.DriverRepository;
import br.com.pavi.api.repository.ManufacturerRepository;
import br.com.pavi.api.repository.StateRepository;
import br.com.pavi.api.repository.TripRepository;
import br.com.pavi.api.repository.VehicleModelRepository;
import br.com.pavi.api.repository.VehicleRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class AuditRemovalIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private VehicleModelRepository vehicleModelRepository;

    @Autowired
    private ManufacturerRepository manufacturerRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private StateRepository stateRepository;

    @BeforeEach
    void setup() {
        deliveryRepository.deleteAll();
        tripRepository.deleteAll();
        driverRepository.deleteAll();
        companyRepository.deleteAll();
        vehicleRepository.deleteAll();
        vehicleModelRepository.deleteAll();
        manufacturerRepository.deleteAll();
        cityRepository.deleteAll();
        stateRepository.deleteAll();
        userRepository.deleteAll();
        createUser("admin", "admin", "ADMIN");
    }

    @Test
    void authenticatedUserGetsNotFoundForAuditLogsEndpoint() throws Exception {
        mvc.perform(get("/audit-logs")
                        .header("Authorization", bearerToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void driverCrudStillWorks() throws Exception {
        City city = createCity();
        String token = bearerToken();

        MvcResult createResult = mvc.perform(post("/drivers")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(driverRequest(city.getId(), "John Doe")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("John Doe"))
                .andReturn();

        Long driverId = jsonId(createResult);

        mvc.perform(put("/drivers/{id}", driverId)
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(driverRequest(city.getId(), "Jane Doe")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Jane Doe"));

        mvc.perform(delete("/drivers/{id}", driverId)
                        .header("Authorization", token))
                .andExpect(status().isOk());

        assertThat(driverRepository.findById(driverId)).isEmpty();
    }

    @Test
    void companyVehicleTripAndDeliveryCrudStillWorks() throws Exception {
        City city = createCity();
        VehicleModel vehicleModel = createVehicleModel();
        String token = bearerToken();

        MvcResult companyResult = mvc.perform(post("/companies")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(companyRequest(city.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.corporateName").value("Test Company"))
                .andReturn();
        Long companyId = jsonId(companyResult);

        MvcResult horseResult = mvc.perform(post("/vehicles")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vehicleRequest(vehicleModel.getId(), "ABC1D23", "cavalo", "12345678901")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plate").value("ABC1D23"))
                .andReturn();
        Long horseId = jsonId(horseResult);

        Vehicle trailer = createVehicle(vehicleModel, "XYZ9Z88", "carreta", "12345678902");
        Driver driver = createDriver(city);

        MvcResult tripResult = mvc.perform(post("/trips")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tripRequest(driver.getId(), horseId, trailer.getId(), companyId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EM_ANDAMENTO"))
                .andReturn();
        Long tripId = jsonId(tripResult);

        MvcResult deliveryResult = mvc.perform(post("/deliveries")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deliveryRequest(tripId, "Pendente", "1000.00")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deliveryStatus").value("Pendente"))
                .andReturn();
        Long deliveryId = jsonId(deliveryResult);

        mvc.perform(put("/deliveries/{id}", deliveryId)
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deliveryRequest(tripId, "Pago", "1200.00")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deliveryStatus").value("Pago"))
                .andExpect(jsonPath("$.deliveryValue").value(1200.00));

        mvc.perform(delete("/deliveries/{id}", deliveryId)
                        .header("Authorization", token))
                .andExpect(status().isOk());

        assertThat(companyRepository.findById(companyId)).isPresent();
        assertThat(vehicleRepository.findById(horseId)).isPresent();
        assertThat(tripRepository.findById(tripId)).isPresent();
        assertThat(deliveryRepository.findById(deliveryId)).isEmpty();
    }

    private String bearerToken() throws Exception {
        jakarta.servlet.http.Cookie cookie = mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "admin",
                                  "password": "admin"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getCookie(br.com.pavi.api.auth.AuthController.SESSION_COOKIE);

        if (cookie == null) {
            throw new IllegalStateException("login did not set the session cookie");
        }
        return "Bearer " + cookie.getValue();
    }

    private void createUser(String username, String password, String role) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        userRepository.save(user);
    }

    private Long jsonId(MvcResult result) throws Exception {
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asLong();
    }

    private State createState() {
        State state = new State();
        state.setName("Test State");
        state.setAbbreviation("TS");
        return stateRepository.save(state);
    }

    private City createCity() {
        City city = new City();
        city.setName("Test City");
        city.setState(createState());
        return cityRepository.save(city);
    }

    private Manufacturer createManufacturer() {
        Manufacturer manufacturer = new Manufacturer();
        manufacturer.setName("Test Manufacturer");
        return manufacturerRepository.save(manufacturer);
    }

    private VehicleModel createVehicleModel() {
        VehicleModel vehicleModel = new VehicleModel();
        vehicleModel.setName("Test Model");
        vehicleModel.setManufacturer(createManufacturer());
        return vehicleModelRepository.save(vehicleModel);
    }

    private Vehicle createVehicle(VehicleModel vehicleModel, String plate, String type, String renavam) {
        Vehicle vehicle = new Vehicle();
        vehicle.setPlate(plate);
        vehicle.setType(type);
        vehicle.setChassis("CHASSIS-" + plate);
        vehicle.setRenavam(renavam);
        vehicle.setModelYear(2024);
        vehicle.setManufacturingYear(2023);
        vehicle.setVehicleModel(vehicleModel);
        return vehicleRepository.save(vehicle);
    }

    private Driver createDriver(City city) {
        Driver driver = new Driver();
        driver.setName("John Doe");
        driver.setSex("M");
        driver.setLicenseNumber("12345678901");
        driver.setBirthDate(LocalDate.of(1990, 5, 15));
        driver.setLicenseExpiration(LocalDate.of(2030, 5, 15));
        driver.setCity(city);
        return driverRepository.save(driver);
    }

    private String driverRequest(Long cityId, String name) {
        return """
            {
              "name": "%s",
              "sex": "M",
              "licenseNumber": "12345678901",
              "birthDate": "1990-05-15",
              "licenseExpiration": "2030-05-15",
              "city": { "id": %d }
            }
            """.formatted(name, cityId);
    }

    private String companyRequest(Long cityId) {
        return """
            {
              "corporateName": "Test Company",
              "cnpj": "00.000.000/0001-00",
              "zipCode": "13000-000",
              "neighborhood": "Centro",
              "street": "Av Brasil",
              "complement": "Sala 10",
              "number": "100",
              "city": { "id": %d }
            }
            """.formatted(cityId);
    }

    private String vehicleRequest(Long vehicleModelId, String plate, String type, String renavam) {
        return """
            {
              "plate": "%s",
              "type": "%s",
              "chassis": "CHASSIS-%s",
              "renavam": "%s",
              "modelYear": 2024,
              "manufacturingYear": 2023,
              "vehicleModel": { "id": %d }
            }
            """.formatted(plate, type, plate, renavam, vehicleModelId);
    }

    private String tripRequest(Long driverId, Long horseId, Long trailerId, Long companyId) {
        return """
            {
              "startDate": "2026-05-01",
              "endDate": "2026-05-03",
              "freightValue": 1500.00,
              "tollValue": 120.50,
              "status": "EM_ANDAMENTO",
              "distance": 450,
              "notes": "Test trip",
              "driver": { "id": %d },
              "horse": { "id": %d },
              "trailer": { "id": %d },
              "origins": [
                { "company": { "id": %d }, "order": 1 }
              ],
              "destinations": [
                { "company": { "id": %d }, "order": 1 }
              ]
            }
            """.formatted(driverId, horseId, trailerId, companyId, companyId);
    }

    private String deliveryRequest(Long tripId, String status, String value) {
        return """
            {
              "trip": { "id": %d },
              "deliveryValue": %s,
              "deliveryStatus": "%s",
              "date": "2026-05-02",
              "paymentDate": "2026-05-10",
              "deadline": "2026-05-09",
              "deliveryType": "Entrega",
              "boarding": "Doca 1",
              "cte": "12345",
              "complementaryCte": "67890",
              "icms": 17.50,
              "complementaryIcms": "Isento",
              "tollValue": 50.00,
              "tollStatus": "Pago",
              "observations": "Sem pendencias",
              "complementaryDelivery": "Entrega parcial"
            }
            """.formatted(tripId, value, status);
    }
}
