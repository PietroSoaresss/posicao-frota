CREATE TABLE driver_vehicle_assignment (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL REFERENCES driver(id),
    vehicle_id BIGINT REFERENCES vehicle(id),
    horse_id BIGINT NOT NULL REFERENCES vehicle(id),
    trailer_id BIGINT NOT NULL REFERENCES vehicle(id),
    start_date DATE NOT NULL,
    end_date DATE,
    CONSTRAINT ck_driver_vehicle_assignment_period
        CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_driver_vehicle_assignment_driver
    ON driver_vehicle_assignment(driver_id);

CREATE INDEX idx_driver_vehicle_assignment_vehicle
    ON driver_vehicle_assignment(vehicle_id);

CREATE INDEX idx_driver_vehicle_assignment_horse
    ON driver_vehicle_assignment(horse_id);

CREATE INDEX idx_driver_vehicle_assignment_trailer
    ON driver_vehicle_assignment(trailer_id);
