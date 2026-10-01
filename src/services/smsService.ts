/**
 * Trim & Twisted - Client SMS Notification Service
 * Connects securely to the server-side endpoint at /api/send-sms
 * (Twilio credentials are kept strictly server-side)
 */

export interface SendSmsPayload {
  phoneNumber: string;
  messageType: 'confirmation' | 'cancellation' | 'reminder';
  bookingId: string;
  customNote?: string;
  clientDetails?: {
    customerName?: string;
    customerPhone?: string;
    date?: string;
    slot?: string;
    stylistName?: string;
    totalAmount?: number | string;
    status?: string;
  };
}

export interface SendSmsResponse {
  success: boolean;
  message?: string;
  sid?: string;
  status?: string;
  error?: string;
  code?: string;
  duplicate?: boolean;
}

/**
 * Send an SMS notification for a booking event via /api/send-sms
 */
export async function sendBookingSmsNotification(
  payload: SendSmsPayload
): Promise<SendSmsResponse> {
  try {
    const res = await fetch('/api/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || `Server responded with HTTP ${res.status}`;
      console.warn(`[SMS Service] Failed to send ${payload.messageType} SMS:`, errorMsg);
      return {
        success: false,
        error: errorMsg,
        code: data?.code || 'HTTP_ERROR',
      };
    }

    if (data?.duplicate) {
      console.log(`[SMS Service] ${payload.messageType} SMS duplicate suppressed for #${payload.bookingId}`);
    } else {
      console.log(`[SMS Service] ${payload.messageType} SMS sent successfully (SID: ${data?.sid})`);
    }

    return {
      success: true,
      message: data?.message || 'SMS sent successfully',
      sid: data?.sid,
      status: data?.status,
      duplicate: !!data?.duplicate,
    };
  } catch (err: any) {
    console.error('[SMS Service] Network error calling /api/send-sms:', err);
    return {
      success: false,
      error: err?.message || 'Network error communicating with SMS server',
      code: 'NETWORK_ERROR',
    };
  }
}
