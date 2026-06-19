ALTER TABLE trip ADD COLUMN IF NOT EXISTS position_date DATE;
ALTER TABLE trip ADD COLUMN IF NOT EXISTS copied_from_id BIGINT;
ALTER TABLE trip ADD COLUMN IF NOT EXISTS origin_location TEXT;
ALTER TABLE trip ADD COLUMN IF NOT EXISTS tnf TEXT;
ALTER TABLE trip ADD COLUMN IF NOT EXISTS destination_agenda TEXT;
ALTER TABLE trip ADD COLUMN IF NOT EXISTS shipper TEXT;
ALTER TABLE trip ADD COLUMN IF NOT EXISTS pavi_value DECIMAL(10,2);
ALTER TABLE trip ADD COLUMN IF NOT EXISTS toll_purchase TEXT;
ALTER TABLE trip ADD COLUMN IF NOT EXISTS guide_payment TEXT;
ALTER TABLE trip ADD COLUMN IF NOT EXISTS substitution_states TEXT;
ALTER TABLE trip ADD COLUMN IF NOT EXISTS second_leg_emission_value DECIMAL(10,2);
ALTER TABLE trip ADD COLUMN IF NOT EXISTS second_leg_guide_payment TEXT;

UPDATE trip
SET position_date = start_date
WHERE position_date IS NULL;

ALTER TABLE trip ALTER COLUMN position_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trip_position_date ON trip(position_date);
CREATE INDEX IF NOT EXISTS idx_trip_position_date_horse ON trip(position_date, horse_id);
