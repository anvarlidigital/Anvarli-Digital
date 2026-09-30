import React, { useState } from 'react';
import type { GalleryItem } from '../types';
import { Play, Sparkles, X, ZoomIn } from 'lucide-react';

interface GallerySectionProps {
  galleryItems: GalleryItem[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ galleryItems }) => {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);

  const categories = ['All', 'Hair', 'Bridal', 'Spa', 'Nails', 'Salon Interior'];

  const filteredItems = galleryItems.filter((item) => {
    if (activeFilter === 'All') return true;
    return item.category.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <section id="gallery" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#FFDF78] text-xs font-semibold uppercase tracking-widest mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Visual Portfolio
        </div>
        <h2 className="font-['Cinzel'] text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#FFDF78] to-[#AA7C11]">
          The Salon Gallery
        </h2>
        <p className="font-['Playfair_Display'] italic text-base sm:text-lg text-[#E6DFCA] mt-2">
          Immerse yourself in our signature hair, bridal styling and aesthetic art
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === cat
                ? 'bg-[#D4AF37] text-[#070B14] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'bg-[#0E1628] text-gray-300 hover:text-white border border-white/10 hover:border-[#D4AF37]/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Photo & Video Assets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setPreviewItem(item)}
            className="group relative h-80 rounded-2xl overflow-hidden border border-white/10 hover:border-[#D4AF37]/60 shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(212,175,55,0.2)]"
          >
            {/* Background Media */}
            {item.type === 'video' ? (
              <div className="w-full h-full bg-[#070B14] flex items-center justify-center relative">
                <video
                  src={item.url}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                  muted
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#D4AF37]/90 text-[#070B14] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            )}

            {/* Gradient Overlay & Caption */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] via-transparent to-black/20 opacity-90 group-hover:opacity-100 transition-opacity" />

            <div className="absolute top-4 left-4">
              <span className="px-2.5 py-1 rounded-md bg-[#070B14]/80 backdrop-blur-md border border-[#D4AF37]/30 text-[10px] font-mono text-[#FFDF78] uppercase">
                {item.category}
              </span>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <h4 className="font-['Cinzel'] text-sm sm:text-base font-bold text-white group-hover:text-[#FFDF78] transition-colors drop-shadow">
                  {item.title}
                </h4>
                <p className="text-[11px] text-gray-300 font-sans mt-0.5">
                  Click to inspect full view
                </p>
              </div>

              <div className="w-8 h-8 rounded-lg bg-[#0E1628]/80 border border-white/20 flex items-center justify-center text-gray-300 group-hover:text-[#FFDF78] group-hover:border-[#D4AF37]">
                <ZoomIn className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-[#0D1527] border border-[#D4AF37]/50 rounded-2xl overflow-hidden shadow-2xl"
          >
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black/90"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-h-[75vh] flex items-center justify-center bg-black">
              {previewItem.type === 'video' ? (
                <video
                  src={previewItem.url}
                  controls
                  autoPlay
                  className="max-h-[75vh] w-auto mx-auto"
                />
              ) : (
                <img
                  src={previewItem.url}
                  alt={previewItem.title}
                  className="max-h-[75vh] w-auto object-contain mx-auto"
                />
              )}
            </div>

            <div className="p-4 sm:p-6 bg-[#0E1628] border-t border-[#D4AF37]/30 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase text-[#D4AF37] font-semibold tracking-wider">
                  {previewItem.category}
                </span>
                <h3 className="font-['Cinzel'] text-lg font-bold text-white mt-0.5">
                  {previewItem.title}
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
