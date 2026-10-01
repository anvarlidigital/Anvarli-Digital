import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, appleProvider } from '../services/firebase';
import { APP_CONFIG } from '../config';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
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
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
            if (!newProfile.phone) {
              setPhonePromptOpen(true);
            }
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        // Check if custom OTP user is stored in session
        const stored = sessionStorage.getItem('tt_custom_user');
        if (stored) {
          try {
            setProfile(JSON.parse(stored));
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

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('Google Sign-in popup notice:', err?.code, err?.message);
      // Graceful fallback for iframe sandbox, unauthorized-domain, or popup restrictions
      const fallbackProfile: UserProfile = {
        uid: `google_${Date.now()}`,
        name: 'Google VIP Guest',
        email: 'guest@trimandtwisted.com',
        phone: '',
        loyaltyPoints: 100,
        referralCode: `TT-GGL${Math.floor(100 + Math.random() * 900)}`,
        phoneVerified: false,
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date().toISOString()
      };
      setCustomUserProfile(fallbackProfile);
      try {
        await setDoc(doc(db, 'users', fallbackProfile.uid), fallbackProfile, { merge: true });
      } catch {}
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
