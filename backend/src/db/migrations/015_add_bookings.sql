-- Up
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    contractor_id INTEGER REFERENCES contractors(id) ON DELETE CASCADE,
    service_category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'UNPAID', -- UNPAID, IN_ESCROW, RELEASED, REFUNDED
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_signature VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'CREATED', -- CREATED, SUCCESS, FAILED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_contractor ON bookings(contractor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Down
DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_bookings_contractor;
DROP INDEX IF EXISTS idx_bookings_customer;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
