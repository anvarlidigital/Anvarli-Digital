/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { APP_CONFIG } from './config';
import { db, seedInitialFirestoreData } from './services/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import type {
  ServiceItem,
  CategoryItem,
  StaffItem,
  CouponItem,
  GalleryItem,
  ReviewItem,
  BookingItem,
  SalonSettings
} from './types';

// Components
import { CheckCircle2, X } from 'lucide-react';
import { ThreeLoadingScreen } from './components/ThreeLoadingScreen';
import { ThreeSalonScene } from './components/ThreeSalonScene';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { OfferBanner } from './components/OfferBanner';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { GallerySection } from './components/GallerySection';
import { ReviewsWall } from './components/ReviewsWall';
import { TeamSection } from './components/TeamSection';
import { PackagesGiftCards } from './components/PackagesGiftCards';
import { LocationFaqSection } from './components/LocationFaqSection';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { BookingModal } from './components/BookingModal';
import { CustomerDashboard } from './components/CustomerDashboard';
import { AuthModal } from './components/AuthModal';
import { PhonePromptModal } from './components/PhonePromptModal';
import { AdminPanel } from './components/AdminPanel';
import { OtpDevToast } from './components/OtpDevToast';
import { MenuFlyerModal } from './components/MenuFlyerModal';
import { Services3DWallSection } from './components/Services3DWallSection';
import { SalonLiveRadar } from './components/SalonLiveRadar';
import { RitualMatcherModal } from './components/RitualMatcherModal';
import { FloatingConciergeBar } from './components/FloatingConciergeBar';

function MainApp() {
  const { profile } = useAuth();

  // 3D Loading Screen State
  const [loadingComplete, setLoadingComplete] = useState(false);

  // Lite 3D Mode (Auto-detects low-end or reduced motion, or user toggle)
  const [liteMode, setLiteMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      return prefersReducedMotion || (isMobile && (navigator.hardwareConcurrency || 4) <= 4);
    }
    return false;
  });

  // Salon Data State
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [userBookings, setUserBookings] = useState<BookingItem[]>([]);

  // Selection & Modal States
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signin');
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [flyerModalOpen, setFlyerModalOpen] = useState(false);
  const [ritualMatcherOpen, setRitualMatcherOpen] = useState(false);
  const [bookingSuccessNote, setBookingSuccessNote] = useState<BookingItem | null>(null);

  // Auto dismiss booking success note after 15 seconds
  useEffect(() => {
    if (bookingSuccessNote) {
      const timer = setTimeout(() => setBookingSuccessNote(null), 15000);
      return () => clearTimeout(timer);
    }
  }, [bookingSuccessNote]);

  // Support #admin in URL or ?admin=true to automatically open Admin Panel
  useEffect(() => {
    const handleUrlRoute = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash === '#admin' || hash === '#/admin' || search.includes('admin=true')) {
        setAdminPanelOpen(true);
      }
    };
    handleUrlRoute();
    window.addEventListener('hashchange', handleUrlRoute);
    window.addEventListener('popstate', handleUrlRoute);
    return () => {
      window.removeEventListener('hashchange', handleUrlRoute);
      window.removeEventListener('popstate', handleUrlRoute);
    };
  }, []);

  // Initial Seeding on first boot
  useEffect(() => {
    seedInitialFirestoreData();
  }, []);

  // Listen to live collections
  useEffect(() => {
    // Categories
    const unsubCat = onSnapshot(collection(db, 'categories'), (snap) => {
      const list: CategoryItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setCategories(list);
    });

    // Services
    const unsubSrv = onSnapshot(collection(db, 'services'), (snap) => {
      const list: ServiceItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setServices(list);
    });

    // Staff
    const unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => {
      const list: StaffItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setStaffList(list);
    });

    // Coupons
    const unsubCoup = onSnapshot(collection(db, 'coupons'), (snap) => {
      const list: CouponItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setCoupons(list);
    });

    // Gallery
    const unsubGal = onSnapshot(collection(db, 'gallery'), (snap) => {
      const list: GalleryItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setGalleryItems(list);
    });

    // Reviews
    const unsubRev = onSnapshot(collection(db, 'reviews'), (snap) => {
      const list: ReviewItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setReviews(list);
    });

    // Settings
    const unsubSet = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as SalonSettings);
      }
    });

    return () => {
      unsubCat();
      unsubSrv();
      unsubStaff();
      unsubCoup();
      unsubGal();
      unsubRev();
      unsubSet();
    };
  }, []);

  // Listen to bookings for current patron
  useEffect(() => {
    const normalizePhone = (p?: string) => (p || '').replace(/\D/g, '').slice(-10);

    const unsubBookings = onSnapshot(collection(db, 'bookings'), (snap) => {
      const list: BookingItem[] = [];
      const userNormPhone = profile?.phone ? normalizePhone(profile.phone) : '';

      snap.forEach((d) => {
        const data = d.data() as BookingItem;
        const bookingNormPhone = normalizePhone(data.customerPhone);

        const isUserMatch =
          (profile && data.userId === profile.uid) ||
          (userNormPhone && bookingNormPhone === userNormPhone) ||
          (profile?.email && data.customerEmail && data.customerEmail.toLowerCase() === profile.email.toLowerCase());

        if (isUserMatch) {
          list.push({ ...data, id: d.id });
        }
      });

      // Also merge any bookings saved in localStorage for guest patron
      try {
        const stored = localStorage.getItem('tt_saved_bookings');
        if (stored) {
          const localList: BookingItem[] = JSON.parse(stored);
          localList.forEach((lb) => {
            if (!list.some((b) => b.bookingId === lb.bookingId || b.id === lb.id)) {
              list.push(lb);
            }
          });
        }
      } catch (e) {
        // localStorage optional
      }

      list.sort((a, b) => (b.date > a.date ? 1 : -1));
      setUserBookings(list);
    });

    return () => unsubBookings();
  }, [profile]);

  // Check URL route for /admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        setAdminPanelOpen(true);
      }
    }
  }, []);

  // Toggle Service selection
  const handleToggleService = (service: ServiceItem) => {
    if (selectedServiceIds.includes(service.id)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== service.id));
    } else {
      setSelectedServiceIds([...selectedServiceIds, service.id]);
    }
  };

  const selectedServicesList = React.useMemo(() => {
    return services.filter((s) => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F3EFE0] relative selection:bg-[#D4AF37]/30 selection:text-[#FFDF78]">
      {/* 1. 3D Loading Screen with Animated Scissors & Hair Strands */}
      {!loadingComplete && (
        <ThreeLoadingScreen
          onLoaded={() => setLoadingComplete(true)}
          liteMode={liteMode}
        />
      )}

      {/* 2. Interactive 3D Salon Background Scene */}
      <ThreeSalonScene liteMode={liteMode} />

      {/* 3. Dev Mode OTP Notifications Toast Simulator */}
      <OtpDevToast />

      {/* Main Content View */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Bar */}
        <Header
          onOpenBooking={() => setBookingModalOpen(true)}
          onOpenAuth={handleOpenAuth}
          onOpenDashboard={() => setDashboardOpen(true)}
          onNavigateAdmin={() => setAdminPanelOpen(true)}
          onOpenRitualMatcher={() => setRitualMatcherOpen(true)}
          liteMode={liteMode}
          onToggleLiteMode={() => setLiteMode(!liteMode)}
        />

        {/* 1. Hero Section with Interactive 3D Royal Salon Suite (Kept Intact at the Top) */}
        <Hero
          onOpenBooking={() => setBookingModalOpen(true)}
          onExploreServices={() => {
            const el = document.getElementById('services');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenRitualMatcher={() => setRitualMatcherOpen(true)}
          liteMode={liteMode}
          onSelectStation={() => {
            setBookingModalOpen(true);
          }}
        />

        {/* 2. Seasonal Offer Banner (Kept Intact) */}
        <OfferBanner
          settings={settings}
          onOpenBooking={() => setBookingModalOpen(true)}
          onViewFlyer={() => setFlyerModalOpen(true)}
        />

        {/* 2.5 Real-Time Salon Floor Demand & Slot Radar */}
        <SalonLiveRadar
          settings={settings}
          onOpenBooking={() => setBookingModalOpen(true)}
        />

        {/* 3. Services 3D Throne Wall Experience & Full Catalog
            Features the 3D Royal Stylist Throne in background & 3D scrolling walls for services */}
        <Services3DWallSection
          categories={categories}
          services={services}
          selectedServiceIds={selectedServiceIds}
          onToggleService={handleToggleService}
          onOpenBooking={() => setBookingModalOpen(true)}
          onOpenRitualMatcher={() => setRitualMatcherOpen(true)}
          liteMode={liteMode}
        />

        {/* 4. Interactive Before & After Transformation Drag Slider (Kept Intact) */}
        <BeforeAfterSlider onOpenBooking={() => setBookingModalOpen(true)} />

        {/* 5. 3D Visual Gallery Carousel (Photos & Videos - Kept Intact) */}
        <GallerySection galleryItems={galleryItems} />

        {/* 6. Reviews Wall (4-metric breakdown & Google Review redirect - Kept Intact) */}
        <ReviewsWall
          reviews={reviews}
          userBookings={userBookings}
          settings={settings}
          onRefreshReviews={() => {}}
          onOpenAuth={() => handleOpenAuth('signin')}
        />

        {/* 6. Meet the Master Stylists (Kept Intact) */}
        <TeamSection
          staffList={staffList}
          onOpenBooking={() => setBookingModalOpen(true)}
        />

        {/* 7. Curated Combos & Digital VIP Gift Cards Pass (Kept Intact) */}
        <PackagesGiftCards onOpenBooking={() => setBookingModalOpen(true)} />

        {/* 8. Salon Location, Google Maps & FAQ Section (Kept Intact) */}
        <LocationFaqSection />

        {/* 9. Footer with Legal Policies & Direct Contact (Kept Intact) */}
        <Footer onNavigateAdmin={() => setAdminPanelOpen(true)} />

        {/* Floating WhatsApp Quick Action Button */}
        <FloatingWhatsApp />

        {/* Floating Luxury Concierge Cart Bar when services are selected */}
        <FloatingConciergeBar
          selectedServices={selectedServicesList}
          onOpenBooking={() => setBookingModalOpen(true)}
          onClearSelection={() => setSelectedServiceIds([])}
          onRemoveService={(id) =>
            setSelectedServiceIds(selectedServiceIds.filter((sid) => sid !== id))
          }
        />
      </div>

      {/* =========================================================================
         MODALS & INTERACTIVE DRAWERS
         ========================================================================= */}

      {/* Bespoke Styling Ritual Matcher Diagnostic Modal */}
      <RitualMatcherModal
        isOpen={ritualMatcherOpen}
        onClose={() => setRitualMatcherOpen(false)}
        services={services}
        onSelectServices={(picked) => setSelectedServiceIds(picked.map((p) => p.id))}
        onOpenBooking={() => setBookingModalOpen(true)}
      />

      {/* Booking System Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        services={services}
        staffList={staffList}
        coupons={coupons}
        settings={settings}
        initialSelectedServices={selectedServiceIds}
        onBookingSuccess={(booking) => {
          setSelectedServiceIds([]);
          setBookingSuccessNote(booking);
        }}
      />

      {/* Global Booking Successful Notification Note Toast */}
      {bookingSuccessNote && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 p-4 rounded-2xl bg-[#0D1527] border-2 border-emerald-400 text-white shadow-[0_10px_40px_rgba(16,185,129,0.35)] animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0 text-emerald-300 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h5 className="font-['Cinzel'] text-sm font-bold text-emerald-300">
                  Booking Confirmed!
                </h5>
                <button
                  onClick={() => setBookingSuccessNote(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-200 mt-1 font-sans">
                Pass ID: <span className="font-mono text-[#FFDF78] font-bold">{bookingSuccessNote.bookingId}</span>
              </p>
              <p className="text-[11px] text-gray-300 mt-0.5 font-sans">
                {bookingSuccessNote.customerName} &bull; {bookingSuccessNote.date} ({bookingSuccessNote.slot})
              </p>
              <p className="text-[11px] text-emerald-300 font-semibold mt-1">
                Zero Advance &bull; Pay ₹{bookingSuccessNote.totalAmount} at salon counter
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={() => {
                    setDashboardOpen(true);
                    setBookingSuccessNote(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow"
                >
                  View in Dashboard
                </button>
                <button
                  onClick={() => setBookingSuccessNote(null)}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Dashboard Modal */}
      <CustomerDashboard
        isOpen={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
        settings={settings}
        onRefreshBookings={() => {}}
        onNavigateAdmin={() => {
          setDashboardOpen(false);
          setAdminPanelOpen(true);
        }}
      />

      {/* Sign In / Sign Up Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
      />

      {/* Phone Prompt for Google Auth */}
      <PhonePromptModal />

      {/* Admin Panel Console */}
      <AdminPanel
        isOpen={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
        onRefreshData={() => {}}
      />

      {/* Official Menu Flyer Modal */}
      <MenuFlyerModal
        isOpen={flyerModalOpen}
        onClose={() => setFlyerModalOpen(false)}
        onOpenBooking={() => setBookingModalOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
