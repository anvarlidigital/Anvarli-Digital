import React, { useState } from 'react';
import { APP_CONFIG } from '../config';
import { ChevronDown, Clock, Compass, ExternalLink, HelpCircle, MapPin, Phone, ShieldCheck, Sparkles } from 'lucide-react';

const FAQS = [
  {
    q: 'Do I need to pay any advance deposit while booking online?',
    a: 'Absolutely not! Trim & Twisted operates strictly on a "Pay after service at the salon" policy. You only settle the payment once your hair, facial, or spa treatment is flawlessly completed to your delight.'
  },
  {
    q: 'What is the advance booking rule?',
    a: 'All appointments must be made at least 2 days ahead of your intended visit (the earliest selectable date is today + 2 days). This allows our master stylists to curate personalized products and guarantee no queue time.'
  },
  {
    q: 'What are the salon slot timings and capacities?',
    a: 'We offer three exclusive time slots daily: 11:00 AM - 02:00 PM, 03:00 PM - 06:00 PM, and 06:00 PM - 09:00 PM. Each slot accommodates up to 3 haircut clients and 2 spa/facial clients in separate pools to maintain unhurried luxury.'
  },
  {
    q: 'Can I reschedule or cancel my appointment?',
    a: 'Yes, appointments can be easily rescheduled or cancelled via your Customer Dashboard up to 24 hours prior to the slot. The old slot is freed immediately and updated vouchers are issued.'
  },
  {
    q: 'Are hair smoothening and keratin treatments suitable for colored hair?',
    a: 'Yes! Our specialists use formaldehyde-free premium European and Japanese keratin & nano plastia formulas that restore cysteine bonds and seal radiant shine even on highlighted or damaged hair.'
  }
];

export const LocationFaqSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="location" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Grid: Salon Location & Map on Left (6 cols), FAQ on Right (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Salon Location & Map (6 cols) */}
        <div className="lg:col-span-6 rounded-3xl bg-[#0E1628]/90 border border-[#D4AF37]/40 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#FFDF78] text-xs font-semibold uppercase tracking-widest mb-3">
            <MapPin className="w-3.5 h-3.5" />
            Sanctuary Location
          </div>

          <h3 className="font-['Cinzel'] text-2xl sm:text-3xl font-bold text-white">
            Visit Trim & Twisted
          </h3>
          <p className="text-xs text-[#B9CADF] mt-1 font-['Playfair_Display'] italic">
            Centrally situated on Chakdaha Main Road with convenient parking and direct railway access
          </p>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div className="p-4 rounded-2xl bg-[#070B14] border border-white/5">
              <div className="flex items-center gap-2 text-[#D4AF37] mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold font-mono">SALON HOURS</span>
              </div>
              <p className="text-xs text-gray-300 font-medium">{APP_CONFIG.openingHours}</p>
              <span className="text-[10px] text-emerald-400 mt-1 block">Open All 7 Days a Week</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#070B14] border border-white/5">
              <div className="flex items-center gap-2 text-[#D4AF37] mb-1">
                <Phone className="w-4 h-4" />
                <span className="text-xs font-bold font-mono">HOTLINE / WA</span>
              </div>
              <p className="text-xs text-white font-mono font-bold">{APP_CONFIG.formattedPhone}</p>
              <span className="text-[10px] text-gray-400 mt-1 block">Instant WhatsApp Support</span>
            </div>
          </div>

          {/* Google Map Embed & Get Directions */}
          <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/30 shadow-inner h-64 bg-[#070B14] mb-6">
            <iframe
              title="Trim & Twisted Salon Map"
              src="https://maps.google.com/maps?q=Trim%20and%20Twisted%20Chakdaha&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
              loading="lazy"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={APP_CONFIG.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Get Directions (Google Maps)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href={APP_CONFIG.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="py-3 px-5 rounded-xl bg-[#070B14] border border-[#D4AF37]/50 text-[#FFDF78] font-bold text-xs hover:bg-[#D4AF37]/15 transition-all flex items-center justify-center gap-2"
            >
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* FAQ Accordion (6 cols) */}
        <div className="lg:col-span-6 rounded-3xl bg-[#0E1628]/90 border border-[#D4AF37]/40 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#FFDF78] text-xs font-semibold uppercase tracking-widest mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked
          </div>

          <h3 className="font-['Cinzel'] text-2xl sm:text-3xl font-bold text-white mb-6">
            Salon Policies & Inquiries
          </h3>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-white/5 bg-[#070B14]/80 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-white hover:text-[#FFDF78] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#D4AF37] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-[#B2C1D9] font-sans leading-relaxed border-t border-white/5 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
