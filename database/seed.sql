-- ============================================================================
-- BCSE302P – DATABASE SYSTEMS LAB | Assessment 6
-- AQE: Approximate Query Engine - Seed Data
-- ============================================================================

-- 1. Insert Initial Users across required roles (Admin, Analyst, Developer)
INSERT INTO users (user_id, full_name, email, role, created_at) VALUES
(1, 'System Administrator', 'admin@aqe.lab', 'ADMIN', CURRENT_TIMESTAMP),
(2, 'Data Analyst', 'analyst@aqe.lab', 'ANALYST', CURRENT_TIMESTAMP),
(3, 'Engine Developer', 'dev@aqe.lab', 'DEVELOPER', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- 2. Insert Standard Dataset (NYC Taxi Yellow Cab)
INSERT INTO datasets (dataset_id, dataset_name, source_uri, format, row_count, status, created_at) VALUES
(1, 'NYC Taxi Yellow Cab Trips', 'data/yellow_tripdata_sample.csv', 'CSV', 100000, 'ACTIVE', CURRENT_TIMESTAMP)
ON CONFLICT (dataset_name) DO NOTHING;

-- 3. Insert Columns for Dataset 1
INSERT INTO columns (column_id, dataset_id, column_name, data_type, ordinal_position, is_nullable) VALUES
(1, 1, 'vendor_id', 'INTEGER', 1, FALSE),
(2, 1, 'pickup_datetime', 'TIMESTAMP', 2, FALSE),
(3, 1, 'dropoff_datetime', 'TIMESTAMP', 3, FALSE),
(4, 1, 'passenger_count', 'INTEGER', 4, FALSE),
(5, 1, 'trip_distance', 'FLOAT', 5, FALSE),
(6, 1, 'pickup_longitude', 'FLOAT', 6, FALSE),
(7, 1, 'pickup_latitude', 'FLOAT', 7, FALSE),
(8, 1, 'rate_code', 'INTEGER', 8, FALSE),
(9, 1, 'payment_type', 'INTEGER', 9, FALSE),
(10, 1, 'fare_amount', 'FLOAT', 10, FALSE),
(11, 1, 'extra', 'FLOAT', 11, FALSE),
(12, 1, 'mta_tax', 'FLOAT', 12, FALSE),
(13, 1, 'tip_amount', 'FLOAT', 13, FALSE),
(14, 1, 'tolls_amount', 'FLOAT', 14, FALSE),
(15, 1, 'total_amount', 'FLOAT', 15, FALSE)
ON CONFLICT (dataset_id, column_name) DO NOTHING;
