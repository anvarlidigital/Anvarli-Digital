import React from 'react';
import type { StaffItem } from '../types';
import { Calendar, Phone, Sparkles, Star } from 'lucide-react';

interface TeamSectionProps {
  staffList: StaffItem[];
  onOpenBooking: () => void;
}

export const TeamSection: React.FC<TeamSectionProps> = ({ staffList, onOpenBooking }) => {
  const activeStaff = staffList.filter((s) => s.status !== 'Former');

  return (
    <section id="team" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#FFDF78] text-xs font-semibold uppercase tracking-widest mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Certified Maestros
        </div>
        <h2 className="font-['Cinzel'] text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#FFDF78] to-[#AA7C11]">
          Meet the Master Stylists
        </h2>
        <p className="font-['Playfair_Display'] italic text-base sm:text-lg text-[#E6DFCA] mt-2">
          Internationally trained artists dedicated to crafting your signature look
        </p>
      </div>

      {/* Grid of Staff Members */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeStaff.map((staff) => (
          <div
            key={staff.id}
            className="group relative rounded-2xl bg-[#0E1628]/85 border border-[#D4AF37]/30 overflow-hidden shadow-xl backdrop-blur-md hover:border-[#D4AF37] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
          >
            {/* Photo Container */}
            <div className="relative h-64 w-full overflow-hidden bg-[#070B14]">
              <img
                src={
                  staff.photoURL ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                }
                alt={staff.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E1628] via-transparent to-transparent" />

              <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#070B14]/80 backdrop-blur-md border border-[#D4AF37]/40 text-[#FFDF78] text-[11px] font-mono font-bold">
                <Star className="w-3 h-3 fill-current text-[#FFDF78]" />
                <span>Master</span>
              </div>
            </div>

            {/* Info Body */}
            <div className="p-5">
              <h3 className="font-['Cinzel'] text-lg font-bold text-white group-hover:text-[#FFDF78] transition-colors">
                {staff.name}
              </h3>
              <p className="text-xs text-[#D4AF37] font-medium mt-0.5">
                {staff.role}
              </p>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#D4AF37]" />
                  Verified Stylist
                </span>
                <span>Since {staff.dateJoined ? staff.dateJoined.substring(0, 4) : '2023'}</span>
              </div>

              <button
                onClick={onOpenBooking}
                className="w-full mt-4 py-2 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/40 text-xs font-semibold text-gray-300 hover:text-[#FFDF78] transition-all flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Request {staff.name.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
