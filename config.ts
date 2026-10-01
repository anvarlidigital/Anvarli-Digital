/**
 * Trim & Twisted - Central Configuration
 * Tagline: "Beauty Is You"
 * 
 * Free-Tier Rule:
 * All keys and settings are configured here.
 * - Firebase Spark (free): Auth + Firestore
 * - Cloudinary (free tier): Unsigned upload preset for images and videos
 * - Phone & WhatsApp: 9647345945
 */

export const APP_CONFIG = {
  // Brand details
  salonName: "Trim & Twisted",
  tagline: "Beauty Is You",
  phone: "9647345945",
  formattedPhone: "+91 96473 45945",
  whatsappNumber: "919647345945",
  whatsappUrl: "https://wa.me/919647345945",
  instagramUrl: "https://www.instagram.com/trimtwisted?stkn=MXg3b2RocDY0eDVxaQ==",
  facebookUrl: "https://www.facebook.com/share/1Byikt62YS/",
  googleMapsUrl: "https://maps.app.goo.gl/UhKjXP9bPafeoGVN6",
  googleMapsEmbedQuery: "Trim & Twisted Unisex Salon Chakdaha",
  address: "Trim & Twisted, Near Chakdaha Station Road, Chakdaha, West Bengal 741222",
  openingHours: "10:30 AM - 09:30 PM (Open All 7 Days)",

  // Feature Flags
  // Apple Sign-in is set to false by default as Apple requires a paid Apple Developer Account ($99/yr)
  ENABLE_APPLE_LOGIN: false,

  // Cloudinary Free Tier Configuration (Unsigned Upload)
  // Instructions:
  // 1. Create a free account at https://cloudinary.com
  // 2. Go to Settings > Upload > Upload presets > Add upload preset
  // 3. Set Signing Mode to 'Unsigned'
  // 4. Paste your cloudName and uploadPreset below
  // Note: The app automatically falls back to an ultra-fast base64/data-URL storage
  // so all image uploads work out of the box even before configuring your Cloudinary account!
  cloudinary: {
    cloudName: "trimandtwisted", // Replace with your free Cloudinary cloud name
    uploadPreset: "salon_unsigned", // Replace with your free unsigned upload preset
    uploadUrl: "https://api.cloudinary.com/v1_1/trimandtwisted/auto/upload"
  },

  // Booking Capacity & Scheduling Rules
  booking: {
    // Advance rule: Bookings must be made at least 2 days ahead
    minAdvanceDays: 2,
    maxAdvanceDays: 45,
    // Available service slots
    slots: [
      "11:00 AM - 02:00 PM",
      "03:00 PM - 06:00 PM",
      "06:00 PM - 09:00 PM"
    ],
    // Separate capacity pools per slot
    haircutPoolCapacity: 3, // 3 haircut customers per slot
    otherPoolCapacity: 2,   // 2 other-service customers per slot
    cancellationWindowHours: 24 // Admin-configurable, default 24h before appointment
  },

  // Seasonal Special Offer Banner (Admin-editable in Firestore Settings)
  initialOfferBanner: {
    text: "Durga Puja Special Offer, 1st September - 30th September",
    startDate: "2026-09-01",
    endDate: "2026-10-31", // Extended to allow testing active state
    active: true
  },

  // Initial Admin Credentials (Hashed in Firestore adminAuth on first seed)
  initialAdmin: {
    username: "trim&twisted",
    password: "mythransh@2024",
    securityQuestion: "What is your home town?",
    securityAnswers: ["chakdaha", "chakdah"]
  }
};
