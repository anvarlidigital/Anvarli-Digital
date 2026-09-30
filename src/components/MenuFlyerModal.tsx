import React from 'react';
import { APP_CONFIG } from '../config';
import { Calendar, Download, Phone, Scissors, Sparkles, X } from 'lucide-react';

interface MenuFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: () => void;
}

export const MenuFlyerModal: React.FC<MenuFlyerModalProps> = ({
  isOpen,
  onClose,
  onOpenBooking,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#FFFDF7] text-[#1E1915] rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-[#D4AF37] my-6 font-sans overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#1E1915]/10 hover:bg-[#1E1915]/20 text-[#1E1915] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Card matching the flyer banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b-2 border-[#D4AF37]/40 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#D4AF37] bg-[#070B14] shadow-md shrink-0">
              <img src="/logo.svg" alt="Trim & Twisted Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-['Cinzel'] text-2xl sm:text-3xl font-black text-[#1E1915] tracking-tight">
                Trim & Twisted
              </h2>
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#AA7C11] block">
                Professional Unisex Salon
              </span>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <span className="inline-block px-3 py-1 rounded-full bg-[#0D2146] text-[#FFDF78] text-xs font-black uppercase tracking-wider">
              Durga Puja Special Offer
            </span>
            <p className="text-xs text-[#5C4D3C] font-semibold mt-1 flex items-center justify-center sm:justify-end gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#AA7C11]" />
              Starting from 1st Sept - 30th Sept
            </p>
          </div>
        </div>

        {/* Flyer Content Two-Column Grid */}
        <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#2A241E]">
          {/* Left Column: Gents & Ladies Haircut */}
          <div className="space-y-4">
            <div>
              <h3 className="font-['Cinzel'] text-sm font-bold text-[#805B09] border-b border-[#D4AF37]/50 pb-1 uppercase tracking-wider">
                Gents Specialties
              </h3>
              <ul className="mt-2 space-y-1.5 font-medium">
                <li className="flex justify-between"><span>Spa</span><span className="font-bold font-mono">399/-</span></li>
                <li className="flex justify-between"><span>Facial (Normal)</span><span className="font-bold font-mono">449/-</span></li>
                <li className="flex justify-between"><span>Facial (Professional)</span><span className="font-bold font-mono">799/-</span></li>
                <li className="flex justify-between"><span>Oil Massage</span><span className="font-bold font-mono">249/-</span></li>
                <li className="flex justify-between"><span>D-tan</span><span className="font-bold font-mono">349/-</span></li>
                <li className="flex justify-between"><span>Normal Massage</span><span className="font-bold font-mono">199/-</span></li>
                <li className="flex justify-between"><span>Professional Massage</span><span className="font-bold font-mono">399/-</span></li>
                <li className="flex justify-between"><span>Hair Colour (Global)</span><span className="font-bold font-mono">499/-</span></li>
                <li className="flex justify-between"><span>Hair Colour (Highlights)</span><span className="font-bold font-mono">149/-</span></li>
              </ul>
            </div>

            <div>
              <h3 className="font-['Cinzel'] text-sm font-bold text-[#805B09] border-b border-[#D4AF37]/50 pb-1 uppercase tracking-wider">
                Ladies Haircut & Spa
              </h3>
              <ul className="mt-2 space-y-1.5 font-medium">
                <li className="flex justify-between"><span>Professional Spa</span><span className="font-bold text-[#AA7C11]">10% Discount</span></li>
                <li className="flex justify-between"><span>Hair Cut (Normal) + Spa</span><span className="font-bold font-mono">999/-</span></li>
                <li className="flex justify-between"><span>(Any length) Adv. Hair Cut + Spa</span><span className="font-bold font-mono">1199/-</span></li>
                <li className="flex justify-between"><span>Haircut + Spa + Facial + D-tan</span><span className="font-bold font-mono">1499/-</span></li>
              </ul>
            </div>

            <div>
              <h3 className="font-['Cinzel'] text-sm font-bold text-[#805B09] border-b border-[#D4AF37]/50 pb-1 uppercase tracking-wider">
                Hair Treatments
              </h3>
              <ul className="mt-2 space-y-1.5 font-medium">
                <li>
                  <div className="flex justify-between">
                    <span>Hair Smoothening/Straightening</span>
                    <span className="font-bold font-mono">2999/- (Starting)</span>
                  </div>
                  <span className="text-[10px] text-gray-600 block">+ Treatment = 1600 X (With offer 1400)</span>
                </li>
                <li className="flex justify-between"><span>Keratin</span><span className="font-bold font-mono">3999/- (Starting)</span></li>
                <li className="flex justify-between"><span>Nano Plastia</span><span className="font-bold font-mono">3999/- (Starting)</span></li>
              </ul>
            </div>
          </div>

          {/* Right Column: Facial, Waxing, Nails, Combos */}
          <div className="space-y-4">
            <div>
              <h3 className="font-['Cinzel'] text-sm font-bold text-[#805B09] border-b border-[#D4AF37]/50 pb-1 uppercase tracking-wider">
                Ladies Facial, Massage & D-tan
              </h3>
              <ul className="mt-2 space-y-1.5 font-medium">
                <li className="flex justify-between"><span>Normal Facial + Normal D-tan</span><span className="font-bold font-mono">399/-</span></li>
                <li className="flex justify-between"><span>Face Massage + D-tan (600)</span><span className="font-bold font-mono text-[#AA7C11]">Offer 399/-</span></li>
                <li className="flex justify-between"><span>Professional Massage + D-tan (1000)</span><span className="font-bold font-mono text-[#AA7C11]">Offer 699/-</span></li>
                <li className="flex justify-between"><span>Hair Treatments (1600)</span><span className="font-bold font-mono text-[#AA7C11]">Offer 1400/-</span></li>
                <li className="flex justify-between"><span>All Professional Facial</span><span className="font-bold text-[#AA7C11]">10% Discount</span></li>
              </ul>
            </div>

            <div>
              <h3 className="font-['Cinzel'] text-sm font-bold text-[#805B09] border-b border-[#D4AF37]/50 pb-1 uppercase tracking-wider">
                Waxing, Nails & Colour
              </h3>
              <ul className="mt-2 space-y-1.5 font-medium">
                <li className="flex justify-between"><span>Full Hand + Leg Wax (Underarms free)</span><span className="font-bold font-mono">1199/-</span></li>
                <li className="flex justify-between"><span>Menicure Pedicure (Hand tan free)</span><span className="font-bold font-mono">1099/-</span></li>
                <li className="flex justify-between"><span>Hair Colour Global</span><span className="font-bold font-mono">999/-</span></li>
                <li className="flex justify-between"><span>Hair Colour Highlight</span><span className="font-bold font-mono">249/-</span></li>
                <li className="flex justify-between"><span>Nail Extension (Single)</span><span className="font-bold font-mono">450/-</span></li>
                <li className="flex justify-between"><span>Nail Extension (Both)</span><span className="font-bold font-mono">799/-</span></li>
              </ul>
            </div>

            {/* Combos */}
            <div className="p-3 bg-[#FFF3D6] rounded-xl border border-[#D4AF37]">
              <h3 className="font-['Cinzel'] text-xs font-bold text-[#805B09] uppercase tracking-wider">
                Festival Combos & Packages
              </h3>
              <div className="mt-2 space-y-2 text-[11px]">
                <div>
                  <p className="font-semibold">
                    Eyebrows + Forehead + Upperlip + Face Massage + Back Massage + Face D-tan + Underarms Wax
                  </p>
                  <span className="font-mono font-bold text-sm text-[#AA7C11]">1099/-</span>
                </div>
                <div className="pt-1.5 border-t border-[#D4AF37]/40">
                  <p className="font-semibold">
                    Eyebrow + Forehead + Upperlip + Chin + Facial (Professional) + Underarms Wax + Menicure + Pedicure
                  </p>
                  <span className="font-mono font-bold text-sm text-[#AA7C11]">1999/-</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Tagline matching handwritten note on flyer */}
        <div className="pt-4 border-t-2 border-[#D4AF37]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-['Playfair_Display'] italic text-lg sm:text-xl text-[#AA7C11] font-bold">
              Beauty Is You
            </span>
            <p className="text-[11px] text-gray-600">
              Chakdaha, West Bengal &bull; Call / WhatsApp: {APP_CONFIG.formattedPhone}
            </p>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenBooking();
            }}
            className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#805B09] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all"
          >
            Book from Menu
          </button>
        </div>
      </div>
    </div>
  );
};
