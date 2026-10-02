import React from 'react';
import { Check, Sparkles, Star, Calendar, ShieldCheck } from 'lucide-react';
import { TiltCard3D } from './TiltCard3D';

interface PackagesGiftCardsProps {
  onOpenBooking: () => void;
}

export const PackagesGiftCards: React.FC<PackagesGiftCardsProps> = ({ onOpenBooking }) => {
  const packages = [
    {
      id: 'pkg-1',
      badge: 'Save ₹600',
      badgeType: 'discount',
      ritualNumber: 'Ritual 01',
      title: 'The Royal Head-to-Toe Indulgence',
      category: 'Ladies All-in-One',
      description: 'Complete head-to-toe pampering with premium salon aesthetics and relaxing care rituals.',
      items: [
        'Eyebrow + Forehead + Upperlip + Chin',
        'Professional Hydrating Facial',
        'Underarms Gentle Waxing',
        'Deluxe Manicure & Pedicure',
      ],
      price: 1999,
      originalPrice: 2599,
      popular: true,
    },
    {
      id: 'pkg-2',
      badge: 'Bestseller',
      badgeType: 'bestseller',
      ritualNumber: 'Ritual 02',
      title: 'Gents Executive Groom & Spa',
      category: 'Gents Complete Grooming',
      description: 'The definitive men’s grooming package tailored for gentlemen demanding precision and relaxation.',
      items: [
        'Precision Haircut & Scalp Massage',
        'Intensive Restorative Hair Spa',
        'Professional Glow Facial & Steam',
        'D-Tan De-pigmentation & Beard Sculpting',
      ],
      price: 1499,
      originalPrice: 1999,
      popular: false,
    },
    {
      id: 'pkg-3',
      badge: 'Exclusive',
      badgeType: 'exclusive',
      ritualNumber: 'Ritual 03',
      title: 'Bridal & Festive Radiance Ritual',
      category: 'Signature Luxury Ritual',
      description: 'Turn heads on your special day with our ultimate ceremonial rejuvenation and radiance therapy.',
      items: [
        'Advanced Radiance Facial & De-tan Mask',
        'Moroccan Oil Restorative Hair Masque',
        'Deluxe Manicure & Pedicure with Polish',
        'Full Face Threading & Professional Hair Styling',
      ],
      price: 3499,
      originalPrice: 4599,
      popular: false,
    },
  ];

  return (
    <section id="packages" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#FFDF78] text-xs font-semibold uppercase tracking-widest mb-3 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Prestige Indulgences</span>
        </div>
        <h2 className="font-['Cinzel'] text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#FFDF78] to-[#AA7C11]">
          Curated Ritual Packages & Combos
        </h2>
        <p className="font-['Playfair_Display'] italic text-base sm:text-lg text-[#E6DFCA] mt-2 max-w-2xl mx-auto">
          Signature all-in-one beauty rituals crafted for complete head-to-toe relaxation and luxury care
        </p>
      </div>

      {/* Packages 3-Column 3D Tilt Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {packages.map((pkg) => (
          <TiltCard3D key={pkg.id} maxTilt={6} scale={1.02} className="h-full">
            <div
              className={`h-full p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0F172A] to-[#0A101E] border flex flex-col justify-between relative overflow-hidden transition-all duration-300 shadow-xl backdrop-blur-md ${
                pkg.popular
                  ? 'border-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.25)] ring-1 ring-[#D4AF37]/60'
                  : 'border-white/10 hover:border-[#D4AF37]/60'
              }`}
            >
              {/* Top Badge */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-[#D4AF37]">
                  {pkg.ritualNumber} &bull; {pkg.category}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                    pkg.badgeType === 'bestseller'
                      ? 'bg-amber-400 text-black shadow-md'
                      : pkg.badgeType === 'exclusive'
                      ? 'bg-purple-900/90 text-purple-200 border border-purple-400/40'
                      : 'bg-[#D4AF37] text-[#070B14] shadow-md'
                  }`}
                >
                  {pkg.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="font-['Cinzel'] text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">
                  {pkg.title}
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed mb-6">
                  {pkg.description}
                </p>

                {/* Inclusions List */}
                <div className="space-y-2.5 pt-4 border-t border-white/10 mb-6">
                  <span className="text-[11px] font-mono uppercase text-gray-400 block tracking-wider font-semibold">
                    Included In This Ritual:
                  </span>
                  {pkg.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-200">
                      <div className="w-4 h-4 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-[#FFDF78]" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing & CTA */}
              <div className="pt-5 border-t border-white/10 flex items-center justify-between gap-4 mt-auto">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-extrabold text-[#FFDF78]">
                      ₹{pkg.price}
                    </span>
                    <span className="font-mono text-sm text-gray-500 line-through">
                      ₹{pkg.originalPrice}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 block font-medium">
                    Zero Advance &bull; Pay at Salon
                  </span>
                </div>

                <button
                  onClick={onOpenBooking}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E6C665] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Package</span>
                </button>
              </div>
            </div>
          </TiltCard3D>
        ))}
      </div>
    </section>
  );
};
