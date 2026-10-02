import React from 'react';
import { APP_CONFIG } from '../config';
import { RoyalSalonHero3D } from './RoyalSalonHero3D';
import { Calendar, ChevronRight, Compass, Facebook, Instagram, MessageCircle, ShieldCheck, Sparkles, Star } from 'lucide-react';

interface HeroProps {
  onOpenBooking: () => void;
  onExploreServices: () => void;
  onOpenRitualMatcher?: () => void;
  onSelectStation?: (stationName: string) => void;
  liteMode?: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenBooking,
  onExploreServices,
  onOpenRitualMatcher = () => {},
  onSelectStation = () => {},
  liteMode = false,
}) => {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center pt-4 sm:pt-6 pb-12 sm:pb-16 px-3 sm:px-6 lg:px-8 overflow-hidden w-full">
      {/* Centered Luxury Header */}
      <div className="relative z-10 w-full max-w-5xl lg:max-w-6xl mx-auto text-center flex flex-col items-center mb-6 sm:mb-8">
        {/* Crown / Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#FFDF78] text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] shadow-[0_0_25px_rgba(212,175,55,0.2)] mb-4 sm:mb-5 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#FFE8A3]" />
          <span>Award-Winning Haute Unisex Salon Sanctuary</span>
        </div>

        {/* 3D Gold Logo Crest with Glow */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-3 sm:mb-4 flex items-center justify-center group cursor-pointer">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#D4AF37] via-[#FFF0A5] to-[#AA7C11] opacity-35 blur-2xl group-hover:opacity-50 transition-opacity duration-700 animate-pulse" />
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl overflow-hidden bg-[#070B14] border-2 border-[#D4AF37] flex items-center justify-center shadow-[0_0_45px_rgba(212,175,55,0.5)] transform group-hover:scale-105 transition-transform duration-500">
            <img
              src="/logo.png"
              onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
              alt="Trim & Twisted Salon Store Crest"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Main Brand Title */}
        <h1 className="font-['Cinzel'] text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5D6] via-[#E8C56B] to-[#996F14] drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)] leading-[1.15] break-words">
          TRIM & TWISTED
        </h1>

        {/* Official Tagline */}
        <p className="font-['Playfair_Display'] italic text-lg xs:text-xl sm:text-3xl md:text-4xl text-[#F6E7B4] tracking-wide mt-1.5 sm:mt-2 font-medium">
          &ldquo;Beauty Is You&rdquo;
        </p>

        {/* Descriptive Brief */}
        <p className="max-w-2xl text-xs sm:text-sm md:text-base text-[#B9CADF] mt-3 sm:mt-4 font-sans leading-relaxed px-2">
          Step into Bengal&apos;s premier aesthetic sanctuary. Precision haircuts, Japanese Nano Plastia, herbal scalp spas & bridal artistry in an interactive 3D royal environment.
        </p>
      </div>

      {/* 3D Interactive Royal Salon Suite Container */}
      <div className="relative z-10 w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto mb-8 sm:mb-10 px-0 sm:px-2">
        <RoyalSalonHero3D
          onSelectStation={(stationName) => {
            onSelectStation(stationName);
            onOpenBooking();
          }}
          onOpenBooking={onOpenBooking}
          liteMode={liteMode}
        />
      </div>

      {/* Main Action CTAs & Trust Badges */}
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* Main CTA Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 w-full px-2 sm:px-0">
          <button
            onClick={onOpenBooking}
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3D57C] to-[#AA7C11] text-[#070B14] font-extrabold text-xs sm:text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_35px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Book Your VIP Appointment</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          <a
            href={APP_CONFIG.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-[#0E1628] hover:bg-[#14223E] border border-[#D4AF37]/50 text-[#FFDF78] font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>WhatsApp Consultation</span>
          </a>

          <button
            onClick={onOpenRitualMatcher}
            className="w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl bg-[#0E1628]/90 hover:bg-[#15233E] border border-[#D4AF37]/40 text-[#FFDF78] font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>Ritual Matcher Quiz</span>
          </button>

          <button
            onClick={onExploreServices}
            className="w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-medium text-xs sm:text-sm transition-all cursor-pointer"
          >
            Explore 3D Walls & Menu
          </button>
        </div>

        {/* Confidence Trust Badges & Social Links */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-5 mt-6 sm:mt-8 text-xs text-[#D8E2F0]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E1628]/80 border border-white/10 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero Advance • Pay After Service</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E1628]/80 border border-white/10 backdrop-blur-sm">
            <Star className="w-4 h-4 text-[#FFDF78] fill-[#FFDF78]" />
            <span>4.95 Rating • 2,400+ Guests</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E1628]/80 border border-white/10 backdrop-blur-sm">
            <Compass className="w-4 h-4 text-[#D4AF37]" />
            <span>Chakdaha Main Road</span>
          </div>

          {/* Social Links (Strictly Icons Only) */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0E1628]/80 border border-[#D4AF37]/30 backdrop-blur-sm">
            <span className="text-[10px] text-gray-400 font-medium">Follow:</span>
            <a
              href={APP_CONFIG.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Follow Trim & Twisted on Instagram"
              className="text-[#FFDF78] hover:text-pink-400 transition-colors p-0.5"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href={APP_CONFIG.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Follow Trim & Twisted on Facebook"
              className="text-[#FFDF78] hover:text-blue-400 transition-colors p-0.5"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Booking Advance Rule Note */}
        <p className="text-[11px] text-[#8EA0BF] mt-4 font-mono">
          * Bookings accepted 2 days in advance to guarantee dedicated master stylist attention.
        </p>
      </div>
    </section>
  );
};

