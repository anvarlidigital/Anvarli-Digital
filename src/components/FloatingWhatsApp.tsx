import React from 'react';
import { APP_CONFIG } from '../config';
import { MessageCircle } from 'lucide-react';

export const FloatingWhatsApp: React.FC = () => {
  return (
    <a
      href={APP_CONFIG.whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Direct WhatsApp Consultation"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2 sm:gap-2.5 px-3 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold text-xs uppercase tracking-wider shadow-[0_10px_35px_rgba(37,211,102,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
    >
      <div className="relative">
        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
      </div>
      <span className="hidden sm:inline font-sans text-xs font-semibold">
        WhatsApp: {APP_CONFIG.phone}
      </span>
      <span className="sm:hidden font-sans font-semibold">WhatsApp</span>
    </a>
  );
};
