-- State
CREATE TABLE state (
                       id SERIAL NOT NULL,
                       name VARCHAR(100) NOT NULL,
                       uf VARCHAR(2) NOT NULL,
                       CONSTRAINT pk_state PRIMARY KEY (id)
);

-- City
CREATE TABLE city (
                      id SERIAL NOT NULL,
                      name VARCHAR(100) NOT NULL,
                      state_id INT NOT NULL,
                      CONSTRAINT pk_city PRIMARY KEY (id),
                      CONSTRAINT fk_city_state FOREIGN KEY (state_id) REFERENCES state(id)
);

-- Company
CREATE TABLE company (
                         id SERIAL NOT NULL,
                         name VARCHAR(150) NOT NULL,
                         cnpj VARCHAR(18) NOT NULL UNIQUE,
                         zip_code VARCHAR(10) NOT NULL,
                         neighborhood VARCHAR(100) NOT NULL,
                         street VARCHAR(150) NOT NULL,
                         complement VARCHAR(100),
                         number VARCHAR(10) NOT NULL,
                         city_id INT NOT NULL,
                         CONSTRAINT pk_company PRIMARY KEY (id),
                         CONSTRAINT fk_company_city FOREIGN KEY (city_id) REFERENCES city(id)
);

-- Manufacturer
CREATE TABLE manufacturer (
                              id SERIAL NOT NULL,
                              name VARCHAR(30) NOT NULL,
                              CONSTRAINT pk_manufacturer PRIMARY KEY (id)
);

-- Vehicle Model
CREATE TABLE vehicle_model (
                               id SERIAL NOT NULL,
                               name VARCHAR(100) NOT NULL,
                               manufacturer_id INT NOT NULL,
                               CONSTRAINT pk_vehicle_model PRIMARY KEY (id),
                               CONSTRAINT fk_vehicle_model_manufacturer FOREIGN KEY (manufacturer_id) REFERENCES manufacturer(id)
);

-- Vehicle
CREATE TABLE vehicle (
                         id SERIAL NOT NULL,
                         plate VARCHAR(10) NOT NULL UNIQUE,
                         type VARCHAR(30) NOT NULL,
                         chassis VARCHAR(50) NOT NULL UNIQUE,
                         renavam VARCHAR(20) NOT NULL UNIQUE,
                         model_year INT NOT NULL,
                         manufacturing_year INT NOT NULL,
                         vehicle_model_id INT NOT NULL,
                         CONSTRAINT pk_vehicle PRIMARY KEY (id),
                         CONSTRAINT fk_vehicle_model FOREIGN KEY (vehicle_model_id) REFERENCES vehicle_model(id)
);

-- Driver
CREATE TABLE driver (
                        id SERIAL NOT NULL,
                        name VARCHAR(150) NOT NULL,
                        sex VARCHAR(1) NOT NULL,
                        license_number VARCHAR(20) NOT NULL UNIQUE,
                        birth_date DATE NOT NULL,
                        license_expiration DATE NOT NULL,
                        city_id INT NOT NULL,
                        CONSTRAINT pk_driver PRIMARY KEY (id),
                        CONSTRAINT fk_driver_city FOREIGN KEY (city_id) REFERENCES city(id)
);

-- Trip
CREATE TABLE trip (
                      id SERIAL NOT NULL,
                      start_date DATE NOT NULL,
                      end_date DATE NOT NULL,
                      freight_value DECIMAL(10,2) NOT NULL,
                      toll_value DECIMAL(10,2) NOT NULL,
                      status VARCHAR(30) NOT NULL,
                      driver_id INT NOT NULL,
                      tractor_id INT NOT NULL,
                      trailer_id INT,
                      CONSTRAINT pk_trip PRIMARY KEY (id),
                      CONSTRAINT fk_trip_driver FOREIGN KEY (driver_id) REFERENCES driver(id),
                      CONSTRAINT fk_trip_tractor FOREIGN KEY (tractor_id) REFERENCES vehicle(id),
                      CONSTRAINT fk_trip_trailer FOREIGN KEY (trailer_id) REFERENCES vehicle(id)
);

-- Origin
CREATE TABLE origin (
                        trip_id INT NOT NULL,
                        company_id INT NOT NULL,
                        ordering INT NOT NULL,
                        CONSTRAINT pk_origin PRIMARY KEY (trip_id, ordering),
                        CONSTRAINT fk_origin_trip FOREIGN KEY (trip_id) REFERENCES trip(id),
                        CONSTRAINT fk_origin_company FOREIGN KEY (company_id) REFERENCES company(id)
);

-- Destination
CREATE TABLE destination (
                             trip_id INT NOT NULL,
                             company_id INT NOT NULL,
                             ordering INT NOT NULL,
                             CONSTRAINT pk_destination PRIMARY KEY (trip_id, ordering),
                             CONSTRAINT fk_destination_trip FOREIGN KEY (trip_id) REFERENCES trip(id),
                             CONSTRAINT fk_destination_company FOREIGN KEY (company_id) REFERENCES company(id)
);

-- Users
CREATE TABLE users (
                       id SERIAL NOT NULL,
                       username TEXT NOT NULL UNIQUE,
                       role TEXT NOT NULL,
                       password_hash TEXT NOT NULL,
                       CONSTRAINT pk_users PRIMARY KEY (id),
);

CREATE TABLE delivery (
                          id                    BIGSERIAL PRIMARY KEY,
                          trip_id               BIGINT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
                          delivery_value        DECIMAL(10,2) NOT NULL,
                          delivery_status       TEXT NOT NULL DEFAULT 'Pendente',
                          date                  DATE NOT NULL,
                          payment_date          DATE,
                          deadline              DATE,
                          delivery_type         TEXT,
                          boarding              TEXT,
                          cte                   TEXT,
                          complementary_cte     TEXT,
                          icms                  DECIMAL(10,4),
                          complementary_icms    TEXT,
                          toll_value            DECIMAL(10,2),
                          toll_status           TEXT,
                          observations          TEXT,
                          complementary_delivery TEXT
);

