import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MoveHorizontal } from 'lucide-react';

interface Transformation {
  id: string;
  title: string;
  category: string;
  beforeImg: string;
  afterImg: string;
  note: string;
}

const TRANSFORMATIONS: Transformation[] = [
  {
    id: 't-1',
    title: 'Nano Plastia Silk Transformation',
    category: 'Hair Treatments',
    beforeImg: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1000&q=80',
    afterImg: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80',
    note: 'Frizz-free mirror shine lasting 6+ months'
  },
  {
    id: 't-2',
    title: 'Precision Gents Sculpt & Spa',
    category: 'Gents',
    beforeImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
    afterImg: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=80',
    note: 'Skin fade, beard contour and gold mask'
  },
  {
    id: 't-3',
    title: 'Bridal Couture & Hair Styling',
    category: 'Bridal',
    beforeImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    afterImg: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1000&q=80',
    note: 'High-definition glow & floral hair sculpting'
  }
];

export const BeforeAfterSlider: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 - 100
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [isDragging, setIsDragging] = useState(false);

  const activeItem = TRANSFORMATIONS[activeIdx];

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setSliderPos(percent);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  return (
    <section className="py-12 sm:py-16 px-3 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#FFDF78] text-xs font-semibold uppercase tracking-widest mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Dramatic Transformations
        </div>
        <h2 className="font-['Cinzel'] text-2xl xs:text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#FFDF78] to-[#AA7C11]">
          Before & After Mastery
        </h2>
        <p className="font-['Playfair_Display'] italic text-xs sm:text-base text-[#D4C8B0] mt-1">
          Drag or tap to reveal the bespoke salon difference
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-start sm:justify-center gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-none px-1">
        {TRANSFORMATIONS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => { setActiveIdx(i); setSliderPos(50); }}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              activeIdx === i
                ? 'bg-[#D4AF37] text-[#070B14] shadow-[0_0_15px_rgba(212,175,55,0.3)] font-bold'
                : 'bg-[#0E1628] text-gray-300 hover:text-white border border-white/10'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Interactive Drag Comparison Frame */}
      <div
        ref={containerRef}
        onClick={handleClick}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative w-full max-w-4xl mx-auto h-[260px] xs:h-[320px] sm:h-[420px] md:h-[480px] rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#D4AF37]/50 shadow-[0_0_50px_rgba(0,0,0,0.8)] cursor-ew-resize select-none touch-none"
      >
        {/* After Image (Background full) */}
        <img
          src={activeItem.afterImg}
          alt="After Transformation"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Before Image (Clipped overlay) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={activeItem.beforeImg}
            alt="Before Transformation"
            className="absolute inset-0 h-full object-cover max-w-none filter brightness-90"
            style={{ width: `${containerWidth}px` }}
          />
        </div>

        {/* Badges on left & right */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 px-2.5 sm:px-3 py-1 rounded-lg bg-[#070B14]/85 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs font-mono text-gray-300">
          BEFORE
        </div>
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 px-2.5 sm:px-3 py-1 rounded-lg bg-[#D4AF37]/90 backdrop-blur-md border border-[#FFDF78] text-[10px] sm:text-xs font-mono font-bold text-[#070B14]">
          AFTER
        </div>

        {/* Center Split Divider Bar */}
        <div
          className="absolute top-0 bottom-0 z-20 w-1 bg-[#D4AF37] shadow-[0_0_15px_#D4AF37]"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Circular Grab Handle */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#070B14] border-2 border-[#D4AF37] flex items-center justify-center text-[#FFDF78] shadow-[0_0_20px_rgba(212,175,55,0.6)]">
            <MoveHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Bottom Note */}
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-20 flex justify-center pointer-events-none">
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#070B14]/90 border border-[#D4AF37]/40 text-[11px] sm:text-xs text-[#FFDF78] backdrop-blur-md text-center max-w-md truncate">
            {activeItem.note}
          </div>
        </div>
      </div>
    </section>
  );
};
