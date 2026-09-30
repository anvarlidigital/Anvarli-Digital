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
import { ThreeLoadingScreen } from './components/ThreeLoadingScreen';
import { ThreeSalonScene } from './components/ThreeSalonScene';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { OfferBanner } from './components/OfferBanner';
import { ServicesSection } from './components/ServicesSection';
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
          liteMode={liteMode}
          onToggleLiteMode={() => setLiteMode(!liteMode)}
        />

        {/* Hero Section with Interactive 3D Royal Salon Suite */}
        <Hero
          onOpenBooking={() => setBookingModalOpen(true)}
          onExploreServices={() => {
            const el = document.getElementById('services');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          liteMode={liteMode}
          onSelectStation={(stationName) => {
            // If user clicked a station in 3D, optionally preselect matching service or open booking
            setBookingModalOpen(true);
          }}
        />

        {/* Seasonal Offer Banner */}
        <OfferBanner
          settings={settings}
          onOpenBooking={() => setBookingModalOpen(true)}
          onViewFlyer={() => setFlyerModalOpen(true)}
        />

        {/* Services & Prices Section (Grouped under Category Headings) */}
        <ServicesSection
          categories={categories}
          services={services}
          selectedServiceIds={selectedServiceIds}
          onToggleService={handleToggleService}
          onOpenBooking={() => setBookingModalOpen(true)}
        />

        {/* Interactive Before & After Transformation Drag Slider */}
        <BeforeAfterSlider />

        {/* 3D Visual Gallery Carousel (Photos & Videos) */}
        <GallerySection galleryItems={galleryItems} />

        {/* Reviews Wall (4-metric breakdown & Google Review redirect) */}
        <ReviewsWall
          reviews={reviews}
          userBookings={userBookings}
          settings={settings}
          onRefreshReviews={() => {}}
          onOpenAuth={() => handleOpenAuth('signin')}
        />

        {/* Meet the Master Stylists */}
        <TeamSection
          staffList={staffList}
          onOpenBooking={() => setBookingModalOpen(true)}
        />

        {/* Curated Combos & Digital VIP Gift Cards Pass */}
        <PackagesGiftCards onOpenBooking={() => setBookingModalOpen(true)} />

        {/* Salon Location, Google Maps & FAQ Section */}
        <LocationFaqSection />

        {/* Footer with Legal Policies & Direct Contact */}
        <Footer onNavigateAdmin={() => setAdminPanelOpen(true)} />

        {/* Floating WhatsApp Quick Action Button */}
        <FloatingWhatsApp />
      </div>

      {/* =========================================================================
         MODALS & INTERACTIVE DRAWERS
         ========================================================================= */}

      {/* Booking System Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        services={services}
        staffList={staffList}
        coupons={coupons}
        settings={settings}
        initialSelectedServices={selectedServiceIds}
        onBookingSuccess={() => {
          setSelectedServiceIds([]);
        }}
      />

      {/* Customer Dashboard Modal */}
      <CustomerDashboard
        isOpen={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
        settings={settings}
        onRefreshBookings={() => {}}
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
