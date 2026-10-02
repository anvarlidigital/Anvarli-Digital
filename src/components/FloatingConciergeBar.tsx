import React from 'react';
import { Calendar, CheckCircle, Clock, Sparkles, Trash2, X } from 'lucide-react';
import type { ServiceItem } from '../types';

interface FloatingConciergeBarProps {
  selectedServices: ServiceItem[];
  onOpenBooking: () => void;
  onClearSelection: () => void;
  onRemoveService: (serviceId: string) => void;
}

export const FloatingConciergeBar: React.FC<FloatingConciergeBarProps> = ({
  selectedServices,
  onOpenBooking,
  onClearSelection,
  onRemoveService,
}) => {
  if (selectedServices.length === 0) return null;

  // Approximate duration calculation
  const totalMinutes = selectedServices.reduce((sum, s) => {
    const name = s.name.toLowerCase();
    if (name.includes('keratin') || name.includes('smoothening') || name.includes('plastia')) return sum + 120;
    if (name.includes('spa')) return sum + 45;
    if (name.includes('facial')) return sum + 45;
    if (name.includes('manicure') || name.includes('pedicure')) return sum + 40;
    if (name.includes('nail')) return sum + 30;
    if (s.isHaircut) return sum + 40;
    return sum + 30;
  }, 0);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const durationText = hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` : `${minutes}m`;

  const totalPrice = selectedServices.reduce(
    (sum, s) => sum + (s.offerPrice !== undefined ? s.offerPrice : s.price || 0),
    0
  );

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-6 sm:right-6 md:left-auto md:right-8 md:w-[460px] z-40 animate-in slide-in-from-bottom-6 duration-300">
      <div className="relative rounded-2xl bg-[#090F1C]/95 border-2 border-[#D4AF37] p-3.5 sm:p-4 shadow-[0_15px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        {/* Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/10 via-transparent to-[#AA7C11]/10 rounded-2xl pointer-events-none" />

        {/* Content Row */}
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#070B14] flex items-center justify-center font-bold text-[11px] shrink-0">
                {selectedServices.length}
              </span>
              <span className="font-['Cinzel'] text-xs sm:text-sm font-bold text-white truncate">
                Selected Salon Rituals
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" />
                <span>~{durationText}</span>
              </span>
            </div>

            {/* Truncated service preview list */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {selectedServices.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-gray-200 whitespace-nowrap"
                >
                  <span className="truncate max-w-[120px]">{s.name}</span>
                  <button
                    onClick={() => onRemoveService(s.id)}
                    className="hover:text-rose-400 ml-0.5"
                    title={`Remove ${s.name}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-mono text-gray-400 block uppercase">Est. Total</span>
              <span className="font-mono text-base sm:text-lg font-black text-[#FFDF78]">
                ₹{totalPrice}
              </span>
            </div>

            <button
              onClick={onOpenBooking}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#FFF0A5] to-[#AA7C11] text-[#070B14] font-extrabold text-[11px] sm:text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Select Slot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
