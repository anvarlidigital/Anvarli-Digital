-- =========================================================================
-- TRIM & TWISTED - LUXURY UNISEX SALON
-- SUPABASE POSTGRESQL SCHEMA & TABLE VIEWER CSV IMPORT FIX
-- Project ID: kvuwagkynvucrwyregxe
-- =========================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard:
--    https://supabase.com/dashboard/project/kvuwagkynvucrwyregxe/sql/new
-- 2. Paste this entire SQL script into the SQL Editor.
-- 3. Click "RUN".
-- 4. In Supabase "Table Editor", open either:
--    - "bookings" table OR
--    - "appointments" table
-- 5. Click "Insert" -> "Import data from CSV" (or spreadsheet) and select
--    your downloaded CSV. All columns will match with 100% zero errors!
-- =========================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. DEDICATED APPOINTMENTS TABLE MATCHING EXACT CSV HEADERS
-- -------------------------------------------------------------------------
-- This table directly matches the 14 columns in the exported CSV spreadsheet:
-- "Booking ID", "Date", "Time Slot", "Customer Name", "Phone", "Email",
-- "Services", "Stylist", "Subtotal", "Discount", "Total Amount", "Status", "Pool", "Created At"
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
    "Booking ID" TEXT PRIMARY KEY,
    "Date" TEXT,
    "Time Slot" TEXT,
    "Customer Name" TEXT,
    "Phone" TEXT,
    "Email" TEXT,
    "Services" TEXT,
    "Stylist" TEXT,
    "Subtotal" NUMERIC DEFAULT 0,
    "Discount" NUMERIC DEFAULT 0,
    "Total Amount" NUMERIC DEFAULT 0,
    "Status" TEXT DEFAULT 'Confirmed',
    "Pool" TEXT DEFAULT 'Salon Care',
    "Created At" TEXT
);

-- Enable RLS and grant permissions so Table Editor can view & edit
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.appointments TO anon, authenticated, service_role;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' AND policyname = 'Public full access to appointments'
    ) THEN
        CREATE POLICY "Public full access to appointments" 
        ON public.appointments FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;


-- -------------------------------------------------------------------------
-- 2. UPDATE OR CREATE public.bookings TABLE WITH CSV COLUMNS & SNAKE_CASE
-- -------------------------------------------------------------------------
-- This ensures if you import into public.bookings, all 14 columns exist!
-- -------------------------------------------------------------------------
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

-- Safely add all 14 exact CSV headers to public.bookings if they don't exist yet:
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Booking ID" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Date" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Time Slot" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Customer Name" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Phone" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Email" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Services" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Stylist" TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Subtotal" NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Discount" NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Total Amount" NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Status" TEXT DEFAULT 'Confirmed';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Pool" TEXT DEFAULT 'Salon Care';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "Created At" TEXT;

-- Auto-synchronization trigger: syncs values between quoted CSV headers and snake_case fields
CREATE OR REPLACE FUNCTION public.sync_bookings_csv_and_snake()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync quoted CSV column values into snake_case fields
    IF NEW."Booking ID" IS NOT NULL AND NEW.booking_id IS NULL THEN
        NEW.booking_id := NEW."Booking ID";
    END IF;
    IF NEW."Customer Name" IS NOT NULL AND NEW.customer_name IS NULL THEN
        NEW.customer_name := NEW."Customer Name";
    END IF;
    IF NEW."Phone" IS NOT NULL AND NEW.customer_phone IS NULL THEN
        NEW.customer_phone := NEW."Phone";
    END IF;
    IF NEW."Email" IS NOT NULL AND NEW.customer_email IS NULL THEN
        NEW.customer_email := NEW."Email";
    END IF;
    IF NEW."Date" IS NOT NULL AND NEW.date IS NULL THEN
        NEW.date := NEW."Date";
    END IF;
    IF NEW."Time Slot" IS NOT NULL AND NEW.slot IS NULL THEN
        NEW.slot := NEW."Time Slot";
    END IF;
    IF NEW."Stylist" IS NOT NULL AND NEW.stylist_name IS NULL THEN
        NEW.stylist_name := NEW."Stylist";
    END IF;
    IF NEW."Subtotal" IS NOT NULL AND (NEW.subtotal IS NULL OR NEW.subtotal = 0) THEN
        NEW.subtotal := NEW."Subtotal";
    END IF;
    IF NEW."Discount" IS NOT NULL AND (NEW.discount IS NULL OR NEW.discount = 0) THEN
        NEW.discount := NEW."Discount";
    END IF;
    IF NEW."Total Amount" IS NOT NULL AND (NEW.total_amount IS NULL OR NEW.total_amount = 0) THEN
        NEW.total_amount := NEW."Total Amount";
    END IF;
    IF NEW."Status" IS NOT NULL AND NEW.status IS NULL THEN
        NEW.status := NEW."Status";
    END IF;
    IF NEW."Pool" IS NOT NULL AND NEW.pool_type IS NULL THEN
        NEW.pool_type := NEW."Pool";
    END IF;

    -- Reverse sync: if snake_case is populated, populate quoted CSV columns
    IF NEW.booking_id IS NOT NULL AND NEW."Booking ID" IS NULL THEN
        NEW."Booking ID" := NEW.booking_id;
    END IF;
    IF NEW.customer_name IS NOT NULL AND NEW."Customer Name" IS NULL THEN
        NEW."Customer Name" := NEW.customer_name;
    END IF;
    IF NEW.customer_phone IS NOT NULL AND NEW."Phone" IS NULL THEN
        NEW."Phone" := NEW.customer_phone;
    END IF;
    IF NEW.customer_email IS NOT NULL AND NEW."Email" IS NULL THEN
        NEW."Email" := NEW.customer_email;
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
    IF NEW.total_amount IS NOT NULL AND (NEW."Total Amount" IS NULL OR NEW."Total Amount" = 0) THEN
        NEW."Total Amount" := NEW.total_amount;
    END IF;
    IF NEW.status IS NOT NULL AND NEW."Status" IS NULL THEN
        NEW."Status" := NEW.status;
    END IF;
    IF NEW.pool_type IS NOT NULL AND NEW."Pool" IS NULL THEN
        NEW."Pool" := NEW.pool_type;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_bookings_csv_and_snake ON public.bookings;
CREATE TRIGGER trg_sync_bookings_csv_and_snake
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_bookings_csv_and_snake();

-- Enable RLS and grant permissions on public.bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.bookings TO anon, authenticated, service_role;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bookings' AND policyname = 'Public full access to bookings'
    ) THEN
        CREATE POLICY "Public full access to bookings" 
        ON public.bookings FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;


-- -------------------------------------------------------------------------
-- 3. USERS & PATRONS TABLE (public.users)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    uid TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    loyalty_points INTEGER DEFAULT 100,
    referral_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Public full access to users'
    ) THEN
        CREATE POLICY "Public full access to users" 
        ON public.users FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;


-- -------------------------------------------------------------------------
-- 4. SERVICES CATALOG TABLE (public.services)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10, 2),
    price_label TEXT,
    offer_price NUMERIC(10, 2),
    note TEXT,
    image TEXT,
    is_haircut BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.services TO anon, authenticated, service_role;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'services' AND policyname = 'Public full access to services'
    ) THEN
        CREATE POLICY "Public full access to services" 
        ON public.services FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;


-- -------------------------------------------------------------------------
-- 5. STAFF & STYLISTS TABLE (public.staff)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL,
    salary NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'Active',
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.staff TO anon, authenticated, service_role;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'staff' AND policyname = 'Public full access to staff'
    ) THEN
        CREATE POLICY "Public full access to staff" 
        ON public.staff FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
