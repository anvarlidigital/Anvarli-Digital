import React, { useState } from 'react';
import {
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Crown,
  RotateCcw,
  Scissors,
  Sparkles,
  Tag,
  X,
  Zap,
} from 'lucide-react';
import type { ServiceItem } from '../types';

interface RitualMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceItem[];
  onSelectServices: (services: ServiceItem[]) => void;
  onOpenBooking: () => void;
}

export const RitualMatcherModal: React.FC<RitualMatcherModalProps> = ({
  isOpen,
  onClose,
  services,
  onSelectServices,
  onOpenBooking,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // User Selections
  const [guestCategory, setGuestCategory] = useState<string>('ladies-hair');
  const [primaryGoal, setPrimaryGoal] = useState<string>('silk-smooth');
  const [timeBudget, setTimeBudget] = useState<string>('signature');

  if (!isOpen) return null;

  // Determine matched services based on user selections
  const getRecommendation = () => {
    let matchedNames: string[] = [];
    let ritualTitle = 'Bespoke Royal Ritual';
    let ritualDesc = 'Crafted exclusively to your aesthetic diagnostic profile.';
    let estimatedMinutes = 90;

    if (guestCategory === 'gents') {
      if (primaryGoal === 'relax') {
        matchedNames = ['Spa', 'Oil Massage', 'Facial (Normal)'];
        ritualTitle = 'Gents Restorative Scalp & Facial Detox';
        ritualDesc = 'Aromatherapy warm oil head therapy combined with deep tissue facial relaxation.';
        estimatedMinutes = 75;
      } else if (primaryGoal === 'glow') {
        matchedNames = ['D-tan', 'Facial (Professional)', 'Normal Massage'];
        ritualTitle = 'Gents Ultra-Luminescence & Tan Reversal';
        ritualDesc = 'Clinical de-tanning and professional facial hydration for clean skin tone.';
        estimatedMinutes = 80;
      } else {
        matchedNames = ['Spa', 'Facial (Normal)', 'Hair Colour (Global)'];
        ritualTitle = 'Gents Executive Total Grooming';
        ritualDesc = 'All-round grooming ritual with hair spa, natural grey blend, and revitalizing face cleanse.';
        estimatedMinutes = 90;
      }
    } else if (guestCategory === 'ladies-treatments') {
      if (primaryGoal === 'keratin') {
        matchedNames = ['Keratin', 'Manicure Pedicure'];
        ritualTitle = 'Ultra-Keratin Deep Conditioning & Hand Spa';
        ritualDesc = 'Frizz-free mirror hair gloss with complimentary hand tan removal therapy.';
        estimatedMinutes = 150;
      } else if (primaryGoal === 'plastia') {
        matchedNames = ['Nano Plastia', 'Manicure Pedicure'];
        ritualTitle = 'Japanese Nano Plastia Silk Transformation';
        ritualDesc = 'Organic non-damaging smoothing that infuses amino acids and intense liquid shine.';
        estimatedMinutes = 180;
      } else {
        matchedNames = ['Hair Smoothening/Straightening', 'Hair Cut (Normal) + Spa'];
        ritualTitle = 'Complete Hair Smoothening & Precision Sculpt';
        ritualDesc = 'Permanent straight mirror finish paired with hair health nourishing spa.';
        estimatedMinutes = 160;
      }
    } else if (guestCategory === 'ladies-skin') {
      matchedNames = [
        'Normal Facial + Normal D-tan',
        'Full Hand + Leg Wax',
        'Manicure Pedicure',
      ];
      ritualTitle = 'Head-to-Toe Velvet Glow Indulgence';
      ritualDesc = 'Triple-action facial illumination, silky gentle waxing, and therapeutic mani-pedi.';
      estimatedMinutes = 120;
    } else {
      // Default: ladies haircut & spa
      if (timeBudget === 'express') {
        matchedNames = ['Hair Cut (Normal) + Spa'];
        ritualTitle = 'Express Hair Revival & Cut';
        ritualDesc = 'Quick precision cut and aromatherapy hair spa for rapid shine.';
        estimatedMinutes = 60;
      } else if (timeBudget === 'royal') {
        matchedNames = [
          'Haircut + Spa + Facial + D-tan',
          'Nail Extension Both',
        ];
        ritualTitle = 'The Grand Empress 4-in-1 Ceremony';
        ritualDesc = 'Advanced haircut, deep hair spa, clinical facial, d-tan and luxury gel nail extensions.';
        estimatedMinutes = 150;
      } else {
        matchedNames = [
          'Advanced Hair Cut + Spa (Any length)',
          'Professional Massage + D-tan',
        ];
        ritualTitle = 'Signature Advanced Haircut & Body Glow';
        ritualDesc = 'Bespoke layered haircut of any length with deep restorative hair spa and face d-tan.';
        estimatedMinutes = 100;
      }
    }

    // Resolve service objects from master list
    const matchedServices = services.filter((s) =>
      matchedNames.some((n) => s.name.toLowerCase().includes(n.toLowerCase()))
    );

    const subtotal = matchedServices.reduce((sum, s) => sum + (s.offerPrice || s.price || 0), 0);

    return {
      title: ritualTitle,
      description: ritualDesc,
      estimatedMinutes,
      services: matchedServices,
      subtotal,
    };
  };

  const recommendation = getRecommendation();

  const handleApplyAndBook = () => {
    onSelectServices(recommendation.services);
    onClose();
    onOpenBooking();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#090E1A] border-2 border-[#D4AF37]/60 rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#D4AF37]/15 rounded-full blur-[80px] pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#805B09] flex items-center justify-center text-[#070B14] font-bold shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Cinzel'] text-lg sm:text-2xl font-bold text-white">
                Bespoke Ritual Matcher
              </h3>
              <p className="text-xs text-gray-400 font-sans">
                Interactive salon diagnostic & personalized treatment curator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close matcher"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Steps Progress */}
        <div className="flex items-center justify-between my-6 px-2">
          {[
            { s: 1, label: 'Profile' },
            { s: 2, label: 'Goal' },
            { s: 3, label: 'Duration' },
            { s: 4, label: 'Your Ritual' },
          ].map((item) => (
            <div key={item.s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                  step === item.s
                    ? 'bg-[#D4AF37] text-[#070B14] shadow-[0_0_12px_#D4AF37]'
                    : step > item.s
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400'
                    : 'bg-white/5 text-gray-500 border border-white/10'
                }`}
              >
                {step > item.s ? <Check className="w-3.5 h-3.5" /> : item.s}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-gray-300">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Category / Profile */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h4 className="font-['Cinzel'] text-sm font-semibold text-[#FFDF78]">
              Step 1: Who is this bespoke appointment for?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'ladies-hair', title: 'Ladies Haircut & Spa', sub: 'Layered cuts, hot oil spa & steam' },
                { id: 'ladies-treatments', title: 'Keratin & Smoothing', sub: 'Nano Plastia, mirror shine therapy' },
                { id: 'ladies-skin', title: 'Facial, Glow & Waxing', sub: 'D-Tan, waxing, nails & mani-pedi' },
                { id: 'gents', title: 'Gents Master Grooming', sub: 'Fade cut, beard contour, spa & facial' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setGuestCategory(c.id)}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    guestCategory === c.id
                      ? 'bg-[#15223C] border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                      : 'bg-[#0E1628]/80 border-white/10 hover:border-white/20'
                  }`}
                >
                  <h5 className="font-['Cinzel'] font-bold text-sm text-white">{c.title}</h5>
                  <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 flex items-center gap-2"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h4 className="font-['Cinzel'] text-sm font-semibold text-[#FFDF78]">
              Step 2: What is your primary transformation objective?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'silk-smooth', title: 'Silky Smoothness & Frizz Free', desc: 'Glass-like hair texture that withstands humid weather' },
                { id: 'glow', title: 'Sun Tan Reversal & Radiant Glow', desc: 'Deep exfoliation, gold glow facial, skin detox' },
                { id: 'relax', title: 'Stress Relief & Scalp Therapy', desc: 'Aromatherapy scalp massage, pressure points & steam' },
                { id: 'makeover', title: 'Complete Red Carpet Makeover', desc: 'Full aesthetic package for weddings, puja or celebrations' },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => setPrimaryGoal(g.id)}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    primaryGoal === g.id
                      ? 'bg-[#15223C] border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                      : 'bg-[#0E1628]/80 border-white/10 hover:border-white/20'
                  }`}
                >
                  <h5 className="font-['Cinzel'] font-bold text-sm text-white">{g.title}</h5>
                  <p className="text-xs text-gray-400 mt-1">{g.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
              >
                &larr; Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 flex items-center gap-2"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Duration / Budget */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h4 className="font-['Cinzel'] text-sm font-semibold text-[#FFDF78]">
              Step 3: What duration fits your schedule best?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'express', title: 'Express Touchup', time: '~45-60 min', desc: 'High efficiency quick refresh' },
                { id: 'signature', title: 'Signature Session', time: '~90-120 min', desc: 'Most popular balanced experience' },
                { id: 'royal', title: 'Full Royal Spa', time: '~150+ min', desc: 'Extensive VIP indulgence' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeBudget(t.id)}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    timeBudget === t.id
                      ? 'bg-[#15223C] border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                      : 'bg-[#0E1628]/80 border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-[10px] font-mono text-[#D4AF37] font-bold block">{t.time}</span>
                  <h5 className="font-['Cinzel'] font-bold text-sm text-white mt-1">{t.title}</h5>
                  <p className="text-xs text-gray-400 mt-1">{t.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
              >
                &larr; Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 flex items-center gap-2"
              >
                <span>Curate My Ritual</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Result Recommendation Card */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in zoom-in-95">
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#111A2E] to-[#0A101D] border-2 border-[#D4AF37] shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-[#FFDF78]" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#D4AF37] font-bold">
                    Custom Diagnostic Match
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Est. {recommendation.estimatedMinutes} Mins</span>
                </div>
              </div>

              <h4 className="font-['Cinzel'] text-xl sm:text-2xl font-bold text-white mb-1">
                {recommendation.title}
              </h4>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-4">
                {recommendation.description}
              </p>

              {/* Inclusions */}
              <div className="space-y-2 pt-3 border-t border-white/10 mb-4">
                <span className="text-[11px] font-mono uppercase text-gray-400 block tracking-wider font-semibold">
                  Curated Inclusions ({recommendation.services.length} Services):
                </span>
                {recommendation.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-white/5"
                  >
                    <span className="text-white font-medium">{srv.name}</span>
                    <span className="font-mono text-[#FFDF78] font-bold">
                      ₹{srv.offerPrice || srv.price || 'Priced on consult'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price & Guarantee */}
              <div className="flex items-baseline justify-between pt-3 border-t border-white/10">
                <div>
                  <span className="text-[10px] text-gray-400 block">Total Est. Payable at Salon:</span>
                  <span className="font-mono text-2xl font-extrabold text-[#FFDF78]">
                    ₹{recommendation.subtotal}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">
                  Zero Advance &bull; Pay After Service
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Diagnostic</span>
              </button>

              <button
                onClick={handleApplyAndBook}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#FFF0A5] to-[#AA7C11] text-[#070B14] font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Select & Reserve Slot</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
