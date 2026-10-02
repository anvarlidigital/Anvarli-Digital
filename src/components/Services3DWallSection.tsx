import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { ServiceItem, CategoryItem } from '../types';
import { Throne3DBackground } from './Throne3DBackground';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flame,
  Grid,
  Layers,
  MessageCircle,
  Plus,
  Scissors,
  Search,
  Sparkles,
  Tag,
  Zap,
} from 'lucide-react';

interface Services3DWallSectionProps {
  categories: CategoryItem[];
  services: ServiceItem[];
  selectedServiceIds: string[];
  onToggleService: (service: ServiceItem) => void;
  onOpenBooking: () => void;
  liteMode?: boolean;
}

export const Services3DWallSection: React.FC<Services3DWallSectionProps> = ({
  categories,
  services,
  selectedServiceIds,
  onToggleService,
  onOpenBooking,
  liteMode = false,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentWallIndex, setCurrentWallIndex] = useState<number>(0);
  const [active3DCat, setActive3DCat] = useState<string>('all');

  // Filtered active categories
  const activeCategories = useMemo(() => {
    return categories
      .filter((c) => c.active !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [categories]);

  // Curated Services for the 3D Walls Stage (Only Services as requested)
  const serviceWalls = useMemo(() => {
    const list = services.filter((s) => s.active !== false);
    if (active3DCat === 'all') return list;
    if (active3DCat === 'gents') return list.filter((s) => s.category.toLowerCase().includes('gents'));
    if (active3DCat === 'hair') {
      return list.filter(
        (s) =>
          s.category.toLowerCase().includes('hair') ||
          s.isHaircut
      );
    }
    if (active3DCat === 'treatments') {
      return list.filter(
        (s) =>
          s.category.toLowerCase().includes('treatment') ||
          s.category.toLowerCase().includes('keratin') ||
          s.name.toLowerCase().includes('smoothening') ||
          s.name.toLowerCase().includes('plastia')
      );
    }
    if (active3DCat === 'facial') {
      return list.filter(
        (s) =>
          s.category.toLowerCase().includes('facial') ||
          s.category.toLowerCase().includes('massage') ||
          s.category.toLowerCase().includes('d-tan') ||
          s.category.toLowerCase().includes('spa')
      );
    }
    if (active3DCat === 'combos') {
      return list.filter((s) => s.category.toLowerCase().includes('combo'));
    }
    return list;
  }, [services, active3DCat]);

  const N = serviceWalls.length;

  // 3D Stage Refs & Animation math
  const stageRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const panelElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const railsRef = useRef<(HTMLElement | null)[]>([]);

  const animRef = useRef({
    target: 0,
    cur: 0,
    mx: 0,
    my: 0,
    cx: 0,
    cy: 0,
    P: 1000,
    D: 1200,
    pos: [] as { x: number; y: number; z: number }[],
    rafId: 0,
  });

  // Ease function
  const ease = (t: number) => {
    const clamped = Math.max(0, Math.min(1, t));
    return clamped * clamped * clamped * (clamped * (6 * clamped - 15) + 10);
  };

  // Jump to 3D Wall index
  const goToWallIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(N - 1, index));
    setCurrentWallIndex(clamped);
    animRef.current.target = N > 1 ? clamped / (N - 1) : 0;
  }, [N]);

  // Layout 3D Coordinates
  const layout = useCallback(() => {
    if (!stageRef.current) return;
    const W = stageRef.current.clientWidth || window.innerWidth;
    const H = stageRef.current.clientHeight || 550;
    const isPortrait = W < H;

    const P = 0.85 * Math.max(W, H);
    const D = 1.15 * P;
    animRef.current.P = P;
    animRef.current.D = D;

    stageRef.current.style.perspective = `${P}px`;

    const xo = isPortrait ? 0.35 * W : 0.25 * W;
    const yo = isPortrait ? 0.1 * H : 0.08 * H;
    const mh = isPortrait ? 0.52 * H : 0.6 * H;
    const mw = isPortrait ? 0.86 * W : 0.62 * W;

    const sx = [-1, 1, -1, 1];
    const sy = [-1, 1, 1, -1];

    const newPos: { x: number; y: number; z: number }[] = [];

    serviceWalls.forEach((_, i) => {
      const w = Math.min(mw, mh * 1.5);
      const h = w / 1.5;
      const el = panelElsRef.current[i];
      if (el) {
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.left = `${(W - w) / 2}px`;
        el.style.top = `${(H - h) / 2}px`;
      }
      newPos.push({
        x: sx[i % 4] * xo,
        y: sy[i % 4] * yo,
        z: -i * D,
      });
    });

    animRef.current.pos = newPos;

    // Floor rails
    const fy = yo + mh / 2 + 0.12 * H;
    const L = P * 1.1 + (N - 1) * D + 3 * P;
    railsRef.current.forEach((l, k) => {
      if (l) {
        l.style.height = `${L}px`;
        l.style.transform = `translate3d(${(k - 5) * 0.2 * W - 1}px, ${fy}px, ${P * 1.1}px) rotateX(-90deg)`;
      }
    });
  }, [serviceWalls, N]);

  // 60fps Animation Loop for 3D stage
  useEffect(() => {
    let active = true;

    const frame = () => {
      if (!active) return;
      const a = animRef.current;
      a.cur += (a.target - a.cur) * 0.09;
      a.cx += (a.mx - a.cx) * 0.06;
      a.cy += (a.my - a.cy) * 0.06;

      if (a.pos.length >= 1 && worldRef.current && rigRef.current) {
        const s = a.cur * Math.max(1, N - 1);
        const i = Math.min(N - 2, Math.max(0, Math.floor(s)));
        const e = ease((s - i - 0.2) / 0.6);

        const pA = a.pos[i] || { x: 0, y: 0, z: 0 };
        const pB = a.pos[i + 1] || pA;

        const X = pA.x + (pB.x - pA.x) * e;
        const Y = pA.y + (pB.y - pA.y) * e;
        const Z = pA.z + (pB.z - pA.z) * e;

        worldRef.current.style.transform = `translate3d(${-X}px, ${-Y}px, ${-Z}px)`;

        const bank = Math.sin(Math.PI * e) * (pB.x > pA.x ? -3.5 : 3.5);
        rigRef.current.style.transform = `rotateX(${a.cy * -2.5}deg) rotateY(${a.cx * 4 + bank}deg)`;

        panelElsRef.current.forEach((el, k) => {
          if (!el) return;
          const p = a.pos[k];
          if (!p) return;
          const rz = p.z - Z;
          const isVisible = rz < a.P * 0.9 && rz > -a.P * 2.2;
          el.style.visibility = isVisible ? 'visible' : 'hidden';

          if (isVisible) {
            const r = Math.min(1, Math.abs(rz) / a.D) * (k % 2 ? -13 : 13);
            el.style.transform = `translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotateY(${r}deg)`;
          }
        });
      }

      animRef.current.rafId = requestAnimationFrame(frame);
    };

    animRef.current.rafId = requestAnimationFrame(frame);

    return () => {
      active = false;
      cancelAnimationFrame(animRef.current.rafId);
    };
  }, [N]);

  // Stage Listeners
  useEffect(() => {
    layout();
    const handleResize = () => layout();

    const stageEl = stageRef.current;
    if (!stageEl) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = stageEl.getBoundingClientRect();
      animRef.current.mx = (e.clientX - rect.left) / rect.width - 0.5;
      animRef.current.my = (e.clientY - rect.top) / rect.height - 0.5;
    };

    // Wheel event inside 3D stage moves through 3D service walls
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 20) {
        if (e.deltaY > 0) {
          goToWallIndex(currentWallIndex + 1);
        } else {
          goToWallIndex(currentWallIndex - 1);
        }
      }
    };

    stageEl.addEventListener('pointermove', handlePointerMove, { passive: true });
    stageEl.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      stageEl.removeEventListener('pointermove', handlePointerMove);
      stageEl.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
    };
  }, [layout, currentWallIndex, goToWallIndex]);

  // Group services by category heading for the Full Catalog section
  const groupedServices = useMemo(() => {
    const activeServices = services.filter((s) => s.active !== false);

    const filtered = activeServices.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.note && s.note.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        activeCategoryFilter === 'all' || s.category.toLowerCase() === activeCategoryFilter.toLowerCase();

      return matchesSearch && matchesCat;
    });

    const groups: { category: string; items: ServiceItem[] }[] = [];

    activeCategories.forEach((cat) => {
      const items = filtered
        .filter((s) => s.category.toLowerCase() === cat.name.toLowerCase())
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      if (items.length > 0) {
        groups.push({ category: cat.name, items });
      }
    });

    return groups;
  }, [services, activeCategories, searchQuery, activeCategoryFilter]);

  return (
    <section id="services" className="relative z-10 py-12 sm:py-16 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* 1. SECTION HEADLINE */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#FFDF78] text-xs font-semibold uppercase tracking-widest mb-3 backdrop-blur-md">
          <Crown className="w-3.5 h-3.5 text-[#FFDF78]" />
          <span>Haute Unisex Salon Rituals</span>
        </div>
        <h2 className="font-['Cinzel'] text-3xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#FFDF78] to-[#AA7C11]">
          Services & Prices
        </h2>
        <p className="font-['Playfair_Display'] italic text-base sm:text-xl text-[#E6DFCA] mt-2">
          3D Throne Wall Showcase &bull; Zero advance payment required
        </p>
      </div>

      {/* =========================================================================
         2. INTERACTIVE 3D SCROLL WALLS SHOWCASE (ONLY SERVICES + 3D THRONE IN BG)
         ========================================================================= */}
      <div className="relative w-full rounded-3xl overflow-hidden border-2 border-[#D4AF37]/50 shadow-[0_0_50px_rgba(212,175,55,0.25)] bg-[#070B14] mb-12 sm:mb-16">
        {/* 3D Viewport Stage */}
        <div
          ref={stageRef}
          className="relative w-full h-[480px] xs:h-[530px] sm:h-[600px] md:h-[650px] overflow-hidden select-none salon-walls-stage"
        >
          {/* 3D Royal Throne Room Background */}
          <Throne3DBackground
            cur={animRef.current.cur}
            cx={animRef.current.cx}
            cy={animRef.current.cy}
            liteMode={liteMode}
          />

          {/* 3D Perspective Rig & World (Only Services Panels + Floor Rails) */}
          <div ref={rigRef} className="salon-walls-rig pointer-events-none">
            <div ref={worldRef} className="salon-walls-world pointer-events-none">
              {/* Floor Rails */}
              {Array.from({ length: 11 }).map((_, k) => (
                <i
                  key={k}
                  ref={(el) => { railsRef.current[k] = el; }}
                  className="salon-walls-rail"
                />
              ))}

              {/* 3D Service Wall Panels */}
              {serviceWalls.map((srv, idx) => {
                const isSelected = selectedServiceIds.includes(srv.id);
                const displayImage =
                  srv.image ||
                  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80';

                return (
                  <div
                    key={srv.id}
                    ref={(el) => { panelElsRef.current[idx] = el; }}
                    onClick={() => onToggleService(srv)}
                    className="salon-walls-panel bg-[#0B101D]/90 backdrop-blur-xl border border-[#D4AF37]/40 overflow-hidden flex flex-col group cursor-pointer pointer-events-auto"
                  >
                    {/* Media Container */}
                    <div className="relative w-full h-[58%] overflow-hidden bg-[#060A13]">
                      <img
                        src={displayImage}
                        alt={srv.name}
                        draggable={false}
                        className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B101D] via-transparent to-black/30 opacity-90 group-hover:opacity-100 transition-opacity" />

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-[#070B14]/90 border border-[#D4AF37]/50 text-[#FFDF78] text-[10px] sm:text-xs font-semibold tracking-wider uppercase font-['Jost'] shadow-md backdrop-blur-md">
                          {srv.category}
                        </span>
                        {srv.isHaircut && (
                          <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FFEAA7] text-[10px] font-medium backdrop-blur-md">
                            Signature Haircut
                          </span>
                        )}
                      </div>

                      {/* Price Tag */}
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex flex-col items-end">
                        {srv.offerPrice ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#070B14] font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                            <span>₹{srv.offerPrice}</span>
                            <span className="line-through text-[10px] text-[#070B14]/70 font-normal">
                              ₹{srv.price}
                            </span>
                          </div>
                        ) : srv.price ? (
                          <div className="px-3 py-1.5 rounded-xl bg-[#070B14]/90 border border-[#D4AF37]/60 text-[#FFDF78] font-bold text-xs sm:text-sm shadow-md backdrop-blur-md">
                            {srv.priceLabel && <span className="text-[10px] font-normal mr-1">{srv.priceLabel}</span>}
                            ₹{srv.price}
                          </div>
                        ) : (
                          srv.priceLabel && (
                            <div className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37] text-[#FFDF78] font-bold text-xs backdrop-blur-md">
                              {srv.priceLabel}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="relative flex-1 p-4 sm:p-6 flex flex-col justify-between">
                      <div>
                        <h2 className="font-['Bodoni_Moda'] text-lg sm:text-2xl font-semibold text-white group-hover:text-[#FFDF78] transition-colors leading-tight">
                          {srv.name}
                        </h2>
                        <p className="font-['Jost'] text-xs sm:text-sm text-[#C9A37A] mt-1.5 line-clamp-2 leading-relaxed">
                          {srv.note || 'Signature salon ritual with luxury herbal essences and relaxing scalp massage.'}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleService(srv);
                          }}
                          className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#25D366] text-white shadow-[0_0_15px_rgba(37,211,102,0.4)]'
                              : 'bg-[#D4AF37]/20 hover:bg-[#D4AF37] text-[#FFDF78] hover:text-[#070B14] border border-[#D4AF37]/60'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Selected</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Add to Booking</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSelected) onToggleService(srv);
                            onOpenBooking();
                          }}
                          className="px-3.5 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-extrabold text-xs sm:text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Book Now</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3D Stage HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 xs:p-4 sm:p-6">
            {/* Top Bar: Title & Category Filters */}
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 pointer-events-auto">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37] text-[#070B14] flex items-center justify-center font-bold shadow-md">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-['Cinzel'] font-bold text-xs sm:text-sm text-white">
                    3D Service Walls
                  </span>
                  <span className="text-[10px] text-[#C9A37A] block font-mono">
                    Throne Chamber View
                  </span>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none pointer-events-auto">
                <button
                  type="button"
                  onClick={() => { setActive3DCat('all'); goToWallIndex(0); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active3DCat === 'all'
                      ? 'bg-[#D4AF37] text-[#070B14] shadow-md'
                      : 'bg-[#0E1628]/85 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  All ({services.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setActive3DCat('gents'); goToWallIndex(0); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active3DCat === 'gents'
                      ? 'bg-[#D4AF37] text-[#070B14] shadow-md'
                      : 'bg-[#0E1628]/85 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  Gents
                </button>
                <button
                  type="button"
                  onClick={() => { setActive3DCat('hair'); goToWallIndex(0); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active3DCat === 'hair'
                      ? 'bg-[#D4AF37] text-[#070B14] shadow-md'
                      : 'bg-[#0E1628]/85 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  Haircut & Spa
                </button>
                <button
                  type="button"
                  onClick={() => { setActive3DCat('treatments'); goToWallIndex(0); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active3DCat === 'treatments'
                      ? 'bg-[#D4AF37] text-[#070B14] shadow-md'
                      : 'bg-[#0E1628]/85 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  Keratin & Treatments
                </button>
                <button
                  type="button"
                  onClick={() => { setActive3DCat('facial'); goToWallIndex(0); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active3DCat === 'facial'
                      ? 'bg-[#D4AF37] text-[#070B14] shadow-md'
                      : 'bg-[#0E1628]/85 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  Facial & D-Tan
                </button>
                <button
                  type="button"
                  onClick={() => { setActive3DCat('combos'); goToWallIndex(0); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active3DCat === 'combos'
                      ? 'bg-[#D4AF37] text-[#070B14] shadow-md'
                      : 'bg-[#0E1628]/85 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  Combos
                </button>
              </div>

              {/* Counter */}
              <div className="px-3 py-1.5 rounded-xl bg-[#0E1628]/90 border border-[#D4AF37]/40 text-[#C9A37A] font-mono text-xs pointer-events-auto">
                {currentWallIndex + 1} of {N}
              </div>
            </div>

            {/* Bottom Controls: Chevrons & Dots */}
            <div className="w-full flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => goToWallIndex(currentWallIndex - 1)}
                  disabled={currentWallIndex === 0}
                  className="w-8 h-8 rounded-xl bg-[#0E1628]/90 hover:bg-[#D4AF37] text-gray-300 hover:text-[#070B14] border border-white/10 disabled:opacity-30 flex items-center justify-center cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => goToWallIndex(currentWallIndex + 1)}
                  disabled={currentWallIndex === N - 1}
                  className="w-8 h-8 rounded-xl bg-[#0E1628]/90 hover:bg-[#D4AF37] text-gray-300 hover:text-[#070B14] border border-white/10 disabled:opacity-30 flex items-center justify-center cursor-pointer transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Dots */}
              <nav className="flex items-center gap-1.5 pointer-events-auto overflow-x-auto max-w-[60vw] px-2 scrollbar-none">
                {serviceWalls.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => goToWallIndex(dotIdx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      dotIdx === currentWallIndex
                        ? 'w-6 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.7)]'
                        : 'w-2 bg-transparent border border-[#C9A37A]/50'
                    }`}
                  />
                ))}
              </nav>

              {/* Scroll / Swipe Hint */}
              <span className="text-[11px] text-[#C9A37A] font-mono hidden sm:inline">
                Scroll Wheel or Tap Dots to Traverse
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
         3. FULL CATEGORIZED SERVICES CATALOG (FULL-FILL THE PAGES WITH CONTENT!)
         All 29 Official Services Categorized with Search & Instant Booking
         ========================================================================= */}
      <div className="w-full">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategoryFilter === 'all'
                  ? 'bg-[#D4AF37] text-[#070B14] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                  : 'bg-[#0E1628] text-gray-300 hover:text-white border border-white/10 hover:border-[#D4AF37]/30'
              }`}
            >
              All Categories ({services.length})
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategoryFilter === cat.name
                    ? 'bg-[#D4AF37] text-[#070B14] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                    : 'bg-[#0E1628] text-gray-300 hover:text-white border border-white/10 hover:border-[#D4AF37]/30'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search haircut, keratin, facial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0E1628] border border-[#D4AF37]/30 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* Selected Services Sticky Bar */}
        {selectedServiceIds.length > 0 && (
          <div className="sticky top-20 sm:top-24 z-30 mb-8 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0D1527]/95 border-2 border-[#D4AF37] shadow-[0_10px_40px_rgba(212,175,55,0.3)] backdrop-blur-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#D4AF37] text-[#070B14] flex items-center justify-center font-bold text-sm shrink-0">
                {selectedServiceIds.length}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider block truncate">
                  Selected for VIP Booking
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

        {/* Categorized Services List */}
        <div className="space-y-12">
          {groupedServices.map((group) => (
            <div key={group.category} className="space-y-4">
              {/* Category Heading Banner */}
              <div className="flex items-center gap-3 border-b border-[#D4AF37]/30 pb-3">
                <div className="w-3 h-3 rounded-full bg-[#D4AF37] shadow-[0_0_12px_#D4AF37]" />
                <h3 className="font-['Cinzel'] text-xl sm:text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#FFDF78] to-[#D4AF37]">
                  CATEGORY: {group.category}
                </h3>
              </div>

              {/* Service Cards Grid */}
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
                      {/* Image Header */}
                      <div className="relative h-48 w-full overflow-hidden bg-[#070B14]">
                        <img
                          src={displayImage}
                          alt={srv.name}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 filter brightness-95"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1628] via-[#0E1628]/30 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-md bg-[#070B14]/85 border border-[#D4AF37]/40 text-[#FFDF78] text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md">
                            {srv.category}
                          </span>
                          {srv.isHaircut && (
                            <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FFEAA7] text-[10px] font-medium backdrop-blur-md">
                              Signature Cut
                            </span>
                          )}
                        </div>

                        {/* Price Badge */}
                        <div className="absolute top-3 right-3 flex flex-col items-end">
                          {srv.offerPrice ? (
                            <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#D4AF37] text-[#070B14] font-black text-xs shadow-lg">
                              <span>₹{srv.offerPrice}</span>
                              <span className="line-through text-[10px] text-[#070B14]/70 font-normal">
                                ₹{srv.price}
                              </span>
                            </div>
                          ) : srv.price ? (
                            <div className="px-3 py-1 rounded-lg bg-[#070B14]/85 border border-[#D4AF37]/50 text-[#FFDF78] font-bold text-xs shadow-md backdrop-blur-md">
                              {srv.priceLabel && <span className="text-[10px] font-normal mr-1">{srv.priceLabel}</span>}
                              ₹{srv.price}
                            </div>
                          ) : (
                            srv.priceLabel && (
                              <div className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37] text-[#FFDF78] font-bold text-xs backdrop-blur-md">
                                {srv.priceLabel}
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Card Content & Action */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-['Cinzel'] text-base sm:text-lg font-bold text-white group-hover:text-[#FFDF78] transition-colors leading-snug">
                            {srv.name}
                          </h4>
                          {srv.note && (
                            <div className="flex items-center gap-1.5 mt-2 text-[#D4AF37] text-xs font-medium">
                              <Tag className="w-3.5 h-3.5 shrink-0" />
                              <span className="line-clamp-1">{srv.note}</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions */}
                        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleService(srv);
                            }}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#25D366] text-white shadow-[0_0_15px_rgba(37,211,102,0.4)]'
                                : 'bg-[#D4AF37]/20 hover:bg-[#D4AF37] text-[#FFDF78] hover:text-[#070B14] border border-[#D4AF37]/50'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Selected</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                <span>Add Service</span>
                              </>
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
      </div>
    </section>
  );
};
