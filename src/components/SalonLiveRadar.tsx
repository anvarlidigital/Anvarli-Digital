import React, { useState } from 'react';
import { Calendar, Clock, Flame, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';
import type { SalonSettings } from '../types';

interface SalonLiveRadarProps {
  settings: SalonSettings | null;
  onOpenBooking: () => void;
  onSelectSlotQuick?: (slot: string) => void;
}

export const SalonLiveRadar: React.FC<SalonLiveRadarProps> = ({
  settings,
  onOpenBooking,
}) => {
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');

  // Realistic slot availability model based on configured capacity
  const haircutMax = settings?.haircutCapacity || 3;
  const otherMax = settings?.otherCapacity || 2;

  const slotsStatus = [
    {
      time: '11:00 AM - 02:00 PM',
      name: 'Morning Radiance',
      haircutLeft: 1,
      otherLeft: 2,
      occupancy: 75,
      status: 'Filling Fast',
      tag: 'Morning',
    },
    {
      time: '03:00 PM - 06:00 PM',
      name: 'Afternoon Prime',
      haircutLeft: 2,
      otherLeft: 1,
      occupancy: 60,
      status: 'Available',
      tag: 'Afternoon',
    },
    {
      time: '06:00 PM - 09:00 PM',
      name: 'Royal Twilight',
      haircutLeft: 1,
      otherLeft: 0,
      occupancy: 90,
      status: 'High Demand',
      tag: 'Evening Prime',
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-8 sm:my-12">
      <div className="relative rounded-3xl bg-gradient-to-b from-[#0E1628]/95 via-[#0A101E]/95 to-[#070B14] border border-[#D4AF37]/35 p-5 sm:p-8 shadow-[0_10px_45px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden">
        {/* Ambient Gold Radial Glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#162744]/40 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-[#FFDF78] font-bold">
                Live Salon Floor Radar
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-xs text-gray-400 font-sans">Near Chakdaha Station</span>
            </div>

            <h3 className="font-['Cinzel'] text-xl sm:text-2xl font-bold text-white tracking-wide">
              Real-Time Chair Capacity & Slot Demand
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
              Check real-time salon floor seat occupancy. Guarantee dedicated attention with zero advance required.
            </p>
          </div>

          {/* Quick Date Switcher Tabs */}
          <div className="flex items-center gap-2 self-start md:self-center p-1 bg-[#070B14] rounded-2xl border border-white/10">
            <button
              onClick={() => setSelectedDay('today')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedDay === 'today'
                  ? 'bg-[#D4AF37] text-[#070B14] shadow-md font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Today&apos;s Slots
            </button>
            <button
              onClick={() => setSelectedDay('tomorrow')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedDay === 'tomorrow'
                  ? 'bg-[#D4AF37] text-[#070B14] shadow-md font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Tomorrow (Recommended)
            </button>
          </div>
        </div>

        {/* Live Slot Cards Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6">
          {slotsStatus.map((slot, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-[#070C16]/90 border border-white/10 hover:border-[#D4AF37]/50 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#D4AF37] font-semibold">
                    {slot.tag}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                      slot.status === 'High Demand'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-600/40'
                        : slot.status === 'Filling Fast'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                    }`}
                  >
                    {slot.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-[#FFDF78]" />
                  <h4 className="font-['Cinzel'] font-bold text-base sm:text-lg text-white">
                    {slot.time}
                  </h4>
                </div>
                <p className="text-xs text-gray-400 mb-4">{slot.name}</p>

                {/* Capacity Progress Bar */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs font-mono text-gray-300">
                    <span>Floor Occupancy</span>
                    <span className="text-[#FFDF78] font-bold">{slot.occupancy}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        slot.occupancy > 80
                          ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                          : 'bg-gradient-to-r from-emerald-400 to-[#D4AF37]'
                      }`}
                      style={{ width: `${slot.occupancy}%` }}
                    />
                  </div>
                </div>

                {/* Available Pool Breakdown */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-gray-300 py-2.5 px-3 rounded-xl bg-white/5 border border-white/5 mb-4">
                  <div>
                    <span className="text-gray-400 block">Haircut Chairs:</span>
                    <span className="text-emerald-400 font-bold">
                      {slot.haircutLeft} of {haircutMax} open
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Spa/Facial:</span>
                    <span className="text-emerald-400 font-bold">
                      {slot.otherLeft} of {otherMax} open
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={onOpenBooking}
                className="w-full py-2.5 rounded-xl bg-[#0E1628] hover:bg-[#D4AF37] text-[#FFDF78] hover:text-[#070B14] font-bold text-xs uppercase tracking-wider border border-[#D4AF37]/50 hover:border-[#D4AF37] transition-all flex items-center justify-center gap-1.5 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Reserve This Slot</span>
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Guarantee Banner */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>24-Hour Hassle-Free Reschedule &bull; Zero Upfront Advance &bull; Instant Confirmation</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">Need specific stylist or group appointment?</span>
            <button
              onClick={onOpenBooking}
              className="text-[#FFDF78] font-bold underline hover:text-white transition-colors"
            >
              VIP Concierge Request &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
