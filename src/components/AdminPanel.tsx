import React, { useState, useEffect, useMemo } from 'react';
import { APP_CONFIG } from '../config';
import type {
  ServiceItem,
  CategoryItem,
  BookingItem,
  ReviewItem,
  StaffItem,
  SalaryPaymentItem,
  CouponItem,
  GalleryItem,
  SalonSettings
} from '../types';
import { db, uploadImageOrMedia, resyncOfficialServicesMenu } from '../services/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  runTransaction
} from 'firebase/firestore';
import { sha256, generateSalt } from '../utils/crypto';
import { jsPDF } from 'jspdf';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageCircle,
  MessageSquare,
  Plus,
  Scissors,
  Settings,
  Sparkles,
  Star,
  Tag,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Video,
  X
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onRefreshData }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const session = sessionStorage.getItem('tt_admin_session');
    if (!session) return false;
    try {
      const parsed = JSON.parse(session);
      return Date.now() < parsed.expiresAt;
    } catch {
      return false;
    }
  });

  // Login Form States (Dual Masked Inputs)
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Forgot Password States
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Active Admin Tab
  const [adminTab, setAdminTab] = useState<
    'dashboard' | 'sales' | 'services' | 'bookings' | 'staff' | 'gallery' | 'coupons' | 'reviews' | 'customers' | 'settings'
  >('dashboard');

  // Salon Data Collections
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPaymentItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [settings, setSettings] = useState<SalonSettings | null>(null);

  // Loading state
  const [loadingData, setLoadingData] = useState(false);

  // Load all admin data from Firestore
  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      // 1. Bookings
      const bSnap = await getDocs(collection(db, 'bookings'));
      const bList: BookingItem[] = [];
      bSnap.forEach((d) => bList.push({ id: d.id, ...(d.data() as any) }));
      bList.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      setBookings(bList);

      // 2. Services
      const sSnap = await getDocs(collection(db, 'services'));
      const sList: ServiceItem[] = [];
      sSnap.forEach((d) => sList.push({ id: d.id, ...(d.data() as any) }));
      sList.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setServices(sList);

      // 3. Categories
      const cSnap = await getDocs(collection(db, 'categories'));
      const cList: CategoryItem[] = [];
      cSnap.forEach((d) => cList.push({ id: d.id, ...(d.data() as any) }));
      cList.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setCategories(cList);

      // 4. Staff
      const stSnap = await getDocs(collection(db, 'staff'));
      const stList: StaffItem[] = [];
      stSnap.forEach((d) => stList.push({ id: d.id, ...(d.data() as any) }));
      setStaff(stList);

      // 5. Salary Payments
      const salSnap = await getDocs(collection(db, 'salaryPayments'));
      const salList: SalaryPaymentItem[] = [];
      salSnap.forEach((d) => salList.push({ id: d.id, ...(d.data() as any) }));
      setSalaryPayments(salList);

      // 6. Coupons
      const cpSnap = await getDocs(collection(db, 'coupons'));
      const cpList: CouponItem[] = [];
      cpSnap.forEach((d) => cpList.push({ id: d.id, ...(d.data() as any) }));
      setCoupons(cpList);

      // 7. Gallery
      const gSnap = await getDocs(collection(db, 'gallery'));
      const gList: GalleryItem[] = [];
      gSnap.forEach((d) => gList.push({ id: d.id, ...(d.data() as any) }));
      gList.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setGallery(gList);

      // 8. Reviews
      const rSnap = await getDocs(collection(db, 'reviews'));
      const rList: ReviewItem[] = [];
      rSnap.forEach((d) => rList.push({ id: d.id, ...(d.data() as any) }));
      setReviews(rList);

      // 9. Settings
      const setDocSnap = await getDoc(doc(db, 'settings', 'general'));
      if (setDocSnap.exists()) {
        setSettings(setDocSnap.data() as SalonSettings);
      }
    } catch (err) {
      console.warn('Admin fetch error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchAllData();
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  // Handle Admin Login with Hashed Credentials & 15-min lockout after 5 failed attempts
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const authRef = doc(db, 'adminAuth', 'config');
      const snap = await getDoc(authRef);

      if (!snap.exists()) {
        setLoginError('Admin authentication configuration missing. Please initialize app.');
        return;
      }

      const authData = snap.data();

      // Check lockout timer
      const now = Date.now();
      if (authData.lockedUntil && now < authData.lockedUntil) {
        const remainingMinutes = Math.ceil((authData.lockedUntil - now) / 60000);
        setLoginError(`Account temporarily locked due to failed attempts. Try again in ${remainingMinutes} mins.`);
        return;
      }

      const inputUsernameHash = await sha256(usernameInput.trim().toLowerCase(), authData.salt);
      const inputPasswordHash = await sha256(passwordInput, authData.salt);

      if (
        inputUsernameHash === authData.usernameHash &&
        inputPasswordHash === authData.passwordHash
      ) {
        // Successful login: Reset failures, establish 12-hour session
        await updateDoc(authRef, {
          failedAttempts: 0,
          lockedUntil: 0,
        });

        const session = {
          authenticated: true,
          expiresAt: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
        };
        sessionStorage.setItem('tt_admin_session', JSON.stringify(session));
        setIsAuthenticated(true);
      } else {
        // Failed attempt counter
        const fails = (authData.failedAttempts || 0) + 1;
        let updatePayload: any = { failedAttempts: fails };

        if (fails >= 5) {
          updatePayload.lockedUntil = now + 15 * 60 * 1000; // 15 mins lock
          await updateDoc(authRef, updatePayload);
          setLoginError('5 failed attempts. Login locked for 15 minutes for security.');
        } else {
          await updateDoc(authRef, updatePayload);
          setLoginError(`Invalid admin credentials. ${5 - fails} attempts remaining.`);
        }
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Login error occurred.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Forgot Password Step 1: Security Question (Hometown)
  const handleVerifySecurityQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    const cleaned = securityAnswer.trim().toLowerCase();

    // Accept Chakdaha or Chakdah (case-insensitive and trimmed)
    if (cleaned === 'chakdaha' || cleaned === 'chakdah') {
      setForgotStep(2);
    } else {
      setForgotError('Incorrect answer. Please try again.');
    }
  };

  // Forgot Password Step 2: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (newPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    try {
      const authRef = doc(db, 'adminAuth', 'config');
      const snap = await getDoc(authRef);
      const salt = snap.exists() ? snap.data().salt || generateSalt(16) : generateSalt(16);
      const passwordHash = await sha256(newPassword, salt);

      await updateDoc(authRef, {
        passwordHash,
        failedAttempts: 0,
        lockedUntil: 0,
        updatedAt: new Date().toISOString(),
      });

      setForgotSuccess(true);
      setTimeout(() => {
        setForgotOpen(false);
        setForgotStep(1);
        setForgotSuccess(false);
        setSecurityAnswer('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2500);
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to update password.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('tt_admin_session');
    setIsAuthenticated(false);
    setUsernameInput('');
    setPasswordInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in overflow-hidden">
      <div className="relative w-full max-w-7xl h-[95vh] bg-[#0A101D] border-2 border-[#D4AF37]/50 rounded-3xl shadow-[0_0_80px_rgba(212,175,55,0.25)] text-[#F3EFE0] flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4AF37]/30 bg-[#070B14]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#070B14] flex items-center justify-center font-bold">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <span className="font-['Cinzel'] text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#FFDF78] to-[#AA7C11]">
                TRIM & TWISTED &bull; MANAGEMENT CONSOLE
              </span>
              <span className="block text-[10px] text-gray-400 font-mono">
                Admin Control Room &bull; Chakdaha Lounge
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="py-1.5 px-3 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area: Auth View OR Management View */}
        {!isAuthenticated ? (
          /* Masked Admin Login View */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md p-8 rounded-3xl bg-[#0D1527] border border-[#D4AF37]/40 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.3)] bg-[#070B14] mx-auto mb-3">
                  <img
                    src="/logo.png"
                    onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
                    alt="Trim & Twisted Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-['Cinzel'] text-2xl font-bold text-white">
                  Owner Authentication
                </h3>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  Dual-masked credentials &bull; SHA-256 salted encryption
                </p>
              </div>

              {loginError && (
                <div className="mb-4 p-3 bg-red-950/70 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                {/* Dual Masked Username (type="password", autocomplete="off") */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1 font-mono">
                    ADMIN IDENTITY PASSKEY (MASKED)
                  </label>
                  <input
                    type="password"
                    autoComplete="off"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] font-mono tracking-widest"
                  />
                </div>

                {/* Dual Masked Password (type="password", autocomplete="off") */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1 font-mono">
                    ADMIN SECURITY KEY (MASKED)
                  </label>
                  <input
                    type="password"
                    autoComplete="off"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] font-mono tracking-widest"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#FFF0A5] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50"
                >
                  {loginLoading ? 'Verifying Secure Hash...' : 'Authorize Entry'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setForgotOpen(true); setForgotStep(1); setForgotError(null); }}
                    className="text-xs text-[#FFDF78] hover:underline font-mono"
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Admin CRM Dashboard */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-[#070B14] border-r border-[#D4AF37]/20 flex flex-row md:flex-col p-3 gap-1 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'sales', label: 'Sales Reports', icon: BarChart3 },
                { id: 'services', label: 'Services Menu', icon: Scissors },
                { id: 'bookings', label: 'Bookings CRM', icon: Calendar },
                { id: 'staff', label: 'Staff & Salaries', icon: Users },
                { id: 'gallery', label: 'Media Gallery', icon: ImageIcon },
                { id: 'coupons', label: 'Coupons Engine', icon: Tag },
                { id: 'reviews', label: 'Reviews Moderation', icon: MessageSquare },
                { id: 'customers', label: 'Customer Directory', icon: UserCheck },
                { id: 'settings', label: 'Salon Settings', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = adminTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAdminTab(tab.id as any)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all text-left ${
                      active
                        ? 'bg-[#D4AF37] text-[#070B14] shadow-md font-bold'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </aside>

            {/* Main Tab Workspace */}
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#0A101D]">
              {adminTab === 'dashboard' && (
                <AdminDashboardOverview
                  bookings={bookings}
                  services={services}
                  staff={staff}
                  onNavigateTab={(t) => setAdminTab(t as any)}
                  onRefresh={fetchAllData}
                />
              )}

              {adminTab === 'sales' && (
                <AdminSalesReport bookings={bookings} staff={staff} services={services} />
              )}

              {adminTab === 'services' && (
                <AdminServicesManager
                  services={services}
                  categories={categories}
                  onRefresh={() => { fetchAllData(); onRefreshData(); }}
                />
              )}

              {adminTab === 'bookings' && (
                <AdminBookingsManager
                  bookings={bookings}
                  services={services}
                  staff={staff}
                  settings={settings}
                  onRefresh={() => { fetchAllData(); onRefreshData(); }}
                />
              )}

              {adminTab === 'staff' && (
                <AdminStaffManager
                  staff={staff}
                  salaryPayments={salaryPayments}
                  onRefresh={fetchAllData}
                />
              )}

              {adminTab === 'gallery' && (
                <AdminGalleryManager
                  gallery={gallery}
                  onRefresh={() => { fetchAllData(); onRefreshData(); }}
                />
              )}

              {adminTab === 'coupons' && (
                <AdminCouponsManager
                  coupons={coupons}
                  onRefresh={() => { fetchAllData(); onRefreshData(); }}
                />
              )}

              {adminTab === 'reviews' && (
                <AdminReviewsManager
                  reviews={reviews}
                  onRefresh={() => { fetchAllData(); onRefreshData(); }}
                />
              )}

              {adminTab === 'customers' && (
                <AdminCustomersManager bookings={bookings} />
              )}

              {adminTab === 'settings' && (
                <AdminSettingsManager
                  settings={settings}
                  onRefresh={() => { fetchAllData(); onRefreshData(); }}
                />
              )}
            </main>
          </div>
        )}

        {/* Forgot Password Modal */}
        {forgotOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#0D1527] border-2 border-[#D4AF37] rounded-3xl p-6 sm:p-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-['Cinzel'] text-xl font-bold text-[#FFDF78]">
                  Password Recovery
                </h4>
                <button
                  onClick={() => setForgotOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {forgotError && (
                <div className="mb-4 p-2.5 bg-red-950/70 border border-red-500 rounded-xl text-xs text-red-200">
                  {forgotError}
                </div>
              )}

              {forgotSuccess ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-white">Password Updated Successfully!</p>
                  <p className="text-xs text-gray-400">
                    From now on, ONLY your new password works. Redirecting to login...
                  </p>
                </div>
              ) : forgotStep === 1 ? (
                /* Step 1: Security Question: Hometown */
                <form onSubmit={handleVerifySecurityQuestion} className="space-y-4">
                  <div className="p-3 bg-[#070B14] rounded-xl border border-white/10">
                    <span className="text-[11px] text-gray-400 uppercase font-mono block">Security Question:</span>
                    <p className="text-sm font-semibold text-[#FFDF78] mt-0.5">What is your home town?</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1 font-mono">
                      SECURITY ANSWER (MASKED) *
                    </label>
                    <input
                      type="password"
                      autoComplete="off"
                      required
                      placeholder="Enter security answer (masked)"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-xs text-white tracking-widest font-mono focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#D4AF37] text-[#070B14] font-bold text-xs uppercase tracking-wider"
                  >
                    Verify Answer
                  </button>
                </form>
              ) : (
                /* Step 2: Set New Password & Confirm Password */
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      New Password (Min 8 chars)
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider"
                  >
                    Save New Password
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT 1: ADMIN DASHBOARD OVERVIEW
   ========================================================================= */
const AdminDashboardOverview: React.FC<{
  bookings: BookingItem[];
  services: ServiceItem[];
  staff: StaffItem[];
  onNavigateTab: (tab: string) => void;
  onRefresh: () => void;
}> = ({ bookings, services, staff, onNavigateTab }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const todayBookings = bookings.filter((b) => b.date === todayStr);
  const completedBookings = bookings.filter((b) => b.status === 'Completed');
  const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const activeStylists = staff.filter((s) => s.status !== 'Former');

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#070B14] border border-[#D4AF37]/40 flex flex-col justify-between">
          <span className="text-xs text-gray-400 uppercase font-mono">Today&apos;s Bookings</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-bold text-[#FFDF78]">{todayBookings.length}</span>
            <span className="text-xs text-emerald-400">Scheduled today</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#070B14] border border-[#D4AF37]/40 flex flex-col justify-between">
          <span className="text-xs text-gray-400 uppercase font-mono">Completed Revenue</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-bold text-[#FFDF78]">₹{totalRevenue}</span>
            <span className="text-xs text-gray-400">From completed</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#070B14] border border-[#D4AF37]/40 flex flex-col justify-between">
          <span className="text-xs text-gray-400 uppercase font-mono">Total Appointments</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-bold text-white">{bookings.length}</span>
            <span className="text-xs text-emerald-400">In database</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#070B14] border border-[#D4AF37]/40 flex flex-col justify-between">
          <span className="text-xs text-gray-400 uppercase font-mono">Active Stylists</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-bold text-[#FFDF78]">{activeStylists.length}</span>
            <span className="text-xs text-gray-400">On duty</span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onNavigateTab('bookings')}
          className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#070B14] font-bold text-xs uppercase"
        >
          View Bookings Queue
        </button>
        <button
          onClick={() => onNavigateTab('sales')}
          className="px-4 py-2 rounded-xl bg-[#0E1628] border border-white/20 text-white font-semibold text-xs"
        >
          Generate Sales Reports
        </button>
        <button
          onClick={() => onNavigateTab('services')}
          className="px-4 py-2 rounded-xl bg-[#0E1628] border border-white/20 text-white font-semibold text-xs"
        >
          Manage Menu & Pricing
        </button>
      </div>

      {/* Recent Appointments Preview */}
      <div className="p-5 rounded-2xl bg-[#070B14] border border-white/10">
        <h4 className="font-['Cinzel'] text-base font-bold text-white mb-4">
          Latest Appointments
        </h4>

        <div className="space-y-3">
          {bookings.slice(0, 5).map((b) => (
            <div
              key={b.id}
              className="p-3.5 rounded-xl bg-[#0E1628] border border-white/5 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-mono text-[#FFDF78] font-bold mr-2">{b.bookingId}</span>
                <span className="text-white font-medium">{b.customerName}</span>
                <span className="text-gray-400 ml-2">({b.customerPhone})</span>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {b.date} &bull; {b.slot} &bull; {b.services.map((s) => s.name).join(', ')}
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-white block">₹{b.totalAmount}</span>
                <span className="text-[10px] uppercase font-bold text-[#FFDF78]">{b.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT 2: SALES REPORTS & CHARTS (CSV & PDF EXPORT)
   ========================================================================= */
const AdminSalesReport: React.FC<{
  bookings: BookingItem[];
  staff: StaffItem[];
  services: ServiceItem[];
}> = ({ bookings }) => {
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const filteredBookings = useMemo(() => {
    const completed = bookings.filter((b) => b.status === 'Completed');
    if (dateRange === 'all') return completed;

    const today = new Date().toISOString().split('T')[0];
    if (dateRange === 'today') {
      return completed.filter((b) => b.date === today);
    }
    // Simple filter
    return completed;
  }, [bookings, dateRange]);

  const totalRevenue = useMemo(() => {
    return filteredBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  }, [filteredBookings]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Booking ID', 'Customer Name', 'Phone', 'Date', 'Slot', 'Services', 'Amount'];
    const rows = filteredBookings.map((b) => [
      b.bookingId,
      `"${b.customerName}"`,
      b.customerPhone,
      b.date,
      `"${b.slot}"`,
      `"${b.services.map((s) => s.name).join('; ')}"`,
      b.totalAmount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TrimTwisted_SalesReport_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF Report
  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.text('Trim & Twisted - Completed Sales Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Completed Bookings: ${filteredBookings.length}`, 14, 34);
    doc.text(`Total Revenue: INR ${totalRevenue}`, 14, 40);

    let y = 50;
    filteredBookings.slice(0, 25).forEach((b) => {
      doc.text(`${b.bookingId} | ${b.date} | ${b.customerName} | INR ${b.totalAmount}`, 14, y);
      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`TrimTwisted_SalesReport_${dateRange}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-['Cinzel'] text-xl font-bold text-white">Sales & Revenue Reports</h3>
          <p className="text-xs text-gray-400">Revenue counted strictly from Completed appointments.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-[#070B14] border border-white/20 text-xs text-white hover:border-[#D4AF37] flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-xl bg-[#D4AF37] text-[#070B14] text-xs font-bold uppercase flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#070B14] border border-[#D4AF37]/30 flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-400 uppercase font-mono">Total Completed Revenue</span>
          <span className="font-mono text-3xl font-bold text-[#FFDF78] block mt-1">₹{totalRevenue}</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400 uppercase font-mono">Completed Visits</span>
          <span className="font-mono text-3xl font-bold text-white block mt-1">{filteredBookings.length}</span>
        </div>
      </div>

      {/* Breakdown List */}
      <div className="p-5 rounded-2xl bg-[#070B14] border border-white/10">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Completed Appointments Ledger
        </h4>

        {filteredBookings.length === 0 ? (
          <p className="text-xs text-gray-500 py-4">No completed bookings yet.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-xl bg-[#0E1628] border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono text-[#FFDF78] font-bold mr-2">{b.bookingId}</span>
                  <span className="text-white font-medium">{b.customerName}</span>
                  <span className="text-gray-400 text-[11px] block mt-0.5">{b.date} &bull; {b.slot}</span>
                </div>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  ₹{b.totalAmount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT 3: SERVICES & CATEGORIES MANAGER (CRUD)
   ========================================================================= */
const AdminServicesManager: React.FC<{
  services: ServiceItem[];
  categories: CategoryItem[];
  onRefresh: () => void;
}> = ({ services, categories, onRefresh }) => {
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Gents');
  const [price, setPrice] = useState<string>('');
  const [priceLabel, setPriceLabel] = useState('');
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [note, setNote] = useState('');
  const [isHaircut, setIsHaircut] = useState(false);
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);

  // Category Manager modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [syncingMenu, setSyncingMenu] = useState(false);

  const handleSyncMenu = async () => {
    setSyncingMenu(true);
    try {
      await resyncOfficialServicesMenu();
      onRefresh();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSyncingMenu(false);
    }
  };

  const openEdit = (s: ServiceItem) => {
    setEditingService(s);
    setIsAddingNew(false);
    setName(s.name);
    setCategory(s.category);
    setPrice(s.price !== null ? String(s.price) : '');
    setPriceLabel(s.priceLabel || '');
    setOfferPrice(s.offerPrice ? String(s.offerPrice) : '');
    setNote(s.note || '');
    setIsHaircut(s.isHaircut);
    setActive(s.active !== false);
    setSortOrder(s.sortOrder || 1);
    setImage(s.image || '');
  };

  const openNew = () => {
    setEditingService(null);
    setIsAddingNew(true);
    setName('');
    setCategory(categories[0]?.name || 'Gents');
    setPrice('');
    setPriceLabel('');
    setOfferPrice('');
    setNote('');
    setIsHaircut(false);
    setActive(true);
    setSortOrder(services.length + 1);
    setImage('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: Partial<ServiceItem> = {
      name: name.trim(),
      category: category.trim(),
      price: price ? Number(price) : null,
      priceLabel: priceLabel.trim() || undefined,
      offerPrice: offerPrice ? Number(offerPrice) : undefined,
      note: note.trim() || undefined,
      isHaircut,
      active,
      sortOrder: Number(sortOrder) || 1,
      image: image || undefined,
    };

    if (editingService) {
      await updateDoc(doc(db, 'services', editingService.id), payload);
    } else {
      const id = `srv-${Date.now()}`;
      await setDoc(doc(db, 'services', id), { ...payload, id });
    }

    setEditingService(null);
    setIsAddingNew(false);
    onRefresh();
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Delete this service permanently?')) return;
    await deleteDoc(doc(db, 'services', id));
    onRefresh();
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const catId = `cat-${Date.now()}`;
    await setDoc(doc(db, 'categories', catId), {
      id: catId,
      name: newCatName.trim(),
      sortOrder: categories.length + 1,
      active: true,
    });
    setNewCatName('');
    onRefresh();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete category?')) return;
    await deleteDoc(doc(db, 'categories', id));
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-['Cinzel'] text-xl font-bold text-white">Services & Pricing Menu</h3>
          <p className="text-xs text-gray-400">
            Edit service names, prices, categories and notes. Updates public site instantly!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncMenu}
            disabled={syncingMenu}
            className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-medium text-xs flex items-center gap-1.5 transition-colors"
            title="Restore and sync official 29 services with HD photos & verified prices"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{syncingMenu ? 'Syncing...' : 'Sync Official Menu & HD Photos'}</span>
          </button>
          <button
            onClick={() => setCatModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#070B14] border border-white/20 text-xs text-white"
          >
            Manage Categories
          </button>
          <button
            onClick={openNew}
            className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#070B14] font-bold text-xs uppercase flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Services List Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#070B14]">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-[#0E1628] text-gray-400 uppercase text-[10px] font-mono border-b border-white/10">
            <tr>
              <th className="py-3 px-4">Service Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Haircut Pool</th>
              <th className="py-3 px-4">Active</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 font-medium text-white">
                  {s.name}
                  {s.note && <span className="text-[10px] text-emerald-400 block">{s.note}</span>}
                </td>
                <td className="py-3 px-4">{s.category}</td>
                <td className="py-3 px-4 font-mono font-bold text-[#FFDF78]">
                  {s.price !== null ? `₹${s.offerPrice || s.price}` : s.priceLabel}
                </td>
                <td className="py-3 px-4">
                  {s.isHaircut ? (
                    <span className="text-emerald-400 font-bold">YES</span>
                  ) : (
                    <span className="text-gray-500">NO</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {s.active !== false ? (
                    <span className="text-emerald-400">Active</span>
                  ) : (
                    <span className="text-red-400">Disabled</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    onClick={() => openEdit(s)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-[#D4AF37]/20 text-[#FFDF78]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(s.id)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit / Add Service Modal */}
      {(editingService || isAddingNew) && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0E1628] border-2 border-[#D4AF37] rounded-3xl p-6">
            <h4 className="font-['Cinzel'] text-xl font-bold text-[#FFDF78] mb-4">
              {editingService ? 'Edit Salon Service' : 'Add New Salon Service'}
            </h4>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 499"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">Offer Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 399"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">Price Label</label>
                  <input
                    type="text"
                    placeholder="Starting / 10%"
                    value={priceLabel}
                    onChange={(e) => setPriceLabel(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Special Note</label>
                <input
                  type="text"
                  placeholder="e.g. Underarms wax free"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHaircut}
                    onChange={(e) => setIsHaircut(e.target.checked)}
                    className="w-4 h-4 rounded text-[#D4AF37]"
                  />
                  <span>Counts as Haircut Pool (Max 3)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#D4AF37]"
                  />
                  <span>Active & Visible</span>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setEditingService(null); setIsAddingNew(false); }}
                  className="flex-1 py-2.5 border border-white/10 rounded-xl text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#D4AF37] text-[#070B14] font-bold rounded-xl uppercase tracking-wider"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0E1628] border-2 border-[#D4AF37] rounded-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-['Cinzel'] text-xl font-bold text-[#FFDF78]">
                Manage Categories
              </h4>
              <button onClick={() => setCatModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#070B14] border border-white/5 text-xs"
                >
                  <span className="font-medium text-white">{c.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New Category Name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 bg-[#D4AF37] text-[#070B14] font-bold text-xs rounded-xl"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT 4: BOOKINGS MANAGER (WALK-INS, CONFIRM, CANCEL, COMPLETE)
   ========================================================================= */
const AdminBookingsManager: React.FC<{
  bookings: BookingItem[];
  services: ServiceItem[];
  staff: StaffItem[];
  settings: SalonSettings | null;
  onRefresh: () => void;
}> = ({ bookings, services, staff, onRefresh }) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('');

  // Walk-in booking modal state
  const [walkinOpen, setWalkinOpen] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinDate, setWalkinDate] = useState(new Date().toISOString().split('T')[0]);
  const [walkinSlot, setWalkinSlot] = useState(APP_CONFIG.booking.slots[0]);
  const [walkinServiceIds, setWalkinServiceIds] = useState<string[]>([]);

  const filteredBookings = bookings.filter((b) => {
    const matchStatus = filterStatus === 'All' || b.status === filterStatus;
    const matchDate = !filterDate || b.date === filterDate;
    return matchStatus && matchDate;
  });

  const handleUpdateStatus = async (
    booking: BookingItem,
    newStatus: BookingItem['status']
  ) => {
    // If cancelling, release seat capacity in slotUsage
    if (newStatus === 'Cancelled' && booking.status !== 'Cancelled') {
      const slotKey = booking.slotKey || `${booking.date}_${encodeURIComponent(booking.slot)}`;
      const slotUsageRef = doc(db, 'slotUsage', slotKey);
      try {
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
      } catch (err) {
        console.warn('Could not release slot on cancel:', err);
      }
    }

    await updateDoc(doc(db, 'bookings', booking.id), { status: newStatus });
    onRefresh();

    // Offer to notify customer via WhatsApp
    const msg = `Hello ${booking.customerName}, this is Trim & Twisted Salon. Your appointment (${booking.bookingId}) on ${booking.date} at ${booking.slot} is now ${newStatus.toUpperCase()}.`;
    window.open(`https://wa.me/91${booking.customerPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleAddWalkin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName.trim() || !walkinPhone.trim() || walkinServiceIds.length === 0) {
      alert('Please fill customer details and pick services.');
      return;
    }

    const srvObjects = services.filter((s) => walkinServiceIds.includes(s.id));
    const subtotal = srvObjects.reduce((acc, s) => acc + (s.offerPrice || s.price || 0), 0);
    const hasHaircut = srvObjects.some((s) => s.isHaircut);

    const bookingId = `TT-${walkinDate.replace(/-/g, '').substring(2)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const slotKey = `${walkinDate}_${encodeURIComponent(walkinSlot)}`;

    // Increment slot capacity for walk-in
    try {
      const slotUsageRef = doc(db, 'slotUsage', slotKey);
      await runTransaction(db, async (t) => {
        const snap = await t.get(slotUsageRef);
        const data = snap.exists() ? snap.data() : { haircutCount: 0, otherCount: 0 };
        if (hasHaircut) {
          t.set(
            slotUsageRef,
            {
              date: walkinDate,
              slot: walkinSlot,
              haircutCount: (data.haircutCount || 0) + 1,
              otherCount: data.otherCount || 0,
            },
            { merge: true }
          );
        } else {
          t.set(
            slotUsageRef,
            {
              date: walkinDate,
              slot: walkinSlot,
              haircutCount: data.haircutCount || 0,
              otherCount: (data.otherCount || 0) + 1,
            },
            { merge: true }
          );
        }
      });
    } catch (err) {
      console.warn('Walkin capacity update note:', err);
    }

    const newBooking: BookingItem = {
      id: bookingId,
      bookingId,
      customerName: walkinName.trim(),
      customerPhone: walkinPhone.trim(),
      customerEmail: '',
      serviceIds: walkinServiceIds,
      services: srvObjects.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        priceLabel: s.priceLabel,
        offerPrice: s.offerPrice,
        isHaircut: s.isHaircut,
      })),
      date: walkinDate,
      slot: walkinSlot,
      slotKey,
      poolType: hasHaircut ? 'haircut' : 'other',
      subtotal,
      discount: 0,
      totalAmount: subtotal,
      status: 'Confirmed',
      notes: 'Walk-in booking created by Admin',
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'bookings'), newBooking);
    setWalkinOpen(false);
    setWalkinName('');
    setWalkinPhone('');
    setWalkinServiceIds([]);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-['Cinzel'] text-xl font-bold text-white">Appointments & Bookings</h3>
          <p className="text-xs text-gray-400">
            Confirm, complete, reschedule or dispatch direct WhatsApp updates to patrons.
          </p>
        </div>

        <button
          onClick={() => setWalkinOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#070B14] font-bold text-xs uppercase flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Walk-in Booking</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#070B14] border border-[#D4AF37]/35 rounded-xl px-3 py-1.5 text-xs text-white"
        >
          <option value="All">All Statuses</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="Rescheduled">Rescheduled</option>
          <option value="Cancelled">Cancelled</option>
          <option value="No-show">No-show</option>
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="bg-[#070B14] border border-[#D4AF37]/35 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
        />

        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            className="text-xs text-gray-400 hover:text-white underline"
          >
            Clear Date
          </button>
        )}
      </div>

      {/* Bookings Queue */}
      <div className="space-y-3">
        {filteredBookings.map((b) => (
          <div
            key={b.id}
            className="p-4 rounded-2xl bg-[#070B14] border border-white/10 hover:border-[#D4AF37]/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-[#FFDF78] bg-[#15223C] px-2 py-0.5 rounded border border-[#D4AF37]/30">
                  {b.bookingId}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    b.status === 'Completed'
                      ? 'bg-blue-950 text-blue-300'
                      : b.status === 'Confirmed'
                      ? 'bg-emerald-950 text-emerald-300'
                      : b.status === 'Rescheduled'
                      ? 'bg-amber-950 text-amber-300'
                      : 'bg-red-950 text-red-300'
                  }`}
                >
                  {b.status}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {b.poolType === 'haircut' ? 'Haircut Pool' : 'Salon Care Pool'}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white">
                {b.customerName} &bull; <span className="text-[#FFDF78] font-mono">{b.customerPhone}</span>
              </h4>

              <p className="text-xs text-gray-400 mt-1">
                {b.date} &bull; {b.slot} &bull; {b.services.map((s) => s.name).join(', ')}
              </p>

              <div className="mt-1 font-mono text-xs text-white">
                Payable: <strong className="text-[#FFDF78]">₹{b.totalAmount}</strong>
              </div>
            </div>

            {/* Admin Status Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleUpdateStatus(b, 'Completed')}
                className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/60"
              >
                Mark Completed
              </button>

              <button
                onClick={() => handleUpdateStatus(b, 'No-show')}
                className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600 text-gray-300 text-xs font-semibold"
              >
                Mark No-Show
              </button>

              <button
                onClick={() => handleUpdateStatus(b, 'Cancelled')}
                className="px-3 py-1.5 rounded-lg bg-red-950 border border-red-500/50 text-red-300 text-xs font-semibold"
              >
                Cancel
              </button>

              <a
                href={`https://wa.me/91${b.customerPhone}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366]"
                title="Direct WhatsApp Message"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Walk-in Booking Modal */}
      {walkinOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0E1628] border-2 border-[#D4AF37] rounded-3xl p-6">
            <h4 className="font-['Cinzel'] text-xl font-bold text-[#FFDF78] mb-4">
              Add Walk-in Salon Appointment
            </h4>

            <form onSubmit={handleAddWalkin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Customer Mobile *</label>
                <input
                  type="tel"
                  required
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={walkinDate}
                    onChange={(e) => setWalkinDate(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">Slot *</label>
                  <select
                    value={walkinSlot}
                    onChange={(e) => setWalkinSlot(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                  >
                    {APP_CONFIG.booking.slots.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Select Services *</label>
                <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-[#070B14] rounded-xl border border-white/10">
                  {services.map((srv) => (
                    <label key={srv.id} className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={walkinServiceIds.includes(srv.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWalkinServiceIds([...walkinServiceIds, srv.id]);
                          } else {
                            setWalkinServiceIds(walkinServiceIds.filter((id) => id !== srv.id));
                          }
                        }}
                      />
                      <span>{srv.name} (₹{srv.offerPrice || srv.price || srv.priceLabel})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setWalkinOpen(false)}
                  className="flex-1 py-2.5 border border-white/10 rounded-xl text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#D4AF37] text-[#070B14] font-bold rounded-xl uppercase tracking-wider"
                >
                  Book Walk-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT 5: STAFF & SALARY MANAGEMENT
   ========================================================================= */
const AdminStaffManager: React.FC<{
  staff: StaffItem[];
  salaryPayments: SalaryPaymentItem[];
  onRefresh: () => void;
}> = ({ staff, salaryPayments, onRefresh }) => {
  const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null);
  const [isNewStaff, setIsNewStaff] = useState(false);

  // Staff Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [salary, setSalary] = useState('');
  const [status, setStatus] = useState<'Active' | 'Former'>('Active');
  const [photoURL, setPhotoURL] = useState('');
  const [dateJoined, setDateJoined] = useState(new Date().toISOString().split('T')[0]);

  // Salary Record Modal
  const [salaryModalStaff, setSalaryModalStaff] = useState<StaffItem | null>(null);
  const [disburseAmount, setDisburseAmount] = useState('');
  const [disburseMonth, setDisburseMonth] = useState('October 2026');
  const [disburseMode, setDisburseMode] = useState<'UPI' | 'Bank Transfer' | 'Cash'>('UPI');
  const [disburseNote, setDisburseNote] = useState('');

  const openEditStaff = (st: StaffItem) => {
    setEditingStaff(st);
    setIsNewStaff(false);
    setName(st.name);
    setPhone(st.phone);
    setRole(st.role);
    setSalary(String(st.salary));
    setStatus(st.status);
    setPhotoURL(st.photoURL || '');
    setDateJoined(st.dateJoined || '');
  };

  const openNewStaff = () => {
    setEditingStaff(null);
    setIsNewStaff(true);
    setName('');
    setPhone('');
    setRole('Stylist');
    setSalary('25000');
    setStatus('Active');
    setPhotoURL('');
    setDateJoined(new Date().toISOString().split('T')[0]);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<StaffItem> = {
      name: name.trim(),
      phone: phone.trim(),
      role: role.trim(),
      salary: Number(salary) || 0,
      status,
      photoURL: photoURL || undefined,
      dateJoined,
    };

    if (editingStaff) {
      await updateDoc(doc(db, 'staff', editingStaff.id), payload);
    } else {
      const id = `st-${Date.now()}`;
      await setDoc(doc(db, 'staff', id), { ...payload, id, totalPaid: 0 });
    }

    setEditingStaff(null);
    setIsNewStaff(false);
    onRefresh();
  };

  const handleRecordSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryModalStaff) return;

    const amt = Number(disburseAmount);
    if (!amt) return;

    const newPayment: SalaryPaymentItem = {
      id: `sal-${Date.now()}`,
      staffId: salaryModalStaff.id,
      staffName: salaryModalStaff.name,
      amount: amt,
      month: disburseMonth,
      date: new Date().toISOString().split('T')[0],
      mode: disburseMode,
      note: disburseNote.trim() || undefined,
    };

    await addDoc(collection(db, 'salaryPayments'), newPayment);

    // Update staff totalPaid
    const newTotal = (salaryModalStaff.totalPaid || 0) + amt;
    await updateDoc(doc(db, 'staff', salaryModalStaff.id), {
      totalPaid: newTotal,
    });

    setSalaryModalStaff(null);
    setDisburseAmount('');
    setDisburseNote('');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-['Cinzel'] text-xl font-bold text-white">Staff & Payroll Management</h3>
          <p className="text-xs text-gray-400">Onboard, update compensation, and log salary disbursements.</p>
        </div>

        <button
          onClick={openNewStaff}
          className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#070B14] font-bold text-xs uppercase flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Stylist</span>
        </button>
      </div>

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((st) => (
          <div
            key={st.id}
            className="p-5 rounded-2xl bg-[#070B14] border border-white/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-[#D4AF37] bg-[#0E1628] shrink-0">
                    {st.photoURL ? (
                      <img src={st.photoURL} alt={st.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[#FFDF78]">
                        {st.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{st.name}</h4>
                    <span className="text-xs text-[#D4AF37]">{st.role}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    st.status === 'Active' ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                  }`}
                >
                  {st.status}
                </span>
              </div>

              <div className="text-xs text-gray-400 space-y-1 font-mono pt-2 border-t border-white/5">
                <div>Phone: <span className="text-white">{st.phone}</span></div>
                <div>Monthly Salary: <span className="text-[#FFDF78]">₹{st.salary}</span></div>
                <div>Total Paid: <span className="text-emerald-400">₹{st.totalPaid || 0}</span></div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
              <button
                onClick={() => {
                  setSalaryModalStaff(st);
                  setDisburseAmount(String(st.salary));
                }}
                className="flex-1 py-1.5 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-xs font-semibold text-[#FFDF78]"
              >
                Log Salary
              </button>
              <button
                onClick={() => openEditStaff(st)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Staff Edit Modal */}
      {(editingStaff || isNewStaff) && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0E1628] border-2 border-[#D4AF37] rounded-3xl p-6">
            <h4 className="font-['Cinzel'] text-xl font-bold text-[#FFDF78] mb-4">
              {editingStaff ? 'Edit Staff Member' : 'Onboard New Staff Member'}
            </h4>

            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Role / Designation *</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1">Salary (₹/mo)</label>
                  <input
                    type="number"
                    required
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">Employment Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Former">Former (Fired)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setEditingStaff(null); setIsNewStaff(false); }}
                  className="flex-1 py-2.5 border border-white/10 rounded-xl text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#D4AF37] text-[#070B14] font-bold rounded-xl uppercase tracking-wider"
                >
                  Save Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Disbursement Modal */}
      {salaryModalStaff && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0E1628] border-2 border-[#D4AF37] rounded-3xl p-6">
            <h4 className="font-['Cinzel'] text-xl font-bold text-[#FFDF78] mb-2">
              Log Salary Disbursement
            </h4>
            <p className="text-xs text-gray-400 mb-4 font-mono">
              Staff: {salaryModalStaff.name} ({salaryModalStaff.role})
            </p>

            <form onSubmit={handleRecordSalary} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 mb-1">Amount Disbursed (INR) *</label>
                <input
                  type="number"
                  required
                  value={disburseAmount}
                  onChange={(e) => setDisburseAmount(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1">Month *</label>
                  <input
                    type="text"
                    required
                    value={disburseMonth}
                    onChange={(e) => setDisburseMonth(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">Payment Mode</label>
                  <select
                    value={disburseMode}
                    onChange={(e) => setDisburseMode(e.target.value as any)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Festival Puja Bonus Included"
                  value={disburseNote}
                  onChange={(e) => setDisburseNote(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSalaryModalStaff(null)}
                  className="flex-1 py-2.5 border border-white/10 rounded-xl text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#D4AF37] text-[#070B14] font-bold rounded-xl uppercase tracking-wider"
                >
                  Record Disbursed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT 6: GALLERY MEDIA MANAGER
   ========================================================================= */
const AdminGalleryManager: React.FC<{
  gallery: GalleryItem[];
  onRefresh: () => void;
}> = ({ gallery, onRefresh }) => {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Hair' | 'Bridal' | 'Spa' | 'Nails' | 'Salon Interior'>('Hair');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title.trim()) {
      alert('Please enter a caption/title for this media asset first.');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImageOrMedia(file);
      const isVid = file.type.startsWith('video');

      const newItem: GalleryItem = {
        id: `gal-${Date.now()}`,
        title: title.trim(),
        category,
        type: isVid ? 'video' : 'image',
        url,
        sortOrder: gallery.length + 1,
      };

      await addDoc(collection(db, 'gallery'), newItem);
      setTitle('');
      onRefresh();
    } catch (err: any) {
      alert('Upload error: ' + err?.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete media asset?')) return;
    await deleteDoc(doc(db, 'gallery', id));
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-['Cinzel'] text-xl font-bold text-white">Gallery & Portfolio Management</h3>
        <p className="text-xs text-gray-400">Upload images AND videos from device files to showcase on 3D public site.</p>
      </div>

      {/* Upload Box */}
      <div className="p-6 rounded-2xl bg-[#070B14] border border-[#D4AF37]/40 space-y-4 max-w-xl">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFDF78]">
          Upload Media Asset (Photos or Videos)
        </h4>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-gray-400 mb-1">Caption / Title</label>
            <input
              type="text"
              placeholder="e.g. Keratin Treatment Showcase"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0E1628] border border-white/20 rounded-xl p-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-[#0E1628] border border-white/20 rounded-xl p-2.5 text-white"
            >
              <option value="Hair">Hair</option>
              <option value="Bridal">Bridal</option>
              <option value="Spa">Spa</option>
              <option value="Nails">Nails</option>
              <option value="Salon Interior">Salon Interior</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block py-4 rounded-xl border-2 border-dashed border-[#D4AF37]/50 text-center cursor-pointer hover:bg-white/5 transition-colors">
            <span className="text-xs font-semibold text-[#FFDF78] block">
              {uploading ? 'Uploading Asset...' : 'Choose Image or Video File from Device'}
            </span>
            <span className="text-[10px] text-gray-400">PNG, JPG, MP4, WebM accepted</span>
            <input
              type="file"
              accept="image/*,video/*"
              disabled={uploading}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Gallery Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {gallery.map((item) => (
          <div
            key={item.id}
            className="group relative rounded-2xl overflow-hidden border border-white/10 bg-[#070B14] h-48"
          >
            {item.type === 'video' ? (
              <video src={item.url} className="w-full h-full object-cover" />
            ) : (
              <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
              <span className="text-[10px] text-[#FFDF78] font-mono font-bold uppercase">{item.category}</span>
              <p className="text-xs font-semibold text-white truncate">{item.title}</p>
              <button
                onClick={() => handleDelete(item.id)}
                className="self-end p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT 7: COUPONS & DISCOUNTS ENGINE
   ========================================================================= */
const AdminCouponsManager: React.FC<{
  coupons: CouponItem[];
  onRefresh: () => void;
}> = ({ coupons, onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [value, setValue] = useState('');
  const [maxCap, setMaxCap] = useState('');
  const [minBill, setMinBill] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('2026-12-31');
  const [terms, setTerms] = useState('');

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value) return;

    const newCoupon: Omit<CouponItem, 'id'> = {
      code: code.trim().toUpperCase(),
      discountType,
      value: Number(value),
      maxCap: maxCap ? Number(maxCap) : undefined,
      minBill: minBill ? Number(minBill) : undefined,
      startDate,
      endDate,
      usedCount: 0,
      terms: terms.trim() || 'Valid on all salon services.',
      active: true,
    };

    await addDoc(collection(db, 'coupons'), newCoupon);
    setModalOpen(false);
    setCode('');
    setValue('');
    onRefresh();
  };

  const handleToggleCoupon = async (coupon: CouponItem) => {
    await updateDoc(doc(db, 'coupons', coupon.id), {
      active: !coupon.active,
    });
    onRefresh();
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Delete coupon?')) return;
    await deleteDoc(doc(db, 'coupons', id));
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-['Cinzel'] text-xl font-bold text-white">Coupons & Promotion Engine</h3>
          <p className="text-xs text-gray-400">Create %, flat discount codes, caps, minimum orders and durations.</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#070B14] font-bold text-xs uppercase flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((cp) => (
          <div key={cp.id} className="p-5 rounded-2xl bg-[#070B14] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-base font-bold text-[#FFDF78] bg-[#0E1628] px-3 py-1 rounded-lg border border-[#D4AF37]/40">
                  {cp.code}
                </span>
                <button
                  onClick={() => handleToggleCoupon(cp)}
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    cp.active !== false ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                  }`}
                >
                  {cp.active !== false ? 'Active' : 'Disabled'}
                </button>
              </div>

              <div className="text-xs text-white font-medium mt-2">
                Discount: {cp.discountType === 'percentage' ? `${cp.value}% Off` : `Flat ₹${cp.value} Off`}
              </div>

              <div className="text-[11px] text-gray-400 font-mono mt-1 space-y-0.5">
                {cp.minBill && <div>Min Bill: ₹{cp.minBill}</div>}
                {cp.maxCap && <div>Max Cap: ₹{cp.maxCap}</div>}
                <div>Valid: {cp.startDate} to {cp.endDate}</div>
                <div>Times Used: {cp.usedCount || 0}</div>
              </div>

              <p className="text-[11px] text-gray-400 mt-2 italic">&ldquo;{cp.terms}&rdquo;</p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
              <button
                onClick={() => handleDeleteCoupon(cp.id)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0E1628] border-2 border-[#D4AF37] rounded-3xl p-6">
            <h4 className="font-['Cinzel'] text-xl font-bold text-[#FFDF78] mb-4">Create Promotion Coupon</h4>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1">Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 20 or 200"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1">Min Bill (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1000"
                    value={minBill}
                    onChange={(e) => setMinBill(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={maxCap}
                    onChange={(e) => setMaxCap(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Terms and Conditions</label>
                <textarea
                  rows={2}
                  placeholder="Shown to customer upon applying..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-white/10 rounded-xl text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#D4AF37] text-[#070B14] font-bold rounded-xl uppercase tracking-wider"
                >
                  Publish Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT 8: REVIEWS MODERATION & ADMIN REPLIES
   ========================================================================= */
const AdminReviewsManager: React.FC<{
  reviews: ReviewItem[];
  onRefresh: () => void;
}> = ({ reviews, onRefresh }) => {
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleUpdateStatus = async (id: string, status: ReviewItem['status']) => {
    await updateDoc(doc(db, 'reviews', id), { status });
    onRefresh();
  };

  const handleSaveReply = async (id: string) => {
    if (!replyText.trim()) return;
    await updateDoc(doc(db, 'reviews', id), {
      adminReply: replyText.trim(),
    });
    setReplyingId(null);
    setReplyText('');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-['Cinzel'] text-xl font-bold text-white">Guest Reviews Moderation</h3>
        <p className="text-xs text-gray-400">Approve, hide, or reply to patron feedback.</p>
      </div>

      <div className="space-y-4">
        {reviews.map((rev) => (
          <div key={rev.id} className="p-5 rounded-2xl bg-[#070B14] border border-white/10 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white text-sm">{rev.customerName}</h4>
                <div className="flex items-center gap-2 text-xs text-[#FFDF78] mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Avg: {rev.averageRating}★</span>
                  <span className="text-gray-400">
                    (Service: {rev.ratingService}★, Staff: {rev.ratingStaff}★, Value: {rev.ratingValue}★, Hygiene: {rev.ratingCleanliness}★)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(rev.id, 'Approved')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                    rev.status === 'Approved' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleUpdateStatus(rev.id, 'Hidden')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                    rev.status === 'Hidden' ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  Hide
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-300 italic">&ldquo;{rev.comment}&rdquo;</p>

            {rev.adminReply ? (
              <div className="p-3 bg-[#0E1628] rounded-xl text-xs text-[#FFDF78] border border-[#D4AF37]/30">
                <strong>Salon Response:</strong> {rev.adminReply}
              </div>
            ) : replyingId === rev.id ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type official salon response..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-[#0E1628] border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <button
                  onClick={() => handleSaveReply(rev.id)}
                  className="px-3 py-1.5 bg-[#D4AF37] text-[#070B14] font-bold text-xs rounded-xl"
                >
                  Reply
                </button>
                <button
                  onClick={() => setReplyingId(null)}
                  className="px-3 py-1.5 border border-white/10 text-xs text-gray-400 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setReplyingId(rev.id); setReplyText(''); }}
                className="text-xs text-[#FFDF78] hover:underline"
              >
                + Add Official Response
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT 9: CUSTOMERS DIRECTORY & HISTORY
   ========================================================================= */
const AdminCustomersManager: React.FC<{ bookings: BookingItem[] }> = ({ bookings }) => {
  // Aggregate unique customers
  const customers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; email: string; visits: number; totalSpent: number }>();
    bookings.forEach((b) => {
      const key = b.customerPhone || b.customerName;
      const existing = map.get(key);
      const spent = b.status === 'Completed' ? b.totalAmount : 0;
      if (existing) {
        existing.visits += 1;
        existing.totalSpent += spent;
      } else {
        map.set(key, {
          name: b.customerName,
          phone: b.customerPhone,
          email: b.customerEmail || 'N/A',
          visits: 1,
          totalSpent: spent,
        });
      }
    });
    return Array.from(map.values());
  }, [bookings]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-['Cinzel'] text-xl font-bold text-white">Customer Directory</h3>
        <p className="text-xs text-gray-400">Patron visits, phone contact, and spending records.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#070B14]">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-[#0E1628] text-gray-400 uppercase text-[10px] font-mono border-b border-white/10">
            <tr>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Total Visits</th>
              <th className="py-3 px-4 text-right">Lifetime Spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {customers.map((c) => (
              <tr key={c.phone} className="hover:bg-white/5">
                <td className="py-3 px-4 font-semibold text-white">{c.name}</td>
                <td className="py-3 px-4 font-mono">{c.phone}</td>
                <td className="py-3 px-4">{c.email}</td>
                <td className="py-3 px-4 font-mono">{c.visits} visit(s)</td>
                <td className="py-3 px-4 font-mono font-bold text-[#FFDF78] text-right">
                  ₹{c.totalSpent}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT 10: SALON SETTINGS (CAPACITIES, DATES, PASSWORD CHANGE)
   ========================================================================= */
const AdminSettingsManager: React.FC<{
  settings: SalonSettings | null;
  onRefresh: () => void;
}> = ({ settings, onRefresh }) => {
  const [haircutCap, setHaircutCap] = useState(settings?.haircutCapacity || 3);
  const [otherCap, setOtherCap] = useState(settings?.otherCapacity || 2);
  const [cancelHours, setCancelHours] = useState(settings?.cancellationHours || 24);
  const [offerText, setOfferText] = useState(settings?.offerBannerText || 'Durga Puja Special Offer, 1st September - 30th September');
  const [offerStart, setOfferStart] = useState(settings?.offerStartDate || '2026-09-01');
  const [offerEnd, setOfferEnd] = useState(settings?.offerEndDate || '2026-10-31');
  const [offerActive, setOfferActive] = useState(settings?.offerBannerActive !== false);
  const [blockedDateInput, setBlockedDateInput] = useState('');
  const [blockedDates, setBlockedDates] = useState<string[]>(settings?.blockedDates || []);
  const [savedMsg, setSavedMsg] = useState(false);

  // In-settings password change
  const [currentPw, setCurrentPw] = useState('');
  const [nextPw, setNextPw] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SalonSettings = {
      haircutCapacity: Number(haircutCap),
      otherCapacity: Number(otherCap),
      cancellationHours: Number(cancelHours),
      offerBannerText: offerText.trim(),
      offerStartDate: offerStart,
      offerEndDate: offerEnd,
      offerBannerActive: offerActive,
      blockedDates,
      googlePlaceId: settings?.googlePlaceId || 'ChIJ...',
      phone: settings?.phone || APP_CONFIG.phone,
      whatsappNumber: settings?.whatsappNumber || APP_CONFIG.whatsappNumber,
      address: settings?.address || APP_CONFIG.address,
    };

    await setDoc(doc(db, 'settings', 'general'), updated);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
    onRefresh();
  };

  const handleAddBlockedDate = () => {
    if (!blockedDateInput) return;
    if (!blockedDates.includes(blockedDateInput)) {
      setBlockedDates([...blockedDates, blockedDateInput]);
    }
    setBlockedDateInput('');
  };

  const handleRemoveBlockedDate = (d: string) => {
    setBlockedDates(blockedDates.filter((x) => x !== d));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (nextPw.length < 8) {
      setPwMsg('New password must be at least 8 characters.');
      return;
    }

    try {
      const authRef = doc(db, 'adminAuth', 'config');
      const snap = await getDoc(authRef);
      if (!snap.exists()) return;

      const authData = snap.data();
      const currentHash = await sha256(currentPw, authData.salt);

      if (currentHash !== authData.passwordHash) {
        setPwMsg('Current password incorrect.');
        return;
      }

      const newHash = await sha256(nextPw, authData.salt);
      await updateDoc(authRef, {
        passwordHash: newHash,
      });

      setPwMsg('Password successfully changed!');
      setCurrentPw('');
      setNextPw('');
    } catch (e: any) {
      setPwMsg('Error changing password.');
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h3 className="font-['Cinzel'] text-xl font-bold text-white">Operational Salon Settings</h3>
        <p className="text-xs text-gray-400">Control slot capacities, seasonal banners, and holiday blocks.</p>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500 rounded-xl text-xs text-emerald-300">
          Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
        {/* Pool Capacities */}
        <div className="p-5 rounded-2xl bg-[#070B14] border border-white/10 space-y-4">
          <h4 className="font-bold text-[#FFDF78] uppercase tracking-wider font-mono">
            Slot Capacity Pools
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-1">Haircut Pool Capacity / Slot</label>
              <input
                type="number"
                value={haircutCap}
                onChange={(e) => setHaircutCap(Number(e.target.value))}
                className="w-full bg-[#0E1628] border border-white/20 rounded-xl p-2.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Salon Care Pool Capacity / Slot</label>
              <input
                type="number"
                value={otherCap}
                onChange={(e) => setOtherCap(Number(e.target.value))}
                className="w-full bg-[#0E1628] border border-white/20 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Cancellation Window (Hours Before Slot)</label>
            <input
              type="number"
              value={cancelHours}
              onChange={(e) => setCancelHours(Number(e.target.value))}
              className="w-full bg-[#0E1628] border border-white/20 rounded-xl p-2.5 text-white font-mono"
            />
          </div>
        </div>

        {/* Offer Banner Settings */}
        <div className="p-5 rounded-2xl bg-[#070B14] border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-[#FFDF78] uppercase tracking-wider font-mono">
              Seasonal Offer Banner
            </h4>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={offerActive}
                onChange={(e) => setOfferActive(e.target.checked)}
              />
              <span>Banner Active</span>
            </label>
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Banner Announcement Text</label>
            <input
              type="text"
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              className="w-full bg-[#0E1628] border border-white/20 rounded-xl p-2.5 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={offerStart}
                onChange={(e) => setOfferStart(e.target.value)}
                className="w-full bg-[#0E1628] border border-white/20 rounded-xl p-2.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                value={offerEnd}
                onChange={(e) => setOfferEnd(e.target.value)}
                className="w-full bg-[#0E1628] border border-white/20 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Blocked Dates / Salon Holidays */}
        <div className="p-5 rounded-2xl bg-[#070B14] border border-white/10 space-y-3">
          <h4 className="font-bold text-[#FFDF78] uppercase tracking-wider font-mono">
            Blocked Dates / Holidays
          </h4>

          <div className="flex gap-2">
            <input
              type="date"
              value={blockedDateInput}
              onChange={(e) => setBlockedDateInput(e.target.value)}
              className="bg-[#0E1628] border border-white/20 rounded-xl p-2 text-white font-mono text-xs"
            />
            <button
              type="button"
              onClick={handleAddBlockedDate}
              className="px-4 py-2 bg-[#D4AF37] text-[#070B14] font-bold rounded-xl"
            >
              Block Date
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {blockedDates.map((d) => (
              <span key={d} className="px-3 py-1 bg-red-950/70 border border-red-500/40 rounded-lg text-red-200 flex items-center gap-1.5">
                <span>{d}</span>
                <button type="button" onClick={() => handleRemoveBlockedDate(d)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="py-3 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider shadow-md"
        >
          Save Operational Settings
        </button>
      </form>

      {/* Change Password Box */}
      <div className="p-5 rounded-2xl bg-[#070B14] border border-white/10 space-y-4">
        <h4 className="font-bold text-[#FFDF78] uppercase tracking-wider font-mono">
          Update Admin Password
        </h4>

        {pwMsg && (
          <div className="p-2.5 bg-amber-950/70 border border-amber-500 rounded-xl text-xs text-amber-200">
            {pwMsg}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
          <div>
            <label className="block text-gray-300 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="w-full bg-[#0E1628] border border-white/20 rounded-xl p-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">New Password (Min 8 chars)</label>
            <input
              type="password"
              required
              value={nextPw}
              onChange={(e) => setNextPw(e.target.value)}
              className="w-full bg-[#0E1628] border border-white/20 rounded-xl p-2.5 text-white"
            />
          </div>

          <button
            type="submit"
            className="py-2.5 px-4 bg-white/10 hover:bg-[#D4AF37]/20 border border-white/20 text-white hover:text-[#FFDF78] rounded-xl font-bold"
          >
            Update Admin Password
          </button>
        </form>
      </div>
    </div>
  );
};
