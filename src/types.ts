export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  photoURL?: string;
  loyaltyPoints: number;
  referralCode: string;
  referredBy?: string;
  phoneVerified: boolean;
  createdAt: string;
  notes?: string;
  role?: 'admin' | 'customer';
  isAdmin?: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: number | null;
  priceLabel?: string; // e.g. "Starting", "10% Discount"
  offerPrice?: number;
  note?: string; // e.g. "Underarms wax free", "Hand tan free"
  image?: string;
  isHaircut: boolean;
  active: boolean;
  sortOrder: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
}

export interface BookingChange {
  date: string;
  slot: string;
  changedAt: string;
  reason?: string;
}

export interface BookingItem {
  id: string;
  bookingId: string; // TT-YYMMDD-XXXX
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceIds: string[];
  services: {
    id: string;
    name: string;
    price: number | null;
    priceLabel?: string;
    offerPrice?: number;
    isHaircut: boolean;
  }[];
  stylistId?: string;
  stylistName?: string;
  date: string; // YYYY-MM-DD
  slot: string;
  slotKey: string; // YYYY-MM-DD_slot_pool
  poolType: 'haircut' | 'other';
  subtotal: number;
  discount: number;
  totalAmount: number;
  couponCode?: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rescheduled' | 'No-show';
  notes?: string;
  history?: BookingChange[];
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  bookingId?: string;
  userId?: string;
  customerName: string;
  ratingService: number; // 1-5
  ratingStaff: number;   // 1-5
  ratingValue: number;   // 1-5
  ratingCleanliness: number; // 1-5
  averageRating: number;
  comment: string;
  status: 'Approved' | 'Pending' | 'Hidden';
  adminReply?: string;
  createdAt: string;
}

export interface StaffItem {
  id: string;
  name: string;
  phone: string;
  role: string;
  salary: number;
  dateJoined: string;
  photoURL?: string;
  status: 'Active' | 'Former';
  totalPaid: number;
}

export interface SalaryPaymentItem {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  month: string;
  amount: number;
  mode: 'Cash' | 'Bank Transfer' | 'UPI';
  note?: string;
}

export interface CouponItem {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  value: number;
  maxCap?: number;
  minBill?: number;
  applicableServices?: string[]; // service IDs or empty for all
  startDate: string;
  endDate: string;
  totalLimit?: number;
  usedCount: number;
  perCustomerLimit?: number;
  terms: string;
  active: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Hair' | 'Bridal' | 'Spa' | 'Nails' | 'Salon Interior';
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  sortOrder: number;
}

export interface SalonSettings {
  haircutCapacity: number;
  otherCapacity: number;
  cancellationHours: number;
  offerBannerText: string;
  offerStartDate: string;
  offerEndDate: string;
  offerBannerActive: boolean;
  blockedDates: string[]; // YYYY-MM-DD
  googlePlaceId: string;
  phone: string;
  whatsappNumber: string;
  address: string;
}

export interface WaitlistEntry {
  id: string;
  date: string;
  slot: string;
  poolType: 'haircut' | 'other';
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  status: 'Waiting' | 'Notified';
  createdAt: string;
}
