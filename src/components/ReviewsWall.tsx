import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config';
import type { ReviewItem, BookingItem, SalonSettings } from '../types';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Check, Copy, ExternalLink, MessageSquare, Sparkles, Star, User } from 'lucide-react';

interface ReviewsWallProps {
  reviews: ReviewItem[];
  userBookings: BookingItem[];
  settings: SalonSettings | null;
  onRefreshReviews: () => void;
  onOpenAuth: () => void;
}

export const ReviewsWall: React.FC<ReviewsWallProps> = ({
  reviews,
  userBookings,
  settings,
  onRefreshReviews,
  onOpenAuth,
}) => {
  const { profile } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [submittedReviewText, setSubmittedReviewText] = useState<string | null>(null);
  const [copiedGoogle, setCopiedGoogle] = useState(false);

  // Form ratings (1 to 5)
  const [ratingService, setRatingService] = useState(5);
  const [ratingStaff, setRatingStaff] = useState(5);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingCleanliness, setRatingCleanliness] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter approved reviews for display
  const approvedReviews = reviews.filter((r) => r.status === 'Approved' || !r.status);

  // Check if current user has any Completed booking
  const hasCompletedBooking = userBookings.some((b) => b.status === 'Completed');

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      onOpenAuth();
      return;
    }

    if (!hasCompletedBooking) {
      setErrorMessage(
        'Reviews are exclusive to verified guests with at least one Completed salon visit.'
      );
      return;
    }

    if (!comment.trim()) {
      setErrorMessage('Please share your thoughts in the review box.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const averageRating = Number(
      ((ratingService + ratingStaff + ratingValue + ratingCleanliness) / 4).toFixed(1)
    );

    try {
      const newReview: Omit<ReviewItem, 'id'> = {
        userId: profile.uid,
        customerName: profile.name,
        ratingService,
        ratingStaff,
        ratingValue,
        ratingCleanliness,
        averageRating,
        comment: comment.trim(),
        status: 'Approved', // Visible to community
        createdAt: new Date().toISOString().split('T')[0],
      };

      await addDoc(collection(db, 'reviews'), newReview);
      setSubmittedReviewText(comment.trim());
      onRefreshReviews();
      setComment('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostOnGoogle = () => {
    if (submittedReviewText) {
      navigator.clipboard.writeText(submittedReviewText);
      setCopiedGoogle(true);
      setTimeout(() => setCopiedGoogle(false), 3000);
    }
    const googleUrl = settings?.googlePlaceId
      ? `https://search.google.com/local/writereview?placeid=${settings.googlePlaceId}`
      : APP_CONFIG.googleMapsUrl;
    window.open(googleUrl, '_blank');
  };

  const renderStarPicker = (label: string, value: number, onChange: (val: number) => void) => (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span className="text-xs text-gray-300 font-medium">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-125 transition-transform"
          >
            <Star
              className={`w-5 h-5 ${
                star <= value ? 'text-[#FFDF78] fill-[#FFDF78]' : 'text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <section id="reviews" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#FFDF78] text-xs font-semibold uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Verified Patron Reviews
          </div>
          <h2 className="font-['Cinzel'] text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#FFDF78] to-[#AA7C11]">
            Reviews & Accolades
          </h2>
          <p className="font-['Playfair_Display'] italic text-sm sm:text-base text-[#E6DFCA] mt-1">
            Real guest evaluations across Service, Staff, Value & Cleanliness
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            if (!profile) {
              onOpenAuth();
            } else {
              setModalOpen(true);
              setSubmittedReviewText(null);
            }
          }}
          className="px-6 py-3 rounded-xl bg-[#0E1628] hover:bg-[#15223C] border border-[#D4AF37]/50 text-[#FFDF78] font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center gap-2 shrink-0"
        >
          <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Floating 3D Reviews Wall Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {approvedReviews.map((rev) => (
          <div
            key={rev.id}
            className="group relative rounded-2xl bg-[#0E1628]/85 border border-[#D4AF37]/30 p-6 shadow-xl backdrop-blur-md hover:border-[#D4AF37] hover:bg-[#121C31] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Header with Name & Average Stars */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1E293B] to-[#0F172A] border border-[#D4AF37]/50 flex items-center justify-center text-[#FFDF78] font-bold text-sm">
                    {rev.customerName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-['Cinzel'] text-sm sm:text-base font-bold text-white group-hover:text-[#FFDF78] transition-colors">
                      {rev.customerName}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {rev.createdAt || 'Verified Guest'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-[#D4AF37]/15 px-2.5 py-1 rounded-lg border border-[#D4AF37]/30">
                  <Star className="w-3.5 h-3.5 text-[#FFDF78] fill-[#FFDF78]" />
                  <span className="font-mono text-xs font-bold text-[#FFDF78]">
                    {rev.averageRating}
                  </span>
                </div>
              </div>

              {/* 4 Category Ratings Mini Bar */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#070B14]/80 border border-white/5 text-[11px] mb-4">
                <div className="flex items-center justify-between text-gray-400">
                  <span>Service:</span>
                  <span className="text-[#FFDF78] font-semibold">{rev.ratingService || 5}★</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Staff:</span>
                  <span className="text-[#FFDF78] font-semibold">{rev.ratingStaff || 5}★</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Value:</span>
                  <span className="text-[#FFDF78] font-semibold">{rev.ratingValue || 5}★</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Hygiene:</span>
                  <span className="text-[#FFDF78] font-semibold">{rev.ratingCleanliness || 5}★</span>
                </div>
              </div>

              {/* Review Comment */}
              <p className="text-xs sm:text-sm text-[#D8E2F0] font-sans leading-relaxed italic">
                &ldquo;{rev.comment}&rdquo;
              </p>
            </div>

            {/* Admin Reply if present */}
            {rev.adminReply && (
              <div className="mt-4 pt-3 border-t border-[#D4AF37]/20 text-xs text-amber-200/90 bg-[#D4AF37]/10 p-2.5 rounded-xl">
                <span className="font-semibold text-[#FFDF78] block mb-0.5">Salon Response:</span>
                {rev.adminReply}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Review Submission Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#0D1527] border border-[#D4AF37]/50 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.25)] text-[#F3EFE0]">
            {!submittedReviewText ? (
              <>
                <div className="text-center mb-6">
                  <h3 className="font-['Cinzel'] text-2xl font-bold text-[#FFDF78]">
                    Rate Your Experience
                  </h3>
                  <p className="text-xs text-[#A5B7D1] mt-1 font-['Playfair_Display']">
                    Evaluating Trim & Twisted across our four core luxury metrics
                  </p>
                </div>

                {!hasCompletedBooking && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 text-xs text-amber-200">
                    * Only verified guests who have had a Completed appointment at our salon can publish a review.
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-xs text-red-200">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmitReview} className="space-y-3">
                  {renderStarPicker('1. Salon Service & Treatment', ratingService, setRatingService)}
                  {renderStarPicker('2. Stylist & Staff Behaviour', ratingStaff, setStaff => setRatingStaff(setStaff))}
                  {renderStarPicker('3. Value for Money', ratingValue, setRatingValue)}
                  {renderStarPicker('4. Salon Cleanliness & Hygiene', ratingCleanliness, setRatingCleanliness)}

                  <div className="pt-2">
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">
                      Tell us about your experience *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Share what you loved about your haircut, spa, facial or makeover..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-[#070B14] border border-[#D4AF37]/35 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-gray-400 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Post Review'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Success & Post on Google Step */
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>

                <h3 className="font-['Cinzel'] text-2xl font-bold text-[#FFDF78]">
                  Thank You, {profile?.name}!
                </h3>

                <p className="text-xs text-gray-300 max-w-sm mx-auto">
                  Your review has been successfully posted to the Trim & Twisted wall.
                </p>

                <div className="p-4 rounded-xl bg-[#070B14] border border-[#D4AF37]/30 text-left text-xs text-gray-300 italic">
                  &ldquo;{submittedReviewText}&rdquo;
                </div>

                <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                  Help fellow salon visitors find us! Click below to automatically copy your review and open our Google Reviews page:
                </p>

                <button
                  type="button"
                  onClick={handlePostOnGoogle}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4285F4] to-[#2B66C5] text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedGoogle ? 'Copied! Opening Google...' : 'Post on Google (Copy & Open)'}</span>
                  <ExternalLink className="w-4 h-4 ml-1" />
                </button>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="block mx-auto text-xs text-gray-400 hover:text-white underline pt-2"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
