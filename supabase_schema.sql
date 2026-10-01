-- =========================================================================
-- TRIM & TWISTED - LUXURY UNISEX SALON
-- SUPABASE POSTGRESQL SCHEMA & TABLE VIEWER CONFIGURATION
-- Project ID: kvuwagkynvucrwyregxe
-- =========================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/kvuwagkynvucrwyregxe/sql/new
-- 2. Paste this entire SQL script into the SQL Editor.
-- 3. Click "RUN".
-- 4. Navigate to "Table Editor" in Supabase: all tables (bookings, users, services, staff, reviews)
--    will be immediately visible, fully editable, and ready to receive real-time synced data!
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. USERS & PATRONS TABLE (public.users)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    uid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    photo_url TEXT,
    loyalty_points INTEGER DEFAULT 100,
    referral_code TEXT,
    referred_by TEXT,
    phone_verified BOOLEAN DEFAULT false,
    role TEXT DEFAULT 'customer',
    is_admin BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast lookups & table filtering
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- -------------------------------------------------------------------------
-- 2. APPOINTMENT BOOKINGS TABLE (public.bookings)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL UNIQUE,
    user_id TEXT REFERENCES public.users(uid) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    date DATE NOT NULL,
    slot TEXT NOT NULL,
    slot_key TEXT,
    pool_type TEXT DEFAULT 'haircut',
    service_ids TEXT[] DEFAULT '{}',
    services JSONB DEFAULT '[]'::jsonb,
    stylist_id TEXT,
    stylist_name TEXT,
    subtotal NUMERIC(10, 2) DEFAULT 0,
    discount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    coupon_code TEXT,
    status TEXT DEFAULT 'Confirmed',
    notes TEXT,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for quick querying in Supabase Table Viewer
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON public.bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- -------------------------------------------------------------------------
-- 3. SERVICES CATALOG TABLE (public.services)
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(active);

-- -------------------------------------------------------------------------
-- 4. STAFF & STYLISTS TABLE (public.staff)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL,
    salary NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'Active',
    photo_url TEXT,
    date_joined TEXT,
    total_paid NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff(status);

-- -------------------------------------------------------------------------
-- 5. REVIEWS & RATINGS TABLE (public.reviews)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    booking_id TEXT,
    user_id TEXT,
    customer_name TEXT NOT NULL,
    rating_service INTEGER DEFAULT 5,
    rating_staff INTEGER DEFAULT 5,
    rating_value INTEGER DEFAULT 5,
    rating_cleanliness INTEGER DEFAULT 5,
    average_rating NUMERIC(3, 2) DEFAULT 5.0,
    comment TEXT,
    status TEXT DEFAULT 'Approved',
    admin_reply TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- -------------------------------------------------------------------------
-- 6. AUTO-UPDATE TIMESTAMP TRIGGER FUNCTION
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS set_timestamp_users ON public.users;
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_bookings ON public.bookings;
CREATE TRIGGER set_timestamp_bookings
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_services ON public.services;
CREATE TRIGGER set_timestamp_services
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_staff ON public.staff;
CREATE TRIGGER set_timestamp_staff
BEFORE UPDATE ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- Ensures Supabase Table Editor, REST API & Anon Key can seamlessly read/write
-- -------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Grant standard permissions to anon, authenticated, and service_role
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.bookings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.services TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.staff TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.reviews TO anon, authenticated, service_role;

-- Users Table Policies
DROP POLICY IF EXISTS "Allow anon and auth read users" ON public.users;
CREATE POLICY "Allow anon and auth read users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon and auth write users" ON public.users;
CREATE POLICY "Allow anon and auth write users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Bookings Table Policies
DROP POLICY IF EXISTS "Allow anon and auth read bookings" ON public.bookings;
CREATE POLICY "Allow anon and auth read bookings" ON public.bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon and auth write bookings" ON public.bookings;
CREATE POLICY "Allow anon and auth write bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

-- Services Table Policies
DROP POLICY IF EXISTS "Allow anon and auth read services" ON public.services;
CREATE POLICY "Allow anon and auth read services" ON public.services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon and auth write services" ON public.services;
CREATE POLICY "Allow anon and auth write services" ON public.services FOR ALL USING (true) WITH CHECK (true);

-- Staff Table Policies
DROP POLICY IF EXISTS "Allow anon and auth read staff" ON public.staff;
CREATE POLICY "Allow anon and auth read staff" ON public.staff FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon and auth write staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);

-- Reviews Table Policies
DROP POLICY IF EXISTS "Allow anon and auth read reviews" ON public.reviews;
CREATE POLICY "Allow anon and auth read reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon and auth write reviews" ON public.reviews;
CREATE POLICY "Allow anon and auth write reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 8. INITIAL CORE DATA SEED (Trim & Twisted Official Services)
-- -------------------------------------------------------------------------
INSERT INTO public.services (id, name, category, price, price_label, offer_price, is_haircut, active, sort_order)
VALUES
    ('srv_men_haircut', 'Men Royal Haircut & Beard Sculpt', 'Haircuts & Styling', 349, 'Classic Haircut', 299, true, true, 1),
    ('srv_women_haircut', 'Women Layered Style & Blowdry', 'Haircuts & Styling', 599, 'Signature Cut', 499, true, true, 2),
    ('srv_nano_plastia', 'Japanese Nano Plastia Hair Botox', 'Hair Treatments', 3999, 'Starting Price', 2999, false, true, 3),
    ('srv_scalp_spa', 'Herbal Aromatherapy Scalp Spa', 'Spa & Scalp Therapy', 1199, '60 Mins Therapy', 899, false, true, 4),
    ('srv_bridal_glow', 'Haute Bridal D-Tan & Radiance Facial', 'Bridal & Aesthetics', 2499, 'Full Face & Neck', 1899, false, true, 5)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    offer_price = EXCLUDED.offer_price;

-- Output confirmation
DO $$
BEGIN
    RAISE NOTICE 'Trim & Twisted Supabase schema setup completed successfully! Visit the Table Editor to view your tables.';
END $$;
