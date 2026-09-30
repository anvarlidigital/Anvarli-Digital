/**
 * Web Crypto API utilities for Admin Authentication and Security Question
 */

export async function sha256(text: string, salt: string = ''): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(text + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(length = 16): string {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}
