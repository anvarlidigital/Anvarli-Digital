import React, { useEffect, useState } from 'react';
import { subscribeToOtpNotifications } from '../services/otp';
import { Check, Copy, KeyRound, X } from 'lucide-react';

interface ToastItem {
  id: string;
  target: string;
  code: string;
  type: 'email' | 'sms';
  message: string;
}

export const OtpDevToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToOtpNotifications((data) => {
      const item: ToastItem = {
        id: Math.random().toString(36).substring(2, 9),
        ...data,
      };
      setToasts((prev) => [item, ...prev]);

      // Auto dismiss after 18 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, 18000);
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-auto">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="p-4 rounded-xl bg-[#0D1527] border border-[#D4AF37]/50 shadow-[0_10px_35px_rgba(0,0,0,0.6)] text-[#F3EFE0] backdrop-blur-xl animate-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <KeyRound className="w-5 h-5 text-[#FFDF78]" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Dev OTP Simulator ({toast.type.toUpperCase()})
              </span>
            </div>
            <button
              onClick={() => handleDismiss(toast.id)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-gray-300 mt-2 font-mono break-all">
            Sent to: <span className="text-white font-medium">{toast.target}</span>
          </p>

          <div className="mt-3 flex items-center justify-between bg-[#070B14] px-3 py-2 rounded-lg border border-[#D4AF37]/30">
            <span className="font-mono text-xl font-bold tracking-widest text-[#FFDF78]">
              {toast.code}
            </span>
            <button
              onClick={() => handleCopy(toast.id, toast.code)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#FFDF78] border border-[#D4AF37]/40 transition-colors"
            >
              {copiedId === toast.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-gray-400 mt-2">
            Expires in 5 minutes. Ready to paste in the verification input.
          </p>
        </div>
      ))}
    </div>
  );
};
