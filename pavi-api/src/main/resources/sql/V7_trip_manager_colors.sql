ALTER TABLE app_user ADD COLUMN IF NOT EXISTS color VARCHAR(16);

UPDATE app_user
SET color = CASE MOD(id, 8)
    WHEN 0 THEN '#2563EB'
    WHEN 1 THEN '#16A34A'
    WHEN 2 THEN '#F97316'
    WHEN 3 THEN '#7C3AED'
    WHEN 4 THEN '#DC2626'
    WHEN 5 THEN '#0891B2'
    WHEN 6 THEN '#CA8A04'
    ELSE '#DB2777'
END
WHERE color IS NULL OR color = '';

ALTER TABLE trip ADD COLUMN IF NOT EXISTS manager_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_trip_manager'
    ) THEN
        ALTER TABLE trip
            ADD CONSTRAINT fk_trip_manager
            FOREIGN KEY (manager_id)
            REFERENCES app_user(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_trip_manager ON trip(manager_id);
