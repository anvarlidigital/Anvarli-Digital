import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MoveHorizontal, Calendar, CheckCircle2, ChevronRight } from 'lucide-react';
import { TiltCard3D } from './TiltCard3D';

interface Transformation {
  id: string;
  title: string;
  category: string;
  beforeImg: string;
  afterImg: string;
  note: string;
  duration: string;
  serviceMatch: string;
}

const TRANSFORMATIONS: Transformation[] = [
  {
    id: 't-1',
    title: 'Nano Plastia Silk Transformation',
    category: 'Hair Treatments',
    beforeImg: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1000&q=80',
    afterImg: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80',
    note: 'Frizz-free mirror shine lasting 6+ months with organic amino therapy',
    duration: '2.5 Hours',
    serviceMatch: 'Nano Plastia',
  },
  {
    id: 't-2',
    title: 'Precision Gents Sculpt & Spa',
    category: 'Gents',
    beforeImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
    afterImg: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=80',
    note: 'Skin fade, beard contour sculpting and golden herbal rejuvenation',
    duration: '75 Mins',
    serviceMatch: 'Spa',
  },
  {
    id: 't-3',
    title: 'Bridal Couture & Hair Sculpting',
    category: 'Bridal & Occasion',
    beforeImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    afterImg: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1000&q=80',
    note: 'High-definition bridal luminescence & floral architectural hair styling',
    duration: '3 Hours',
    serviceMatch: 'Advanced Hair Cut + Spa (Any length)',
  },
];

interface BeforeAfterSliderProps {
  onOpenBooking?: () => void;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ onOpenBooking = () => {} }) => {
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
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#FFDF78] text-xs font-semibold uppercase tracking-widest mb-3 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Dramatic Transformations</span>
        </div>
        <h2 className="font-['Cinzel'] text-2xl xs:text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#FFDF78] to-[#AA7C11]">
          Before & After Mastery
        </h2>
        <p className="font-['Playfair_Display'] italic text-sm sm:text-lg text-[#D4C8B0] mt-1.5">
          Drag split handle or tap anywhere to reveal the bespoke salon difference
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-start sm:justify-center gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-none px-1">
        {TRANSFORMATIONS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => { setActiveIdx(i); setSliderPos(50); }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              activeIdx === i
                ? 'bg-[#D4AF37] text-[#070B14] shadow-[0_0_20px_rgba(212,175,55,0.4)] font-bold'
                : 'bg-[#0E1628] text-gray-300 hover:text-white border border-white/10'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Interactive Drag Comparison Frame inside 3D Tilt Card */}
      <TiltCard3D maxTilt={4} scale={1.01} className="w-full max-w-4xl mx-auto">
        <div
          ref={containerRef}
          onClick={handleClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="relative w-full h-[270px] xs:h-[330px] sm:h-[440px] md:h-[500px] rounded-3xl overflow-hidden border-2 border-[#D4AF37]/60 shadow-[0_20px_70px_rgba(0,0,0,0.85)] cursor-ew-resize select-none touch-none bg-[#070B14]"
        >
          {/* After Image (Background full) */}
          <img
            src={activeItem.afterImg}
            alt="After Transformation"
            className="absolute inset-0 w-full h-full object-cover filter brightness-105"
          />

          {/* Before Image (Clipped overlay) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={activeItem.beforeImg}
              alt="Before Transformation"
              className="absolute inset-0 h-full object-cover max-w-none filter brightness-90 saturate-75"
              style={{ width: `${containerWidth}px` }}
            />
          </div>

          {/* Badges on left & right */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 px-3 py-1 rounded-xl bg-[#070B14]/85 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs font-mono text-gray-300">
            BEFORE SALON
          </div>
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 px-3 py-1 rounded-xl bg-[#D4AF37] backdrop-blur-md border border-[#FFDF78] text-[10px] sm:text-xs font-mono font-black text-[#070B14] shadow-lg">
            AFTER &bull; LUXURY RESULT
          </div>

          {/* Center Split Divider Bar */}
          <div
            className="absolute top-0 bottom-0 z-20 w-1 bg-[#FFDF78] shadow-[0_0_20px_#D4AF37]"
            style={{ left: `${sliderPos}%` }}
          >
            {/* Circular Grab Handle */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#070B14] border-2 border-[#D4AF37] flex items-center justify-center text-[#FFDF78] shadow-[0_0_25px_rgba(212,175,55,0.7)] group">
              <MoveHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          {/* Bottom Note & Quick Book Callout */}
          <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-2xl bg-[#070B14]/90 border border-[#D4AF37]/50 backdrop-blur-xl pointer-events-auto">
            <div className="text-left min-w-0">
              <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider block font-semibold">
                {activeItem.category} &bull; {activeItem.duration}
              </span>
              <p className="text-xs sm:text-sm text-white font-medium truncate">
                {activeItem.note}
              </p>
            </div>

            <button
              onClick={onOpenBooking}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Get This Transformation</span>
            </button>
          </div>
        </div>
      </TiltCard3D>
    </section>
  );
};
