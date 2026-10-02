import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Calendar, Crown, Eye, Flame, RotateCcw, Scissors, Sparkles as SparklesIcon, Zap } from 'lucide-react';

// 3D Royal Stylist Throne Chair
function RoyalStylistThrone({ isSelected, onClick }: { isSelected: boolean; onClick: () => void }) {
  const chairRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (chairRef.current) {
      const t = clock.getElapsedTime();
      // Gentle breathing idle rotation
      chairRef.current.rotation.y = Math.sin(t * 0.5) * 0.12;
    }
  });

  return (
    <group
      ref={chairRef}
      position={[0, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered || isSelected ? 1.05 : 1}
    >
      {/* Ornate Gold Crown finial on top of chair */}
      <mesh position={[0, 2.35, -0.42]}>
        <cylinderGeometry args={[0.08, 0.16, 0.18, 5]} />
        <meshStandardMaterial
          color="#FFDF78"
          metalness={0.95}
          roughness={0.15}
          emissive="#AA7C11"
          emissiveIntensity={hovered ? 0.6 : 0.2}
        />
      </mesh>

      {/* Hydraulic Polished Gold & Chrome Base */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.7, 0.75, 0.12, 36]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.1} />
      </mesh>
      {/* Hydraulic Center Shaft */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.9, 24]} />
        <meshStandardMaterial color="#FFF5D6" metalness={0.98} roughness={0.08} />
      </mesh>

      {/* Footrest with Royal Filigree */}
      <group position={[0, 0.25, 0.65]}>
        <mesh>
          <boxGeometry args={[0.65, 0.04, 0.35]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-0.2, -0.1, -0.2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} />
        </mesh>
        <mesh position={[0.2, -0.1, -0.2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} />
        </mesh>
      </group>

      {/* Tufted Seat Cushion (Royal Midnight Navy Velvet) */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.62, 0.64, 0.22, 32]} />
        <meshStandardMaterial
          color="#0A111E"
          roughness={0.75}
          metalness={0.15}
        />
      </mesh>

      {/* Royal Gold Cushion Trim Rim */}
      <mesh position={[0, 1.05, 0]}>
        <torusGeometry args={[0.64, 0.025, 16, 32]} />
        <meshStandardMaterial color="#FFDF78" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* High Backrest with Tufted Curve */}
      <group position={[0, 1.68, -0.44]}>
        {/* Navy Velvet Body */}
        <mesh>
          <boxGeometry args={[1.05, 1.15, 0.16]} />
          <meshStandardMaterial color="#070C15" roughness={0.8} />
        </mesh>
        {/* Heavy Gold Border Frame */}
        <mesh position={[0, 0, 0.08]}>
          <boxGeometry args={[1.09, 1.19, 0.02]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>

      {/* Sculpted Golden Lion-Paw / Royal Armrests */}
      <group position={[-0.56, 1.45, 0.05]}>
        <mesh>
          <boxGeometry args={[0.1, 0.45, 0.65]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>
      <group position={[0.56, 1.45, 0.05]}>
        <mesh>
          <boxGeometry args={[0.1, 0.45, 0.65]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>

      {/* Interactive Beacon / Aura on Base when hovered or selected */}
      {(hovered || isSelected) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.15, 32]} />
          <meshBasicMaterial color="#FFDF78" opacity={0.65} transparent />
        </mesh>
      )}
    </group>
  );
}

// 3D Grand Illuminated Arch & Gold Mirror
function GrandArchMirror() {
  return (
    <group position={[0, 0, -2.4]}>
      {/* Arch Columns */}
      <mesh position={[-1.6, 2.5, 0]}>
        <cylinderGeometry args={[0.14, 0.16, 5, 24]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[1.6, 2.5, 0]}>
        <cylinderGeometry args={[0.14, 0.16, 5, 24]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Arch Top Curve */}
      <mesh position={[0, 4.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[1.6, 0.14, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Mirror Glass Surface */}
      <mesh position={[0, 2.8, 0.02]}>
        <planeGeometry args={[3.0, 3.8]} />
        <meshStandardMaterial
          color="#162238"
          metalness={0.98}
          roughness={0.05}
          emissive="#0D1526"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Mirror Halo Backlight */}
      <pointLight position={[0, 3.2, 0.4]} intensity={2.2} distance={5} color="#FFE6A3" />

      {/* Marble & Glass Vanity Shelf */}
      <mesh position={[0, 0.95, 0.35]}>
        <boxGeometry args={[3.4, 0.08, 0.7]} />
        <meshStandardMaterial color="#0A0E18" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.92, 0.35]}>
        <boxGeometry args={[3.44, 0.03, 0.74]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.95} />
      </mesh>

      {/* Luxury Perfume / Hair Care Crystal Flasks */}
      <mesh position={[-0.9, 1.15, 0.4]}>
        <cylinderGeometry args={[0.07, 0.07, 0.32, 16]} />
        <meshStandardMaterial color="#FFDF78" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[-0.65, 1.12, 0.35]}>
        <boxGeometry args={[0.14, 0.26, 0.14]} />
        <meshStandardMaterial color="#E8A838" roughness={0.15} metalness={0.5} />
      </mesh>
      <mesh position={[0.8, 1.15, 0.4]}>
        <cylinderGeometry args={[0.06, 0.08, 0.35, 16]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.9} />
      </mesh>
    </group>
  );
}

// 3D Animated Floating Gold Scissors
function FloatingGoldScissors() {
  const groupRef = useRef<THREE.Group>(null);
  const blade1 = useRef<THREE.Mesh>(null);
  const blade2 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = 2.4 + Math.sin(t * 1.5) * 0.12;
      groupRef.current.rotation.y = t * 0.4;
    }
    const snip = Math.sin(t * 4) * 0.2 + 0.2;
    if (blade1.current) blade1.current.rotation.z = snip;
    if (blade2.current) blade2.current.rotation.z = -snip;
  });

  return (
    <group ref={groupRef} position={[1.4, 2.4, 0.5]} scale={0.75}>
      {/* Pivot */}
      <mesh position={[0, 0, 0.05]}>
        <cylinderGeometry args={[0.07, 0.07, 0.12, 16]} />
        <meshStandardMaterial color="#FFF5D6" metalness={0.95} />
      </mesh>
      {/* Blade 1 */}
      <group ref={blade1 as any}>
        <mesh position={[0.5, 0.03, 0]}>
          <boxGeometry args={[1.0, 0.06, 0.02]} />
          <meshStandardMaterial color="#FFDF78" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[-0.5, 0.2, 0]}>
          <torusGeometry args={[0.22, 0.04, 12, 24]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} />
        </mesh>
      </group>
      {/* Blade 2 */}
      <group ref={blade2 as any}>
        <mesh position={[0.5, -0.03, 0]}>
          <boxGeometry args={[1.0, 0.06, 0.02]} />
          <meshStandardMaterial color="#FFDF78" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[-0.5, -0.2, 0]}>
          <torusGeometry args={[0.22, 0.04, 12, 24]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// 3D Grand Crystal Chandelier
function RoyalChandelier() {
  return (
    <group position={[0, 4.4, 0]}>
      {/* Suspension Chain */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} />
      </mesh>
      {/* Golden Tier 1 */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[1.1, 0.05, 16, 32]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Golden Tier 2 */}
      <mesh position={[0, -0.35, 0]}>
        <torusGeometry args={[0.7, 0.04, 16, 32]} />
        <meshStandardMaterial color="#FFDF78" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Glowing Warm Chandelier Bulbs */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 1.1;
        const z = Math.sin(angle) * 1.1;
        return (
          <mesh key={i} position={[x, 0.12, z]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color="#FFF5D6" emissive="#FFDA73" emissiveIntensity={3} />
          </mesh>
        );
      })}

      <pointLight position={[0, -0.2, 0]} intensity={2.8} distance={7} color="#FFE8A3" />
    </group>
  );
}

// Interactive Hotspot Station Indicator
function StationHotspot({
  position,
  label,
  subLabel,
  onClick,
}: {
  position: [number, number, number];
  label: string;
  subLabel: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Floating Glowing Ring */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.32, 24]} />
        <meshBasicMaterial color={hovered ? '#FFF0A5' : '#D4AF37'} transparent opacity={0.8} />
      </mesh>

      {/* Floating Vertical Light Beam */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8, 8]} />
        <meshBasicMaterial color="#FFDF78" transparent opacity={hovered ? 0.9 : 0.4} />
      </mesh>

      {/* Floating Icon Orb */}
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color="#D4AF37"
          emissive="#FFDF78"
          emissiveIntensity={hovered ? 2.5 : 1.2}
        />
      </mesh>
    </group>
  );
}

interface RoyalSalonHero3DProps {
  onSelectStation: (stationName: string) => void;
  onOpenBooking: () => void;
  liteMode: boolean;
}

export const RoyalSalonHero3D: React.FC<RoyalSalonHero3DProps> = ({
  onSelectStation,
  onOpenBooking,
  liteMode,
}) => {
  const [activePreset, setActivePreset] = useState<'suite' | 'chair' | 'mirror' | 'spa'>('suite');
  const [lightingTheme, setLightingTheme] = useState<'gold' | 'sapphire' | 'emerald' | 'champagne'>('gold');
  const [activeStationName, setActiveStationName] = useState<string>('Royal Stylist Throne');

  // Camera coordinates based on preset
  const cameraPos: [number, number, number] =
    activePreset === 'chair'
      ? [0, 1.8, 2.4]
      : activePreset === 'mirror'
      ? [0, 2.6, 2.8]
      : activePreset === 'spa'
      ? [-1.8, 2.0, 2.8]
      : [0, 2.2, 4.4];

  const lightColor =
    lightingTheme === 'sapphire'
      ? '#7BA9E8'
      : lightingTheme === 'emerald'
      ? '#6EE7B7'
      : lightingTheme === 'champagne'
      ? '#FFF3D6'
      : '#FFDF78';

  return (
    <div className="relative w-full h-[370px] xs:h-[410px] sm:h-[490px] md:h-[550px] lg:h-[620px] rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#D4AF37]/50 shadow-[0_0_60px_rgba(212,175,55,0.25)] bg-[#070B14]">
      {/* Top Interactive HUD Bar */}
      <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 z-20 flex items-center justify-between gap-1.5 sm:gap-2 pointer-events-none">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#0D1527]/90 border border-[#D4AF37]/60 text-[#FFDF78] text-[10px] sm:text-xs font-semibold backdrop-blur-md shadow-lg pointer-events-auto">
          <Crown className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#FFDF78] shrink-0" />
          <span className="truncate max-w-[150px] xs:max-w-none">Interactive 3D Salon Studio</span>
        </div>

        {/* Camera Views & Lighting Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Presets */}
          <div className="hidden sm:flex bg-[#070B14]/85 p-1 rounded-xl border border-white/10 backdrop-blur-md text-xs">
            <button
              onClick={() => setActivePreset('suite')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activePreset === 'suite' ? 'bg-[#D4AF37] text-[#070B14] font-bold' : 'text-gray-300 hover:text-white'
              }`}
            >
              Suite
            </button>
            <button
              onClick={() => setActivePreset('chair')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activePreset === 'chair' ? 'bg-[#D4AF37] text-[#070B14] font-bold' : 'text-gray-300 hover:text-white'
              }`}
            >
              VIP Chair
            </button>
            <button
              onClick={() => setActivePreset('mirror')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activePreset === 'mirror' ? 'bg-[#D4AF37] text-[#070B14] font-bold' : 'text-gray-300 hover:text-white'
              }`}
            >
              Vanity
            </button>
            <button
              onClick={() => setActivePreset('spa')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activePreset === 'spa' ? 'bg-[#D4AF37] text-[#070B14] font-bold' : 'text-gray-300 hover:text-white'
              }`}
            >
              Spa Area
            </button>
          </div>

          {/* Lighting Mode */}
          <button
            onClick={() =>
              setLightingTheme((curr) =>
                curr === 'gold'
                  ? 'sapphire'
                  : curr === 'sapphire'
                  ? 'emerald'
                  : curr === 'emerald'
                  ? 'champagne'
                  : 'gold'
              )
            }
            className="p-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#070B14]/85 border border-[#D4AF37]/50 text-[#FFDF78] text-[11px] sm:text-xs flex items-center gap-1.5 backdrop-blur-md shrink-0 hover:bg-[#D4AF37]/20 transition-all"
            title="Toggle Royal Ambiance Lighting: Gold / Sapphire / Emerald / Champagne"
          >
            <Flame className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline capitalize font-medium">{lightingTheme} Mood</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas or Lite Fallback */}
      {!liteMode ? (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: cameraPos, fov: 48 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[3, 8, 4]} intensity={2.2} color={lightColor} />
          <pointLight position={[-3, 3, 2]} intensity={1.5} color="#D4AF37" />

          {/* Luxury Black Marble Floor with Geometric Gold Border Inlay */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[16, 16]} />
            <meshStandardMaterial color="#060911" roughness={0.1} metalness={0.6} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
            <ringGeometry args={[2.5, 2.55, 48]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.95} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
            <ringGeometry args={[3.8, 3.84, 48]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.95} />
          </mesh>

          {/* 3D Salon Setup */}
          <RoyalStylistThrone
            isSelected={activeStationName === 'Royal Stylist Throne'}
            onClick={() => {
              setActiveStationName('Royal Stylist Throne');
              onSelectStation('Haircut & Styling');
            }}
          />
          <GrandArchMirror />
          <FloatingGoldScissors />
          <RoyalChandelier />

          {/* Interactive Stations */}
          <StationHotspot
            position={[-1.8, 0, 0.8]}
            label="Spa Suite"
            subLabel="Head & Oil Therapy"
            onClick={() => {
              setActiveStationName('Aromatherapy Spa Suite');
              onSelectStation('Spa');
            }}
          />
          <StationHotspot
            position={[1.8, 0, 0.8]}
            label="Aesthetic Bar"
            subLabel="Facial & D-Tan"
            onClick={() => {
              setActiveStationName('Aesthetic & Facial Bar');
              onSelectStation('Facial');
            }}
          />

          {/* Golden Floating Embers */}
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <Sparkles count={55} scale={[8, 5, 6]} size={2.5} speed={0.4} color="#D4AF37" />
          </Float>

          {/* Smooth OrbitControls: constrained so customer never gets lost underneath the floor */}
          <OrbitControls
            enableZoom={true}
            maxDistance={6.5}
            minDistance={2.0}
            maxPolarAngle={Math.PI / 2 - 0.05} // Stays above ground
            minPolarAngle={Math.PI / 6}
            dampingFactor={0.05}
          />
        </Canvas>
      ) : (
        /* Lite Mode Luxury Display */
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#131D31] via-[#0A101D] to-[#070B14] text-center">
          <div className="w-24 h-24 rounded-3xl border-2 border-[#D4AF37] p-2 bg-[#070B14] shadow-[0_0_35px_rgba(212,175,55,0.4)] mb-4 animate-pulse">
            <img src="/logo.svg" alt="Trim & Twisted" className="w-full h-full object-cover rounded-2xl" />
          </div>
          <h3 className="font-['Cinzel'] text-2xl font-bold text-[#FFDF78]">
            Royal Salon Suite
          </h3>
          <p className="text-xs text-gray-300 max-w-md mt-1">
            Running in high-performance mode. Tap below to reserve your VIP stylist chair.
          </p>
        </div>
      )}

      {/* Bottom Interactive Callout Banner inside 3D View */}
      <div className="absolute bottom-2.5 sm:bottom-4 left-2.5 sm:left-4 right-2.5 sm:right-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#070B14]/90 border border-[#D4AF37]/50 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-2.5 sm:gap-3 text-left w-full sm:w-auto">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#805B09] flex items-center justify-center text-[#070B14] font-bold shadow-md shrink-0">
            <SparklesIcon className="w-4 sm:w-5 h-4 sm:h-5 fill-current" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] uppercase font-mono text-[#D4AF37] tracking-wider block font-semibold truncate">
              Currently Selected Station
            </span>
            <h4 className="font-['Cinzel'] text-xs sm:text-base font-bold text-white truncate">
              {activeStationName}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-end">
          <span className="hidden lg:inline text-[11px] text-gray-400 font-mono">
            Drag to Rotate 360° &bull; Scroll to Zoom
          </span>
          <button
            onClick={onOpenBooking}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#FFF0A5] to-[#AA7C11] text-[#070B14] font-extrabold text-[11px] sm:text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book This Station</span>
          </button>
        </div>
      </div>
    </div>
  );
};
