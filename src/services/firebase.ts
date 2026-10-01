import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut as fbSignOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { APP_CONFIG } from '../config';
import { sha256, generateSalt } from '../utils/crypto';
import type {
  UserProfile,
  ServiceItem,
  CategoryItem,
  BookingItem,
  ReviewItem,
  StaffItem,
  SalaryPaymentItem,
  CouponItem,
  GalleryItem,
  SalonSettings,
  WaitlistEntry
} from '../types';

// Resolve Firebase Config from JSON or Vercel Environment Variables
const resolvedFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '(default)'
};

// Initialize Firebase App
const app = initializeApp(resolvedFirebaseConfig);

// Initialize Firestore with explicit database ID
export const db = getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

// Error Handling Infrastructure as mandated by skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as mandated by skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Initial Exact Categories from Prompt
export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'cat-gents', name: 'Gents', sortOrder: 1, active: true },
  { id: 'cat-ladies-haircut-spa', name: 'Ladies - Haircut & Spa', sortOrder: 2, active: true },
  { id: 'cat-ladies-hair-treatments', name: 'Ladies - Hair Treatments', sortOrder: 3, active: true },
  { id: 'cat-ladies-facial-massage-dtan', name: 'Ladies - Facial, Massage & D-tan', sortOrder: 4, active: true },
  { id: 'cat-ladies-waxing-nails-colour', name: 'Ladies - Waxing, Nails & Colour', sortOrder: 5, active: true },
  { id: 'cat-combo', name: 'Combo', sortOrder: 6, active: true },
];

// Initial Exact Services from Prompt with HD Category-Specific Photography
export const INITIAL_SERVICES: Omit<ServiceItem, 'id'>[] = [
  // CATEGORY: Gents
  { name: 'Spa', category: 'Gents', price: 399, isHaircut: false, active: true, sortOrder: 1, image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80' },
  { name: 'Facial (Normal)', category: 'Gents', price: 449, isHaircut: false, active: true, sortOrder: 2, image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80' },
  { name: 'Facial (Professional)', category: 'Gents', price: 799, isHaircut: false, active: true, sortOrder: 3, image: 'https://images.unsplash.com/photo-1512290900672-1f419c8f4204?auto=format&fit=crop&w=800&q=80' },
  { name: 'Oil Massage', category: 'Gents', price: 249, isHaircut: false, active: true, sortOrder: 4, image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80' },
  { name: 'D-tan', category: 'Gents', price: 349, isHaircut: false, active: true, sortOrder: 5, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80' },
  { name: 'Normal Massage', category: 'Gents', price: 199, isHaircut: false, active: true, sortOrder: 6, image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80' },
  { name: 'Professional Massage', category: 'Gents', price: 399, isHaircut: false, active: true, sortOrder: 7, image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80' },
  { name: 'Hair Colour (Global)', category: 'Gents', price: 499, isHaircut: false, active: true, sortOrder: 8, image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Hair Colour (Highlights)', category: 'Gents', price: 149, isHaircut: false, active: true, sortOrder: 9, image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80' },

  // CATEGORY: Ladies - Haircut & Spa
  { name: 'Professional Spa', category: 'Ladies - Haircut & Spa', price: null, priceLabel: '10% Discount', isHaircut: false, active: true, sortOrder: 10, image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80' },
  { name: 'Hair Cut (Normal) + Spa', category: 'Ladies - Haircut & Spa', price: 999, isHaircut: true, active: true, sortOrder: 11, image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80' },
  { name: 'Advanced Hair Cut + Spa (Any length)', category: 'Ladies - Haircut & Spa', price: 1199, isHaircut: true, active: true, sortOrder: 12, image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=800&q=80' },
  { name: 'Haircut + Spa + Facial + D-tan', category: 'Ladies - Haircut & Spa', price: 1499, isHaircut: true, active: true, sortOrder: 13, image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80' },

  // CATEGORY: Ladies - Hair Treatments
  { name: 'Hair Smoothening/Straightening', category: 'Ladies - Hair Treatments', price: 2999, priceLabel: 'Starting', note: 'Treatment = 1600 X (With offer 1400)', isHaircut: false, active: true, sortOrder: 14, image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80' },
  { name: 'Keratin', category: 'Ladies - Hair Treatments', price: 3999, priceLabel: 'Starting', isHaircut: false, active: true, sortOrder: 15, image: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=800&q=80' },
  { name: 'Nano Plastia', category: 'Ladies - Hair Treatments', price: 3999, priceLabel: 'Starting', isHaircut: false, active: true, sortOrder: 16, image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80' },

  // CATEGORY: Ladies - Facial, Massage & D-tan
  { name: 'Normal Facial + Normal D-tan', category: 'Ladies - Facial, Massage & D-tan', price: 399, isHaircut: false, active: true, sortOrder: 17, image: 'https://images.unsplash.com/photo-1512290900672-1f419c8f4204?auto=format&fit=crop&w=800&q=80' },
  { name: 'Face Massage + D-tan', category: 'Ladies - Facial, Massage & D-tan', price: 600, offerPrice: 399, note: 'With offer 399', isHaircut: false, active: true, sortOrder: 18, image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80' },
  { name: 'Professional Massage + D-tan', category: 'Ladies - Facial, Massage & D-tan', price: 1000, offerPrice: 699, note: 'With offer 699', isHaircut: false, active: true, sortOrder: 19, image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80' },
  { name: 'Hair Treatments', category: 'Ladies - Facial, Massage & D-tan', price: 1600, offerPrice: 1400, note: 'With offer 1400', isHaircut: false, active: true, sortOrder: 20, image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80' },
  { name: 'All Professional Facial', category: 'Ladies - Facial, Massage & D-tan', price: null, priceLabel: '10% discount', isHaircut: false, active: true, sortOrder: 21, image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80' },

  // CATEGORY: Ladies - Waxing, Nails & Colour
  { name: 'Full Hand + Leg Wax', category: 'Ladies - Waxing, Nails & Colour', price: 1199, note: 'Underarms wax free', isHaircut: false, active: true, sortOrder: 22, image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=800&q=80' },
  { name: 'Manicure Pedicure', category: 'Ladies - Waxing, Nails & Colour', price: 1099, note: 'Hand tan free', isHaircut: false, active: true, sortOrder: 23, image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80' },
  { name: 'Hair Colour Global', category: 'Ladies - Waxing, Nails & Colour', price: 999, isHaircut: false, active: true, sortOrder: 24, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80' },
  { name: 'Hair Colour Highlight', category: 'Ladies - Waxing, Nails & Colour', price: 249, isHaircut: false, active: true, sortOrder: 25, image: 'https://images.unsplash.com/photo-1517832606589-715752c043e0?auto=format&fit=crop&w=800&q=80' },
  { name: 'Nail Extension Single', category: 'Ladies - Waxing, Nails & Colour', price: 450, isHaircut: false, active: true, sortOrder: 26, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80' },
  { name: 'Nail Extension Both', category: 'Ladies - Waxing, Nails & Colour', price: 799, isHaircut: false, active: true, sortOrder: 27, image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=800&q=80' },

  // CATEGORY: Combo
  { name: 'Eyebrows + Forehead + Upperlip + Face Massage + Back Massage + Face D-tan + Underarms Wax', category: 'Combo', price: 1099, isHaircut: false, active: true, sortOrder: 28, image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80' },
  { name: 'Eyebrow + Forehead + Upperlip + Chin + Facial (Professional) + Underarms Wax + Manicure + Pedicure', category: 'Combo', price: 1999, isHaircut: false, active: true, sortOrder: 29, image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80' }
];

export const INITIAL_STAFF: Omit<StaffItem, 'id'>[] = [
  { name: 'Priya Sharma', phone: '9830123456', role: 'Master Hair & Colour Stylist', salary: 32000, dateJoined: '2023-04-15', status: 'Active', totalPaid: 128000, photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { name: 'Rahul Das', phone: '9830234567', role: 'Senior Barber & Spa Specialist', salary: 28000, dateJoined: '2023-06-01', status: 'Active', totalPaid: 112000, photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { name: 'Sneha Roy', phone: '9830345678', role: 'Advanced Skin & Facial Aesthetician', salary: 29000, dateJoined: '2023-08-10', status: 'Active', totalPaid: 87000, photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
  { name: 'Amit Sen', phone: '9830456789', role: 'Keratin & Hair Treatment Specialist', salary: 26000, dateJoined: '2024-01-12', status: 'Active', totalPaid: 52000, photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' }
];

export const INITIAL_REVIEWS: Omit<ReviewItem, 'id'>[] = [
  {
    customerName: 'Ananya Mukherjee',
    ratingService: 5,
    ratingStaff: 5,
    ratingValue: 5,
    ratingCleanliness: 5,
    averageRating: 5,
    comment: 'Trim & Twisted has redefined salon luxury in Chakdaha! The Advanced Haircut and Spa experience was beyond heavenly. The ambiance and gold interiors feel like a 5-star resort.',
    status: 'Approved',
    adminReply: 'Thank you Ananya! Delighted to craft your signature look.',
    createdAt: '2026-09-18'
  },
  {
    customerName: 'Subhajit Paul',
    ratingService: 5,
    ratingStaff: 5,
    ratingValue: 5,
    ratingCleanliness: 4.8,
    averageRating: 4.9,
    comment: 'Best gents professional massage and beard sculpting in town. The staff behaviour was impeccable and punctual.',
    status: 'Approved',
    createdAt: '2026-09-22'
  },
  {
    customerName: 'Debasmita Ghosh',
    ratingService: 5,
    ratingStaff: 5,
    ratingValue: 4.8,
    ratingCleanliness: 5,
    averageRating: 4.95,
    comment: 'Got my Keratin treatment and manicure done before Puja. My hair looks silky smooth with mirror-like shine. Worth every single rupee!',
    status: 'Approved',
    adminReply: 'We are thrilled you love the Keratin shine! See you soon Debasmita.',
    createdAt: '2026-09-25'
  }
];

export const INITIAL_GALLERY: Omit<GalleryItem, 'id'>[] = [
  { title: 'Bridal Makeover & Royal Hair Styling', category: 'Bridal', type: 'image', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80', sortOrder: 1 },
  { title: 'Ultra-Gloss Keratin Smoothing', category: 'Hair', type: 'image', url: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80', sortOrder: 2 },
  { title: 'Artistic Gel Nail Extensions', category: 'Nails', type: 'image', url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80', sortOrder: 3 },
  { title: 'Aromatherapy Hair Spa Ritual', category: 'Spa', type: 'image', url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80', sortOrder: 4 },
  { title: 'Gents Fade & Precision Beard Sculpt', category: 'Hair', type: 'image', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80', sortOrder: 5 },
  { title: 'Luxury Salon Floor & Styling Mirrors', category: 'Salon Interior', type: 'image', url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80', sortOrder: 6 }
];

export const INITIAL_COUPONS: Omit<CouponItem, 'id'>[] = [
  {
    code: 'PUJA200',
    discountType: 'flat',
    value: 200,
    minBill: 1200,
    startDate: '2026-09-01',
    endDate: '2026-10-31',
    totalLimit: 500,
    usedCount: 14,
    terms: 'Flat ₹200 off on services above ₹1200. Valid during Durga Puja season.',
    active: true
  },
  {
    code: 'WELCOME10',
    discountType: 'percentage',
    value: 10,
    maxCap: 300,
    minBill: 499,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    totalLimit: 1000,
    usedCount: 42,
    terms: '10% off for first-time or returning VIP customers, capped at ₹300.',
    active: true
  }
];

/**
 * Seed initial Firestore collections if not yet present
 */
export async function seedInitialFirestoreData() {
  try {
    // 1. Check & Seed Categories
    const catSnap = await getDocs(collection(db, 'categories'));
    if (catSnap.empty) {
      const batch = writeBatch(db);
      for (const cat of INITIAL_CATEGORIES) {
        batch.set(doc(db, 'categories', cat.id), cat);
      }
      await batch.commit();
    }

    // 2. Check & Seed Services (Upsert images and verified prices)
    const srvSnap = await getDocs(collection(db, 'services'));
    if (srvSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_SERVICES.forEach((srv, idx) => {
        const id = `srv-${idx + 1}`;
        batch.set(doc(db, 'services', id), { ...srv, id });
      });
      await batch.commit();
    } else {
      // Sync images or missing fields for any existing services
      const existingDocs = srvSnap.docs;
      const batch = writeBatch(db);
      let needsUpdate = false;

      for (const d of existingDocs) {
        const currentData = d.data();
        const matchedInitial = INITIAL_SERVICES.find(
          (s) => s.name.trim().toLowerCase() === (currentData.name || '').trim().toLowerCase()
        );
        if (matchedInitial) {
          // If image is completely missing, provide initial default
          if (!currentData.image) {
            batch.update(doc(db, 'services', d.id), {
              image: matchedInitial.image,
              ...(matchedInitial.priceLabel ? { priceLabel: matchedInitial.priceLabel } : {}),
              ...(matchedInitial.note ? { note: matchedInitial.note } : {}),
              ...(matchedInitial.offerPrice ? { offerPrice: matchedInitial.offerPrice } : {})
            });
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        await batch.commit();
      }
    }

    // 3. Check & Seed Settings
    const settingsRef = doc(db, 'settings', 'general');
    const settingsDoc = await getDoc(settingsRef);
    if (!settingsDoc.exists()) {
      const initialSettings: SalonSettings = {
        haircutCapacity: APP_CONFIG.booking.haircutPoolCapacity,
        otherCapacity: APP_CONFIG.booking.otherPoolCapacity,
        cancellationHours: APP_CONFIG.booking.cancellationWindowHours,
        offerBannerText: APP_CONFIG.initialOfferBanner.text,
        offerStartDate: APP_CONFIG.initialOfferBanner.startDate,
        offerEndDate: APP_CONFIG.initialOfferBanner.endDate,
        offerBannerActive: APP_CONFIG.initialOfferBanner.active,
        blockedDates: [],
        googlePlaceId: 'ChIJj83e...',
        phone: APP_CONFIG.phone,
        whatsappNumber: APP_CONFIG.whatsappNumber,
        address: APP_CONFIG.address
      };
      await setDoc(settingsRef, initialSettings);
    }

    // 4. Check & Seed Admin Auth Hash
    const adminAuthRef = doc(db, 'adminAuth', 'config');
    const adminAuthDoc = await getDoc(adminAuthRef);
    if (!adminAuthDoc.exists()) {
      const salt = generateSalt(16);
      const usernameHash = await sha256(APP_CONFIG.initialAdmin.username.trim().toLowerCase(), salt);
      const passwordHash = await sha256(APP_CONFIG.initialAdmin.password, salt);
      const securityAnswerHash = await sha256('chakdaha', salt);

      await setDoc(adminAuthRef, {
        usernameHash,
        passwordHash,
        salt,
        securityQuestion: APP_CONFIG.initialAdmin.securityQuestion,
        securityAnswerHash,
        failedAttempts: 0,
        lockedUntil: 0,
        updatedAt: new Date().toISOString()
      });
    }

    // 5. Seed Staff if empty
    const staffSnap = await getDocs(collection(db, 'staff'));
    if (staffSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_STAFF.forEach((st, idx) => {
        const id = `st-${idx + 1}`;
        batch.set(doc(db, 'staff', id), { ...st, id });
      });
      await batch.commit();
    }

    // 6. Seed Reviews if empty
    const revSnap = await getDocs(collection(db, 'reviews'));
    if (revSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_REVIEWS.forEach((rev, idx) => {
        const id = `rev-${idx + 1}`;
        batch.set(doc(db, 'reviews', id), { ...rev, id });
      });
      await batch.commit();
    }

    // 7. Seed Gallery if empty
    const galSnap = await getDocs(collection(db, 'gallery'));
    if (galSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_GALLERY.forEach((item, idx) => {
        const id = `gal-${idx + 1}`;
        batch.set(doc(db, 'gallery', id), { ...item, id });
      });
      await batch.commit();
    }

    // 8. Seed Coupons if empty
    const coupSnap = await getDocs(collection(db, 'coupons'));
    if (coupSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_COUPONS.forEach((cp, idx) => {
        const id = `cp-${idx + 1}`;
        batch.set(doc(db, 'coupons', id), { ...cp, id });
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Initial seeding note:', err);
  }
}

/**
 * Force-sync / restore all 29 official services with HD photos and prices
 */
export async function resyncOfficialServicesMenu() {
  const batch = writeBatch(db);
  for (const cat of INITIAL_CATEGORIES) {
    batch.set(doc(db, 'categories', cat.id), cat, { merge: true });
  }
  INITIAL_SERVICES.forEach((srv, idx) => {
    const id = `srv-${idx + 1}`;
    batch.set(doc(db, 'services', id), { ...srv, id }, { merge: true });
  });
  await batch.commit();
}

/**
 * Robust image uploader using Cloudinary Unsigned Upload
 * with graceful instant local base64 fallback so image uploads
 * never fail even before custom Cloudinary credentials are set up.
 */
export async function uploadImageOrMedia(file: File): Promise<string> {
  try {
    const { cloudName, uploadPreset } = APP_CONFIG.cloudinary;

    if (cloudName && uploadPreset && cloudName !== 'trimandtwisted') {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.secure_url) {
          return data.secure_url;
        }
      }
    }

    // Fallback: Read as Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as data URL'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  } catch (error) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Recursively strips undefined properties from objects and arrays
 * to prevent Firestore "Unsupported field value: undefined" errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value);
      }
    }
    return result as T;
  }
  return data;
}

/**
 * Empties all slot usage counts so every slot is 100% free, and cleans previous/pending test bookings
 */
export async function clearAllBookingsAndResetSlots() {
  try {
    // 1. Delete all slotUsage documents
    const slotsSnap = await getDocs(collection(db, 'slotUsage'));
    const batch1 = writeBatch(db);
    slotsSnap.docs.forEach((d) => {
      batch1.delete(doc(db, 'slotUsage', d.id));
    });
    await batch1.commit();

    // 2. Clear all previous/pending bookings
    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    const batch2 = writeBatch(db);
    bookingsSnap.docs.forEach((d) => {
      batch2.delete(doc(db, 'bookings', d.id));
    });
    await batch2.commit();

    // Clear local storage cache
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('tt_saved_bookings');
      } catch {}
    }

    return { success: true, count: bookingsSnap.docs.length };
  } catch (err: any) {
    console.error('Error clearing bookings and resetting slots:', err);
    throw err;
  }
}

export {
  signInWithPopup,
  fbSignOut
};
