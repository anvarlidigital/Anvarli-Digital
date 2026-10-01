import type { Request, Response } from 'express';
import twilio from 'twilio';

// =========================================================================
// IN-MEMORY CACHE & RATE LIMITING INFRASTRUCTURE
// =========================================================================
// Deduplication cache: prevents duplicate SMS notifications for the same booking event
// Key: `${bookingId}_${messageType}_${normalizedPhone}` -> timestamp (ms)
const dedupCache = new Map<string, number>();
const DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes deduplication window

// Rate limiter: limits SMS requests per IP and per destination phone number
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const ipRateLimits = new Map<string, RateLimitBucket>();
const phoneRateLimits = new Map<string, RateLimitBucket>();

const IP_MAX_REQUESTS = 25; // 25 requests per 10 minutes per IP
const PHONE_MAX_SMS = 4; // 4 SMS per 10 minutes per phone number
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, timestamp] of dedupCache.entries()) {
    if (now - timestamp > DEDUP_WINDOW_MS) {
      dedupCache.delete(key);
    }
  }
  for (const [key, bucket] of ipRateLimits.entries()) {
    if (now > bucket.resetAt) {
      ipRateLimits.delete(key);
    }
  }
  for (const [key, bucket] of phoneRateLimits.entries()) {
    if (now > bucket.resetAt) {
      phoneRateLimits.delete(key);
    }
  }
}

// Periodically clean up memory every 5 minutes
setInterval(cleanupOldEntries, 5 * 60 * 1000).unref();

/**
 * Validate and normalize phone numbers into strict E.164 format (+[country][number])
 */
function normalizeToE164(rawPhone: string): { valid: boolean; formatted: string; reason?: string } {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { valid: false, formatted: '', reason: 'Phone number is required' };
  }

  // Remove whitespace, hyphens, parentheses, dots
  let cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, '').trim();

  // If no leading '+' and has 10 digits (standard Indian mobile e.g. 9647345945), prepend +91
  if (!cleaned.startsWith('+')) {
    if (/^[6-9]\d{9}$/.test(cleaned)) {
      cleaned = `+91${cleaned}`;
    } else if (/^0[6-9]\d{9}$/.test(cleaned)) {
      cleaned = `+91${cleaned.slice(1)}`;
    } else {
      cleaned = `+${cleaned}`;
    }
  }

  // E.164 validation regex: + followed by 7 to 15 digits
  const e164Regex = /^\+[1-9]\d{7,14}$/;
  if (!e164Regex.test(cleaned)) {
    return {
      valid: false,
      formatted: cleaned,
      reason: `Phone number ${cleaned} does not conform to E.164 format (+[country code][number], 8-15 digits)`
    };
  }

  return { valid: true, formatted: cleaned };
}

/**
 * Mask phone number for secure logging (e.g. +91*****45945)
 */
function maskPhoneNumber(phone: string): string {
  if (phone.length <= 6) return phone;
  const start = phone.slice(0, 4);
  const end = phone.slice(-4);
  return `${start}*****${end}`;
}

/**
 * Fetch booking details from Supabase using REST API
 */
async function fetchBookingFromSupabase(bookingId: string): Promise<any | null> {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://kvuwagkynvucrwyregxe.supabase.co';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'sb_publishable_P_y1N_OBaMy_pAsfQaOgyg_DBLwjrHS';

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Twilio SMS] Supabase credentials not found in env, skipping DB lookup');
    return null;
  }

  const cleanUrl = supabaseUrl.replace(/\/+$/, '');
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Try querying public.bookings
    const bookingsEndpoint = `${cleanUrl}/rest/v1/bookings?select=*&or=(booking_id.eq.${encodeURIComponent(
      bookingId
    )},id.eq.${encodeURIComponent(bookingId)})&limit=1`;
    const res = await fetch(bookingsEndpoint, { headers });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const b = data[0];
        let servicesStr = '';
        if (Array.isArray(b.services)) {
          servicesStr = b.services.map((s: any) => typeof s === 'string' ? s : s?.name || '').filter(Boolean).join(', ');
        } else if (typeof b.services === 'string') {
          servicesStr = b.services;
        } else if (b['Services']) {
          servicesStr = String(b['Services']);
        }

        return {
          bookingId: b.booking_id || b.id || bookingId,
          customerName: b.customer_name || b['Customer Name'] || 'Valued Guest',
          customerPhone: b.customer_phone || b['Phone'] || '',
          date: b.date || b['Date'] || '',
          slot: b.slot || b['Time Slot'] || '',
          services: servicesStr,
          stylist: b.stylist_name || b['Stylist'] || 'Assigned Stylist',
          totalAmount: b.total_amount || b['Total Amount'] || 0,
          status: b.status || b['Status'] || 'Confirmed',
          sms_status: b.sms_status || null,
          sms_sid: b.sms_sid || null
        };
      }
    }

    // 2. Try querying public.appointments
    const appointmentsEndpoint = `${cleanUrl}/rest/v1/appointments?select=*&Booking%20ID=eq.${encodeURIComponent(
      bookingId
    )}&limit=1`;
    const resAppt = await fetch(appointmentsEndpoint, { headers });

    if (resAppt.ok) {
      const dataAppt = await resAppt.json();
      if (Array.isArray(dataAppt) && dataAppt.length > 0) {
        const a = dataAppt[0];
        return {
          bookingId: a['Booking ID'] || bookingId,
          customerName: a['Customer Name'] || 'Valued Guest',
          customerPhone: a['Phone'] || '',
          date: a['Date'] || '',
          slot: a['Time Slot'] || '',
          services: a['Services'] || '',
          stylist: a['Stylist'] || 'Assigned Stylist',
          totalAmount: a['Total Amount'] || 0,
          status: a['Status'] || 'Confirmed',
          sms_status: a.sms_status || null,
          sms_sid: a.sms_sid || null
        };
      }
    }
  } catch (err: any) {
    console.error('[Twilio SMS] Supabase fetch error:', err?.message || err);
  }

  return null;
}

/**
 * Record SMS notification status and Twilio SID in Supabase
 */
async function updateSupabaseSmsStatus(
  bookingId: string,
  status: 'Sent' | 'Failed' | 'Opted-Out',
  sid?: string,
  error?: string
) {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://kvuwagkynvucrwyregxe.supabase.co';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'sb_publishable_P_y1N_OBaMy_pAsfQaOgyg_DBLwjrHS';

  if (!supabaseUrl || !supabaseKey) return;

  const cleanUrl = supabaseUrl.replace(/\/+$/, '');
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  try {
    const payload = {
      sms_status: status,
      sms_sid: sid || null,
      sms_error: error || null,
      sms_sent_at: new Date().toISOString(),
      notification_status: status === 'Sent' ? 'Delivered' : (error ? `Failed: ${error}` : 'Failed'),
      updated_at: new Date().toISOString()
    };

    await fetch(
      `${cleanUrl}/rest/v1/bookings?or=(booking_id.eq.${encodeURIComponent(
        bookingId
      )},id.eq.${encodeURIComponent(bookingId)})`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload)
      }
    );
  } catch (e: any) {
    console.warn('[Twilio SMS] Note updating Supabase with notification status:', e?.message || e);
  }
}

/**
 * Generate SMS text content based on notification type and booking data
 */
function generateSmsContent(
  messageType: 'confirmation' | 'cancellation' | 'reminder' | 'test',
  booking: {
    bookingId: string;
    customerName: string;
    date: string;
    slot: string;
    services?: string;
    stylist?: string;
    totalAmount?: number | string;
  },
  customNote?: string
): string {
  const name = booking.customerName || 'Guest';
  const id = booking.bookingId;
  const date = booking.date || 'your scheduled date';
  const slot = booking.slot || 'scheduled time';
  const services = booking.services ? ` for ${booking.services}` : '';
  const stylist = booking.stylist && booking.stylist !== 'Any' ? ` with ${booking.stylist}` : '';
  const amount = booking.totalAmount ? ` (Total: ₹${booking.totalAmount})` : '';

  switch (messageType) {
    case 'confirmation':
      return `Trim & Twisted: Hi ${name}, your booking #${id}${services} on ${date} at ${slot}${stylist} is CONFIRMED!${amount} Location: Near Chakdaha Station Road. Queries: +91 96473 45945. Reply STOP to opt out.`;

    case 'cancellation':
      return `Trim & Twisted: Hi ${name}, booking #${id}${services} on ${date} at ${slot} has been CANCELLED as requested. If this was a mistake, call +91 96473 45945 to rebook.`;

    case 'reminder':
      return `Trim & Twisted Reminder: Hi ${name}, your appointment #${id}${services} is scheduled for ${date} at ${slot}${stylist}. Location: Near Chakdaha Station Rd. Helpline: +91 96473 45945.`;

    case 'test':
      return customNote || `Trim & Twisted [TEST]: Twilio SMS Gateway is active & connected! Sent to ${name} at ${new Date().toLocaleTimeString('en-IN')}.`;

    default:
      return `Trim & Twisted: Update for booking #${id}${services} on ${date} at ${slot}. Call +91 96473 45945 for assistance.`;
  }
}

/**
 * Main Server-Side Handler for /api/send-sms
 * Supports both Vercel Serverless Function and Express server
 */
export default async function handler(req: Request | any, res: Response | any) {
  const requestStartTime = Date.now();

  // Enable CORS headers for preview and frontend communication
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Use POST.',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    const { phoneNumber, messageType, bookingId, customNote, clientDetails } = req.body || {};

    // 1. Validate payload basics
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: phoneNumber',
        code: 'MISSING_PHONE_NUMBER'
      });
    }

    if (!messageType || !['confirmation', 'cancellation', 'reminder', 'test'].includes(messageType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid messageType. Must be one of: confirmation, cancellation, reminder, test',
        code: 'INVALID_MESSAGE_TYPE'
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: bookingId',
        code: 'MISSING_BOOKING_ID'
      });
    }

    // 2. Validate E.164 phone format
    const phoneCheck = normalizeToE164(phoneNumber);
    if (!phoneCheck.valid) {
      return res.status(400).json({
        success: false,
        error: phoneCheck.reason,
        code: 'INVALID_E164_PHONE'
      });
    }
    const normalizedPhone = phoneCheck.formatted;

    // 3. Client Rate Limiting
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown-ip';

    const now = Date.now();

    // Check IP rate limit
    let ipBucket = ipRateLimits.get(clientIp);
    if (!ipBucket || now > ipBucket.resetAt) {
      ipBucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
      ipRateLimits.set(clientIp, ipBucket);
    }
    ipBucket.count += 1;
    if (ipBucket.count > IP_MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded for this IP. Please wait a few minutes.',
        code: 'IP_RATE_LIMIT_EXCEEDED'
      });
    }

    // Check Phone rate limit
    let phoneBucket = phoneRateLimits.get(normalizedPhone);
    if (!phoneBucket || now > phoneBucket.resetAt) {
      phoneBucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
      phoneRateLimits.set(normalizedPhone, phoneBucket);
    }
    phoneBucket.count += 1;
    if (phoneBucket.count > PHONE_MAX_SMS) {
      return res.status(429).json({
        success: false,
        error: `Rate limit exceeded for recipient phone ${maskPhoneNumber(
          normalizedPhone
        )}. Maximum ${PHONE_MAX_SMS} SMS per 10 minutes.`,
        code: 'PHONE_RATE_LIMIT_EXCEEDED'
      });
    }

    // 4. Duplicate prevention for same booking event
    const dedupKey = `${bookingId}_${messageType}_${normalizedPhone}`;
    const previousSentTime = dedupCache.get(dedupKey);
    if (previousSentTime && now - previousSentTime < DEDUP_WINDOW_MS) {
      const minutesAgo = Math.round((now - previousSentTime) / 60000);
      console.log(
        `[Twilio SMS] [DEDUP] Duplicate suppressed for ${dedupKey} (sent ${minutesAgo}m ago)`
      );
      return res.status(200).json({
        success: true,
        message: `SMS notification for booking #${bookingId} (${messageType}) was already sent recently.`,
        duplicate: true,
        bookingId,
        messageType,
        recipient: maskPhoneNumber(normalizedPhone)
      });
    }

    // 5. Database lookup & Booking verification (Supabase)
    const booking = await fetchBookingFromSupabase(bookingId);

    // Prevent duplicate confirmation SMS if Supabase already records it as sent
    if (booking && booking.sms_status === 'Sent' && booking.sms_sid && messageType === 'confirmation') {
      console.log(
        `[Twilio SMS] [DEDUP] SMS already previously dispatched for booking #${bookingId} (SID: ${booking.sms_sid})`
      );
      return res.status(200).json({
        success: true,
        message: `SMS notification for booking #${bookingId} was already sent.`,
        duplicate: true,
        bookingId,
        messageType,
        sid: booking.sms_sid,
        status: 'delivered',
        recipient: maskPhoneNumber(normalizedPhone)
      });
    }

    // If booking was not in Supabase yet (or during instant optimistic client dispatch),
    // allow clientDetails if provided, or verify phone format
    const effectiveBooking = booking || {
      bookingId,
      customerName: clientDetails?.customerName || 'Valued Guest',
      customerPhone: clientDetails?.customerPhone || normalizedPhone,
      date: clientDetails?.date || 'Scheduled Date',
      slot: clientDetails?.slot || 'Booked Slot',
      services: clientDetails?.services || '',
      stylist: clientDetails?.stylistName || 'Salon Stylist',
      totalAmount: clientDetails?.totalAmount || 0,
      status: clientDetails?.status || 'Confirmed'
    };

    // Security check: If booking was retrieved from database, ensure the recipient phone
    // matches the customer phone on the booking to prevent arbitrary number exploitation
    if (booking && booking.customerPhone) {
      const bookingPhoneNorm = normalizeToE164(booking.customerPhone);
      if (bookingPhoneNorm.valid && bookingPhoneNorm.formatted !== normalizedPhone) {
        console.warn(
          `[Twilio SMS] [SECURITY] Phone mismatch: requested ${normalizedPhone}, booking has ${bookingPhoneNorm.formatted}`
        );
        return res.status(403).json({
          success: false,
          error: 'Recipient phone number does not match the booking customer phone number.',
          code: 'UNAUTHORIZED_RECIPIENT'
        });
      }
    }

    // 6. Trial Account Safety Restriction Check
    const trialVerifiedNumber =
      process.env.TWILIO_TRIAL_VERIFIED_PHONE || '+919647345945';
    const isTrialMode = process.env.TWILIO_TRIAL_MODE !== 'false';

    if (isTrialMode) {
      const normTrial = normalizeToE164(trialVerifiedNumber);
      if (normTrial.valid && normalizedPhone !== normTrial.formatted) {
        console.warn(
          `[Twilio SMS] [TRIAL RESTRICTION] Blocked send to ${maskPhoneNumber(
            normalizedPhone
          )}. Trial verified phone is ${normTrial.formatted}`
        );
        return res.status(403).json({
          success: false,
          error: `Twilio Trial Account Restriction: During trial testing, SMS can only be sent to your verified Twilio trial phone number (${normTrial.formatted}). To test with other numbers, verify them in your Twilio Console or upgrade your Twilio project.`,
          code: 'TWILIO_TRIAL_PHONE_RESTRICTION',
          allowedVerifiedNumber: normTrial.formatted
        });
      }
    }

    // 7. Verify Twilio Credentials from Environment Variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.warn('[Twilio SMS] Server environment variables not fully configured:');
      console.warn('- TWILIO_ACCOUNT_SID:', accountSid ? 'Set' : 'MISSING');
      console.warn('- TWILIO_AUTH_TOKEN:', authToken ? 'Set' : 'MISSING');
      console.warn('- TWILIO_PHONE_NUMBER:', twilioPhoneNumber ? 'Set' : 'MISSING');

      return res.status(503).json({
        success: false,
        error:
          'Twilio credentials are not configured on the server. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your server/Vercel environment variables.',
        code: 'TWILIO_NOT_CONFIGURED',
        requiredEnv: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']
      });
    }

    // 8. Generate SMS message body
    const messageBody = generateSmsContent(messageType, effectiveBooking, customNote);

    // 9. Dispatch SMS using official Twilio SDK
    const client = twilio(accountSid, authToken);

    const messageResult = await client.messages.create({
      body: messageBody,
      from: twilioPhoneNumber,
      to: normalizedPhone
    });

    // 10. Record deduplication cache on successful dispatch
    dedupCache.set(dedupKey, Date.now());

    // Record notification status and Twilio message SID in Supabase
    await updateSupabaseSmsStatus(bookingId, 'Sent', messageResult.sid);

    // Structured server log (with masked phone for customer privacy)
    console.log(
      `[Twilio SMS] [SENT] [${messageType.toUpperCase()}] Booking: ${bookingId} | To: ${maskPhoneNumber(
        normalizedPhone
      )} | Twilio SID: ${messageResult.sid} | Status: ${messageResult.status} (${Date.now() -
        requestStartTime}ms)`
    );

    return res.status(200).json({
      success: true,
      message: `SMS notification (${messageType}) sent successfully`,
      sid: messageResult.sid,
      status: messageResult.status,
      to: maskPhoneNumber(normalizedPhone),
      messageType,
      bookingId,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[Twilio SMS] Exception sending SMS:', err);

    // Provide helpful diagnostics for common Twilio error codes
    let userFriendlyMsg = err?.message || 'Failed to dispatch SMS through Twilio';
    let errCode = 'TWILIO_DISPATCH_ERROR';

    if (err?.code === 21211) {
      userFriendlyMsg = 'The recipient phone number is not valid.';
      errCode = 'TWILIO_INVALID_PHONE';
    } else if (err?.code === 21608) {
      userFriendlyMsg =
        'This recipient number is not verified on your Twilio Trial account. Verify it in the Twilio Console.';
      errCode = 'TWILIO_UNVERIFIED_NUMBER';
    } else if (err?.code === 20003) {
      userFriendlyMsg = 'Authentication failed. Please verify your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.';
      errCode = 'TWILIO_AUTH_FAILURE';
    } else if (err?.code === 21606) {
      userFriendlyMsg = 'The "From" phone number is not a valid SMS-capable Twilio phone number.';
      errCode = 'TWILIO_INVALID_SENDER_NUMBER';
    }

    // Record failure in Supabase without reversing the booking
    if (req.body?.bookingId) {
      await updateSupabaseSmsStatus(req.body.bookingId, 'Failed', undefined, userFriendlyMsg);
    }

    return res.status(500).json({
      success: false,
      error: userFriendlyMsg,
      code: errCode,
      twilioCode: err?.code || null
    });
  }
}
