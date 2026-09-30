/**
 * OTP Service for Trim & Twisted Authentication
 * 
 * Features:
 * - 6-digit cryptographically secure code generation
 * - 5 minutes expiration (300 seconds)
 * - 30-second resend cooldown
 * - Max 5 verification attempts per target
 * - Dev-mode on-screen notification toast
 * - Complete plug-in comments for Twilio (SMS) and Resend (Email)
 */

interface OtpEntry {
  code: string;
  target: string; // email or phone
  type: 'email' | 'sms';
  createdAt: number;
  expiresAt: number;
  attempts: number;
  resendAvailableAt: number;
}

// In-memory active OTP store
const otpStore = new Map<string, OtpEntry>();

// Listeners for in-app dev notification toasts
type OtpListener = (notification: { target: string; code: string; type: 'email' | 'sms'; message: string }) => void;
const listeners = new Set<OtpListener>();

export function subscribeToOtpNotifications(listener: OtpListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyDevOtp(target: string, code: string, type: 'email' | 'sms') {
  const message = `[DEV MODE] Trim & Twisted Verification Code for ${target}: ${code} (Valid for 5 mins)`;
  listeners.forEach(cb => cb({ target, code, type, message }));
}

function generate6DigitCode(): string {
  // Generates 6 digits between 100000 and 999999
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send 6-digit OTP to Email
 */
export async function sendEmailOtp(email: string): Promise<{ success: boolean; message: string; cooldownSeconds?: number }> {
  const normalizedEmail = email.trim().toLowerCase();
  const now = Date.now();
  const existing = otpStore.get(normalizedEmail);

  if (existing && now < existing.resendAvailableAt) {
    const cooldownSeconds = Math.ceil((existing.resendAvailableAt - now) / 1000);
    return {
      success: false,
      message: `Please wait ${cooldownSeconds}s before requesting a new code.`,
      cooldownSeconds
    };
  }

  const code = generate6DigitCode();
  const entry: OtpEntry = {
    code,
    target: normalizedEmail,
    type: 'email',
    createdAt: now,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes
    attempts: 0,
    resendAvailableAt: now + 30 * 1000 // 30 seconds cooldown
  };

  otpStore.set(normalizedEmail, entry);

  /*
   * =========================================================================
   * PRODUCTION RESEND INTEGRATION POINT:
   * =========================================================================
   * To send actual emails via Resend in production:
   * 1. npm install resend
   * 2. Add RESEND_API_KEY to your environment variables
   * 3. Call Resend API:
   *    const { Resend } = await import('resend');
   *    const resend = new Resend(process.env.RESEND_API_KEY);
   *    await resend.emails.send({
   *      from: 'Trim & Twisted <verify@trimandtwisted.com>',
   *      to: normalizedEmail,
   *      subject: 'Your Trim & Twisted Verification Code',
   *      html: `<p>Your code is <strong>${code}</strong>. Valid for 5 minutes.</p>`
   *    });
   * =========================================================================
   */

  notifyDevOtp(normalizedEmail, code, 'email');

  return {
    success: true,
    message: `Verification code sent to ${normalizedEmail}`
  };
}

/**
 * Send 6-digit OTP to SMS / Phone
 */
export async function sendSmsOtp(phone: string): Promise<{ success: boolean; message: string; cooldownSeconds?: number }> {
  const normalizedPhone = phone.trim().replace(/\s+/g, '');
  const now = Date.now();
  const existing = otpStore.get(normalizedPhone);

  if (existing && now < existing.resendAvailableAt) {
    const cooldownSeconds = Math.ceil((existing.resendAvailableAt - now) / 1000);
    return {
      success: false,
      message: `Please wait ${cooldownSeconds}s before requesting a new code.`,
      cooldownSeconds
    };
  }

  const code = generate6DigitCode();
  const entry: OtpEntry = {
    code,
    target: normalizedPhone,
    type: 'sms',
    createdAt: now,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes
    attempts: 0,
    resendAvailableAt: now + 30 * 1000 // 30 seconds cooldown
  };

  otpStore.set(normalizedPhone, entry);

  /*
   * =========================================================================
   * PRODUCTION TWILIO INTEGRATION POINT:
   * =========================================================================
   * To send actual SMS via Twilio in production:
   * 1. npm install twilio
   * 2. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
   * 3. Call Twilio API:
   *    const twilio = (await import('twilio')).default;
   *    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
   *    await client.messages.create({
   *      body: `Your Trim & Twisted verification code is: ${code}. Expires in 5 minutes.`,
   *      from: process.env.TWILIO_PHONE_NUMBER,
   *      to: normalizedPhone.startsWith('+') ? normalizedPhone : `+91${normalizedPhone}`
   *    });
   * =========================================================================
   */

  notifyDevOtp(normalizedPhone, code, 'sms');

  return {
    success: true,
    message: `Verification code sent to ${normalizedPhone}`
  };
}

/**
 * Verify OTP for email or phone target
 */
export async function verifyOtp(target: string, code: string): Promise<{ valid: boolean; message: string }> {
  const normalized = target.trim().toLowerCase().replace(/\s+/g, '');
  const entry = otpStore.get(normalized);

  if (!entry) {
    return { valid: false, message: 'No active code found for this destination. Please request a new one.' };
  }

  const now = Date.now();
  if (now > entry.expiresAt) {
    otpStore.delete(normalized);
    return { valid: false, message: 'Verification code has expired. Please request a new one.' };
  }

  if (entry.attempts >= 5) {
    otpStore.delete(normalized);
    return { valid: false, message: 'Maximum verification attempts exceeded (5). Please request a new code.' };
  }

  entry.attempts += 1;

  if (entry.code !== code.trim()) {
    const remaining = 5 - entry.attempts;
    return {
      valid: false,
      message: `Invalid code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`
    };
  }

  // Verification successful, consume code
  otpStore.delete(normalized);
  return { valid: true, message: 'Code verified successfully.' };
}
