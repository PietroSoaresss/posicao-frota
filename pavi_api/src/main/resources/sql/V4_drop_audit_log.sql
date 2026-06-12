-- Manual cleanup for existing PostgreSQL environments.
-- This project does not auto-run versioned migrations, so execute this file manually
-- against databases that still contain the legacy audit_log table.

DROP TABLE IF EXISTS audit_log;
