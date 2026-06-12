-- State
CREATE TABLE state (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL
);


-- City
CREATE TABLE city (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    state_id BIGINT NOT NULL REFERENCES state(id)
);

-- Company
CREATE TABLE company (
    id BIGSERIAL PRIMARY KEY,
    corporate_name TEXT NOT NULL,
    cnpj TEXT NOT NULL UNIQUE,
    zip_code TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    street TEXT NOT NULL,
    complement TEXT,
    number TEXT NOT NULL,
    city_id BIGINT NOT NULL REFERENCES city(id)
);

-- Manufacturer
CREATE TABLE manufacturer (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- Vehicle Model
CREATE TABLE vehicle_model (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    manufacturer_id BIGINT NOT NULL REFERENCES manufacturer(id)
);

-- Vehicle
CREATE TABLE vehicle (
    id BIGSERIAL PRIMARY KEY,
    plate TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    chassis TEXT NOT NULL UNIQUE,
    renavam TEXT NOT NULL UNIQUE,
    model_year INT NOT NULL,
    manufacturing_year INT NOT NULL,
    vehicle_model_id BIGINT NOT NULL REFERENCES vehicle_model(id)
);

-- Driver
CREATE TABLE driver (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    sex TEXT NOT NULL,
    license_number TEXT NOT NULL UNIQUE,
    birth_date DATE NOT NULL,
    license_expiration DATE NOT NULL,
    city_id BIGINT NOT NULL REFERENCES city(id)
);

-- Trip
CREATE TABLE trip (
    id BIGSERIAL PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    freight_value DECIMAL(10,2) NOT NULL,
    toll_value DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL,
    driver_id BIGINT NOT NULL REFERENCES driver(id),
    horse_id BIGINT NOT NULL REFERENCES vehicle(id),
    trailer_id BIGINT REFERENCES vehicle(id)
);

-- Origin (composite key: trip_id + company_id)
CREATE TABLE origin (
    trip_id BIGINT NOT NULL REFERENCES trip(id),
    company_id BIGINT NOT NULL REFERENCES company(id),
    ordering INT NOT NULL,
    PRIMARY KEY (trip_id, company_id)
);

-- Destination (composite key: trip_id + company_id)
CREATE TABLE destination (
    trip_id BIGINT NOT NULL REFERENCES trip(id),
    company_id BIGINT NOT NULL REFERENCES company(id),
    ordering INT NOT NULL,
    PRIMARY KEY (trip_id, company_id)
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

CREATE INDEX idx_delivery_trip_id ON delivery(trip_id);
CREATE INDEX idx_delivery_status  ON delivery(delivery_status);
