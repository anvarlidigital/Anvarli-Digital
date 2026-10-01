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
  doc,
  updateDoc,
  runTransaction
} from 'firebase/firestore';
import { generateBookingVoucherPdf } from '../utils/voucherPdf';
import { sendEmailOtp, sendSmsOtp, verifyOtp } from '../services/otp';
import {
  AlertCircle,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Gift,
  History,
  MessageCircle,
  Share2,
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
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  isOpen,
  onClose,
  settings,
  onRefreshBookings,
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

  // Sync profile details
  useEffect(() => {
    if (profile) {
      setEditName(profile.name || '');
      setEditPhone(profile.phone || '');
      setEditEmail(profile.email || '');
    }
  }, [profile]);

  // Minimum advance date for reschedule (2 days ahead)
  const minAdvanceDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (APP_CONFIG.booking.minAdvanceDays || 2));
    return d.toISOString().split('T')[0];
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
    });
    setProfileSavedMsg('Profile changes saved.');
    setTimeout(() => setProfileSavedMsg(null), 3000);
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

  // Check Cancellation Rule (admin-configurable window, default 24h)
  const canCancelOrReschedule = (booking: BookingItem) => {
    if (booking.status === 'Cancelled' || booking.status === 'Completed') return false;

    const windowHours = settings?.cancellationHours || APP_CONFIG.booking.cancellationWindowHours;
    const appointmentDate = new Date(`${booking.date}T10:00:00`);
    const diffMs = appointmentDate.getTime() - Date.now();
    const diffHours = diffMs / (1000 * 60 * 60);

    return diffHours >= windowHours;
  };

  // Cancel Booking
  const handleCancelBooking = async (booking: BookingItem) => {
    try {
      // 1. Release capacity in slotUsage
      const slotKey = booking.slotKey || `${booking.date}_${encodeURIComponent(booking.slot)}`;
      const slotUsageRef = doc(db, 'slotUsage', slotKey);
      await runTransaction(db, async (t) => {
        const snap = await t.get(slotUsageRef);
        if (snap.exists()) {
          const data = snap.data();
          if (booking.poolType === 'haircut') {
            t.update(slotUsageRef, {
              haircutCount: Math.max(0, (data.haircutCount || 1) - 1),
            });
          } else {
            t.update(slotUsageRef, {
              otherCount: Math.max(0, (data.otherCount || 1) - 1),
            });
          }
        }
      });

      // 2. Mark booking as Cancelled
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, {
        status: 'Cancelled',
      });

      // Update state
      setUserBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: 'Cancelled' } : b))
      );
      onRefreshBookings();

      // Open WhatsApp with CANCELLED status notification
      const cancelMsg = `Hello Trim & Twisted. Please note that my appointment has been CANCELLED:
• Booking ID: ${booking.bookingId}
• Name: ${booking.customerName}
• Scheduled: ${booking.date} (${booking.slot})
• Status: CANCELLED`;

      window.open(`https://wa.me/919647345945?text=${encodeURIComponent(cancelMsg)}`, '_blank');
    } catch (e: any) {
      console.error('Cancellation error:', e);
    }
  };

  // Perform Reschedule
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
      const oldSlotKey = rescheduleBooking.slotKey;
      const newSlotKey = `${rescheduleDate}_${encodeURIComponent(rescheduleSlot)}`;

      const oldSlotRef = doc(db, 'slotUsage', oldSlotKey);
      const newSlotRef = doc(db, 'slotUsage', newSlotKey);

      const haircutCap = settings?.haircutCapacity || APP_CONFIG.booking.haircutPoolCapacity;
      const otherCap = settings?.otherCapacity || APP_CONFIG.booking.otherPoolCapacity;

      // Atomic transaction: free old slot, allocate new slot
      await runTransaction(db, async (t) => {
        // Read new slot
        const newSnap = await t.get(newSlotRef);
        const newData = newSnap.exists() ? newSnap.data() : { haircutCount: 0, otherCount: 0 };

        if (rescheduleBooking.poolType === 'haircut') {
          if ((newData.haircutCount || 0) >= haircutCap) {
            throw new Error('Target slot haircut pool is full.');
          }
          t.set(
            newSlotRef,
            {
              date: rescheduleDate,
              slot: rescheduleSlot,
              haircutCount: (newData.haircutCount || 0) + 1,
              otherCount: newData.otherCount || 0,
            },
            { merge: true }
          );
        } else {
          if ((newData.otherCount || 0) >= otherCap) {
            throw new Error('Target slot care pool is full.');
          }
          t.set(
            newSlotRef,
            {
              date: rescheduleDate,
              slot: rescheduleSlot,
              haircutCount: newData.haircutCount || 0,
              otherCount: (newData.otherCount || 0) + 1,
            },
            { merge: true }
          );
        }

        // Decrement old slot if different
        if (oldSlotKey !== newSlotKey) {
          const oldSnap = await t.get(oldSlotRef);
          if (oldSnap.exists()) {
            const oldData = oldSnap.data();
            if (rescheduleBooking.poolType === 'haircut') {
              t.update(oldSlotRef, {
                haircutCount: Math.max(0, (oldData.haircutCount || 1) - 1),
              });
            } else {
              t.update(oldSlotRef, {
                otherCount: Math.max(0, (oldData.otherCount || 1) - 1),
              });
            }
          }
        }
      });

      // Update Booking Document with Reschedule History
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

      const bookingDocRef = doc(db, 'bookings', rescheduleBooking.id);
      await updateDoc(bookingDocRef, {
        date: rescheduleDate,
        slot: rescheduleSlot,
        slotKey: newSlotKey,
        status: 'Rescheduled',
        history: changeHistory,
      });

      setUserBookings((prev) =>
        prev.map((b) => (b.id === rescheduleBooking.id ? updatedBooking : b))
      );

      // Notify owner via WhatsApp with clearly marked RESCHEDULED status
      const msg = `Notice: Appointment RESCHEDULED
• Booking ID: ${rescheduleBooking.bookingId}
• Name: ${rescheduleBooking.customerName}
• OLD Schedule: ${rescheduleBooking.date} (${rescheduleBooking.slot})
• NEW Schedule: ${rescheduleDate} (${rescheduleSlot})
• Status: RESCHEDULED`;

      window.open(`https://wa.me/919647345945?text=${encodeURIComponent(msg)}`, '_blank');

      // Auto download new updated voucher with RESCHEDULED header
      generateBookingVoucherPdf(updatedBooking);

      setRescheduleBooking(null);
      onRefreshBookings();
    } catch (err: any) {
      setRescheduleError(err?.message || 'Reschedule failed.');
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0D1527] border-2 border-[#D4AF37]/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(212,175,55,0.25)] text-[#F3EFE0] my-8">
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

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#070B14] border border-[#D4AF37]/40 text-center">
              <span className="text-[10px] uppercase text-gray-400 font-mono block">Loyalty Points</span>
              <span className="text-xl font-mono font-bold text-[#FFDF78]">{profile.loyaltyPoints || 100}</span>
            </div>
            <button
              onClick={() => { signOut(); onClose(); }}
              className="py-2.5 px-4 rounded-xl border border-white/10 hover:border-red-500/50 text-xs text-gray-400 hover:text-red-300 transition-colors"
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
                          {booking.date}
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
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Email Address (Modifying triggers OTP verification)
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-xs text-white"
                />
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

              <div className="p-3 bg-[#070B14] rounded-xl text-xs text-gray-300 mb-4">
                <span>Current Schedule: </span>
                <span className="font-semibold text-white">
                  {rescheduleBooking.date} • {rescheduleBooking.slot}
                </span>
              </div>

              {rescheduleError && (
                <div className="mb-4 p-2.5 bg-red-950/70 border border-red-500 rounded-xl text-xs text-red-200">
                  {rescheduleError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    New Date (Min 2 days ahead)
                  </label>
                  <input
                    type="date"
                    min={minAdvanceDate}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    New Slot
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
                    className="flex-1 py-2.5 border border-white/10 rounded-xl text-xs text-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={rescheduling}
                    onClick={handleExecuteReschedule}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs rounded-xl uppercase tracking-wider hover:brightness-110"
                  >
                    {rescheduling ? 'Updating...' : 'Confirm Reschedule'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
