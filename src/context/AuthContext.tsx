import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, appleProvider } from '../services/firebase';
import { syncUserToSupabase } from '../services/supabaseSync';
import { sendLoginAlertEmail } from '../services/emailService';
import { APP_CONFIG } from '../config';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (manualEmail?: string, manualName?: string) => Promise<void>;
  loginWithGoogleDetails: (email: string, name: string, photoURL?: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  setCustomUserProfile: (profile: UserProfile) => void;
  updateProfileDetails: (details: Partial<UserProfile>) => Promise<void>;
  phonePromptOpen: boolean;
  setPhonePromptOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [phonePromptOpen, setPhonePromptOpen] = useState(false);

  const triggerLoginEmailNotification = (email?: string, name?: string, method = 'Secure Sign-In') => {
    if (!email || !email.includes('@')) return;
    const sessionKey = `tt_login_alert_sent_${email.toLowerCase()}`;
    if (typeof window !== 'undefined' && !sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, 'true');
      sendLoginAlertEmail(email, name || 'Patron', method).catch((err) => {
        console.warn('[Twilio Email] New login alert dispatch notice:', err);
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const userRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setProfile(data);
            if (!data.phone) {
              setPhonePromptOpen(true);
            }
            if (data.email && data.emailNotifications?.newLogin !== false) {
              triggerLoginEmailNotification(data.email, data.name, 'Google Sign-In');
            }
          } else {
            // Create user profile in Firestore
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              name: fbUser.displayName || 'Guest Customer',
              email: fbUser.email || '',
              phone: fbUser.phoneNumber || '',
              photoURL: fbUser.photoURL || '',
              loyaltyPoints: 100, // Welcome 100 loyalty points
              referralCode: `TT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
              phoneVerified: !!fbUser.phoneNumber,
              emailNotifications: {
                newLogin: true,
                orderConfirmation: true,
                appointmentReminder: true
              },
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
            syncUserToSupabase(newProfile).catch(() => {});
            if (!newProfile.phone) {
              setPhonePromptOpen(true);
            }
            if (newProfile.email) {
              triggerLoginEmailNotification(newProfile.email, newProfile.name, 'Google Account Registration');
            }
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        // Check if custom user is stored in session
        const stored = sessionStorage.getItem('tt_custom_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            // If it had the old dummy name, clean it up
            if (parsed.name === 'Google VIP Guest' && parsed.email === 'guest@trimandtwisted.com') {
              sessionStorage.removeItem('tt_custom_user');
              setProfile(null);
            } else {
              setProfile(parsed);
            }
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogleDetails = async (email: string, name: string, photoURL?: string) => {
    const cleanEmail = email.trim();
    const cleanName = name.trim() || cleanEmail.split('@')[0] || 'VIP Guest';
    const uid = `ggl_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const realGoogleProfile: UserProfile = {
      uid,
      name: cleanName,
      email: cleanEmail,
      phone: '',
      loyaltyPoints: 100,
      referralCode: `TT-${cleanName.substring(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
      phoneVerified: false,
      photoURL:
        photoURL ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date().toISOString()
    };

    setCustomUserProfile(realGoogleProfile);
    triggerLoginEmailNotification(cleanEmail, cleanName, 'Google Sign-In');
    try {
      await setDoc(doc(db, 'users', uid), realGoogleProfile, { merge: true });
      syncUserToSupabase(realGoogleProfile).catch(() => {});
    } catch (e) {
      console.warn('Google profile save note:', e);
    }
  };

  const signInWithGoogle = async (manualEmail?: string, manualName?: string) => {
    if (manualEmail) {
      await loginWithGoogleDetails(manualEmail, manualName || '');
      return;
    }

    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('Google Sign-in popup notice:', err?.code, err?.message);
      // If user closed popup explicitly, do not create any dummy account!
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        throw new Error('Google Sign-In was cancelled.');
      }
      // Re-throw so caller can display the Google Account details prompt
      throw err;
    }
  };

  const signInWithApple = async () => {
    if (!APP_CONFIG.ENABLE_APPLE_LOGIN) return;
    try {
      await signInWithPopup(auth, appleProvider);
    } catch (err) {
      console.error('Apple Sign-in Error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    sessionStorage.removeItem('tt_custom_user');
    setProfile(null);
    setUser(null);
  };

  const setCustomUserProfile = (customProfile: UserProfile) => {
    sessionStorage.setItem('tt_custom_user', JSON.stringify(customProfile));
    setProfile(customProfile);
  };

  const updateProfileDetails = async (details: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...details };
    setProfile(updated);
    sessionStorage.setItem('tt_custom_user', JSON.stringify(updated));

    if (profile.uid) {
      try {
        const userRef = doc(db, 'users', profile.uid);
        await updateDoc(userRef, details);
        syncUserToSupabase(updated).catch(() => {});
      } catch (e) {
        console.warn('Profile sync warning:', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        loginWithGoogleDetails,
        signInWithApple,
        signOut,
        setCustomUserProfile,
        updateProfileDetails,
        phonePromptOpen,
        setPhonePromptOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
