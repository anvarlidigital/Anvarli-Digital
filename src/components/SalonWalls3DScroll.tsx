import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { ServiceItem, CategoryItem, GalleryItem, ReviewItem, StaffItem } from '../types';
import { Throne3DBackground } from './Throne3DBackground';
import { APP_CONFIG } from '../config';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  Flame,
  Grid,
  Info,
  Layers,
  MessageCircle,
  Phone,
  Plus,
  Scissors,
  Sparkles,
  Star,
  Tag,
  ZoomIn,
} from 'lucide-react';

export interface WallPanelItem {
  id: string;
  type: 'service' | 'gallery' | 'story' | 'review';
  src: string;
  title: string;
  category: string;
  description: string;
  price?: number | null;
  priceLabel?: string | null;
  offerPrice?: number | null;
  badge?: string;
  aspect: number;
  serviceData?: ServiceItem;
  galleryData?: GalleryItem;
  storyAction?: () => void;
}

interface SalonWalls3DScrollProps {
  services: ServiceItem[];
  categories: CategoryItem[];
  galleryItems: GalleryItem[];
  reviews: ReviewItem[];
  staffList?: StaffItem[];
  selectedServiceIds: string[];
  onToggleService: (service: ServiceItem) => void;
  onOpenBooking: () => void;
  onOpenFlyer?: () => void;
  onOpenDashboard?: () => void;
  onPreviewGallery?: (item: GalleryItem) => void;
  liteMode?: boolean;
}

export const SalonWalls3DScroll: React.FC<SalonWalls3DScrollProps> = ({
  services,
  categories,
  galleryItems,
  reviews,
  selectedServiceIds,
  onToggleService,
  onOpenBooking,
  onOpenFlyer = () => {},
  onOpenDashboard = () => {},
  onPreviewGallery = () => {},
  liteMode = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isScrollingHintVisible, setIsScrollingHintVisible] = useState<boolean>(true);
  const [zoomPreview, setZoomPreview] = useState<WallPanelItem | null>(null);

  // Sync with navigation hash (#services or #gallery)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#gallery') {
        setActiveFilter('gallery');
      } else if (hash === '#services') {
        setActiveFilter('services');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const panelElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const railsRef = useRef<(HTMLElement | null)[]>([]);

  // Animation values stored in refs for 60fps raf loop without React rerenders
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

  // Build Curated Wall Panels from Services, Gallery & Story
  const wallPanels = useMemo<WallPanelItem[]>(() => {
    const list: WallPanelItem[] = [];

    // 1. Welcome Royale Hero Wall
    list.push({
      id: 'wall-welcome',
      type: 'story',
      src: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
      title: 'Trim & Twisted • Royal Sanctuary',
      category: 'The Sanctuary',
      description: 'Haute unisex styling, precision shears & Japanese Nano Plastia in an immersive royal chamber.',
      badge: 'Award-Winning Haute Salon',
      aspect: 1.58,
    });

    // 2. Curated Services Walls
    const activeServices = services.filter((s) => s.active !== false);
    activeServices.forEach((srv) => {
      list.push({
        id: `wall-srv-${srv.id}`,
        type: 'service',
        src: srv.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
        title: srv.name,
        category: srv.category,
        description: srv.note || (srv.isHaircut ? 'Bespoke precision cut with luxury wash & blowout' : 'Signature salon treatment with luxury herbal essences'),
        price: srv.price,
        priceLabel: srv.priceLabel,
        offerPrice: srv.offerPrice,
        badge: srv.isHaircut ? 'Signature Cut' : srv.offerPrice ? 'Special Offer' : undefined,
        aspect: 1.5,
        serviceData: srv,
      });
    });

    // 3. Visual Gallery Walls
    galleryItems.forEach((gal) => {
      list.push({
        id: `wall-gal-${gal.id}`,
        type: 'gallery',
        src: gal.url,
        title: gal.title,
        category: `Gallery • ${gal.category}`,
        description: 'Captured live inside our luxury salon floor during styling ceremonies.',
        badge: gal.category,
        aspect: 1.58,
        galleryData: gal,
      });
    });

    // 4. Patron Accolades & Story Wall
    list.push({
      id: 'wall-reviews',
      type: 'story',
      src: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1200&q=80',
      title: '4.95 Stars • 2,400+ Happy Guests',
      category: 'Patron Accolades',
      description: 'Chakdaha\'s most loved unisex styling sanctuary. Zero advance payment, pay only when fully satisfied.',
      badge: 'Certified Reviews',
      aspect: 1.58,
    });

    return list;
  }, [services, galleryItems]);

  // Filter panels based on active category
  const filteredPanels = useMemo(() => {
    if (activeFilter === 'all') return wallPanels;
    if (activeFilter === 'services') return wallPanels.filter((p) => p.type === 'service');
    if (activeFilter === 'gallery') return wallPanels.filter((p) => p.type === 'gallery');
    if (activeFilter === 'hair') {
      return wallPanels.filter(
        (p) =>
          p.category.toLowerCase().includes('hair') ||
          p.category.toLowerCase().includes('gents')
      );
    }
    if (activeFilter === 'treatments') {
      return wallPanels.filter(
        (p) =>
          p.category.toLowerCase().includes('treatment') ||
          p.category.toLowerCase().includes('keratin') ||
          p.category.toLowerCase().includes('facial') ||
          p.category.toLowerCase().includes('spa')
      );
    }
    return wallPanels.filter((p) => p.category.toLowerCase().includes(activeFilter.toLowerCase()));
  }, [wallPanels, activeFilter]);

  const N = filteredPanels.length;

  // Selected Services Total Calculation
  const selectedServicesCount = selectedServiceIds.length;
  const selectedTotalAmount = useMemo(() => {
    return services
      .filter((s) => selectedServiceIds.includes(s.id))
      .reduce((sum, s) => sum + (s.offerPrice || s.price || 0), 0);
  }, [services, selectedServiceIds]);

  // Measure Scroll Position on Track
  const measure = useCallback(() => {
    if (!trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    const max = trackRef.current.offsetHeight - window.innerHeight;
    if (max <= 0) return;
    const t = Math.max(0, Math.min(1, -r.top / max));
    animRef.current.target = t;
  }, []);

  // Layout 3D Coordinates
  const layout = useCallback(() => {
    if (typeof window === 'undefined') return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const isPortrait = W < H;

    const P = 0.8 * Math.max(W, H);
    const D = 1.18 * P;
    animRef.current.P = P;
    animRef.current.D = D;

    if (stageRef.current) {
      stageRef.current.style.perspective = `${P}px`;
    }

    const xo = isPortrait ? 0.38 * W : 0.28 * W;
    const yo = isPortrait ? 0.11 * H : 0.085 * H;
    const mh = isPortrait ? 0.55 * H : 0.62 * H;
    const mw = isPortrait ? 0.88 * W : 0.65 * W;

    const sx = [-1, 1, -1, 1];
    const sy = [-1, 1, 1, -1];

    const newPos: { x: number; y: number; z: number }[] = [];

    filteredPanels.forEach((o, i) => {
      const w = Math.min(mw, mh * o.aspect);
      const h = w / o.aspect;
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

    // Floor Rails Position & Depth
    const fy = yo + mh / 2 + 0.12 * H;
    const L = P * 1.1 + (N - 1) * D + 3 * P;
    railsRef.current.forEach((l, k) => {
      if (l) {
        l.style.height = `${L}px`;
        l.style.transform = `translate3d(${(k - 5) * 0.2 * W - 1}px, ${fy}px, ${P * 1.1}px) rotateX(-90deg)`;
      }
    });
  }, [filteredPanels, N]);

  // Smooth Ease Function
  const ease = (t: number) => {
    const clamped = Math.max(0, Math.min(1, t));
    return clamped * clamped * clamped * (clamped * (6 * clamped - 15) + 10);
  };

  // Jump to Wall Index
  const goToIndex = useCallback(
    (index: number) => {
      if (!trackRef.current) return;
      const max = trackRef.current.offsetHeight - window.innerHeight;
      const top = trackRef.current.getBoundingClientRect().top + window.scrollY;
      const targetScroll = top + (max * index) / Math.max(1, N - 1);
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    },
    [N]
  );

  // Keyboard Navigation: Arrow Up / Down, PageUp / PageDown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToIndex(Math.min(N - 1, currentIndex + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToIndex(Math.max(0, currentIndex - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, N, goToIndex]);

  // Main 60fps Animation Loop
  useEffect(() => {
    let active = true;

    const frame = () => {
      if (!active) return;
      const a = animRef.current;
      a.cur += (a.target - a.cur) * 0.08;
      a.cx += (a.mx - a.cx) * 0.06;
      a.cy += (a.my - a.cy) * 0.06;

      if (a.pos.length >= 2 && worldRef.current && rigRef.current) {
        const s = a.cur * (N - 1);
        const i = Math.min(N - 2, Math.max(0, Math.floor(s)));
        const e = ease((s - i - 0.2) / 0.6);

        const pA = a.pos[i] || { x: 0, y: 0, z: 0 };
        const pB = a.pos[i + 1] || pA;

        const X = pA.x + (pB.x - pA.x) * e;
        const Y = pA.y + (pB.y - pA.y) * e;
        const Z = pA.z + (pB.z - pA.z) * e;

        worldRef.current.style.transform = `translate3d(${-X}px, ${-Y}px, ${-Z}px)`;

        const bank = Math.sin(Math.PI * e) * (pB.x > pA.x ? -3.5 : 3.5);
        rigRef.current.style.transform = `rotateX(${a.cy * -2.8}deg) rotateY(${a.cx * 4 + bank}deg)`;

        // Update each panel's visibility & dynamic rotation
        panelElsRef.current.forEach((el, k) => {
          if (!el) return;
          const p = a.pos[k];
          if (!p) return;
          const rz = p.z - Z;
          // Culling optimization: show only panels within viewing depth
          const isVisible = rz < a.P * 0.88 && rz > -a.P * 2.2;
          el.style.visibility = isVisible ? 'visible' : 'hidden';

          if (isVisible) {
            const r = Math.min(1, Math.abs(rz) / a.D) * (k % 2 ? -13 : 13);
            el.style.transform = `translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotateY(${r}deg)`;
          }
        });

        // Update active index
        const nearestIdx = Math.min(N - 1, Math.max(0, Math.round(a.cur * (N - 1))));
        if (nearestIdx !== currentIndex) {
          setCurrentIndex(nearestIdx);
        }
      }

      setIsScrollingHintVisible(a.cur < 0.03);

      a.rafId = requestAnimationFrame(frame);
    };

    animRef.current.rafId = requestAnimationFrame(frame);

    return () => {
      active = false;
      cancelAnimationFrame(animRef.current.rafId);
    };
  }, [N, currentIndex]);

  // Setup Event Listeners
  useEffect(() => {
    layout();
    measure();

    const handleScroll = () => measure();
    const handleResize = () => {
      layout();
      measure();
    };

    const handlePointerMove = (e: PointerEvent) => {
      animRef.current.mx = e.clientX / window.innerWidth - 0.5;
      animRef.current.my = e.clientY / window.innerHeight - 0.5;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [layout, measure]);

  // Dynamically compute track height based on panel count (e.g. 110vh per panel)
  const trackHeight = useMemo(() => {
    return `${Math.max(300, (N + 0.8) * 105)}vh`;
  }, [N]);

  return (
    <div className="relative w-full overflow-visible">
      {/* 3D Track Container with anchors for #services and #gallery */}
      <main
        ref={trackRef}
        id="services"
        style={{ height: trackHeight }}
        className="relative w-full"
      >
        <div id="gallery" className="absolute top-[40%] pointer-events-none" />
        {/* Sticky 100vh Viewport Stage */}
        <div
          ref={stageRef}
          id="salon-walls-stage"
          className="sticky top-0 w-full h-screen h-[100svh] overflow-hidden bg-[#070B14] select-none salon-walls-stage"
        >
          {/* =========================================================================
             1. 3D ROYAL THRONE ROOM BACKGROUND CANVAS (User Request: Keep throne 3D in bg)
             ========================================================================= */}
          <Throne3DBackground
            cur={animRef.current.cur}
            cx={animRef.current.cx}
            cy={animRef.current.cy}
            liteMode={liteMode}
          />

          {/* =========================================================================
             2. 3D PERSPECTIVE RIG & WORLD (Panels + Floor Rails)
             ========================================================================= */}
          <div ref={rigRef} className="salon-walls-rig pointer-events-none">
            <div ref={worldRef} className="salon-walls-world pointer-events-none">
              {/* 11 Perspective Floor Rails */}
              {Array.from({ length: 11 }).map((_, k) => (
                <i
                  key={k}
                  ref={(el) => { railsRef.current[k] = el; }}
                  className="salon-walls-rail"
                />
              ))}

              {/* 3D Salon Wall Panels */}
              {filteredPanels.map((item, idx) => {
                const isService = item.type === 'service' && item.serviceData;
                const isSelected = isService ? selectedServiceIds.includes(item.serviceData!.id) : false;

                return (
                  <div
                    key={item.id}
                    ref={(el) => { panelElsRef.current[idx] = el; }}
                    className="salon-walls-panel bg-[#0B101D]/90 backdrop-blur-xl border border-[#D4AF37]/35 overflow-hidden flex flex-col group cursor-pointer pointer-events-auto"
                    onClick={() => {
                      if (item.type === 'gallery' && item.galleryData) {
                        onPreviewGallery(item.galleryData);
                      } else if (item.type === 'service' && item.serviceData) {
                        onToggleService(item.serviceData);
                      } else if (item.storyAction) {
                        item.storyAction();
                      }
                    }}
                  >
                    {/* Media Container */}
                    <div className="relative w-full h-[58%] overflow-hidden bg-[#060A13]">
                      <img
                        src={item.src}
                        alt={item.title}
                        draggable={false}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B101D] via-transparent to-black/30 opacity-90 group-hover:opacity-100 transition-opacity" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 z-10">
                        <span className="px-2.5 py-1 rounded-full bg-[#070B14]/85 border border-[#D4AF37]/50 text-[#FFDF78] text-[10px] sm:text-xs font-semibold tracking-wider uppercase font-['Jost'] shadow-md backdrop-blur-md">
                          {item.category}
                        </span>
                        {item.badge && (
                          <span className="hidden xs:inline-block px-2.5 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FFEAA7] text-[10px] sm:text-xs font-medium backdrop-blur-md">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Price Tag if Service */}
                      {isService && (
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex flex-col items-end">
                          {item.offerPrice ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#070B14] font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                              <span>₹{item.offerPrice}</span>
                              <span className="line-through text-[10px] text-[#070B14]/70 font-normal">
                                ₹{item.price}
                              </span>
                            </div>
                          ) : item.price ? (
                            <div className="px-3 py-1.5 rounded-xl bg-[#070B14]/90 border border-[#D4AF37]/60 text-[#FFDF78] font-bold text-xs sm:text-sm shadow-md backdrop-blur-md">
                              {item.priceLabel && <span className="text-[10px] font-normal mr-1">{item.priceLabel}</span>}
                              ₹{item.price}
                            </div>
                          ) : (
                            item.priceLabel && (
                              <div className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37] text-[#FFDF78] font-bold text-xs backdrop-blur-md">
                                {item.priceLabel}
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {/* Quick Zoom Icon on Gallery */}
                      {item.type === 'gallery' && (
                        <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-[#070B14]/80 border border-[#D4AF37]/50 text-[#FFDF78] flex items-center justify-center backdrop-blur-md">
                          <ZoomIn className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content & Action Section */}
                    <div className="relative flex-1 p-4 sm:p-6 flex flex-col justify-between">
                      <div>
                        <h2 className="font-['Bodoni_Moda'] text-lg sm:text-2xl md:text-3xl font-semibold text-white group-hover:text-[#FFDF78] transition-colors leading-tight">
                          {item.title}
                        </h2>
                        <p className="font-['Jost'] text-xs sm:text-sm text-[#C9A37A] mt-1.5 sm:mt-2 line-clamp-2 max-w-xl leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Panel Footer Controls */}
                      <div className="mt-3 sm:mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                        {isService ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleService(item.serviceData!);
                              }}
                              className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
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
                                  <span>Add to Appointment</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isSelected) onToggleService(item.serviceData!);
                                onOpenBooking();
                              }}
                              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-extrabold text-xs sm:text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
                            >
                              <Calendar className="w-4 h-4" />
                              <span>Book Now</span>
                            </button>
                          </>
                        ) : item.type === 'gallery' ? (
                          <div className="w-full flex items-center justify-between">
                            <span className="text-[11px] text-[#A0AEC0] font-mono">
                              Live Salon Portfolio
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPreviewGallery(item.galleryData!);
                              }}
                              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-[#D4AF37] text-white hover:text-[#070B14] text-xs font-semibold transition-all border border-white/15"
                            >
                              Inspect Fullscreen
                            </button>
                          </div>
                        ) : (
                          <div className="w-full flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[#FFDF78] text-xs">
                              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                              <span className="font-semibold">Zero Advance Required</span>
                            </div>
                            <button
                              type="button"
                              onClick={onOpenBooking}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110"
                            >
                              Reserve VIP Slot
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* =========================================================================
             3. HEADS-UP DISPLAY (HUD) OVERLAY
             ========================================================================= */}
          <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 xs:p-4 sm:p-6 lg:p-8">
            {/* Top Bar: Brand, Category Filters & Actions */}
            <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              {/* Brand Logo & Name */}
              <div className="flex items-center gap-3 pointer-events-auto">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#070B14]/90 border border-[#D4AF37] p-1.5 shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center shrink-0">
                  <img src="/logo.png" onError={(e) => { e.currentTarget.src = '/logo.svg'; }} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                </div>
                <div>
                  <div className="font-['Cinzel'] font-bold text-sm sm:text-base text-white tracking-wider flex items-center gap-1.5">
                    <span>Trim & Twisted</span>
                    <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#FFDF78] border border-[#D4AF37]/40">
                      3D Walls
                    </span>
                  </div>
                  <p className="text-[11px] text-[#C9A37A] font-['Playfair_Display'] italic">
                    Beauty Is You &bull; Luxury Unisex Salon
                  </p>
                </div>
              </div>

              {/* Category / Mode Switcher Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === 'all'
                      ? 'bg-[#D4AF37] text-[#070B14] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                      : 'bg-[#0E1628]/85 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  All 3D Walls
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('services')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === 'services'
                      ? 'bg-[#D4AF37] text-[#070B14] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                      : 'bg-[#0E1628]/85 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  Services ({services.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('hair')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === 'hair'
                      ? 'bg-[#D4AF37] text-[#070B14] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                      : 'bg-[#0E1628]/85 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  Hair & Gents
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('treatments')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === 'treatments'
                      ? 'bg-[#D4AF37] text-[#070B14] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                      : 'bg-[#0E1628]/85 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  Treatments & Spa
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('gallery')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === 'gallery'
                      ? 'bg-[#D4AF37] text-[#070B14] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                      : 'bg-[#0E1628]/85 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  Gallery Portfolio ({galleryItems.length})
                </button>
              </div>

              {/* Right Counter & Quick Booking Button */}
              <div className="flex items-center gap-2 pointer-events-auto">
                {selectedServicesCount > 0 ? (
                  <button
                    type="button"
                    onClick={onOpenBooking}
                    className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#FFF0A5] to-[#AA7C11] text-[#070B14] font-extrabold text-xs shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {selectedServicesCount} Book &bull; ₹{selectedTotalAmount}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenBooking}
                    className="hidden sm:flex px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#070B14] font-extrabold text-xs uppercase tracking-wider items-center gap-1.5 shadow-md hover:brightness-110"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Appointment</span>
                  </button>
                )}

                {/* Wall Counter */}
                <div className="px-3 py-1.5 rounded-xl bg-[#0E1628]/85 border border-[#D4AF37]/35 text-[#C9A37A] font-mono text-xs shadow-md">
                  {currentIndex + 1} of {N}
                </div>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="w-full flex items-center justify-between gap-3">
              {/* Keyboard / Navigation Chevrons */}
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => goToIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0E1628]/85 hover:bg-[#D4AF37] text-gray-300 hover:text-[#070B14] border border-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer shadow-md"
                  aria-label="Previous Wall"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => goToIndex(Math.min(N - 1, currentIndex + 1))}
                  disabled={currentIndex === N - 1}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0E1628]/85 hover:bg-[#D4AF37] text-gray-300 hover:text-[#070B14] border border-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer shadow-md"
                  aria-label="Next Wall"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="hidden lg:inline text-[11px] text-[#A0AEC0] font-mono ml-2">
                  Use &larr; &rarr; Keys or Scroll
                </span>
              </div>

              {/* Navigation Dots (from template: dots button with .on) */}
              <nav
                className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto overflow-x-auto max-w-[50vw] sm:max-w-none px-2 scrollbar-none"
                aria-label="Salon wall panels navigation"
              >
                {filteredPanels.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => goToIndex(dotIdx)}
                    aria-label={`Jump to wall ${dotIdx + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      dotIdx === currentIndex
                        ? 'w-7 sm:w-8 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.7)]'
                        : 'w-2.5 bg-transparent border border-[#C9A37A]/60 hover:border-[#FFDF78]'
                    }`}
                  />
                ))}
              </nav>

              {/* Scroll / Action Hint */}
              <div className="flex items-center gap-3 pointer-events-auto">
                <a
                  href={APP_CONFIG.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] text-white text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                {isScrollingHintVisible && (
                  <div className="flex items-center gap-1 text-[#C9A37A] font-['Jost'] text-xs animate-bounce">
                    <ChevronDown className="w-4 h-4" />
                    <span className="hidden xs:inline">Scroll to Explore</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fullscreen Photo Modal for Gallery preview */}
      {zoomPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setZoomPreview(null)}
        >
          <div
            className="relative max-w-4xl w-full rounded-2xl overflow-hidden border border-[#D4AF37]/60 bg-[#070B14] p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomPreview(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-[#D4AF37] hover:text-[#070B14] transition-colors"
            >
              ✕
            </button>
            <img src={zoomPreview.src} alt={zoomPreview.title} className="w-full max-h-[75vh] object-contain rounded-xl" />
            <div className="p-4 text-center">
              <h3 className="font-['Cinzel'] text-xl font-bold text-[#FFDF78]">{zoomPreview.title}</h3>
              <p className="text-sm text-gray-300 mt-1">{zoomPreview.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
