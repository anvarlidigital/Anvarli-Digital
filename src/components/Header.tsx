import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config';
import {
  Calendar,
  Compass,
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
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBooking,
  onOpenAuth,
  onOpenDashboard,
  onNavigateAdmin,
  liteMode,
  onToggleLiteMode,
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
      <div className="hidden sm:flex items-center justify-between px-6 py-1.5 text-[11px] bg-[#0A111E] border-b border-white/5 text-[#8EA0BF]">
        <div className="flex items-center gap-6">
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
            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
            title="Salon Management Portal"
          >
            <Lock className="w-3 h-3 text-[#D4AF37]" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <a href="#" className="flex items-center gap-3.5 group">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#D4AF37]/60 shadow-[0_0_20px_rgba(212,175,55,0.25)] group-hover:scale-105 transition-transform bg-[#070B14]">
            <img
              src="/logo.png"
              onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
              alt="Trim & Twisted Logo"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 rounded-xl bg-[#D4AF37]/10 pointer-events-none" />
          </div>
          <div>
            <span className="font-['Cinzel'] text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FFF0A5] via-[#D4AF37] to-[#AA7C11] block leading-tight">
              TRIM & TWISTED
            </span>
            <span className="font-['Playfair_Display'] italic text-[11px] sm:text-xs text-[#E6DFCA] tracking-widest block -mt-0.5">
              Beauty Is You
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-[#A5B7D1]">
          <button
            onClick={() => scrollToSection('services')}
            className="hover:text-[#FFDF78] transition-colors"
          >
            Services & Prices
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
            Curated Packages
          </button>
          <button
            onClick={() => scrollToSection('location')}
            className="hover:text-[#FFDF78] transition-colors"
          >
            Map & Hours
          </button>
        </nav>

        {/* Action Controls & Profile */}
        <div className="hidden sm:flex items-center gap-3">
          {/* 3D Lite Mode Toggle */}
          <button
            onClick={onToggleLiteMode}
            title={liteMode ? 'Switch to Full 3D Immersive Mode' : 'Switch to Performance Lite 3D Mode'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              liteMode
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-[#0E1628] border-white/10 text-gray-300 hover:text-white hover:border-[#D4AF37]/30'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{liteMode ? '3D Lite' : '3D High'}</span>
          </button>

          {/* Auth State Button */}
          {profile ? (
            <button
              onClick={onOpenDashboard}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0E1628] border border-[#D4AF37]/40 text-[#FFDF78] hover:bg-[#D4AF37]/15 transition-all text-xs font-semibold"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border border-[#D4AF37] bg-[#070B14] flex items-center justify-center shrink-0">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                )}
              </div>
              <span className="max-w-[100px] truncate">{profile.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth('signin')}
              className="px-4 py-2 rounded-xl bg-[#0E1628] hover:bg-[#15223C] border border-[#D4AF37]/30 text-[#E6DFCA] hover:text-white transition-all text-xs font-semibold"
            >
              Sign In
            </button>
          )}

          {/* Book Appointment CTA */}
          <button
            onClick={onOpenBooking}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E6C665] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(212,175,55,0.35)]"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Now</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={onOpenBooking}
            className="px-3.5 py-2 rounded-lg bg-[#D4AF37] text-[#070B14] font-bold text-xs"
          >
            Book
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#0A111E] border-b border-[#D4AF37]/30 px-6 py-6 space-y-4 animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 gap-2 text-xs font-medium uppercase tracking-wider">
            <button
              onClick={() => scrollToSection('services')}
              className="p-2.5 rounded-lg bg-[#0E1628] text-left text-[#C8D6EC]"
            >
              Services & Menu
            </button>
            <button
              onClick={() => scrollToSection('gallery')}
              className="p-2.5 rounded-lg bg-[#0E1628] text-left text-[#C8D6EC]"
            >
              3D Gallery
            </button>
            <button
              onClick={() => scrollToSection('reviews')}
              className="p-2.5 rounded-lg bg-[#0E1628] text-left text-[#C8D6EC]"
            >
              Reviews Wall
            </button>
            <button
              onClick={() => scrollToSection('team')}
              className="p-2.5 rounded-lg bg-[#0E1628] text-left text-[#C8D6EC]"
            >
              Master Stylists
            </button>
            <button
              onClick={() => scrollToSection('packages')}
              className="p-2.5 rounded-lg bg-[#0E1628] text-left text-[#C8D6EC]"
            >
              Curated Packages
            </button>
            <button
              onClick={() => scrollToSection('location')}
              className="p-2.5 rounded-lg bg-[#0E1628] text-left text-[#C8D6EC]"
            >
              Map & Hours
            </button>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-white/10">
            <button
              onClick={onToggleLiteMode}
              className="flex items-center gap-1.5 text-xs text-gray-300"
            >
              <Zap className="w-4 h-4 text-[#D4AF37]" />
              <span>{liteMode ? 'Lite Mode (Active)' : 'High 3D'}</span>
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

            <button
              onClick={() => { setMobileMenuOpen(false); onNavigateAdmin(); }}
              className="w-full py-2 rounded-xl text-gray-400 hover:text-white text-xs flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Salon Owner / Admin Access</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
