/**
 * Trim & Twisted - Twilio Comms Email Notification Service
 * Sends transactional email notifications via /api/send-email:
 * - Email verification OTP
 * - New login detected (after login)
 * - Order / booking confirmation
 * - Appointment reminder
 */

import type { BookingItem, UserProfile } from '../types';

export interface EmailNotificationPayload {
  toEmail: string;
  type: 'verification' | 'new_login' | 'order_confirmation' | 'appointment_reminder' | 'test';
  bookingId?: string;
  customerName?: string;
  code?: string;
  appointmentDetails?: {
    date?: string;
    slot?: string;
    services?: string;
    stylist?: string;
    totalAmount?: number | string;
    address?: string;
  };
  loginDetails?: {
    ip?: string;
    userAgent?: string;
    timestamp?: string;
    method?: string;
  };
}

export interface EmailNotificationResult {
  success: boolean;
  message: string;
  operationId?: string;
  code?: string;
  fallbackUsed?: boolean;
}

/**
 * Send an email notification via /api/send-email
 */
export async function sendEmailNotification(
  payload: EmailNotificationPayload
): Promise<EmailNotificationResult> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || `Failed to send email (HTTP ${res.status})`,
        code: data.code
      };
    }

    return {
      success: true,
      message: data.message || 'Email sent successfully via Twilio Comms API',
      operationId: data.operationId,
      fallbackUsed: data.fallbackUsed
    };
  } catch (err: any) {
    console.warn('[Twilio Email Service] Fetch exception:', err);
    return {
      success: false,
      message: err?.message || 'Network error communicating with /api/send-email endpoint.',
      code: 'NETWORK_ERROR'
    };
  }
}

/**
 * Dispatch 'New Login Detected' alert to customer
 */
export async function sendLoginAlertEmail(
  email: string,
  customerName: string,
  authMethod: string = 'Secure Verification'
): Promise<EmailNotificationResult> {
  return sendEmailNotification({
    toEmail: email,
    type: 'new_login',
    customerName,
    loginDetails: {
      timestamp: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      method: authMethod,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser'
    }
  });
}

/**
 * Dispatch 'Order / Booking Confirmation' email to customer
 */
export async function sendBookingConfirmationEmail(
  booking: BookingItem
): Promise<EmailNotificationResult> {
  const email = booking.customerEmail;
  if (!email || !email.includes('@')) {
    return {
      success: false,
      message: 'No recipient customer email provided for booking',
      code: 'NO_EMAIL'
    };
  }

  const servicesSummary = Array.isArray(booking.services)
    ? booking.services.map((s) => s.name).join(', ')
    : 'Selected Salon Rituals';

  return sendEmailNotification({
    toEmail: email,
    type: 'order_confirmation',
    bookingId: booking.bookingId,
    customerName: booking.customerName,
    appointmentDetails: {
      date: booking.date,
      slot: booking.slot,
      services: servicesSummary,
      stylist: booking.stylistName || 'Any Master Stylist',
      totalAmount: booking.totalAmount
    }
  });
}

/**
 * Dispatch 'Appointment Reminder' email to customer
 */
export async function sendAppointmentReminderEmail(
  booking: BookingItem
): Promise<EmailNotificationResult> {
  const email = booking.customerEmail;
  if (!email || !email.includes('@')) {
    return {
      success: false,
      message: 'No recipient customer email provided for reminder',
      code: 'NO_EMAIL'
    };
  }

  const servicesSummary = Array.isArray(booking.services)
    ? booking.services.map((s) => s.name).join(', ')
    : 'Selected Salon Rituals';

  return sendEmailNotification({
    toEmail: email,
    type: 'appointment_reminder',
    bookingId: booking.bookingId,
    customerName: booking.customerName,
    appointmentDetails: {
      date: booking.date,
      slot: booking.slot,
      services: servicesSummary,
      stylist: booking.stylistName || 'Any Master Stylist',
      totalAmount: booking.totalAmount
    }
  });
}

/**
 * Direct Test Gateway Ping for Admin or Customer Preferences
 */
export async function testTwilioEmail(
  targetEmail: string
): Promise<EmailNotificationResult> {
  return sendEmailNotification({
    toEmail: targetEmail,
    type: 'test',
    customerName: 'Salon Patron',
    appointmentDetails: {
      date: 'Tomorrow',
      slot: '11:00 AM - 02:00 PM',
      services: 'Trim & Twisted Luxury Salon Test Ritual',
      totalAmount: 1200
    }
  });
}
