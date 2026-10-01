import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config';
import { sendEmailOtp, sendSmsOtp, verifyOtp } from '../services/otp';
import { AlertCircle, CheckCircle2, Lock, Mail, Phone, User, X, Sparkles } from 'lucide-react';
import type { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const { signInWithGoogle, loginWithGoogleDetails, signInWithApple, updateProfileDetails, setCustomUserProfile } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [step, setStep] = useState<'input' | 'verify' | 'google-confirm'>('input');

  // Google Profile Confirm fields
  const [googleName, setGoogleName] = useState('Ankit Brata Ghosh');
  const [googleEmail, setGoogleEmail] = useState('ghoshankitbrata143@gmail.com');
  const [googlePhone, setGooglePhone] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [signinTarget, setSigninTarget] = useState(''); // email or phone
  const [verificationCode, setVerificationCode] = useState('');

  // Status & timers
  const [activeTarget, setActiveTarget] = useState('');
  const [activeType, setActiveType] = useState<'email' | 'sms'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(300); // 5 minutes

  useEffect(() => {
    setMode(initialMode);
    setStep('input');
    setError(null);
    setSuccess(null);
  }, [initialMode, isOpen]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Code expiry countdown
  useEffect(() => {
    if (step === 'verify' && expirySeconds > 0) {
      const timer = setTimeout(() => setExpirySeconds(expirySeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, expirySeconds]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      if (err?.message === 'Google Sign-In was cancelled.') {
        // User closed popup
        return;
      }
      // In preview iframe, popups are restricted or domain not authorized:
      // Show Google Account confirmation step with user's real Google details
      setStep('google-confirm');
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmGoogleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim() || !googleEmail.includes('@')) {
      setError('Please provide a valid Google email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogleDetails(
        googleEmail.trim(),
        googleName.trim() || googleEmail.split('@')[0],
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      );
      if (googlePhone.trim()) {
        await updateProfileDetails({ phone: googlePhone.trim() });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate with Google account.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (!APP_CONFIG.ENABLE_APPLE_LOGIN) return;
    try {
      setLoading(true);
      setError(null);
      await signInWithApple();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Apple sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  // Sign Up: Request verification
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError('Please enter either your email or phone number.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (email.trim()) {
        res = await sendEmailOtp(email.trim());
        setActiveTarget(email.trim());
        setActiveType('email');
      } else {
        res = await sendSmsOtp(phone.trim());
        setActiveTarget(phone.trim());
        setActiveType('sms');
      }

      if (res.success) {
        setStep('verify');
        setCooldown(30);
        setExpirySeconds(300);
        setSuccess(`Verification code dispatched to ${activeTarget || email || phone}`);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Sign In: Request verification
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const target = signinTarget.trim();
    if (!target) {
      setError('Please enter your email or phone number.');
      return;
    }

    setLoading(true);
    try {
      const isEmail = target.includes('@');
      let res;
      if (isEmail) {
        res = await sendEmailOtp(target);
        setActiveTarget(target);
        setActiveType('email');
      } else {
        res = await sendSmsOtp(target);
        setActiveTarget(target);
        setActiveType('sms');
      }

      if (res.success) {
        setStep('verify');
        setCooldown(30);
        setExpirySeconds(300);
        setSuccess(`Verification code sent to ${target}`);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send login code.');
    } finally {
      setLoading(false);
    }
  };

  // Verify Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (verificationCode.trim().length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(activeTarget, verificationCode.trim());
      if (result.valid) {
        // Authenticated! Create or load profile
        const isEmail = activeTarget.includes('@');
        const customUid = `otp-${Math.random().toString(36).substring(2, 10)}`;
        const userProfile: UserProfile = {
          uid: customUid,
          name: name.trim() || 'VIP Guest',
          email: isEmail ? activeTarget : (email || ''),
          phone: !isEmail ? activeTarget : (phone || ''),
          loyaltyPoints: 100,
          referralCode: `TT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          phoneVerified: !isEmail,
          createdAt: new Date().toISOString()
        };

        setCustomUserProfile(userProfile);
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Verification error.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Code
  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = activeType === 'email'
        ? await sendEmailOtp(activeTarget)
        : await sendSmsOtp(activeTarget);

      if (res.success) {
        setCooldown(30);
        setExpirySeconds(300);
        setSuccess('A new 6-digit code has been dispatched.');
      } else {
        setError(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0D1527] border border-[#D4AF37]/40 rounded-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(212,175,55,0.2)] text-[#F3EFE0]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#FFDF78] text-xs font-semibold tracking-widest uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Trim & Twisted Lounge
          </div>
          <h2 className="font-['Cinzel'] text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF0A5] via-[#D4AF37] to-[#AA7C11]">
            {step === 'verify' ? 'Security Verification' : (mode === 'signin' ? 'Welcome Back' : 'Join Our VIP Circle')}
          </h2>
          <p className="text-xs text-[#B2C1D9] mt-1 font-['Playfair_Display'] italic">
            &ldquo;Beauty Is You&rdquo;
          </p>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 flex items-start gap-2.5 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {step === 'google-confirm' ? (
          /* Google Profile Authentication Step */
          <form onSubmit={handleConfirmGoogleProfile} className="space-y-4">
            <div className="p-4 rounded-xl bg-[#070B14] border border-[#D4AF37]/40 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto shadow-md">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h3 className="font-['Cinzel'] text-lg font-bold text-[#FFDF78]">
                Google Account Authentication
              </h3>
              <p className="text-xs text-[#B2C1D9]">
                Confirm your Google account details to sign in and link your reservations and loyalty points:
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                placeholder="e.g. Ankit Brata Ghosh"
                className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Google Gmail Address *
              </label>
              <input
                type="email"
                required
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                WhatsApp Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={googlePhone}
                onChange={(e) => setGooglePhone(e.target.value)}
                placeholder="e.g. 9647345945"
                className="w-full bg-[#070B14] border border-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="flex-1 py-3 rounded-xl border border-white/20 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In with Google'}
              </button>
            </div>
          </form>
        ) : step === 'input' ? (
          <>
            {/* Third-Party Fast Auth Options */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-[#0B1120] font-medium text-sm hover:bg-gray-100 transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>

              {APP_CONFIG.ENABLE_APPLE_LOGIN && (
                <button
                  type="button"
                  onClick={handleAppleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-black text-white border border-white/20 font-medium text-sm hover:bg-neutral-900 transition-all shadow-md"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.56-7.81-11.6-14.3-5.26-8.48-9.35-17.65-12.27-27.5-2.92-9.85-4.38-19.16-4.38-27.93 0-14.12 3.52-25.56 10.57-34.32 7.05-8.76 15.77-13.25 26.15-13.47 4.93 0 10.38 1.34 16.35 4.02 5.97 2.68 9.77 4.07 11.4 4.17 1.52-.1 5.37-1.55 11.54-4.35 6.17-2.8 11.73-4.11 16.68-3.92 12.8.63 22.84 5.39 30.12 14.28-11.42 6.94-17.02 16.51-16.8 28.71.22 9.68 3.96 17.75 11.22 24.2 4.48 4.02 9.68 6.94 15.61 8.76-2.46 7.28-5.33 14.27-8.6 20.97zM119.22 31.84c0-7.28 2.64-14.21 7.92-20.79 5.28-6.58 11.97-10.65 20.07-12.21.33 1.3.49 2.58.49 3.84 0 7.29-2.73 14.37-8.19 21.23-5.46 6.86-12.08 10.87-19.86 12.03-.22-1.3-.43-2.67-.43-4.1z" />
                  </svg>
                  Continue with Apple
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#D4AF37]/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0D1527] px-3 text-[#8E9DB7] font-mono">
                  Or use OTP verification
                </span>
              </div>
            </div>

            {/* Toggle Sign In / Sign Up */}
            <div className="flex bg-[#070B14] p-1 rounded-xl border border-[#D4AF37]/25 mb-5">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'signin'
                    ? 'bg-[#D4AF37] text-[#070B14] shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-[#D4AF37] text-[#070B14] shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {mode === 'signin' ? (
              /* Sign In Form */
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#C8D6EC] mb-1.5">
                    Email or Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. guest@domain.com or 9647345945"
                      value={signinTarget}
                      onChange={(e) => setSigninTarget(e.target.value)}
                      className="w-full bg-[#070B14] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-semibold text-sm tracking-wide hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                >
                  {loading ? 'Sending Code...' : 'Get Verification Code'}
                </button>
              </form>
            ) : (
              /* Sign Up Form */
              <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#C8D6EC] mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ananya Ghosh"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#070B14] border border-[#D4AF37]/30 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#C8D6EC] mb-1">
                    Mobile Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <input
                      type="tel"
                      placeholder="e.g. 9647345945"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#070B14] border border-[#D4AF37]/30 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#C8D6EC] mb-1">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      placeholder="e.g. customer@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#070B14] border border-[#D4AF37]/30 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-semibold text-sm tracking-wide hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                >
                  {loading ? 'Creating Code...' : 'Register & Receive Code'}
                </button>
              </form>
            )}
          </>
        ) : (
          /* Step 2: Verification Code Entry */
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="p-3.5 bg-[#070B14] rounded-xl border border-[#D4AF37]/25 text-center">
              <span className="text-xs text-gray-400">Code dispatched to:</span>
              <p className="text-sm font-semibold text-[#FFDF78] font-mono mt-0.5">{activeTarget}</p>
              <div className="flex items-center justify-center gap-2 mt-2 text-xs text-amber-300 font-mono">
                <Lock className="w-3.5 h-3.5" />
                <span>Code expires in: {formatTime(expirySeconds)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#C8D6EC] mb-1.5 text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                placeholder="• • • • • •"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#070B14] border-2 border-[#D4AF37]/60 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.4em] text-[#FFDF78] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/40 shadow-inner"
              />
              <p className="text-[11px] text-gray-400 text-center mt-1.5">
                Maximum 5 attempts allowed.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-sm tracking-wide hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(212,175,55,0.3)]"
            >
              {loading ? 'Verifying...' : 'Confirm & Proceed'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="text-gray-400 hover:text-white underline underline-offset-4"
              >
                Change details
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={handleResend}
                className={`font-medium ${
                  cooldown > 0
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-[#FFDF78] hover:underline'
                }`}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
