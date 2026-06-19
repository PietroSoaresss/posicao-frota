ALTER TABLE driver_vehicle_assignment
    ADD COLUMN IF NOT EXISTS horse_id BIGINT,
    ADD COLUMN IF NOT EXISTS trailer_id BIGINT;

UPDATE driver_vehicle_assignment
SET horse_id = COALESCE(horse_id, vehicle_id);

UPDATE driver_vehicle_assignment
SET trailer_id = COALESCE(
    trailer_id,
    (
        SELECT id
        FROM vehicle
        WHERE UPPER(type) LIKE '%CARRETA%'
          AND id <> driver_vehicle_assignment.horse_id
        ORDER BY id
        LIMIT 1
    )
);

UPDATE driver_vehicle_assignment
SET trailer_id = horse_id
WHERE trailer_id IS NULL;

ALTER TABLE driver_vehicle_assignment
    ALTER COLUMN horse_id SET NOT NULL,
    ALTER COLUMN trailer_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_driver_vehicle_assignment_horse'
    ) THEN
        ALTER TABLE driver_vehicle_assignment
            ADD CONSTRAINT fk_driver_vehicle_assignment_horse
            FOREIGN KEY (horse_id) REFERENCES vehicle(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_driver_vehicle_assignment_trailer'
    ) THEN
        ALTER TABLE driver_vehicle_assignment
            ADD CONSTRAINT fk_driver_vehicle_assignment_trailer
            FOREIGN KEY (trailer_id) REFERENCES vehicle(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_driver_vehicle_assignment_horse
    ON driver_vehicle_assignment(horse_id);

CREATE INDEX IF NOT EXISTS idx_driver_vehicle_assignment_trailer
    ON driver_vehicle_assignment(trailer_id);
