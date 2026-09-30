import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Phone, CheckCircle2, AlertCircle } from 'lucide-react';

export const PhonePromptModal: React.FC = () => {
  const { profile, updateProfileDetails, phonePromptOpen, setPhonePromptOpen } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!phonePromptOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      await updateProfileDetails({
        phone: cleanPhone,
        phoneVerified: true
      });
      setPhonePromptOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to update phone number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-[#0D1527] border border-[#D4AF37]/50 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.25)] text-[#F3EFE0]">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-3 text-[#FFDF78]">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="font-['Cinzel'] text-xl font-bold text-[#FFDF78]">
            Complete Your Salon Profile
          </h3>
          <p className="text-xs text-[#A5B7D1] mt-1 font-['Playfair_Display']">
            Welcome to Trim & Twisted, {profile?.name || 'VIP Guest'}! Please confirm your mobile number to receive appointment updates and WhatsApp vouchers.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/50 flex items-center gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#C8D6EC] mb-1">
              Mobile Number (India)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-[#FFDF78] font-mono font-medium">
                +91
              </span>
              <input
                type="tel"
                required
                autoFocus
                placeholder="9647345945"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Used strictly for appointment confirmations and salon updates.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-sm tracking-wide hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(212,175,55,0.25)] flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Confirm Mobile Number'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
