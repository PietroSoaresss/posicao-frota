package br.com.pavi.api;

import br.com.pavi.api.model.City;
import br.com.pavi.api.model.Company;
import br.com.pavi.api.model.Driver;
import br.com.pavi.api.model.Manufacturer;
import br.com.pavi.api.model.State;
import br.com.pavi.api.auth.User;
import br.com.pavi.api.auth.UserRepository;
import br.com.pavi.api.model.Vehicle;
import br.com.pavi.api.model.VehicleModel;
import br.com.pavi.api.repository.CityRepository;
import br.com.pavi.api.repository.CompanyRepository;
import br.com.pavi.api.repository.DriverRepository;
import br.com.pavi.api.repository.ManufacturerRepository;
import br.com.pavi.api.repository.StateRepository;
import br.com.pavi.api.repository.TripRepository;
import br.com.pavi.api.repository.VehicleModelRepository;
import br.com.pavi.api.repository.VehicleRepository;
import br.com.pavi.api.tracking.TrackingPosition;
import br.com.pavi.api.tracking.TrackingPositionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
class SmokeTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private TrackingPositionRepository trackingPositionRepository;

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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setup() {
        trackingPositionRepository.deleteAll();
        tripRepository.deleteAll();
        driverRepository.deleteAll();
        companyRepository.deleteAll();
        vehicleRepository.deleteAll();
        vehicleModelRepository.deleteAll();
        manufacturerRepository.deleteAll();
        cityRepository.deleteAll();
        stateRepository.deleteAll();
        userRepository.deleteAll();
        createAdminUser();
    }

    @Test
    void testStateFindAll() throws Exception {
        mvc.perform(get("/states"))
            .andExpect(status().isOk());
    }

    @Test
    void testStateCreate() throws Exception {
        mvc.perform(post("/states")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Test State",
                      "acronym": "TS"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Test State"))
            .andExpect(jsonPath("$.acronym").value("TS"));
    }

    @Test
    void testCityFindAll() throws Exception {
        mvc.perform(get("/cities"))
            .andExpect(status().isOk());
    }

    @Test
    void testCityCreate() throws Exception {
        State state = createState("Test State", "TS");

        mvc.perform(post("/cities")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Test City",
                      "state": { "id": %d }
                    }
                    """.formatted(state.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Test City"))
            .andExpect(jsonPath("$.state.id").value(state.getId()));
    }

    @Test
    void testCompanyFindAll() throws Exception {
        mvc.perform(get("/companies"))
            .andExpect(status().isOk());
    }

    @Test
    void testCompanyCreate() throws Exception {
        City city = createCity();

        mvc.perform(post("/companies")
                .contentType(MediaType.APPLICATION_JSON)
                .content(companyRequest(city.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.corporateName").value("Test Company"))
            .andExpect(jsonPath("$.city.id").value(city.getId()));
    }

    @Test
    void testCompanyCreateRejectsIncompletePayload() throws Exception {
        mvc.perform(post("/companies")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "corporateName": "Test Company",
                      "cnpj": "00.000.000/0001-00"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.zipCode").exists())
            .andExpect(jsonPath("$.errors.city").exists());
    }

    @Test
    void testManufacturerFindAll() throws Exception {
        mvc.perform(get("/manufacturers"))
            .andExpect(status().isOk());
    }

    @Test
    void testManufacturerCreate() throws Exception {
        mvc.perform(post("/manufacturers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Test Manufacturer"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Test Manufacturer"));
    }

    @Test
    void testVehicleModelFindAll() throws Exception {
        mvc.perform(get("/vehicle-models"))
            .andExpect(status().isOk());
    }

    @Test
    void testVehicleModelCreate() throws Exception {
        Manufacturer manufacturer = createManufacturer();

        mvc.perform(post("/vehicle-models")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Test Model",
                      "manufacturer": { "id": %d }
                    }
                    """.formatted(manufacturer.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Test Model"))
            .andExpect(jsonPath("$.manufacturer.id").value(manufacturer.getId()));
    }

    @Test
    void testVehicleFindAll() throws Exception {
        mvc.perform(get("/vehicles"))
            .andExpect(status().isOk());
    }

    @Test
    void testVehicleCreate() throws Exception {
        VehicleModel vehicleModel = createVehicleModel();

        mvc.perform(post("/vehicles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(vehicleRequest(vehicleModel.getId(), "ABC1D23", "cavalo")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.plate").value("ABC1D23"))
            .andExpect(jsonPath("$.vehicleModel.id").value(vehicleModel.getId()));
    }

    @Test
    void testVehicleCreateRejectsIncompletePayload() throws Exception {
        mvc.perform(post("/vehicles")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "plate": "ABC-1234",
                      "type": "TRUCK"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.chassis").exists())
            .andExpect(jsonPath("$.errors.vehicleModel").exists());
    }

    @Test
    void testDriverFindAll() throws Exception {
        mvc.perform(get("/drivers"))
            .andExpect(status().isOk());
    }

    @Test
    void testDriverCreate() throws Exception {
        City city = createCity();

        mvc.perform(post("/drivers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(driverRequest(city.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("John Doe"))
            .andExpect(jsonPath("$.city.id").value(city.getId()));
    }

    @Test
    void testTripFind() throws Exception {
        mvc.perform(get("/trips"))
            .andExpect(status().isOk());
    }

    @Test
    void testTripCreate() throws Exception {
        City city = createCity();
        Manufacturer manufacturer = createManufacturer();
        VehicleModel vehicleModel = createVehicleModel(manufacturer);
        Vehicle horse = createVehicle(vehicleModel, "ABC1D23", "cavalo");
        Vehicle trailer = createVehicle(vehicleModel, "XYZ9Z88", "carreta");
        Company company = createCompany(city);
        Driver driver = createDriver(city);

        mvc.perform(post("/trips")
                .contentType(MediaType.APPLICATION_JSON)
                .content(tripRequest(driver.getId(), horse.getId(), trailer.getId(), company.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("EM_ANDAMENTO"))
            .andExpect(jsonPath("$.driver.id").value(driver.getId()))
            .andExpect(jsonPath("$.horse.id").value(horse.getId()))
            .andExpect(jsonPath("$.trailer.id").value(trailer.getId()))
            .andExpect(jsonPath("$.origins[0].company.id").value(company.getId()))
            .andExpect(jsonPath("$.destinations[0].company.id").value(company.getId()));
    }

    @Test
    void testTripCreateRejectsIncompletePayload() throws Exception {
        mvc.perform(post("/trips")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "status": "SCHEDULED"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.startDate").exists())
            .andExpect(jsonPath("$.errors.driver").exists())
            .andExpect(jsonPath("$.errors.origins").exists());
    }

    @Test
    void testTrackingActiveTripsReturnsLatestHorsePosition() throws Exception {
        City city = createCity();
        Manufacturer manufacturer = createManufacturer();
        VehicleModel vehicleModel = createVehicleModel(manufacturer);
        Vehicle horse = createVehicle(vehicleModel, "abc-1d23", "cavalo");
        Vehicle trailer = createVehicle(vehicleModel, "XYZ9Z88", "carreta");
        Company company = createCompany(city);
        Driver driver = createDriver(city);
        LocalDate today = LocalDate.now();

        mvc.perform(post("/trips")
                .contentType(MediaType.APPLICATION_JSON)
                .content(tripRequest(
                        driver.getId(),
                        horse.getId(),
                        trailer.getId(),
                        company.getId(),
                        today.minusDays(1),
                        today.plusDays(1),
                        "Viajando"
                )))
            .andExpect(status().isOk());

        Long tripId = tripRepository.findAll().getFirst().getId();
        TrackingPosition position = new TrackingPosition();
        position.setPacketId(9001L);
        position.setSascarVehicleId(123L);
        position.setLicensePlate("ABC1D23");
        position.setLatitude(-23.55);
        position.setLongitude(-46.63);
        position.setSpeed(64);
        position.setIgnition(1);
        position.setDirection(180);
        position.setOdometer(123456L);
        position.setCity("Sao Paulo");
        position.setState("SP");
        position.setStreet("Av Paulista");
        position.setPacketDateUtc(Instant.now());
        position.setPositionDateUtc(Instant.now());
        position.setIngestedAt(Instant.now());
        trackingPositionRepository.save(position);

        mvc.perform(get("/tracking/active-trips"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].tripId").value(tripId))
            .andExpect(jsonPath("$[0].horsePlate").value("ABC1D23"))
            .andExpect(jsonPath("$[0].latestPosition.packetId").value(9001))
            .andExpect(jsonPath("$[0].latestPosition.latitude").value(-23.55))
            .andExpect(jsonPath("$[0].missingPosition").value(false));
    }

    @Test
    void testTripUpdate() throws Exception {
        City city = createCity();
        Manufacturer manufacturer = createManufacturer();
        VehicleModel vehicleModel = createVehicleModel(manufacturer);
        Vehicle horse = createVehicle(vehicleModel, "ABC1D23", "cavalo");
        Vehicle trailer = createVehicle(vehicleModel, "XYZ9Z88", "carreta");
        Company company = createCompany(city);
        Driver driver = createDriver(city);

        mvc.perform(post("/trips")
                .contentType(MediaType.APPLICATION_JSON)
                .content(tripRequest(driver.getId(), horse.getId(), trailer.getId(), company.getId())))
            .andExpect(status().isOk());

        Long tripId = tripRepository.findAll().getFirst().getId();

        mvc.perform(put("/trips/{id}", tripId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "startDate": "2026-05-01",
                      "endDate": "2026-05-03",
                      "freightValue": 1500.00,
                      "tollValue": 120.50,
                      "status": "CONCLUIDA",
                      "distance": 350,
                      "notes": "Viagem atualizada",
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
                    """.formatted(driver.getId(), horse.getId(), trailer.getId(), company.getId(), company.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CONCLUIDA"))
            .andExpect(jsonPath("$.distance").value(350))
            .andExpect(jsonPath("$.notes").value("Viagem atualizada"));
    }

    @Test
    void testAuthLogin() throws Exception {
        mvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "username": "admin",
                      "password": "admin"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isString());
    }

    private State createState(String name, String abbreviation) {
        State state = new State();
        state.setName(name);
        state.setAbbreviation(abbreviation);
        return stateRepository.save(state);
    }

    private City createCity() {
        return createCity(createState("Test State", "TS"));
    }

    private City createCity(State state) {
        City city = new City();
        city.setName("Test City");
        city.setState(state);
        return cityRepository.save(city);
    }

    private Manufacturer createManufacturer() {
        Manufacturer manufacturer = new Manufacturer();
        manufacturer.setName("Test Manufacturer");
        return manufacturerRepository.save(manufacturer);
    }

    private VehicleModel createVehicleModel() {
        return createVehicleModel(createManufacturer());
    }

    private VehicleModel createVehicleModel(Manufacturer manufacturer) {
        VehicleModel vehicleModel = new VehicleModel();
        vehicleModel.setName("Test Model");
        vehicleModel.setManufacturer(manufacturer);
        return vehicleModelRepository.save(vehicleModel);
    }

    private Vehicle createVehicle(VehicleModel vehicleModel, String plate, String type) {
        Vehicle vehicle = new Vehicle();
        vehicle.setPlate(plate);
        vehicle.setType(type);
        vehicle.setChassis("CHASSIS-" + plate);
        vehicle.setRenavam("RENAVAM-" + plate);
        vehicle.setModelYear(2024);
        vehicle.setManufacturingYear(2023);
        vehicle.setVehicleModel(vehicleModel);
        return vehicleRepository.save(vehicle);
    }

    private Company createCompany(City city) {
        Company company = new Company();
        company.setCorporateName("Test Company");
        company.setCnpj("00.000.000/0001-00");
        company.setZipCode("13000-000");
        company.setNeighborhood("Centro");
        company.setStreet("Av Brasil");
        company.setComplement("Sala 10");
        company.setNumber("100");
        company.setCity(city);
        return companyRepository.save(company);
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

    private void createAdminUser() {
        User user = new User();
        user.setUsername("admin");
        user.setPassword(passwordEncoder.encode("admin"));
        user.setRole("ADMIN");
        userRepository.save(user);
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

    private String vehicleRequest(Long vehicleModelId, String plate, String type) {
        return """
            {
              "plate": "%s",
              "type": "%s",
              "chassis": "9BWZZZ377VT004251",
              "renavam": "12345678901",
              "modelYear": 2024,
              "manufacturingYear": 2023,
              "vehicleModel": { "id": %d }
            }
            """.formatted(plate, type, vehicleModelId);
    }

    private String driverRequest(Long cityId) {
        return """
            {
              "name": "John Doe",
              "sex": "M",
              "licenseNumber": "12345678901",
              "birthDate": "1990-05-15",
              "licenseExpiration": "2030-05-15",
              "city": { "id": %d }
            }
            """.formatted(cityId);
    }

    private String tripRequest(Long driverId, Long horseId, Long trailerId, Long companyId) {
        return tripRequest(
                driverId,
                horseId,
                trailerId,
                companyId,
                LocalDate.of(2026, 5, 1),
                LocalDate.of(2026, 5, 3),
                "EM_ANDAMENTO"
        );
    }

    private String tripRequest(Long driverId,
                               Long horseId,
                               Long trailerId,
                               Long companyId,
                               LocalDate startDate,
                               LocalDate endDate,
                               String tripStatus) {
        return """
            {
              "startDate": "%s",
              "endDate": "%s",
              "freightValue": 1500.00,
              "tollValue": 120.50,
              "status": "%s",
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
            """.formatted(startDate, endDate, tripStatus, driverId, horseId, trailerId, companyId, companyId);
    }
}
