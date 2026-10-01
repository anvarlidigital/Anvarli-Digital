import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config';
import type { BookingItem, ReviewItem, SalonSettings } from '../types';
import { db, uploadImageOrMedia } from '../services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  doc,
  updateDoc,
  runTransaction
} from 'firebase/firestore';
import { generateBookingVoucherPdf } from '../utils/voucherPdf';
import { formatDateDDMMYYYY } from '../utils/date';
import { sendEmailOtp, sendSmsOtp, verifyOtp } from '../services/otp';
import { sendAppointmentReminderEmail, testTwilioEmail } from '../services/emailService';
import {
  AlertCircle,
  Bell,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Gift,
  History,
  Lock,
  Mail,
  MessageCircle,
  Send,
  Share2,
  Shield,
  Sparkles,
  Star,
  Tag,
  User,
  X
} from 'lucide-react';

interface CustomerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SalonSettings | null;
  onRefreshBookings: () => void;
  onNavigateAdmin?: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  isOpen,
  onClose,
  settings,
  onRefreshBookings,
  onNavigateAdmin,
}) => {
  const { profile, updateProfileDetails, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile' | 'loyalty'>('bookings');

  // Bookings state
  const [userBookings, setUserBookings] = useState<BookingItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Profile Edit fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Re-verification state when phone or email changes
  const [verifyModalTarget, setVerifyModalTarget] = useState<{ target: string; type: 'phone' | 'email' } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Reschedule Modal state
  const [rescheduleBooking, setRescheduleBooking] = useState<BookingItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleSuccessBooking, setRescheduleSuccessBooking] = useState<BookingItem | null>(null);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);
  const [confirmCancelBooking, setConfirmCancelBooking] = useState<BookingItem | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Email Notification Preferences State
  const [notifyLogin, setNotifyLogin] = useState(true);
  const [notifyOrder, setNotifyOrder] = useState(true);
  const [notifyReminder, setNotifyReminder] = useState(true);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailMsg, setTestEmailMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [reminderSendingBookingId, setReminderSendingBookingId] = useState<string | null>(null);
  const [reminderSuccessMsg, setReminderSuccessMsg] = useState<string | null>(null);

  // Sync profile details
  useEffect(() => {
    if (profile) {
      setEditName(profile.name || '');
      setEditPhone(profile.phone || '');
      setEditEmail(profile.email || '');
      setNotifyLogin(profile.emailNotifications?.newLogin !== false);
      setNotifyOrder(profile.emailNotifications?.orderConfirmation !== false);
      setNotifyReminder(profile.emailNotifications?.appointmentReminder !== false);
    }
  }, [profile]);

  // Minimum advance date for reschedule (2 days ahead)
  const minAdvanceDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (APP_CONFIG.booking.minAdvanceDays || 2));
    return d.toISOString().split('T')[0];
  }, []);

  // Upcoming selectable dates for easy 1-tap picking
  const availableRescheduleDates = useMemo(() => {
    const list: { ymd: string; dayName: string; formatted: string }[] = [];
    const base = new Date();
    base.setDate(base.getDate() + (APP_CONFIG.booking.minAdvanceDays || 2));
    for (let i = 0; i < 14; i++) {
      const cur = new Date(base);
      cur.setDate(base.getDate() + i);
      const ymd = cur.toISOString().split('T')[0];
      const dayName = cur.toLocaleDateString('en-IN', { weekday: 'short' });
      list.push({
        ymd,
        dayName,
        formatted: formatDateDDMMYYYY(ymd),
      });
    }
    return list;
  }, []);

  // Fetch bookings for this user
  useEffect(() => {
    if (!isOpen || !profile) return;

    const fetchUserBookings = async () => {
      setLoadingBookings(true);
      try {
        const qByPhone = query(
          collection(db, 'bookings'),
          where('customerPhone', '==', profile.phone)
        );
        const snap = await getDocs(qByPhone);
        const list: BookingItem[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });

        // Also check if userId matches
        if (profile.uid) {
          const qByUid = query(
            collection(db, 'bookings'),
            where('userId', '==', profile.uid)
          );
          const snap2 = await getDocs(qByUid);
          snap2.forEach((d) => {
            if (!list.some((item) => item.id === d.id)) {
              list.push({ id: d.id, ...(d.data() as any) });
            }
          });
        }

        // Sort descending by created or date
        list.sort((a, b) => (b.date > a.date ? 1 : -1));
        setUserBookings(list);
      } catch (e) {
        console.warn('User bookings fetch:', e);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchUserBookings();
  }, [isOpen, profile]);

  if (!isOpen || !profile) return null;

  // Handle avatar upload via Cloudinary with fallback
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const url = await uploadImageOrMedia(file);
      await updateProfileDetails({ photoURL: url });
      setProfileSavedMsg('Profile avatar updated successfully!');
      setTimeout(() => setProfileSavedMsg(null), 3000);
    } catch (err: any) {
      setProfileErrorMsg('Avatar upload error: ' + (err?.message || 'Failed to upload'));
      setTimeout(() => setProfileErrorMsg(null), 4000);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle Profile Save with re-verification trigger
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSavedMsg(null);

    // If phone changed, require re-verification
    if (editPhone.trim() && editPhone.trim() !== profile.phone) {
      await sendSmsOtp(editPhone.trim());
      setVerifyModalTarget({ target: editPhone.trim(), type: 'phone' });
      return;
    }

    // If email changed, require re-verification
    if (editEmail.trim() && editEmail.trim() !== profile.email) {
      await sendEmailOtp(editEmail.trim());
      setVerifyModalTarget({ target: editEmail.trim(), type: 'email' });
      return;
    }

    // Otherwise save directly
    await updateProfileDetails({
      name: editName.trim(),
      emailNotifications: {
        newLogin: notifyLogin,
        orderConfirmation: notifyOrder,
        appointmentReminder: notifyReminder
      }
    });
    setProfileSavedMsg('Profile and notification preferences saved.');
    setTimeout(() => setProfileSavedMsg(null), 3000);
  };

  // Instant toggle for email preferences
  const handleToggleEmailPref = async (key: 'newLogin' | 'orderConfirmation' | 'appointmentReminder', val: boolean) => {
    if (key === 'newLogin') setNotifyLogin(val);
    if (key === 'orderConfirmation') setNotifyOrder(val);
    if (key === 'appointmentReminder') setNotifyReminder(val);

    const updatedPrefs = {
      newLogin: key === 'newLogin' ? val : notifyLogin,
      orderConfirmation: key === 'orderConfirmation' ? val : notifyOrder,
      appointmentReminder: key === 'appointmentReminder' ? val : notifyReminder
    };

    await updateProfileDetails({ emailNotifications: updatedPrefs });
    setProfileSavedMsg('Email preferences updated.');
    setTimeout(() => setProfileSavedMsg(null), 2500);
  };

  // Send Appointment Reminder Email on demand for a booking
  const handleSendBookingReminderEmail = async (booking: BookingItem) => {
    const targetEmail = booking.customerEmail || editEmail.trim() || profile?.email;
    if (!targetEmail || !targetEmail.includes('@')) {
      setReminderSuccessMsg('Please specify a valid email address on your profile first.');
      setTimeout(() => setReminderSuccessMsg(null), 4000);
      return;
    }

    setReminderSendingBookingId(booking.id || booking.bookingId);
    setReminderSuccessMsg(null);
    try {
      const res = await sendAppointmentReminderEmail({ ...booking, customerEmail: targetEmail });
      if (res.success) {
        setReminderSuccessMsg(`Appointment reminder email sent to ${targetEmail} via Twilio!`);
      } else {
        setReminderSuccessMsg(`Could not send reminder: ${res.message}`);
      }
      setTimeout(() => setReminderSuccessMsg(null), 6000);
    } catch (e: any) {
      setReminderSuccessMsg(e?.message || 'Error dispatching reminder email');
      setTimeout(() => setReminderSuccessMsg(null), 5000);
    } finally {
      setReminderSendingBookingId(null);
    }
  };

  // Test Twilio Comms Email Gateway on demand
  const handleTestTwilioEmail = async () => {
    const target = editEmail.trim() || profile?.email || 'ghoshankitbrata4@gmail.com';
    setSendingTestEmail(true);
    setTestEmailMsg(null);
    try {
      const res = await testTwilioEmail(target);
      if (res.success) {
        setTestEmailMsg({
          success: true,
          text: `Twilio test email delivered to ${target}! (Operation: ${res.operationId || 'Accepted 202'})`
        });
      } else {
        setTestEmailMsg({
          success: false,
          text: `Twilio Email Error: ${res.message}`
        });
      }
      setTimeout(() => setTestEmailMsg(null), 7000);
    } catch (e: any) {
      setTestEmailMsg({ success: false, text: e?.message || 'Failed to dispatch test email' });
      setTimeout(() => setTestEmailMsg(null), 5000);
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Complete re-verification
  const handleConfirmReverification = async () => {
    if (!verifyModalTarget) return;
    setVerifyError(null);

    const res = await verifyOtp(verifyModalTarget.target, verifyCode.trim());
    if (res.valid) {
      if (verifyModalTarget.type === 'phone') {
        await updateProfileDetails({
          phone: verifyModalTarget.target,
          name: editName.trim(),
          phoneVerified: true,
        });
      } else {
        await updateProfileDetails({
          email: verifyModalTarget.target,
          name: editName.trim(),
        });
      }
      setVerifyModalTarget(null);
      setVerifyCode('');
      setProfileSavedMsg('Verified and updated successfully!');
      setTimeout(() => setProfileSavedMsg(null), 3000);
    } else {
      setVerifyError(res.message);
    }
  };

  // Check Cancellation Rule (active for any confirmed/rescheduled/pending appointment)
  const canCancelOrReschedule = (booking: BookingItem) => {
    return booking.status !== 'Cancelled' && booking.status !== 'Completed';
  };

  // Cancel Booking Trigger
  const handleCancelBooking = (booking: BookingItem) => {
    setConfirmCancelBooking(booking);
  };

  // Execute Cancel Booking (No blocking window.confirm)
  const executeCancelBooking = async () => {
    if (!confirmCancelBooking) return;
    const booking = confirmCancelBooking;
    setCancelling(true);

    try {
      // 1. Release capacity in slotUsage safely
      const slotKey = booking.slotKey || `${booking.date}_${encodeURIComponent(booking.slot)}`;
      const slotUsageRef = doc(db, 'slotUsage', slotKey);
      try {
        const snap = await getDoc(slotUsageRef);
        if (snap.exists()) {
          const data = snap.data();
          if (booking.poolType === 'haircut') {
            await updateDoc(slotUsageRef, {
              haircutCount: Math.max(0, (data.haircutCount || 1) - 1),
            });
          } else {
            await updateDoc(slotUsageRef, {
              otherCount: Math.max(0, (data.otherCount || 1) - 1),
            });
          }
        }
      } catch (err) {
        console.warn('Slot release notice:', err);
      }

      // 2. Mark booking as Cancelled in Firestore
      const targetDocId = booking.id || booking.bookingId;
      const bookingRef = doc(db, 'bookings', targetDocId);
      await setDoc(bookingRef, { status: 'Cancelled' }, { merge: true });

      // Update state
      setUserBookings((prev) =>
        prev.map((b) => (b.id === booking.id || b.bookingId === booking.bookingId ? { ...b, status: 'Cancelled' } : b))
      );
      onRefreshBookings();
      setCancelSuccessMsg(`Appointment ${booking.bookingId} cancelled successfully.`);
      setTimeout(() => setCancelSuccessMsg(null), 4000);
      setConfirmCancelBooking(null);

      // Open WhatsApp notification to owner
      const cancelMsg = `Hello Trim & Twisted! Please note that my appointment has been CANCELLED:
• Booking ID: ${booking.bookingId}
• Name: ${booking.customerName}
• Scheduled Date: ${formatDateDDMMYYYY(booking.date)}
• Slot: ${booking.slot}
• Phone: ${booking.customerPhone}
• Status: CANCELLED`;

      try {
        window.open(`https://wa.me/919647345945?text=${encodeURIComponent(cancelMsg)}`, '_blank');
      } catch {}
    } catch (e: any) {
      console.error('Cancellation error:', e);
      setProfileErrorMsg('Cancellation error: ' + (e?.message || 'Could not cancel booking'));
    } finally {
      setCancelling(false);
    }
  };

  // Perform Reschedule (Safe sequential operations that NEVER trigger read-before-write error)
  const handleExecuteReschedule = async () => {
    if (!rescheduleBooking || !rescheduleDate || !rescheduleSlot) {
      setRescheduleError('Please choose a valid date and slot.');
      return;
    }

    if (rescheduleDate < minAdvanceDate) {
      setRescheduleError('Rescheduled appointments must also be at least 2 days ahead.');
      return;
    }

    setRescheduling(true);
    setRescheduleError(null);

    try {
      const oldSlotKey = rescheduleBooking.slotKey || `${rescheduleBooking.date}_${encodeURIComponent(rescheduleBooking.slot)}`;
      const newSlotKey = `${rescheduleDate}_${encodeURIComponent(rescheduleSlot)}`;

      const oldSlotRef = doc(db, 'slotUsage', oldSlotKey);
      const newSlotRef = doc(db, 'slotUsage', newSlotKey);

      const haircutCap = settings?.haircutCapacity || APP_CONFIG.booking.haircutPoolCapacity;
      const otherCap = settings?.otherCapacity || APP_CONFIG.booking.otherPoolCapacity;

      // 1. Check target slot capacity
      const newSnap = await getDoc(newSlotRef);
      const newData = newSnap.exists() ? newSnap.data() : { haircutCount: 0, otherCount: 0 };
      const currentHaircut = newData.haircutCount || 0;
      const currentOther = newData.otherCount || 0;

      if (rescheduleBooking.poolType === 'haircut') {
        if (currentHaircut >= haircutCap) {
          throw new Error('Target slot haircut station is full. Please choose another slot.');
        }
      } else {
        if (currentOther >= otherCap) {
          throw new Error('Target slot specialized care suite is full. Please choose another slot.');
        }
      }

      // 2. Allocate capacity in target slot
      await setDoc(
        newSlotRef,
        {
          date: rescheduleDate,
          slot: rescheduleSlot,
          haircutCount: rescheduleBooking.poolType === 'haircut' ? currentHaircut + 1 : currentHaircut,
          otherCount: rescheduleBooking.poolType === 'haircut' ? currentOther : currentOther + 1,
        },
        { merge: true }
      );

      // 3. Release old slot if slot changed
      if (oldSlotKey && oldSlotKey !== newSlotKey) {
        try {
          const oldSnap = await getDoc(oldSlotRef);
          if (oldSnap.exists()) {
            const oldData = oldSnap.data();
            await updateDoc(oldSlotRef, {
              haircutCount: rescheduleBooking.poolType === 'haircut' ? Math.max(0, (oldData.haircutCount || 1) - 1) : (oldData.haircutCount || 0),
              otherCount: rescheduleBooking.poolType === 'haircut' ? (oldData.otherCount || 0) : Math.max(0, (oldData.otherCount || 1) - 1),
            });
          }
        } catch (err) {
          console.warn('Old slot release note:', err);
        }
      }

      // 4. Update Booking Document with Reschedule History
      const changeHistory = rescheduleBooking.history || [];
      changeHistory.push({
        date: rescheduleBooking.date,
        slot: rescheduleBooking.slot,
        changedAt: new Date().toISOString(),
        reason: 'Customer initiated reschedule',
      });

      const updatedBooking: BookingItem = {
        ...rescheduleBooking,
        date: rescheduleDate,
        slot: rescheduleSlot,
        slotKey: newSlotKey,
        status: 'Rescheduled',
        history: changeHistory,
      };

      const targetDocId = rescheduleBooking.id || rescheduleBooking.bookingId;
      const bookingDocRef = doc(db, 'bookings', targetDocId);
      await setDoc(bookingDocRef, {
        date: rescheduleDate,
        slot: rescheduleSlot,
        slotKey: newSlotKey,
        status: 'Rescheduled',
        history: changeHistory,
      }, { merge: true });

      setUserBookings((prev) =>
        prev.map((b) => (b.id === rescheduleBooking.id || b.bookingId === rescheduleBooking.bookingId ? updatedBooking : b))
      );

      setRescheduleBooking(null);
      setRescheduleSuccessBooking(updatedBooking);
      onRefreshBookings();

      // Automatically dispatch WhatsApp notification to owner
      const ownerMsg = `Hello Trim & Twisted! My appointment has been RESCHEDULED:
• Booking ID: ${rescheduleBooking.bookingId}
• Name: ${rescheduleBooking.customerName}
• Phone: ${rescheduleBooking.customerPhone}
• Old Date: ${formatDateDDMMYYYY(rescheduleBooking.date)} (${rescheduleBooking.slot})
• New Date: ${formatDateDDMMYYYY(rescheduleDate)}
• New Slot: ${rescheduleSlot}
• Status: RESCHEDULED`;

      try {
        window.open(`https://wa.me/919647345945?text=${encodeURIComponent(ownerMsg)}`, '_blank');
      } catch {}

      // Auto generate updated voucher PDF
      try {
        generateBookingVoucherPdf(updatedBooking);
      } catch {}
    } catch (err: any) {
      setRescheduleError(err?.message || 'Reschedule failed.');
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 xs:p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0D1527] border-2 border-[#D4AF37]/50 rounded-2xl sm:rounded-3xl p-3.5 xs:p-5 sm:p-8 shadow-[0_0_60px_rgba(212,175,55,0.25)] text-[#F3EFE0] my-2 sm:my-8 max-h-[96vh] sm:max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Salon Brand Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#D4AF37]/50 shadow-md bg-[#070B14]">
            <img
              src="/logo.png"
              onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
              alt="Trim & Twisted Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-['Cinzel'] text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF0A5] via-[#D4AF37] to-[#AA7C11]">
              TRIM & TWISTED
            </h3>
            <p className="font-['Playfair_Display'] italic text-[11px] sm:text-xs text-[#E6DFCA]">
              &ldquo;Beauty Is You&rdquo; &bull; VIP Member Portal
            </p>
          </div>
        </div>

        {/* User Hero Banner */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-white/10">
          <div className="relative w-20 h-20 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-[#070B14] shadow-[0_0_20px_rgba(212,175,55,0.3)] shrink-0">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#FFDF78]">
                {profile.name.charAt(0)}
              </div>
            )}
            <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
              <Camera className="w-6 h-6 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#FFDF78] text-[11px] font-bold uppercase tracking-wider mb-1 font-mono">
              <Sparkles className="w-3 h-3" />
              VIP Patron Club
            </div>
            <h2 className="font-['Cinzel'] text-2xl font-bold text-white">
              {profile.name}
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {profile.phone || 'No phone verified'} &bull; {profile.email || 'No email attached'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="p-3 rounded-2xl bg-[#070B14] border border-[#D4AF37]/40 text-center">
              <span className="text-[10px] uppercase text-gray-400 font-mono block">Loyalty Points</span>
              <span className="text-xl font-mono font-bold text-[#FFDF78]">{profile.loyaltyPoints || 100}</span>
            </div>
            {onNavigateAdmin && (
              <button
                onClick={onNavigateAdmin}
                className="py-2.5 px-3 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/60 text-xs font-bold text-[#FFDF78] hover:bg-[#D4AF37]/35 flex items-center gap-1.5 transition-all shadow"
                title="Open Salon Owner / Admin Portal"
              >
                <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Admin Console</span>
              </button>
            )}
            <button
              onClick={() => { signOut(); onClose(); }}
              className="py-2.5 px-3.5 rounded-xl border border-white/10 hover:border-red-500/50 text-xs text-gray-400 hover:text-red-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex border-b border-white/10 mt-6 gap-2 sm:gap-6 text-xs sm:text-sm font-semibold uppercase tracking-wider overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'border-[#D4AF37] text-[#FFDF78]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>My Bookings ({userBookings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-[#D4AF37] text-[#FFDF78]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Security</span>
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'loyalty'
                ? 'border-[#D4AF37] text-[#FFDF78]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Loyalty & Referrals</span>
          </button>
        </div>

        {/* Cancellation feedback banner */}
        {cancelSuccessMsg && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cancelSuccessMsg}</span>
          </div>
        )}

        {/* Appointment reminder email feedback banner */}
        {reminderSuccessMsg && (
          <div className="mb-4 p-3 bg-[#0D1E3A] border border-[#D4AF37]/50 rounded-xl text-xs text-[#FFDF78] flex items-center gap-2 animate-in fade-in duration-200">
            <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>{reminderSuccessMsg}</span>
          </div>
        )}

        {/* Tab 1: Bookings Management */}
        {activeTab === 'bookings' && (
          <div className="pt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {loadingBookings ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading appointments...</div>
            ) : userBookings.length === 0 ? (
              <div className="py-12 text-center bg-[#070B14] rounded-2xl border border-white/5 p-6">
                <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-300">No appointments scheduled</p>
                <p className="text-xs text-gray-500 mt-1">Book your signature haircut, spa, or facial today.</p>
              </div>
            ) : (
              userBookings.map((booking) => {
                const canModify = canCancelOrReschedule(booking);

                return (
                  <div
                    key={booking.id}
                    className="p-5 rounded-2xl bg-[#0E1628] border border-white/10 hover:border-[#D4AF37]/50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="font-mono text-xs font-bold text-[#FFDF78] bg-[#D4AF37]/15 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                          {booking.bookingId}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            booking.status === 'Confirmed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : booking.status === 'Rescheduled'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : booking.status === 'Completed'
                              ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                              : 'bg-red-950 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-white font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                          {formatDateDDMMYYYY(booking.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                          {booking.slot}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mt-1.5">
                        {booking.services.map((s) => s.name).join(', ')}
                      </p>

                      <div className="mt-2 text-xs font-mono">
                        <span className="text-gray-400">Payable at salon: </span>
                        <span className="text-[#FFDF78] font-bold">₹{booking.totalAmount}</span>
                      </div>

                      {booking.history && booking.history.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-300/80 font-mono">
                          <History className="w-3 h-3" />
                          <span>Rescheduled {booking.history.length} time(s)</span>
                        </div>
                      )}
                    </div>

                    {/* Actions: Download PDF, Reschedule, Cancel */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={() => generateBookingVoucherPdf(booking)}
                        className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/40 text-xs text-gray-300 hover:text-[#FFDF78] flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF Pass</span>
                      </button>

                      {/* Email Reminder Button */}
                      <button
                        type="button"
                        onClick={() => handleSendBookingReminderEmail(booking)}
                        disabled={reminderSendingBookingId === (booking.id || booking.bookingId)}
                        className="py-2 px-3 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-xs text-[#FFDF78] flex items-center gap-1.5 transition-all disabled:opacity-50"
                        title="Send appointment reminder email to your inbox"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>
                          {reminderSendingBookingId === (booking.id || booking.bookingId)
                            ? 'Sending...'
                            : 'Email Reminder'}
                        </span>
                      </button>

                      {canModify && (
                        <>
                          <button
                            onClick={() => {
                              setRescheduleBooking(booking);
                              setRescheduleDate(minAdvanceDate);
                              setRescheduleSlot(booking.slot);
                              setRescheduleError(null);
                            }}
                            className="py-2 px-3 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-xs font-bold text-[#FFDF78] hover:bg-[#D4AF37]/30 transition-colors"
                          >
                            Reschedule
                          </button>

                          <button
                            onClick={() => handleCancelBooking(booking)}
                            className="py-2 px-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 hover:bg-red-900/60 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Profile & Security */}
        {activeTab === 'profile' && (
          <div className="pt-6 max-w-lg">
            {profileSavedMsg && (
              <div className="mb-4 p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{profileSavedMsg}</span>
              </div>
            )}
            {profileErrorMsg && (
              <div className="mb-4 p-3 bg-red-950/70 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Mobile Number (Modifying triggers OTP verification)
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-300">
                    Email Address
                  </label>
                  {editEmail.trim() && (
                    <button
                      type="button"
                      onClick={async () => {
                        await sendEmailOtp(editEmail.trim());
                        setVerifyModalTarget({ target: editEmail.trim(), type: 'email' });
                      }}
                      className="text-[11px] text-[#FFDF78] hover:underline flex items-center gap-1 font-mono"
                    >
                      <Shield className="w-3 h-3 text-[#D4AF37]" />
                      <span>Verify Email</span>
                    </button>
                  )}
                </div>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              {/* Email Notification Preferences Section */}
              <div className="p-4 rounded-xl bg-[#070B14] border border-[#D4AF37]/30 space-y-3.5 mt-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FFDF78]">
                    <Bell className="w-4 h-4 text-[#D4AF37]" />
                    <span>Email Notification Preferences</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">Twilio Comms</span>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Choose which transactional notifications you would like delivered to your email:
                </p>

                {/* Option 1: New Login Detected */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#0E1628] border border-white/5">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>New Login Detected</span>
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Receive an instant security email alert whenever your account logs in.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyLogin}
                      onChange={(e) => handleToggleEmailPref('newLogin', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                  </label>
                </div>

                {/* Option 2: Order Confirmation */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#0E1628] border border-white/5">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FFDF78]" />
                      <span>Order & Booking Confirmation</span>
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Receive immediate email receipt, order number, and digital pass upon booking.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyOrder}
                      onChange={(e) => handleToggleEmailPref('orderConfirmation', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                  </label>
                </div>

                {/* Option 3: Appointment Reminder */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#0E1628] border border-white/5">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>Appointment Reminder</span>
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Receive an appointment reminder with time slot and styling service details.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyReminder}
                      onChange={(e) => handleToggleEmailPref('appointmentReminder', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                  </label>
                </div>

                {/* Test Twilio Email Gateway Button */}
                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-400">
                    Verify deliverability to your inbox:
                  </span>
                  <button
                    type="button"
                    onClick={handleTestTwilioEmail}
                    disabled={sendingTestEmail}
                    className="py-1.5 px-3 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/35 border border-[#D4AF37]/50 text-[11px] font-bold text-[#FFDF78] flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3 h-3 text-[#D4AF37]" />
                    <span>{sendingTestEmail ? 'Dispatching...' : 'Send Test Email'}</span>
                  </button>
                </div>

                {testEmailMsg && (
                  <div
                    className={`p-2.5 rounded-lg text-[11px] border ${
                      testEmailMsg.success
                        ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    {testEmailMsg.text}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md"
              >
                Save Changes
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Loyalty & Referrals */}
        {activeTab === 'loyalty' && (
          <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#070B14] border border-[#D4AF37]/40">
              <span className="text-xs uppercase text-[#D4AF37] font-bold font-mono">
                Points Balance
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-mono text-4xl font-bold text-[#FFDF78]">
                  {profile.loyaltyPoints || 100}
                </span>
                <span className="text-xs text-gray-400">VIP Points</span>
              </div>
              <p className="text-xs text-gray-300 mt-3 leading-relaxed">
                Earn 10 points for every ₹100 spent on completed salon visits. 100 points = ₹100 direct cash discount on your next service.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#070B14] border border-[#D4AF37]/40">
              <span className="text-xs uppercase text-[#D4AF37] font-bold font-mono">
                Your Referral Code
              </span>
              <div className="flex items-center gap-2 mt-2">
                <div className="font-mono text-xl font-bold text-[#FFDF78] bg-[#0E1628] px-4 py-2 rounded-xl border border-white/10 select-all">
                  {profile.referralCode || 'TT-ROYAL'}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(profile.referralCode || 'TT-ROYAL');
                    setCopiedReferral(true);
                    setTimeout(() => setCopiedReferral(false), 2500);
                  }}
                  className="p-2.5 rounded-xl bg-[#D4AF37]/20 text-[#FFDF78] border border-[#D4AF37]/40 flex items-center gap-1.5 hover:bg-[#D4AF37]/30 transition-all text-xs font-semibold"
                  title="Copy referral code"
                >
                  {copiedReferral ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-300 mt-3 leading-relaxed">
                Invite friends to Trim & Twisted. When they book their first appointment, you both receive 150 bonus points!
              </p>
            </div>
          </div>
        )}

        {/* Re-verification Modal */}
        {verifyModalTarget && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-sm bg-[#0E1628] border border-[#D4AF37]/60 rounded-2xl p-6 text-center">
              <h4 className="font-['Cinzel'] text-lg font-bold text-[#FFDF78] mb-2">
                Verify New {verifyModalTarget.type === 'phone' ? 'Phone' : 'Email'}
              </h4>
              <p className="text-xs text-gray-300 mb-4 font-mono">
                Code sent to: {verifyModalTarget.target}
              </p>

              {verifyError && (
                <div className="mb-3 p-2 bg-red-950/70 border border-red-500 text-[11px] text-red-200 rounded-lg">
                  {verifyError}
                </div>
              )}

              <input
                type="text"
                maxLength={6}
                placeholder="• • • • • •"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#070B14] border-2 border-[#D4AF37] rounded-xl py-2.5 text-center text-xl font-mono text-[#FFDF78] mb-4"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalTarget(null)}
                  className="flex-1 py-2 text-xs text-gray-400 border border-white/10 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReverification}
                  className="flex-1 py-2 text-xs font-bold bg-[#D4AF37] text-[#070B14] rounded-xl"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {rescheduleBooking && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#0E1628] border-2 border-[#D4AF37] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-['Cinzel'] text-xl font-bold text-[#FFDF78]">
                  Reschedule Appointment
                </h4>
                <button
                  onClick={() => setRescheduleBooking(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-[#070B14] rounded-xl text-xs text-gray-300 mb-4 border border-white/5">
                <span>Current Schedule: </span>
                <span className="font-semibold text-white">
                  {formatDateDDMMYYYY(rescheduleBooking.date)} • {rescheduleBooking.slot}
                </span>
              </div>

              {rescheduleError && (
                <div className="mb-4 p-2.5 bg-red-950/70 border border-red-500 rounded-xl text-xs text-red-200">
                  {rescheduleError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Select New Date (DD/MM/YYYY)</span>
                    </label>
                    {rescheduleDate && (
                      <span className="text-xs font-mono text-[#FFDF78] font-bold">
                        {formatDateDDMMYYYY(rescheduleDate)}
                      </span>
                    )}
                  </div>

                  {/* Quick Select Upcoming Date Chips */}
                  <div className="mb-2">
                    <p className="text-[10px] text-gray-400 mb-1">Upcoming available dates:</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {availableRescheduleDates.slice(0, 7).map((d) => (
                        <button
                          key={d.ymd}
                          type="button"
                          onClick={() => setRescheduleDate(d.ymd)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all border cursor-pointer ${
                            rescheduleDate === d.ymd
                              ? 'bg-[#D4AF37] text-[#070B14] font-bold border-[#D4AF37] shadow-sm'
                              : 'bg-[#070B14] text-gray-300 border-white/10 hover:border-[#D4AF37]/50'
                          }`}
                        >
                          <span className="text-[10px] block opacity-70">{d.dayName}</span>
                          <span>{d.formatted}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calendar Input */}
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      min={minAdvanceDate}
                      value={rescheduleDate}
                      style={{ colorScheme: 'dark' }}
                      onClick={(e) => {
                        try {
                          (e.currentTarget as any).showPicker?.();
                        } catch {}
                      }}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full bg-[#070B14] border-2 border-[#D4AF37]/50 focus:border-[#D4AF37] rounded-xl p-3 pr-10 text-xs sm:text-sm text-white font-mono cursor-pointer focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        try {
                          (input as any)?.showPicker?.();
                        } catch {
                          input?.focus();
                        }
                      }}
                      className="absolute right-2 p-2 text-[#D4AF37] hover:text-[#FFDF78] rounded-lg bg-[#D4AF37]/15 cursor-pointer"
                      title="Open Calendar"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Tap any date button above or click calendar icon to pick date
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Select New Slot</span>
                  </label>
                  <select
                    value={rescheduleSlot}
                    onChange={(e) => setRescheduleSlot(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-xs text-white"
                  >
                    {APP_CONFIG.booking.slots.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRescheduleBooking(null)}
                    className="flex-1 py-2.5 border border-white/10 rounded-xl text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={rescheduling}
                    onClick={handleExecuteReschedule}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs rounded-xl uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md"
                  >
                    {rescheduling ? 'Updating...' : 'Confirm Reschedule'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Appointment Confirmation Modal */}
        {confirmCancelBooking && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-md bg-[#0D1527] border-2 border-red-500/60 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center mx-auto text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-['Cinzel'] text-xl font-bold text-white">
                  Cancel Appointment?
                </h4>
                <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                  Are you sure you want to cancel booking <strong className="text-[#FFDF78] font-mono">{confirmCancelBooking.bookingId}</strong>?
                </p>
                <div className="mt-3 p-3 bg-[#070B14] rounded-xl border border-white/10 text-left text-xs font-mono space-y-1">
                  <div>Date: <strong className="text-white">{formatDateDDMMYYYY(confirmCancelBooking.date)}</strong></div>
                  <div>Slot: <strong className="text-white">{confirmCancelBooking.slot}</strong></div>
                  <div>Services: <span className="text-gray-300 font-sans">{confirmCancelBooking.services.map((s) => s.name).join(', ')}</span></div>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  The reserved seat capacity will be released immediately so other guests can book.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setConfirmCancelBooking(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={executeCancelBooking}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Confirmation Thank You Screen */}
        {rescheduleSuccessBooking && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-md bg-[#0D1527] border-2 border-[#D4AF37] rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-[0_0_50px_rgba(212,175,55,0.3)]">
              <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden border border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.4)] bg-[#070B14]">
                <img
                  src="/logo.png"
                  onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
                  alt="Trim & Twisted Logo"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-xs font-black uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>SUCCESSFULLY RESCHEDULED ✓</span>
              </div>

              <div>
                <h3 className="font-['Cinzel'] text-xl sm:text-2xl font-bold text-[#FFDF78]">
                  Thank You, {rescheduleSuccessBooking.customerName}!
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  Your appointment has been successfully rescheduled in our salon system.
                </p>
              </div>

              {/* Summary Card with DD/MM/YYYY */}
              <div className="p-4 rounded-2xl bg-[#070B14] border border-[#D4AF37]/40 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-gray-400">BOOKING ID:</span>
                  <span className="font-bold text-[#FFDF78] text-sm">{rescheduleSuccessBooking.bookingId}</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span>Guest:</span>
                  <span className="text-white font-sans font-semibold">{rescheduleSuccessBooking.customerName}</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span>Phone:</span>
                  <span className="text-white">{rescheduleSuccessBooking.customerPhone}</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span>New Date:</span>
                  <span className="text-[#FFDF78] font-bold text-sm">{formatDateDDMMYYYY(rescheduleSuccessBooking.date)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span>New Timing:</span>
                  <span className="text-white font-semibold">{rescheduleSuccessBooking.slot}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10 text-gray-300">
                  <span>Payable at Salon:</span>
                  <span className="text-[#FFDF78] font-bold text-sm">₹{rescheduleSuccessBooking.totalAmount}</span>
                </div>
              </div>

              {/* Action Buttons: Download PDF & WhatsApp */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => generateBookingVoucherPdf(rescheduleSuccessBooking)}
                  className="w-full sm:flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Voucher (PDF)</span>
                </button>

                <a
                  href={`https://wa.me/919647345945?text=${encodeURIComponent(`Hello Trim & Twisted! My appointment has been RESCHEDULED:
• Booking ID: ${rescheduleSuccessBooking.bookingId}
• Name: ${rescheduleSuccessBooking.customerName}
• Phone: ${rescheduleSuccessBooking.customerPhone}
• New Date: ${formatDateDDMMYYYY(rescheduleSuccessBooking.date)}
• New Slot: ${rescheduleSuccessBooking.slot}
• Status: RESCHEDULED`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:flex-1 py-3 px-3 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>WhatsApp Owner</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setRescheduleSuccessBooking(null)}
                className="text-xs text-gray-400 hover:text-white underline underline-offset-4 pt-1"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
