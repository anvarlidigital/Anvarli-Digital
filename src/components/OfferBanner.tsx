import React from 'react';
import type { SalonSettings } from '../types';
import { Calendar, Flame, Sparkles, Tag } from 'lucide-react';

interface OfferBannerProps {
  settings: SalonSettings | null;
  onOpenBooking: () => void;
  onViewFlyer?: () => void;
}

export const OfferBanner: React.FC<OfferBannerProps> = ({ settings, onOpenBooking, onViewFlyer }) => {
  const bannerText = settings?.offerBannerText || 'Durga Puja Special Offer, 1st September - 30th September';
  const startDate = settings?.offerStartDate || '2026-09-01';
  const endDate = settings?.offerEndDate || '2026-10-31';
  const isActive = settings?.offerBannerActive !== undefined ? settings.offerBannerActive : true;

  // Check if current date falls within offer dates
  const todayStr = new Date().toISOString().split('T')[0];
  const isExpired = todayStr > endDate || todayStr < startDate;

  if (!isActive || isExpired) {
    return null;
  }

  return (
    <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-12">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1B1104] via-[#2F1C05] to-[#120C03] border-2 border-[#D4AF37]/60 p-4 sm:p-6 shadow-[0_0_40px_rgba(212,175,55,0.25)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Decorative Ambient Gold Flare */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#D4AF37]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#AA7C11]/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-4 text-center md:text-left">
          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#805B09] items-center justify-center text-[#070B14] shadow-lg shrink-0">
            <Flame className="w-7 h-7 fill-current animate-bounce" />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FFDF78] text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Festive Grand Privilege
              </span>
              <span className="text-xs text-amber-200/80 font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Valid: {startDate} to {endDate}
              </span>
            </div>

            <h3 className="font-['Cinzel'] text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#FFDF78] to-[#D4AF37]">
              {bannerText}
            </h3>

            <p className="text-xs text-[#E3D4B6] mt-0.5 font-['Playfair_Display'] italic">
              Experience signature salon treatments with seasonal discounts up to 40% & free complimentary upgrades!
            </p>
          </div>
        </div>

        <div className="relative flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-[#070B14]/80 border border-[#D4AF37]/40 text-center">
            <span className="text-[10px] uppercase text-gray-400 block font-mono">Use Coupon</span>
            <span className="text-sm font-mono font-bold text-[#FFDF78] tracking-wider flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
              PUJA200
            </span>
          </div>

          {onViewFlyer && (
            <button
              type="button"
              onClick={onViewFlyer}
              className="px-4 py-3 rounded-xl bg-[#0E1628] border border-[#D4AF37]/50 text-[#FFDF78] font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37]/20 transition-all whitespace-nowrap"
            >
              View Official Menu
            </button>
          )}

          <button
            onClick={onOpenBooking}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] whitespace-nowrap"
          >
            Claim Offer Now
          </button>
        </div>
      </div>
    </div>
  );
};
