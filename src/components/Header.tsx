import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config';
import {
  Calendar,
  Compass,
  Facebook,
  Instagram,
  Layers,
  Lock,
  Menu,
  Phone,
  Scissors,
  Sparkles,
  User,
  X,
  Zap
} from 'lucide-react';

interface HeaderProps {
  onOpenBooking: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onOpenDashboard: () => void;
  onNavigateAdmin: () => void;
  liteMode: boolean;
  onToggleLiteMode: () => void;
  onOpenRitualMatcher?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBooking,
  onOpenAuth,
  onOpenDashboard,
  onNavigateAdmin,
  liteMode,
  onToggleLiteMode,
  onOpenRitualMatcher = () => {},
}) => {
  const { profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#070B14]/85 border-b border-[#D4AF37]/20 transition-all">
      {/* Top micro bar with contact & salon announcement */}
      {/* Top Utility Ribbon (Visible on md and up screens) */}
      <div className="hidden md:flex items-center justify-between px-4 sm:px-6 py-1.5 text-[11px] bg-[#0A111E] border-b border-white/5 text-[#8EA0BF]">
        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href={APP_CONFIG.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-[#FFDF78] transition-colors"
          >
            <Phone className="w-3 h-3 text-[#D4AF37]" />
            <span>Direct WhatsApp: <strong>{APP_CONFIG.formattedPhone}</strong></span>
          </a>
          <a
            href={APP_CONFIG.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-[#FFDF78] transition-colors"
          >
            <Compass className="w-3 h-3 text-[#D4AF37]" />
            <span>Near Chakdaha Station Road, Chakdaha</span>
          </a>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[#FFDF78] font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Zero Advance Booking • Pay After Service at Salon
          </span>
          <button
            onClick={onNavigateAdmin}
            className="flex items-center gap-1 text-gray-400 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/40 transition-all"
            title="Salon Management Portal"
          >
            <Lock className="w-3 h-3 text-[#D4AF37]" />
            <span className="font-semibold text-[#FFDF78]">Admin Portal</span>
          </button>
          {/* Social Links (Icons only, no visible text) */}
          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            <a
              href={APP_CONFIG.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Follow Trim & Twisted on Instagram"
              className="p-1 rounded-lg text-[#FFDF78] hover:text-pink-400 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a
              href={APP_CONFIG.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Follow Trim & Twisted on Facebook"
              className="p-1 rounded-lg text-[#FFDF78] hover:text-blue-400 transition-colors"
            >
              <Facebook className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Brand Logo & Tagline */}
        <a href="#" className="flex items-center gap-2.5 sm:gap-3.5 group shrink-0">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-[#D4AF37]/60 shadow-[0_0_20px_rgba(212,175,55,0.25)] group-hover:scale-105 transition-transform bg-[#070B14]">
            <img
              src="/logo.png"
              onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
              alt="Trim & Twisted Logo"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 rounded-xl bg-[#D4AF37]/10 pointer-events-none" />
          </div>
          <div>
            <span className="font-['Cinzel'] text-base xs:text-lg sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FFF0A5] via-[#D4AF37] to-[#AA7C11] block leading-tight whitespace-nowrap">
              TRIM & TWISTED
            </span>
            <span className="font-['Playfair_Display'] italic text-[10px] sm:text-xs text-[#E6DFCA] tracking-widest block -mt-0.5 whitespace-nowrap">
              Beauty Is You
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links (>= lg) */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-xs font-semibold uppercase tracking-wider text-[#A5B7D1]">
          <button
            onClick={() => scrollToSection('services')}
            className="hover:text-[#FFDF78] transition-colors"
          >
            Services & 3D Walls
          </button>
          <button
            onClick={onOpenRitualMatcher}
            className="text-[#FFDF78] hover:text-white transition-colors flex items-center gap-1 font-bold"
          >
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            <span>Ritual Matcher</span>
          </button>
          <button
            onClick={() => scrollToSection('gallery')}
            className="hover:text-[#FFDF78] transition-colors"
          >
            3D Gallery
          </button>
          <button
            onClick={() => scrollToSection('reviews')}
            className="hover:text-[#FFDF78] transition-colors"
          >
            Reviews
          </button>
          <button
            onClick={() => scrollToSection('team')}
            className="hover:text-[#FFDF78] transition-colors"
          >
            Stylists
          </button>
          <button
            onClick={() => scrollToSection('packages')}
            className="hover:text-[#FFDF78] transition-colors"
          >
            Packages
          </button>
          <button
            onClick={() => scrollToSection('location')}
            className="hover:text-[#FFDF78] transition-colors"
          >
            Map & Hours
          </button>
        </nav>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Social Icons (Desktop only >= lg) */}
          <div className="hidden xl:flex items-center gap-1.5 mr-1">
            <a
              href={APP_CONFIG.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Trim & Twisted on Instagram"
              className="p-2 rounded-xl bg-[#0E1628] hover:bg-[#1A253F] border border-white/10 hover:border-pink-500/40 text-[#FFDF78] hover:text-pink-400 transition-all shadow-sm"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href={APP_CONFIG.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Trim & Twisted on Facebook"
              className="p-2 rounded-xl bg-[#0E1628] hover:bg-[#1A253F] border border-white/10 hover:border-blue-500/40 text-[#FFDF78] hover:text-blue-400 transition-all shadow-sm"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>

          {/* 3D Lite Mode Toggle (Hidden on very small mobile) */}
          <button
            onClick={onToggleLiteMode}
            title={liteMode ? 'Switch to Full 3D Immersive Mode' : 'Switch to Performance Lite 3D Mode'}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              liteMode
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-[#0E1628] border-white/10 text-gray-300 hover:text-white hover:border-[#D4AF37]/30'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{liteMode ? '3D Lite' : '3D High'}</span>
          </button>

          {/* Auth State Button (Tablet & Desktop) */}
          <div className="hidden sm:block">
            {profile ? (
              <button
                onClick={onOpenDashboard}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0E1628] border border-[#D4AF37]/40 text-[#FFDF78] hover:bg-[#D4AF37]/15 transition-all text-xs font-semibold"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden border border-[#D4AF37] bg-[#070B14] flex items-center justify-center shrink-0">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                  )}
                </div>
                <span className="max-w-[80px] md:max-w-[100px] truncate">{profile.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenAuth('signin')}
                className="px-3.5 py-2 rounded-xl bg-[#0E1628] hover:bg-[#15223C] border border-[#D4AF37]/30 text-[#E6DFCA] hover:text-white transition-all text-xs font-semibold"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Admin Lock Button (Always accessible on Mobile, Tablet & Desktop) */}
          <button
            onClick={onNavigateAdmin}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#0E1628] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FFDF78] text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Open Salon Owner / Admin Portal"
            aria-label="Admin Portal"
          >
            <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          {/* Book Appointment CTA */}
          <button
            onClick={onOpenBooking}
            className="flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E6C665] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(212,175,55,0.35)] whitespace-nowrap"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Book Now</span>
            <span className="xs:hidden">Book</span>
          </button>

          {/* Mobile & Tablet Hamburger menu button (Visible below lg) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer (Visible when hamburger is open below lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0A111E] border-b border-[#D4AF37]/30 px-4 sm:px-6 py-5 space-y-4 animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-medium uppercase tracking-wider">
            <button
              onClick={() => scrollToSection('services')}
              className="p-3 rounded-xl bg-[#0E1628] text-left text-[#C8D6EC] hover:text-white hover:bg-[#142038] border border-white/5"
            >
              Services & 3D Walls
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenRitualMatcher(); }}
              className="p-3 rounded-xl bg-[#D4AF37]/15 text-left text-[#FFDF78] hover:text-white hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 font-bold"
            >
              Ritual Matcher Quiz
            </button>
            <button
              onClick={() => scrollToSection('gallery')}
              className="p-3 rounded-xl bg-[#0E1628] text-left text-[#C8D6EC] hover:text-white hover:bg-[#142038] border border-white/5"
            >
              3D Gallery
            </button>
            <button
              onClick={() => scrollToSection('reviews')}
              className="p-3 rounded-xl bg-[#0E1628] text-left text-[#C8D6EC] hover:text-white hover:bg-[#142038] border border-white/5"
            >
              Reviews Wall
            </button>
            <button
              onClick={() => scrollToSection('team')}
              className="p-3 rounded-xl bg-[#0E1628] text-left text-[#C8D6EC] hover:text-white hover:bg-[#142038] border border-white/5"
            >
              Master Stylists
            </button>
            <button
              onClick={() => scrollToSection('packages')}
              className="p-3 rounded-xl bg-[#0E1628] text-left text-[#C8D6EC] hover:text-white hover:bg-[#142038] border border-white/5"
            >
              Curated Packages
            </button>
            <button
              onClick={() => scrollToSection('location')}
              className="p-3 rounded-xl bg-[#0E1628] text-left text-[#C8D6EC] hover:text-white hover:bg-[#142038] border border-white/5"
            >
              Map & Hours
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            {/* Social Icons (Mobile) */}
            <div className="flex items-center gap-2">
              <a
                href={APP_CONFIG.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Trim & Twisted on Instagram"
                className="p-2 rounded-xl bg-[#0E1628] border border-white/10 text-[#FFDF78] hover:text-pink-400 flex items-center justify-center"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={APP_CONFIG.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Trim & Twisted on Facebook"
                className="p-2 rounded-xl bg-[#0E1628] border border-white/10 text-[#FFDF78] hover:text-blue-400 flex items-center justify-center"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>

            <button
              onClick={onToggleLiteMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1628] border border-[#D4AF37]/30 text-xs text-gray-300"
            >
              <Zap className="w-4 h-4 text-[#D4AF37]" />
              <span>{liteMode ? '3D Lite Mode' : '3D High Mode'}</span>
            </button>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            {profile ? (
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenDashboard(); }}
                className="w-full py-2.5 rounded-xl bg-[#0E1628] border border-[#D4AF37]/50 text-[#FFDF78] font-semibold text-xs flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>My Appointments & Profile ({profile.name})</span>
              </button>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenAuth('signin'); }}
                className="w-full py-2.5 rounded-xl bg-[#0E1628] border border-white/20 text-white font-semibold text-xs"
              >
                Sign In / Sign Up
              </button>
            )}

            {/* Direct Prominent Admin Portal Button in Mobile Drawer */}
            <button
              onClick={() => { setMobileMenuOpen(false); onNavigateAdmin(); }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37]/20 to-[#AA7C11]/20 border border-[#D4AF37]/50 text-[#FFDF78] hover:text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
            >
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Salon Owner & Staff Admin Portal</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
