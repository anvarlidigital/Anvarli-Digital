import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config';
import type { ServiceItem, StaffItem, CouponItem, BookingItem, SalonSettings } from '../types';
import { db, sanitizeForFirestore } from '../services/firebase';
import { doc, getDoc, setDoc, runTransaction, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { generateBookingVoucherPdf } from '../utils/voucherPdf';
import { formatDateDDMMYYYY } from '../utils/date';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Info,
  MessageCircle,
  Plus,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  X
} from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceItem[];
  staffList: StaffItem[];
  coupons: CouponItem[];
  settings: SalonSettings | null;
  initialSelectedServices: string[];
  onBookingSuccess: (booking: BookingItem) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  services,
  staffList,
  coupons,
  settings,
  initialSelectedServices,
  onBookingSuccess,
}) => {
  const { profile } = useAuth();

  // Multi-step: 'picker' -> 'success'
  const [step, setStep] = useState<'picker' | 'success'>('picker');

  // Selected Services
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedServices);

  // In-modal Service Browser state
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Date & Slot selection
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  // Calendar Month Navigation
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + (APP_CONFIG.booking.minAdvanceDays || 2));
    return d;
  });

  // Form inputs (prefilled from profile)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedStylistId, setSelectedStylistId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponItem | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [specialNotes, setSpecialNotes] = useState('');

  // Real-time slot capacities state
  const [slotUsage, setSlotUsage] = useState<Record<string, { haircutCount: number; otherCount: number }>>({});

  // Waitlist state
  const [waitlistModalSlot, setWaitlistModalSlot] = useState<string | null>(null);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  // Final booked appointment
  const [createdBooking, setCreatedBooking] = useState<BookingItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync initial services when opened
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedServices.length > 0) {
        setSelectedIds(initialSelectedServices);
        setServicePickerOpen(false);
      } else {
        // If no services selected yet, automatically open the service picker!
        setServicePickerOpen(true);
      }
      setStep('picker');
      setSubmitError(null);
      setCreatedBooking(null);
      setWaitlistSubmitted(false);
    }
  }, [isOpen, initialSelectedServices]);

  // Sync user profile inputs
  useEffect(() => {
    if (profile) {
      setCustomerName(profile.name || '');
      setCustomerPhone(profile.phone || '');
      setCustomerEmail(profile.email || '');
    }
  }, [profile]);

  // Minimum selectable date: today + 2 days (ADVANCE RULE)
  const minSelectableDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (APP_CONFIG.booking.minAdvanceDays || 2));
    return d.toISOString().split('T')[0];
  }, []);

  const maxSelectableDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (APP_CONFIG.booking.maxAdvanceDays || 45));
    return d.toISOString().split('T')[0];
  }, []);

  // Set default date when picker loads
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(minSelectableDate);
    }
  }, [minSelectableDate, selectedDate]);

  // Categories list for in-modal service picker
  const serviceCategories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => set.add(s.category));
    return ['All', ...Array.from(set)];
  }, [services]);

  // Filtered services for the in-modal service picker
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
      const matchesSearch =
        !serviceSearch.trim() ||
        s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.category.toLowerCase().includes(serviceSearch.toLowerCase());
      return matchesCat && matchesSearch && s.active !== false;
    });
  }, [services, selectedCategory, serviceSearch]);

  // Determine if booking requires Haircut pool
  const selectedServiceObjects = useMemo(() => {
    return services.filter((s) => selectedIds.includes(s.id));
  }, [services, selectedIds]);

  const requiresHaircutPool = useMemo(() => {
    return selectedServiceObjects.some((s) => s.isHaircut);
  }, [selectedServiceObjects]);

  // Real-time slot availability listener for selectedDate
  useEffect(() => {
    if (!selectedDate) return;

    // Listen live to slotUsage changes for all slots on this date
    const unsubscribes = APP_CONFIG.booking.slots.map((slot) => {
      const docId = `${selectedDate}_${encodeURIComponent(slot)}`;
      return onSnapshot(doc(db, 'slotUsage', docId), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSlotUsage((prev) => ({
            ...prev,
            [slot]: {
              haircutCount: data.haircutCount || 0,
              otherCount: data.otherCount || 0,
            },
          }));
        } else {
          setSlotUsage((prev) => ({
            ...prev,
            [slot]: { haircutCount: 0, otherCount: 0 },
          }));
        }
      });
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [selectedDate]);

  // Calculate Subtotal & Discount
  const subtotal = useMemo(() => {
    return selectedServiceObjects.reduce((acc, curr) => {
      const p = curr.offerPrice || curr.price || 0;
      return acc + p;
    }, 0);
  }, [selectedServiceObjects]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.minBill && subtotal < appliedCoupon.minBill) return 0;

    let d = 0;
    if (appliedCoupon.discountType === 'percentage') {
      d = Math.round((subtotal * appliedCoupon.value) / 100);
      if (appliedCoupon.maxCap && d > appliedCoupon.maxCap) {
        d = appliedCoupon.maxCap;
      }
    } else {
      d = appliedCoupon.value;
    }
    return Math.min(d, subtotal);
  }, [appliedCoupon, subtotal]);

  const finalPayable = Math.max(0, subtotal - discountAmount);

  // Capacity limits from admin settings
  const haircutCapacity = settings?.haircutCapacity || APP_CONFIG.booking.haircutPoolCapacity;
  const otherCapacity = settings?.otherCapacity || APP_CONFIG.booking.otherPoolCapacity;

  // Validate Slot Availability
  const checkSlotStatus = (slot: string) => {
    // Check if date is blocked by admin
    if (settings?.blockedDates?.includes(selectedDate)) {
      return { closed: true, reason: 'Date Blocked by Salon' };
    }

    const usage = slotUsage[slot] || { haircutCount: 0, otherCount: 0 };
    if (requiresHaircutPool) {
      if (usage.haircutCount >= haircutCapacity) {
        return { closed: true, reason: 'Haircut Pool Full' };
      }
    } else {
      if (usage.otherCount >= otherCapacity) {
        return { closed: true, reason: 'Salon Care Pool Full' };
      }
    }

    return { closed: false };
  };

  // Toggle service selection
  const handleToggleService = (srv: ServiceItem) => {
    if (selectedIds.includes(srv.id)) {
      setSelectedIds(selectedIds.filter((id) => id !== srv.id));
    } else {
      setSelectedIds([...selectedIds, srv.id]);
    }
  };

  // Apply Coupon Code
  const handleApplyCoupon = () => {
    setCouponError(null);
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    const matched = coupons.find(
      (c) => c.code.toUpperCase() === code && c.active !== false
    );

    if (!matched) {
      setCouponError('Invalid or inactive coupon code.');
      return;
    }

    if (matched.minBill && subtotal < matched.minBill) {
      setCouponError(`Requires minimum order of ₹${matched.minBill}`);
      return;
    }

    setAppliedCoupon(matched);
  };

  // Generate Booking ID format: TT-YYMMDD-XXXX
  const generateBookingId = (dateStr: string) => {
    const parts = dateStr.split('-');
    const yy = parts[0].substring(2);
    const mm = parts[1];
    const dd = parts[2];
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `TT-${yy}${mm}${dd}-${rand}`;
  };

  // Handle Waitlist Notification Signup
  const handleJoinWaitlist = async (slot: string) => {
    if (!customerPhone.trim()) {
      setSubmitError('Please provide your mobile number so we can notify you if a slot opens.');
      return;
    }

    try {
      await addDoc(collection(db, 'waitlist'), sanitizeForFirestore({
        date: selectedDate,
        slot,
        poolType: requiresHaircutPool ? 'haircut' : 'other',
        customerName: customerName.trim() || 'Valued Guest',
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || '',
        status: 'Waiting',
        createdAt: new Date().toISOString(),
      }));
      setWaitlistSubmitted(true);
      setTimeout(() => {
        setWaitlistModalSlot(null);
        setWaitlistSubmitted(false);
      }, 2500);
    } catch (e) {
      console.warn('Waitlist entry error:', e);
    }
  };

  // Handle Submit Booking with Firestore Transaction
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (selectedIds.length === 0) {
      setSubmitError('Please select at least one salon service from the menu.');
      setServicePickerOpen(true);
      return;
    }

    if (!selectedDate) {
      setSubmitError('Please select an appointment date from the calendar.');
      return;
    }

    if (!selectedSlot) {
      setSubmitError('Please choose an available appointment timing slot.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setSubmitError('Please provide your name and WhatsApp mobile number.');
      return;
    }

    // Double check date advance rule (min 2 days)
    if (selectedDate < minSelectableDate) {
      setSubmitError('Bookings must be scheduled at least 2 days in advance.');
      return;
    }

    setSubmitting(true);

    try {
      const slotDocId = `${selectedDate}_${encodeURIComponent(selectedSlot)}`;
      const slotUsageRef = doc(db, 'slotUsage', slotDocId);

      const bookingId = generateBookingId(selectedDate);
      const chosenStylist = staffList.find((s) => s.id === selectedStylistId);

      // Capacity allocation check
      const slotSnap = await getDoc(slotUsageRef);
      const currentData = slotSnap.exists()
        ? slotSnap.data()
        : { haircutCount: 0, otherCount: 0 };

      const currentHaircutCount = currentData.haircutCount || 0;
      const currentOtherCount = currentData.otherCount || 0;

      if (requiresHaircutPool) {
        if (currentHaircutCount >= haircutCapacity) {
          throw new Error('This slot haircut station is full. Please choose another slot.');
        }
        await setDoc(
          slotUsageRef,
          {
            date: selectedDate,
            slot: selectedSlot,
            haircutCount: currentHaircutCount + 1,
            otherCount: currentOtherCount,
          },
          { merge: true }
        );
      } else {
        if (currentOtherCount >= otherCapacity) {
          throw new Error('This slot salon care suite is full. Please choose another slot.');
        }
        await setDoc(
          slotUsageRef,
          {
            date: selectedDate,
            slot: selectedSlot,
            haircutCount: currentHaircutCount,
            otherCount: currentOtherCount + 1,
          },
          { merge: true }
        );
      }

      // Transaction passed! Create booking document
      const newBooking: BookingItem = {
        id: bookingId,
        bookingId,
        userId: profile?.uid || '',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || '',
        serviceIds: selectedIds,
        services: selectedServiceObjects.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price ?? 0,
          priceLabel: s.priceLabel || '',
          offerPrice: s.offerPrice ?? 0,
          isHaircut: !!s.isHaircut,
        })),
        stylistId: chosenStylist?.id || '',
        stylistName: chosenStylist?.name || '',
        date: selectedDate,
        slot: selectedSlot,
        slotKey: slotDocId,
        poolType: requiresHaircutPool ? 'haircut' : 'other',
        subtotal,
        discount: discountAmount,
        totalAmount: finalPayable,
        couponCode: appliedCoupon?.code || '',
        status: 'Confirmed',
        notes: specialNotes.trim() || '',
        history: [],
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'bookings'), sanitizeForFirestore(newBooking));
      const confirmedBooking = { ...newBooking, id: docRef.id };

      // Cache booking in local storage so it immediately persists for this browser session
      try {
        const stored = localStorage.getItem('tt_saved_bookings');
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(confirmedBooking);
        localStorage.setItem('tt_saved_bookings', JSON.stringify(list));
      } catch (e) {
        // Local storage optional
      }

      setCreatedBooking(confirmedBooking);
      setStep('success');
      onBookingSuccess(confirmedBooking);

      // Automatically redirect details to owner's WhatsApp number
      const srvNames = confirmedBooking.services.map((s) => s.name).join(', ');
      const whatsappMsg = `Hello Trim & Twisted! New Appointment Booking Confirmed:
• Booking ID: ${confirmedBooking.bookingId}
• Name: ${confirmedBooking.customerName}
• Phone: ${confirmedBooking.customerPhone}
• Date: ${formatDateDDMMYYYY(confirmedBooking.date)}
• Slot: ${confirmedBooking.slot}
• Services: ${srvNames}
• Total Payable at Salon: ₹${confirmedBooking.totalAmount}
• Status: CONFIRMED`;

      try {
        window.open(`https://wa.me/919647345945?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
      } catch {}

      // Automatically generate & download booking receipt PDF
      try {
        generateBookingVoucherPdf(confirmedBooking);
      } catch {}

      // Trigger Confetti Celebration!
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#FFDF78', '#FFF0A5', '#AA7C11'],
        });
      } catch (e) {
        // Confetti visual optional
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to complete appointment booking.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open WhatsApp with prefilled message
  const handleOpenWhatsApp = (booking: BookingItem) => {
    const srvNames = booking.services.map((s) => s.name).join(', ');
    const msg = `Hello Trim & Twisted! Appointment Confirmation:
• Booking ID: ${booking.bookingId}
• Name: ${booking.customerName}
• Phone: ${booking.customerPhone}
• Date: ${formatDateDDMMYYYY(booking.date)}
• Slot: ${booking.slot}
• Services: ${srvNames}
• Total Payable: ₹${booking.totalAmount}
• Status: CONFIRMED`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/919647345945?text=${encoded}`, '_blank');
  };

  // Interactive Calendar Generation Helper
  const calendarDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    // First day of current month
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Total days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Blank cells before month starts
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, dateStr: '' });
    }

    // Days of the month
    for (let d = 1; d <= totalDays; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      days.push({ dayNumber: d, dateStr });
    }

    return days;
  }, [calendarViewDate]);

  const currentMonthYearName = useMemo(() => {
    return calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [calendarViewDate]);

  const readableSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    try {
      const [y, m, d] = selectedDate.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0D1527] border-2 border-[#D4AF37]/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(212,175,55,0.25)] text-[#F3EFE0] my-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'picker' ? (
          <>
            {/* Salon Store Logo & Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl overflow-hidden border border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.3)] bg-[#070B14]">
                <img
                  src="/logo.png"
                  onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
                  alt="Trim & Twisted Salon Store Crest"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#FFDF78] text-xs font-semibold uppercase tracking-widest mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FFE8A3]" />
                VIP Reservation System
              </div>
              <h2 className="font-['Cinzel'] text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#FFDF78] to-[#AA7C11]">
                Book Salon Appointment
              </h2>
              <p className="font-['Playfair_Display'] italic text-xs sm:text-sm text-[#D8E2F0] mt-1">
                Zero Advance Payment • Pay after service at the salon
              </p>
            </div>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitBooking} className="space-y-6">
              {/* =========================================================================
                  SECTION 1: SERVICE SELECTION (IN-MODAL SERVICE BROWSER & CHIPS)
                  ========================================================================= */}
              <div className="p-4 rounded-2xl bg-[#070B14] border border-[#D4AF37]/35 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#FFDF78] flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Choose Services ({selectedIds.length} Selected) *</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setServicePickerOpen(!servicePickerOpen)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/35 border border-[#D4AF37]/60 text-xs font-bold text-[#FFDF78] transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{servicePickerOpen ? 'Hide Service Menu' : '+ Add / Browse Services'}</span>
                  </button>
                </div>

                {/* Selected Service Chips */}
                {selectedIds.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-[#0E1628] border border-dashed border-[#D4AF37]/40 text-center">
                    <p className="text-xs text-amber-300 font-semibold mb-1">
                      ⚠️ No services added yet!
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Select services below to configure your appointment:
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-[#0E1628] rounded-xl border border-white/10">
                    {selectedServiceObjects.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#15223C] border border-[#D4AF37]/40 text-xs text-[#FFDF78]"
                      >
                        {s.isHaircut && <Scissors className="w-3 h-3 text-[#D4AF37]" />}
                        <span>{s.name}</span>
                        <span className="font-mono text-white font-semibold">
                          (₹{s.offerPrice || s.price || s.priceLabel})
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedIds(selectedIds.filter((id) => id !== s.id))}
                          className="hover:text-red-400 ml-1 p-0.5 text-gray-400"
                          title="Remove service"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* In-Modal Service Browser Accordion */}
                {servicePickerOpen && (
                  <div className="pt-3 border-t border-white/10 space-y-3 animate-in fade-in duration-200">
                    {/* Search and Category Filter */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search salon services..."
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          className="w-full bg-[#0E1628] border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-[#0E1628] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      >
                        {serviceCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Service Items Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {filteredServices.map((srv) => {
                        const isChosen = selectedIds.includes(srv.id);
                        return (
                          <div
                            key={srv.id}
                            onClick={() => handleToggleService(srv)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                              isChosen
                                ? 'bg-[#15223C] border-[#D4AF37] text-white shadow-sm'
                                : 'bg-[#0E1628]/70 border-white/10 hover:border-[#D4AF37]/50 text-gray-300'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                {srv.isHaircut && <Scissors className="w-3 h-3 text-[#D4AF37] shrink-0" />}
                                <h5 className="text-xs font-semibold truncate">{srv.name}</h5>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-gray-400 uppercase font-mono">{srv.category}</span>
                                {srv.note && (
                                  <span className="text-[10px] text-emerald-400 font-medium truncate">
                                    • {srv.note}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-xs font-bold text-[#FFDF78]">
                                ₹{srv.offerPrice || srv.price || srv.priceLabel}
                              </span>
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                  isChosen
                                    ? 'bg-[#D4AF37] text-[#070B14]'
                                    : 'bg-white/5 text-gray-400 border border-white/10'
                                }`}
                              >
                                {isChosen ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pool Indicator Badge */}
                <div className="pt-2 text-[11px] text-gray-400 flex items-center justify-between font-mono">
                  <span>
                    Assigned Pool:{' '}
                    <strong className={requiresHaircutPool ? 'text-[#FFDF78]' : 'text-blue-300'}>
                      {requiresHaircutPool ? '✂️ Haircut Pool (Stylist Station)' : '💆 Salon Care Pool (Spa/Treatment)'}
                    </strong>
                  </span>
                  <span>
                    Subtotal: <strong className="text-[#FFDF78]">₹{subtotal}</strong>
                  </span>
                </div>
              </div>

              {/* =========================================================================
                  SECTION 2: INTERACTIVE VISIBLE MONTHLY CALENDAR
                  ========================================================================= */}
              <div className="p-4 rounded-2xl bg-[#070B14] border border-[#D4AF37]/35 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#FFDF78] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Select Appointment Date *</span>
                  </label>

                  {/* Month Navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = new Date(calendarViewDate);
                        prev.setMonth(prev.getMonth() - 1);
                        setCalendarViewDate(prev);
                      }}
                      className="p-1 rounded-lg bg-[#0E1628] border border-white/15 hover:border-[#D4AF37] text-white"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-['Cinzel'] text-xs font-bold text-[#FFDF78] px-2 min-w-[120px] text-center">
                      {currentMonthYearName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Date(calendarViewDate);
                        next.setMonth(next.getMonth() + 1);
                        setCalendarViewDate(next);
                      }}
                      className="p-1 rounded-lg bg-[#0E1628] border border-white/15 hover:border-[#D4AF37] text-white"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Calendar Day Labels */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase text-gray-400 pb-1">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((item, idx) => {
                    if (!item.dayNumber) {
                      return <div key={`empty-${idx}`} className="h-9" />;
                    }

                    const isBeforeMin = item.dateStr < minSelectableDate;
                    const isAfterMax = item.dateStr > maxSelectableDate;
                    const isBlocked = settings?.blockedDates?.includes(item.dateStr);
                    const isDisabled = isBeforeMin || isAfterMax || isBlocked;
                    const isSelected = selectedDate === item.dateStr;

                    return (
                      <button
                        key={item.dateStr}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          setSelectedDate(item.dateStr);
                          setSelectedSlot('');
                        }}
                        className={`h-9 rounded-xl font-mono text-xs flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-black shadow-[0_0_15px_#D4AF37] scale-105 z-10'
                            : isDisabled
                            ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-transparent'
                            : 'bg-[#0E1628] text-gray-200 hover:border-[#D4AF37]/60 hover:text-white border border-white/10'
                        }`}
                        title={
                          isBeforeMin
                            ? 'Disabled: Minimum 2-day advance booking rule'
                            : isBlocked
                            ? 'Salon holiday / blocked'
                            : item.dateStr
                        }
                      >
                        <span>{item.dayNumber}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Date Summary & Quick Pickers */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
                  <div className="text-gray-300">
                    Selected:{' '}
                    <strong className="text-[#FFDF78] font-mono">{readableSelectedDate || 'None'}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(minSelectableDate);
                        setSelectedSlot('');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-[#FFDF78]"
                    >
                      Earliest Available (+2 Days)
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 font-mono">
                  * 2-Day Advance Rule: Today & tomorrow are reserved to assure dedicated stylist attention.
                </p>
              </div>

              {/* =========================================================================
                  SECTION 3: TIMING SLOTS WITH BOTH SEAT CAPACITIES CLEARLY DISPLAYED
                  ========================================================================= */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#FFDF78] mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Choose Slot Timing *</span>
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono font-normal">
                    Showing real-time availability for {readableSelectedDate}
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {APP_CONFIG.booking.slots.map((slot) => {
                    const status = checkSlotStatus(slot);
                    const usage = slotUsage[slot] || { haircutCount: 0, otherCount: 0 };

                    const haircutSeatsLeft = Math.max(0, haircutCapacity - usage.haircutCount);
                    const careSeatsLeft = Math.max(0, otherCapacity - usage.otherCount);

                    const isSelected = selectedSlot === slot;

                    return (
                      <div
                        key={slot}
                        onClick={() => {
                          if (!status.closed) {
                            setSelectedSlot(slot);
                          }
                        }}
                        className={`relative rounded-2xl p-3.5 border transition-all text-left flex flex-col justify-between ${
                          status.closed
                            ? 'bg-[#070B14]/40 border-gray-800 text-gray-500 cursor-not-allowed opacity-70'
                            : isSelected
                            ? 'bg-[#15223C] border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.35)] cursor-pointer ring-1 ring-[#D4AF37]'
                            : 'bg-[#070B14] border-white/10 hover:border-[#D4AF37]/50 text-gray-300 cursor-pointer'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-xs font-bold text-white">{slot}</span>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-[#D4AF37] text-[#070B14] flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </div>

                          {/* Both Capacity Pools Displayed */}
                          <div className="space-y-1 text-[11px] font-mono border-t border-white/5 pt-1.5">
                            {/* Haircut Seats */}
                            <div
                              className={`flex items-center justify-between ${
                                requiresHaircutPool ? 'text-[#FFDF78] font-bold' : 'text-gray-400'
                              }`}
                            >
                              <span className="flex items-center gap-1">
                                <Scissors className="w-3 h-3" />
                                <span>Haircut:</span>
                              </span>
                              <span>
                                {haircutSeatsLeft} / {haircutCapacity} seats left
                              </span>
                            </div>

                            {/* Care/Spa Seats */}
                            <div
                              className={`flex items-center justify-between ${
                                !requiresHaircutPool ? 'text-[#FFDF78] font-bold' : 'text-gray-400'
                              }`}
                            >
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>Care/Spa:</span>
                              </span>
                              <span>
                                {careSeatsLeft} / {otherCapacity} seats left
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Label or Waitlist */}
                        <div className="mt-2.5 pt-2 border-t border-white/5">
                          {status.closed ? (
                            <div>
                              <span className="inline-block px-2 py-0.5 rounded bg-red-950/70 border border-red-500/40 text-red-300 text-[10px] font-bold">
                                {status.reason || 'Slot Full'}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWaitlistModalSlot(slot);
                                }}
                                className="mt-1 text-[10px] text-[#FFDF78] underline block hover:text-white"
                              >
                                Notify me if seat opens
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                              <Check className="w-3 h-3" />
                              <span>Available for booking</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* =========================================================================
                  SECTION 4: STYLIST & CONTACT DETAILS
                  ========================================================================= */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stylist Preference */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#FFDF78] mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Master Stylist (Optional)</span>
                  </label>
                  <select
                    value={selectedStylistId}
                    onChange={(e) => setSelectedStylistId(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Any Available Senior Stylist</option>
                    {staffList
                      .filter((st) => st.status !== 'Former')
                      .map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.role})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-[#C8D6EC] mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Subhajit Paul"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-[#C8D6EC] mb-1.5">
                    WhatsApp Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9647345945"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] font-mono"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-[#C8D6EC] mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. you@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Coupon Code Section */}
              <div className="p-3.5 rounded-xl bg-[#070B14] border border-white/10">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter promo coupon code (e.g. PUJA200)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full bg-[#0E1628] border border-white/20 rounded-xl pl-9 pr-3 py-2 text-xs text-white uppercase tracking-wider font-mono focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-[#D4AF37]/20 border border-white/20 hover:border-[#D4AF37] text-xs font-bold text-white hover:text-[#FFDF78] transition-colors"
                  >
                    Apply
                  </button>
                </div>

                {couponError && <p className="text-[11px] text-red-400 mt-1.5">{couponError}</p>}
                {appliedCoupon && (
                  <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Coupon &quot;{appliedCoupon.code}&quot; applied! You saved ₹{discountAmount}.</span>
                  </p>
                )}
              </div>

              {/* Total Summary Breakdown */}
              <div className="p-4 rounded-2xl bg-[#0E1628] border border-[#D4AF37]/40 space-y-2">
                <div className="flex justify-between text-xs text-gray-300">
                  <span>Subtotal ({selectedIds.length} services):</span>
                  <span className="font-mono text-white">₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
                  <span className="font-['Cinzel'] text-sm font-bold text-white">
                    Total Payable at Salon:
                  </span>
                  <span className="font-mono text-2xl font-black text-[#FFDF78]">
                    ₹{finalPayable}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 font-mono text-right">
                  * Zero advance required. Pay at counter after your styling service.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#FFF0A5] to-[#AA7C11] text-[#070B14] font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_35px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{submitting ? 'Reserving Seat...' : 'Confirm Salon Reservation (Pay at Salon)'}</span>
              </button>
            </form>
          </>
        ) : (
          /* =========================================================================
              CONFIRMED ORDER SUCCESS SCREEN
              ========================================================================= */
          createdBooking && (
            <div className="text-center py-4 space-y-6">
              {/* Salon Logo */}
              <div className="w-20 h-20 mx-auto rounded-3xl overflow-hidden border-2 border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.4)] bg-[#070B14]">
                <img
                  src="/logo.png"
                  onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
                  alt="Trim & Twisted Salon Store Crest"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Big Prominent Confirmed Status Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-950/90 border-2 border-emerald-400 text-emerald-300 text-sm font-black uppercase tracking-widest shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-pulse">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>STATUS: CONFIRMED ✓</span>
              </div>

              <div>
                <h3 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#FFDF78] to-[#AA7C11]">
                  Thank You! Booking Confirmed, {createdBooking.customerName}!
                </h3>
                <p className="font-['Playfair_Display'] italic text-sm text-[#E6DFCA] mt-1">
                  Your seat has been reserved in our styling roster. We look forward to welcoming you.
                </p>
              </div>

              {/* Booking Pass ID Card */}
              <div className="p-6 rounded-2xl bg-[#070B14] border border-[#D4AF37]/60 max-w-md mx-auto text-left space-y-2.5 shadow-xl font-mono">
                <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
                  <span className="text-xs text-gray-400">BOOKING PASS ID:</span>
                  <span className="text-lg font-black text-[#FFDF78]">
                    {createdBooking.bookingId}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-300">
                  <span>Guest Name:</span>
                  <span className="font-bold text-white font-sans">{createdBooking.customerName}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-300">
                  <span>Contact Mobile:</span>
                  <span className="font-bold text-white">{createdBooking.customerPhone}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-300">
                  <span>Appointment Date:</span>
                  <span className="font-bold text-[#FFDF78] text-sm">{formatDateDDMMYYYY(createdBooking.date)}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-300">
                  <span>Timing Slot:</span>
                  <span className="font-bold text-white">{createdBooking.slot}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-300">
                  <span>Allocated Pool:</span>
                  <span className="font-bold text-[#FFDF78] uppercase">
                    {createdBooking.poolType === 'haircut' ? '✂️ Haircut Station' : '💆 Salon Care Suite'}
                  </span>
                </div>

                {createdBooking.stylistName && (
                  <div className="flex justify-between items-center text-xs text-gray-300">
                    <span>Master Stylist:</span>
                    <span className="font-medium text-white">{createdBooking.stylistName}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-gray-300">
                  <span>Services:</span>
                  <span className="font-medium text-white max-w-[220px] truncate text-right">
                    {createdBooking.services.map((s) => s.name).join(', ')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-300 pt-2 border-t border-white/10">
                  <span>Payable at Counter:</span>
                  <span className="font-mono font-black text-[#FFDF78] text-base">
                    ₹{createdBooking.totalAmount}
                  </span>
                </div>

                <div className="pt-2 text-[11px] text-emerald-400 font-bold text-center border-t border-white/5">
                  ✓ Verified Zero Advance • Pay after service at salon
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => generateBookingVoucherPdf(createdBooking)}
                  className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Receipt (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(createdBooking)}
                  className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Send to Owner WhatsApp</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-xs text-gray-400 hover:text-white underline underline-offset-4"
              >
                Close & Return to Salon Experience
              </button>
            </div>
          )
        )}

        {/* Waitlist Modal Inner */}
        {waitlistModalSlot && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-sm bg-[#0E1628] border border-[#D4AF37]/60 rounded-2xl p-6 text-center">
              <h4 className="font-['Cinzel'] text-lg font-bold text-[#FFDF78] mb-2">
                Join Slot Waitlist
              </h4>
              <p className="text-xs text-gray-300 mb-4">
                We will send an immediate WhatsApp notification if a cancellation occurs for {selectedDate} ({waitlistModalSlot}).
              </p>

              {waitlistSubmitted ? (
                <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>You are on the priority waitlist!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="tel"
                    placeholder="Your WhatsApp Mobile Number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#070B14] border border-white/20 rounded-xl p-2.5 text-xs text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWaitlistModalSlot(null)}
                      className="flex-1 py-2 text-xs text-gray-400 border border-white/10 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleJoinWaitlist(waitlistModalSlot)}
                      className="flex-1 py-2 text-xs font-bold bg-[#D4AF37] text-[#070B14] rounded-xl"
                    >
                      Notify Me
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
