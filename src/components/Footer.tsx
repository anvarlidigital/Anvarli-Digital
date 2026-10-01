import React, { useState } from 'react';
import { APP_CONFIG } from '../config';
import { Compass, Facebook, FileText, Heart, Instagram, Lock, Phone, Scissors, ShieldAlert, Sparkles, X } from 'lucide-react';

interface FooterProps {
  onNavigateAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateAdmin }) => {
  const [modalContent, setModalContent] = useState<{ title: string; body: string } | null>(null);

  const openPrivacy = () => {
    setModalContent({
      title: 'Privacy Policy',
      body: `Trim & Twisted ("we", "our", or "salon") is devoted to safeguarding the privacy and personal integrity of our esteemed patrons.
      
1. Information Collected: We collect your name, mobile phone number, and optional email address strictly to confirm appointment schedules, distribute digital voucher passes, and deliver customer service notifications.
2. Protection of Data: We never sell, rent, or trade client information to any third parties. Your details are secured via Google Firebase infrastructure.
3. Communications: You will receive WhatsApp appointment confirmations and service status updates. You can opt out at any time by speaking to our front desk.
4. Contact: For privacy inquiries, please connect with us at +91 9647345945.`
    });
  };

  const openTerms = () => {
    setModalContent({
      title: 'Terms & Conditions',
      body: `Welcome to Trim & Twisted Unisex Salon. By reserving an appointment through this platform, you agree to the following terms:
      
1. Advance Bookings: Bookings must be scheduled at least 2 days ahead to allow optimal stylist allocation and room preparation.
2. Zero Advance Payment: Online reservations require zero deposit. All payments for services and retail products are collected at the salon counter after treatment.
3. Salon Etiquette: We request our guests to arrive 10 minutes prior to their designated time slot. In the event of delays exceeding 25 minutes without notice, we reserve the right to reallocate the stylist.
4. Promotions & Coupons: Promotional codes and coupons are valid according to their individual minimum bill requirements and seasonal validity windows.`
    });
  };

  const openCancellation = () => {
    setModalContent({
      title: 'Cancellation & Reschedule Policy',
      body: `We respect your time and strive to maintain pristine punctuality for all salon visitors:
      
1. Cancellation Window: Appointments can be rescheduled or cancelled with zero penalty up to 24 hours before your scheduled time slot.
2. Easy Rescheduling: You can reschedule directly through your Customer Dashboard. The previous slot will be released automatically and a revised voucher pass will be issued.
3. No-Show Policy: Repeated failure to show up without prior communication may limit future slot reservation privileges.
4. Immediate Support: Need emergency rescheduling? Send us an instant message on WhatsApp at +91 9647345945.`
    });
  };

  return (
    <footer className="relative z-10 bg-[#05080E] border-t border-[#D4AF37]/20 pt-16 pb-12 text-[#9FB0C8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#D4AF37]/60 bg-[#0E1628] shadow-[0_0_15px_rgba(212,175,55,0.25)]">
                <img
                  src="/logo.png"
                  onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
                  alt="Trim & Twisted Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-['Cinzel'] text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#FFDF78] to-[#AA7C11]">
                TRIM & TWISTED
              </span>
            </div>
            <p className="font-['Playfair_Display'] italic text-sm text-[#F6E7B4] mb-3">
              &ldquo;Beauty Is You&rdquo;
            </p>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              Award-winning luxury unisex salon in Chakdaha, West Bengal. Elevating bespoke hair styling, skin aesthetics, and bridal elegance.
            </p>

            {/* Social Media Link Icons (Strictly icons only, no visible link text) */}
            <div className="flex items-center gap-2.5 mt-4">
              <a
                href={APP_CONFIG.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Follow Trim & Twisted on Instagram"
                className="w-9 h-9 rounded-xl bg-[#0E1628] hover:bg-[#1A253F] border border-[#D4AF37]/30 hover:border-pink-500/60 text-[#FFDF78] hover:text-pink-400 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(212,175,55,0.15)] group"
              >
                <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href={APP_CONFIG.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Connect with Trim & Twisted on Facebook"
                className="w-9 h-9 rounded-xl bg-[#0E1628] hover:bg-[#1A253F] border border-[#D4AF37]/30 hover:border-blue-500/60 text-[#FFDF78] hover:text-blue-400 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(212,175,55,0.15)] group"
              >
                <Facebook className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>

          {/* Quick Direct Contacts */}
          <div>
            <h4 className="font-['Cinzel'] text-xs font-bold uppercase tracking-widest text-[#FFDF78] mb-4">
              Salon Concierge
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href={APP_CONFIG.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-[#FFDF78] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>WhatsApp: {APP_CONFIG.formattedPhone}</span>
                </a>
              </li>
              <li>
                <a
                  href={APP_CONFIG.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2 hover:text-[#FFDF78] transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-[#D4AF37] mt-0.5 shrink-0" />
                  <span>{APP_CONFIG.address}</span>
                </a>
              </li>
              <li className="pt-1 text-gray-400">
                Hours: {APP_CONFIG.openingHours}
              </li>
            </ul>
          </div>

          {/* Salon Commitments */}
          <div>
            <h4 className="font-['Cinzel'] text-xs font-bold uppercase tracking-widest text-[#FFDF78] mb-4">
              Our Core Promise
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Zero Advance Payment</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Pay After Service at Salon</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Uncrowded 3-Haircut / 2-Care Slots</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>100% Authentic Branded Care</span>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h4 className="font-['Cinzel'] text-xs font-bold uppercase tracking-widest text-[#FFDF78] mb-4">
              Governance & Access
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={openPrivacy}
                  className="hover:text-[#FFDF78] transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={openTerms}
                  className="hover:text-[#FFDF78] transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={openCancellation}
                  className="hover:text-[#FFDF78] transition-colors text-left"
                >
                  Cancellation Policy (24hr Window)
                </button>
              </li>
              <li className="pt-2">
                <button
                  onClick={onNavigateAdmin}
                  className="text-gray-500 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3 h-3 text-[#D4AF37]" />
                  <span>Admin Management Console</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Trim & Twisted Unisex Salon. All Rights Reserved.</p>
          <div className="flex items-center gap-3">
            <a
              href={APP_CONFIG.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Trim & Twisted Instagram"
              className="text-[#FFDF78] hover:text-pink-400 transition-colors p-1"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href={APP_CONFIG.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Trim & Twisted Facebook"
              className="text-[#FFDF78] hover:text-blue-400 transition-colors p-1"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>
          <p className="flex items-center gap-1 text-[11px]">
            Crafted for <span className="text-[#FFDF78]">Trim & Twisted</span> &bull; Beauty Is You
          </p>
        </div>
      </div>

      {/* Policy Modal Dialogue */}
      {modalContent && (
        <div
          onClick={() => setModalContent(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#0D1527] border border-[#D4AF37]/50 rounded-2xl p-6 sm:p-8 shadow-2xl text-[#F3EFE0]"
          >
            <button
              onClick={() => setModalContent(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-['Cinzel'] text-2xl font-bold text-[#FFDF78] mb-4">
              {modalContent.title}
            </h3>

            <div className="text-xs text-gray-300 font-sans leading-relaxed whitespace-pre-line max-h-[60vh] overflow-y-auto pr-2">
              {modalContent.body}
            </div>

            <button
              onClick={() => setModalContent(null)}
              className="w-full mt-6 py-2.5 rounded-xl bg-[#0E1628] border border-[#D4AF37]/40 text-xs font-semibold text-[#FFDF78] hover:bg-[#D4AF37]/15"
            >
              Understood & Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};
