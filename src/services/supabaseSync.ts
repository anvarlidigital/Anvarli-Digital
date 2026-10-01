/**
 * Trim & Twisted - Supabase Real-Time Sync Service
 * Project ID: kvuwagkynvucrwyregxe
 * Supabase Table Viewer Integration
 */

import type { BookingItem, UserProfile, ServiceItem, StaffItem } from '../types';

export const SUPABASE_CONFIG = {
  projectId: 'kvuwagkynvucrwyregxe',
  url: 'https://kvuwagkynvucrwyregxe.supabase.co',
  apiKey: 'sb_publishable_P_y1N_OBaMy_pAsfQaOgyg_DBLwjrHS',
  tableViewerUrl: 'https://supabase.com/dashboard/project/kvuwagkynvucrwyregxe/editor',
};

// Retrieve active URL and API key (supports user custom override via localStorage)
export function getActiveSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('tt_supabase_url');
    const customKey = localStorage.getItem('tt_supabase_key');
    return {
      url: (customUrl && customUrl.trim()) || SUPABASE_CONFIG.url,
      apiKey: (customKey && customKey.trim()) || SUPABASE_CONFIG.apiKey,
    };
  }
  return {
    url: SUPABASE_CONFIG.url,
    apiKey: SUPABASE_CONFIG.apiKey,
  };
}

/**
 * Format booking payload for Supabase PostgreSQL schema
 */
export function formatBookingForSupabase(b: BookingItem) {
  return {
    id: b.id || b.bookingId,
    booking_id: b.bookingId,
    user_id: b.userId || null,
    customer_name: b.customerName,
    customer_phone: b.customerPhone,
    customer_email: b.customerEmail || null,
    date: b.date,
    slot: b.slot,
    slot_key: b.slotKey || `${b.date}_${b.slot}`,
    pool_type: b.poolType || 'haircut',
    service_ids: b.serviceIds || [],
    services: b.services || [],
    stylist_id: b.stylistId || null,
    stylist_name: b.stylistName || null,
    subtotal: Number(b.subtotal) || 0,
    discount: Number(b.discount) || 0,
    total_amount: Number(b.totalAmount) || 0,
    coupon_code: b.couponCode || null,
    status: b.status || 'Confirmed',
    notes: b.notes || null,
    history: b.history || [],
    sms_consent: b.smsConsent !== false,
    sms_status: b.smsStatus || 'Pending',
    sms_sid: b.smsSid || null,
    sms_error: b.smsError || null,
    sms_sent_at: b.smsSentAt || null,
    notification_status: b.notificationStatus || b.smsStatus || 'Pending',
    created_at: b.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Format user payload for Supabase PostgreSQL schema
 */
export function formatUserForSupabase(u: UserProfile) {
  return {
    uid: u.uid,
    name: u.name || 'Salon Guest',
    email: u.email || null,
    phone: u.phone || null,
    photo_url: u.photoURL || null,
    loyalty_points: Number(u.loyaltyPoints) || 0,
    referral_code: u.referralCode || null,
    referred_by: u.referredBy || null,
    phone_verified: !!u.phoneVerified,
    role: u.role || 'customer',
    is_admin: !!(u.isAdmin || u.role === 'admin'),
    notes: u.notes || null,
    created_at: u.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Format service payload for Supabase PostgreSQL schema
 */
export function formatServiceForSupabase(s: ServiceItem) {
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    price: s.price !== null ? Number(s.price) : null,
    price_label: s.priceLabel || null,
    offer_price: s.offerPrice !== undefined ? Number(s.offerPrice) : null,
    note: s.note || null,
    image: s.image || null,
    is_haircut: !!s.isHaircut,
    active: s.active !== false,
    sort_order: Number(s.sortOrder) || 0,
    created_at: new Date().toISOString(),
  };
}

/**
 * Format staff payload for Supabase PostgreSQL schema
 */
export function formatStaffForSupabase(st: StaffItem) {
  return {
    id: st.id,
    name: st.name,
    phone: st.phone || null,
    role: st.role,
    salary: Number(st.salary) || 0,
    status: st.status || 'Active',
    photo_url: st.photoURL || null,
    date_joined: st.dateJoined || null,
    total_paid: Number(st.totalPaid) || 0,
    created_at: new Date().toISOString(),
  };
}

/**
 * Synchronize a single booking to Supabase REST API (Upsert)
 */
export async function syncBookingToSupabase(booking: BookingItem): Promise<{ success: boolean; error?: string }> {
  const { url, apiKey } = getActiveSupabaseCredentials();
  if (!url || !apiKey) return { success: false, error: 'Missing credentials' };

  try {
    const payload = formatBookingForSupabase(booking);
    const endpoint = `${url.replace(/\/+$/, '')}/rest/v1/bookings`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Supabase booking sync response:', res.status, errText);
      return { success: false, error: `HTTP ${res.status}: ${errText}` };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Supabase booking sync error:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Synchronize a user profile to Supabase REST API (Upsert)
 */
export async function syncUserToSupabase(user: UserProfile): Promise<{ success: boolean; error?: string }> {
  const { url, apiKey } = getActiveSupabaseCredentials();
  if (!url || !apiKey) return { success: false, error: 'Missing credentials' };

  try {
    const payload = formatUserForSupabase(user);
    const endpoint = `${url.replace(/\/+$/, '')}/rest/v1/users`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Supabase user sync response:', res.status, errText);
      return { success: false, error: `HTTP ${res.status}: ${errText}` };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Supabase user sync error:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Batch synchronize all existing collections to Supabase
 */
export async function syncAllToSupabase(data: {
  bookings: BookingItem[];
  users: UserProfile[];
  services: ServiceItem[];
  staff: StaffItem[];
}): Promise<{
  success: boolean;
  syncedBookings: number;
  syncedUsers: number;
  syncedServices: number;
  syncedStaff: number;
  errors: string[];
}> {
  const { url, apiKey } = getActiveSupabaseCredentials();
  const errors: string[] = [];
  let syncedBookings = 0;
  let syncedUsers = 0;
  let syncedServices = 0;
  let syncedStaff = 0;

  if (!url || !apiKey) {
    return {
      success: false,
      syncedBookings: 0,
      syncedUsers: 0,
      syncedServices: 0,
      syncedStaff: 0,
      errors: ['Missing Supabase URL or API Key'],
    };
  }

  const baseHeaders = {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates',
  };
  const cleanUrl = url.replace(/\/+$/, '');

  // 1. Sync Users first (for foreign key integrity)
  if (data.users.length > 0) {
    try {
      const formatted = data.users.map(formatUserForSupabase);
      const res = await fetch(`${cleanUrl}/rest/v1/users`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify(formatted),
      });
      if (res.ok) {
        syncedUsers = formatted.length;
      } else {
        const t = await res.text();
        errors.push(`Users table sync: ${res.status} - ${t}`);
      }
    } catch (e: any) {
      errors.push(`Users table error: ${e?.message}`);
    }
  }

  // 2. Sync Services
  if (data.services.length > 0) {
    try {
      const formatted = data.services.map(formatServiceForSupabase);
      const res = await fetch(`${cleanUrl}/rest/v1/services`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify(formatted),
      });
      if (res.ok) {
        syncedServices = formatted.length;
      } else {
        const t = await res.text();
        errors.push(`Services table sync: ${res.status} - ${t}`);
      }
    } catch (e: any) {
      errors.push(`Services table error: ${e?.message}`);
    }
  }

  // 3. Sync Staff
  if (data.staff.length > 0) {
    try {
      const formatted = data.staff.map(formatStaffForSupabase);
      const res = await fetch(`${cleanUrl}/rest/v1/staff`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify(formatted),
      });
      if (res.ok) {
        syncedStaff = formatted.length;
      } else {
        const t = await res.text();
        errors.push(`Staff table sync: ${res.status} - ${t}`);
      }
    } catch (e: any) {
      errors.push(`Staff table error: ${e?.message}`);
    }
  }

  // 4. Sync Bookings
  if (data.bookings.length > 0) {
    try {
      const formatted = data.bookings.map(formatBookingForSupabase);
      const res = await fetch(`${cleanUrl}/rest/v1/bookings`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify(formatted),
      });
      if (res.ok) {
        syncedBookings = formatted.length;
      } else {
        const t = await res.text();
        errors.push(`Bookings table sync: ${res.status} - ${t}`);
      }
    } catch (e: any) {
      errors.push(`Bookings table error: ${e?.message}`);
    }
  }

  return {
    success: errors.length === 0,
    syncedBookings,
    syncedUsers,
    syncedServices,
    syncedStaff,
    errors,
  };
}

/**
 * Ping Supabase API to check table accessibility
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  status: number;
  message: string;
  hasBookingsTable?: boolean;
  hasUsersTable?: boolean;
}> {
  const { url, apiKey } = getActiveSupabaseCredentials();
  if (!url || !apiKey) {
    return { connected: false, status: 0, message: 'URL and API Key required' };
  }

  const cleanUrl = url.replace(/\/+$/, '');
  const headers = {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
  };

  try {
    // Check root REST
    const pingRes = await fetch(`${cleanUrl}/rest/v1/`, { headers });
    if (!pingRes.ok && pingRes.status !== 200 && pingRes.status !== 401) {
      return { connected: false, status: pingRes.status, message: `Server error: ${pingRes.statusText}` };
    }

    // Check if bookings and users tables are created
    let hasBookingsTable = false;
    let hasUsersTable = false;

    try {
      const bRes = await fetch(`${cleanUrl}/rest/v1/bookings?limit=1`, { headers });
      hasBookingsTable = bRes.ok;
    } catch {}

    try {
      const uRes = await fetch(`${cleanUrl}/rest/v1/users?limit=1`, { headers });
      hasUsersTable = uRes.ok;
    } catch {}

    return {
      connected: true,
      status: pingRes.status,
      message: 'Supabase REST Endpoint Connected!',
      hasBookingsTable,
      hasUsersTable,
    };
  } catch (err: any) {
    return {
      connected: false,
      status: 0,
      message: err?.message || 'Network error connecting to Supabase',
    };
  }
}
