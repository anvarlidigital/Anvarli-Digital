-- =========================================================================
-- TRIM & TWISTED - LUXURY UNISEX SALON
-- SUPABASE POSTGRESQL SCHEMA FOR CSV IMPORT & TABLE VIEWER
-- =========================================================================
-- This script creates the exact tables and columns required to import your
-- exported bookings spreadsheet into Supabase Table Editor with ZERO errors.
--
-- Supported CSV Headers:
-- "Booking ID", "Date", "Time Slot", "Customer Name", "Phone", "Email",
-- "Services", "Stylist", "Subtotal", "Discount", "Total Amount", "Status", "Pool", "Created At"
--
-- HOW TO USE IN SUPABASE:
-- 1. Open your Supabase Dashboard -> Project -> SQL Editor
--    (https://supabase.com/dashboard/project/_/sql/new)
-- 2. Paste this entire script into the editor and click "RUN" (green button).
-- 3. Go to "Table Editor" in Supabase left sidebar.
-- 4. Click on either "appointments" OR "bookings".
-- 5. Click "Insert" -> "Import data from CSV".
-- 6. Select your exported CSV file. It will import with 100% success!
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- TABLE 1: public.appointments (EXACT MATCH FOR EXPORTED CSV SPREADSHEET)
-- =========================================================================
-- All columns use TEXT for safe CSV parsing, preventing numeric or date casting
-- errors when importing via the Supabase Web UI Table Editor.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    "Booking ID" TEXT PRIMARY KEY,
    "Date" TEXT,
    "Time Slot" TEXT,
    "Customer Name" TEXT,
    "Phone" TEXT,
    "Email" TEXT,
    "Services" TEXT,
    "Stylist" TEXT,
    "Subtotal" TEXT DEFAULT '0',
    "Discount" TEXT DEFAULT '0',
    "Total Amount" TEXT DEFAULT '0',
    "Status" TEXT DEFAULT 'Confirmed',
    "Pool" TEXT DEFAULT 'Salon Care',
    "Created At" TEXT,
    imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & Grant full access
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.appointments TO anon, authenticated, service_role;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' AND policyname = 'Public access to appointments'
    ) THEN
        CREATE POLICY "Public access to appointments" 
        ON public.appointments FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;


-- =========================================================================
-- TABLE 2: public.bookings (CANONICAL BOOKINGS TABLE)
-- =========================================================================
-- Also includes all 14 CSV headers as columns so you can import your CSV
-- directly into "bookings" as well!
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    booking_id TEXT UNIQUE,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    date TEXT,
    slot TEXT,
    stylist_name TEXT,
    subtotal NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Confirmed',
    pool_type TEXT DEFAULT 'other',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely ensure all 14 exact CSV headers exist in public.bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Booking ID" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Date" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Time Slot" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Customer Name" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Phone" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Email" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Services" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Stylist" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Subtotal" TEXT DEFAULT '0';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Discount" TEXT DEFAULT '0';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Total Amount" TEXT DEFAULT '0';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Status" TEXT DEFAULT 'Confirmed';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Pool" TEXT DEFAULT 'Salon Care';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Created At" TEXT;

-- Enable Row Level Security (RLS) & Grant full access
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.bookings TO anon, authenticated, service_role;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bookings' AND policyname = 'Public access to bookings'
    ) THEN
        CREATE POLICY "Public access to bookings" 
        ON public.bookings FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- =========================================================================
-- AUTO-SYNC TRIGGER BETWEEN CSV HEADERS AND SNAKE_CASE COLUMNS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.sync_bookings_csv_and_snake()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchronize quoted CSV columns into snake_case fields
    IF NEW."Booking ID" IS NOT NULL AND (NEW.booking_id IS NULL OR NEW.booking_id = '') THEN
        NEW.booking_id := NEW."Booking ID";
    END IF;
    IF NEW."Customer Name" IS NOT NULL AND (NEW.customer_name IS NULL OR NEW.customer_name = '') THEN
        NEW.customer_name := NEW."Customer Name";
    END IF;
    IF NEW."Phone" IS NOT NULL AND (NEW.customer_phone IS NULL OR NEW.customer_phone = '') THEN
        NEW.customer_phone := NEW."Phone";
    END IF;
    IF NEW."Email" IS NOT NULL AND (NEW.customer_email IS NULL OR NEW.customer_email = '') THEN
        NEW.customer_email := NEW."Email";
    END IF;
    IF NEW."Date" IS NOT NULL AND (NEW.date IS NULL OR NEW.date = '') THEN
        NEW.date := NEW."Date";
    END IF;
    IF NEW."Time Slot" IS NOT NULL AND (NEW.slot IS NULL OR NEW.slot = '') THEN
        NEW.slot := NEW."Time Slot";
    END IF;
    IF NEW."Stylist" IS NOT NULL AND (NEW.stylist_name IS NULL OR NEW.stylist_name = '') THEN
        NEW.stylist_name := NEW."Stylist";
    END IF;
    IF NEW."Total Amount" IS NOT NULL AND (NEW.total_amount IS NULL OR NEW.total_amount = 0) THEN
        BEGIN
            NEW.total_amount := regexp_replace(NEW."Total Amount", '[^0-9.]', '', 'g')::NUMERIC;
        EXCEPTION WHEN OTHERS THEN
            NEW.total_amount := 0;
        END;
    END IF;
    IF NEW."Subtotal" IS NOT NULL AND (NEW.subtotal IS NULL OR NEW.subtotal = 0) THEN
        BEGIN
            NEW.subtotal := regexp_replace(NEW."Subtotal", '[^0-9.]', '', 'g')::NUMERIC;
        EXCEPTION WHEN OTHERS THEN
            NEW.subtotal := 0;
        END;
    END IF;
    IF NEW."Discount" IS NOT NULL AND (NEW.discount IS NULL OR NEW.discount = 0) THEN
        BEGIN
            NEW.discount := regexp_replace(NEW."Discount", '[^0-9.]', '', 'g')::NUMERIC;
        EXCEPTION WHEN OTHERS THEN
            NEW.discount := 0;
        END;
    END IF;
    IF NEW."Status" IS NOT NULL AND (NEW.status IS NULL OR NEW.status = '') THEN
        NEW.status := NEW."Status";
    END IF;
    IF NEW."Pool" IS NOT NULL AND (NEW.pool_type IS NULL OR NEW.pool_type = '') THEN
        NEW.pool_type := NEW."Pool";
    END IF;

    -- Reverse sync: if snake_case is filled, fill quoted headers
    IF NEW.booking_id IS NOT NULL AND NEW."Booking ID" IS NULL THEN
        NEW."Booking ID" := NEW.booking_id;
    END IF;
    IF NEW.customer_name IS NOT NULL AND NEW."Customer Name" IS NULL THEN
        NEW."Customer Name" := NEW.customer_name;
    END IF;
    IF NEW.customer_phone IS NOT NULL AND NEW."Phone" IS NULL THEN
        NEW."Phone" := NEW.customer_phone;
    END IF;
    IF NEW.date IS NOT NULL AND NEW."Date" IS NULL THEN
        NEW."Date" := NEW.date;
    END IF;
    IF NEW.slot IS NOT NULL AND NEW."Time Slot" IS NULL THEN
        NEW."Time Slot" := NEW.slot;
    END IF;
    IF NEW.stylist_name IS NOT NULL AND NEW."Stylist" IS NULL THEN
        NEW."Stylist" := NEW.stylist_name;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_bookings_csv_and_snake ON public.bookings;
CREATE TRIGGER trg_sync_bookings_csv_and_snake
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_bookings_csv_and_snake();


-- =========================================================================
-- HELPER VIEWS & VERIFICATION
-- =========================================================================
-- You can query this view to see all appointments in a single clean format:
CREATE OR REPLACE VIEW public.v_all_bookings AS
SELECT 
    "Booking ID" AS booking_id,
    "Date" AS appointment_date,
    "Time Slot" AS appointment_slot,
    "Customer Name" AS customer_name,
    "Phone" AS customer_phone,
    "Email" AS customer_email,
    "Services" AS services,
    "Stylist" AS stylist,
    "Total Amount" AS total_amount,
    "Status" AS status,
    "Pool" AS pool,
    "Created At" AS booked_on
FROM public.appointments
UNION ALL
SELECT 
    COALESCE("Booking ID", booking_id) AS booking_id,
    COALESCE("Date", date) AS appointment_date,
    COALESCE("Time Slot", slot) AS appointment_slot,
    COALESCE("Customer Name", customer_name) AS customer_name,
    COALESCE("Phone", customer_phone) AS customer_phone,
    COALESCE("Email", customer_email) AS customer_email,
    "Services" AS services,
    COALESCE("Stylist", stylist_name) AS stylist,
    COALESCE("Total Amount", total_amount::text) AS total_amount,
    COALESCE("Status", status) AS status,
    COALESCE("Pool", pool_type) AS pool,
    COALESCE("Created At", created_at::text) AS booked_on
FROM public.bookings
WHERE "Booking ID" IS NOT NULL OR booking_id IS NOT NULL;

-- Permissions for the view
GRANT SELECT ON public.v_all_bookings TO anon, authenticated, service_role;
