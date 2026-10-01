import React, { useState, useMemo } from 'react';
import type { ServiceItem, CategoryItem } from '../types';
import { Check, Plus, Search, Sparkles, Tag, Scissors } from 'lucide-react';

interface ServicesSectionProps {
  categories: CategoryItem[];
  services: ServiceItem[];
  selectedServiceIds: string[];
  onToggleService: (service: ServiceItem) => void;
  onOpenBooking: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  categories,
  services,
  selectedServiceIds,
  onToggleService,
  onOpenBooking,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active categories in order
  const activeCategories = useMemo(() => {
    return categories
      .filter((c) => c.active !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [categories]);

  // Group services by category heading
  const groupedServices = useMemo(() => {
    const activeServices = services.filter((s) => s.active !== false);

    // Filter by search query
    const filtered = activeServices.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.note && s.note.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategoryFilter === 'all' || s.category === selectedCategoryFilter;

      return matchesSearch && matchesCat;
    });

    // Group by category name preserving order
    const groups: { category: string; items: ServiceItem[] }[] = [];

    activeCategories.forEach((cat) => {
      const items = filtered
        .filter((s) => s.category.toLowerCase() === cat.name.toLowerCase())
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      if (items.length > 0) {
        groups.push({ category: cat.name, items });
      }
    });

    // Catch any services under categories not in activeCategories list
    const knownCats = new Set(activeCategories.map((c) => c.name.toLowerCase()));
    const orphans = filtered.filter((s) => !knownCats.has(s.category.toLowerCase()));
    if (orphans.length > 0) {
      groups.push({ category: 'Other Specialties', items: orphans });
    }

    return groups;
  }, [services, activeCategories, searchQuery, selectedCategoryFilter]);

  return (
    <section id="services" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#FFDF78] text-xs font-semibold uppercase tracking-widest mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          The Haute Salon Collection
        </div>
        <h2 className="font-['Cinzel'] text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#FFDF78] to-[#AA7C11]">
          Services & Prices
        </h2>
        <p className="font-['Playfair_Display'] italic text-base sm:text-lg text-[#E6DFCA] mt-2">
          Grouped by category headings • Zero advance payment required
        </p>
      </div>

      {/* Filter Tabs & Search Box */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoryFilter === 'all'
                ? 'bg-[#D4AF37] text-[#070B14] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                : 'bg-[#0E1628] text-gray-300 hover:text-white border border-white/10 hover:border-[#D4AF37]/30'
            }`}
          >
            All Specialties
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat.name)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategoryFilter === cat.name
                  ? 'bg-[#D4AF37] text-[#070B14] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                  : 'bg-[#0E1628] text-gray-300 hover:text-white border border-white/10 hover:border-[#D4AF37]/30'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search service, facial, spa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0E1628] border border-[#D4AF37]/30 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* Selected Items Floating Action Bar */}
      {selectedServiceIds.length > 0 && (
        <div className="sticky top-20 sm:top-24 z-30 mb-8 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0D1527]/95 border-2 border-[#D4AF37] shadow-[0_10px_40px_rgba(212,175,55,0.3)] backdrop-blur-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#D4AF37] text-[#070B14] flex items-center justify-center font-bold text-sm shrink-0">
              {selectedServiceIds.length}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider block truncate">
                Selected for Booking
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#FFDF78] truncate block">
                {selectedServiceIds.length} {selectedServiceIds.length === 1 ? 'service' : 'services'} added to pass
              </span>
            </div>
          </div>

          <button
            onClick={onOpenBooking}
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#FFF0A5] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md text-center"
          >
            Continue to Slot Selection
          </button>
        </div>
      )}

      {/* Services List Grouped Under Category Headings */}
      {groupedServices.length === 0 ? (
        <div className="text-center py-16 bg-[#0E1628]/40 rounded-2xl border border-white/5">
          <p className="text-gray-400 text-sm">No services match your criteria.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {groupedServices.map((group) => (
            <div key={group.category} className="space-y-4">
              {/* Category Section Heading */}
              <div className="flex items-center gap-3 border-b border-[#D4AF37]/25 pb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]" />
                <h3 className="font-['Cinzel'] text-xl sm:text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#FFDF78] to-[#D4AF37]">
                  CATEGORY: {group.category}
                </h3>
              </div>

              {/* Grid of 3D Tilt Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((srv) => {
                  const isSelected = selectedServiceIds.includes(srv.id);
                  const displayImage =
                    srv.image ||
                    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80';

                  return (
                    <div
                      key={srv.id}
                      onClick={() => onToggleService(srv)}
                      className={`group relative rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#15223C] border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.35)] -translate-y-1'
                          : 'bg-[#0E1628]/90 border-white/10 hover:border-[#D4AF37]/60 hover:bg-[#121C31] hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.5)]'
                      }`}
                    >
                      {/* Image Banner Header */}
                      <div className="relative h-48 w-full overflow-hidden bg-[#070B14]">
                        <img
                          src={displayImage}
                          alt={srv.name}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 filter brightness-95"
                          loading="lazy"
                        />
                        {/* Gradient Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1628] via-[#0E1628]/30 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-md bg-[#070B14]/80 backdrop-blur-md border border-[#D4AF37]/40 text-[#FFDF78] text-[10px] font-mono uppercase tracking-wider font-semibold">
                            {srv.category}
                          </span>

                          {srv.isHaircut && (
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#D4AF37]/90 text-[#070B14] text-[10px] font-bold shadow-md">
                              <Scissors className="w-3 h-3 stroke-[2.5]" />
                              <span>Haircut Pool</span>
                            </div>
                          )}
                        </div>

                        {/* Highlight Note Badge floating on image */}
                        {srv.note && (
                          <div className="absolute bottom-3 left-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/85 border border-emerald-500/50 text-emerald-300 text-[11px] font-semibold backdrop-blur-md shadow-md">
                              <Tag className="w-3 h-3 text-emerald-400" />
                              <span>{srv.note}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Content & Pricing */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-['Cinzel'] text-base sm:text-lg font-bold text-white group-hover:text-[#FFDF78] transition-colors leading-snug">
                            {srv.name}
                          </h4>
                        </div>

                        {/* Bottom Pricing & Action */}
                        <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between">
                          {/* Price Presentation */}
                          <div className="flex items-baseline gap-2">
                            {srv.price !== null ? (
                              <>
                                <span className="font-mono text-2xl font-black text-[#FFDF78]">
                                  ₹{srv.offerPrice || srv.price}
                                </span>
                                {srv.offerPrice && (
                                  <span className="font-mono text-xs text-gray-500 line-through">
                                    ₹{srv.price}
                                  </span>
                                )}
                                {srv.priceLabel && (
                                  <span className="text-xs text-gray-400 font-sans font-medium">
                                    ({srv.priceLabel})
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="font-semibold text-sm text-[#FFDF78] bg-[#D4AF37]/15 px-3 py-1 rounded-lg border border-[#D4AF37]/35">
                                {srv.priceLabel || 'Package Discount'}
                              </span>
                            )}
                          </div>

                          {/* Select Toggle Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleService(srv);
                            }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] shadow-[0_0_15px_#D4AF37] scale-105'
                                : 'bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-[#D4AF37]/25 border border-white/10 group-hover:border-[#D4AF37]/50'
                            }`}
                            title={isSelected ? 'Remove from selection' : 'Add to booking pass'}
                          >
                            {isSelected ? (
                              <Check className="w-5 h-5 stroke-[3]" />
                            ) : (
                              <Plus className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

