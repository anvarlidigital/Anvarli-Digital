import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// 3D Animated Gold Scissors
function GoldScissors() {
  const leftBladeRef = useRef<THREE.Group>(null);
  const rightBladeRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Smooth scissor snip motion: open, pause, snip closed
    const angle = Math.sin(t * 3.5) * 0.22 + 0.22;
    if (leftBladeRef.current) {
      leftBladeRef.current.rotation.z = angle;
    }
    if (rightBladeRef.current) {
      rightBladeRef.current.rotation.z = -angle;
    }
  });

  return (
    <group position={[0, 0.2, 0]}>
      {/* Pivot Center Pin */}
      <mesh position={[0, 0, 0.08]}>
        <cylinderGeometry args={[0.09, 0.09, 0.16, 32]} />
        <meshStandardMaterial color="#FFDF78" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Left Blade and Handle */}
      <group ref={leftBladeRef}>
        {/* Blade */}
        <mesh position={[0.7, 0.04, 0]} rotation={[0, 0, 0.05]}>
          <boxGeometry args={[1.4, 0.08, 0.03]} />
          <meshStandardMaterial color="#E5C158" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Scissor Tip */}
        <mesh position={[1.45, 0.02, 0]} rotation={[0, 0, -0.6]}>
          <coneGeometry args={[0.07, 0.25, 4]} />
          <meshStandardMaterial color="#FFF0A0" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Left Finger Ring Handle */}
        <mesh position={[-0.7, 0.25, 0]}>
          <torusGeometry args={[0.3, 0.06, 16, 32]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Right Blade and Handle */}
      <group ref={rightBladeRef}>
        {/* Blade */}
        <mesh position={[0.7, -0.04, 0]} rotation={[0, 0, -0.05]}>
          <boxGeometry args={[1.4, 0.08, 0.03]} />
          <meshStandardMaterial color="#E5C158" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Scissor Tip */}
        <mesh position={[1.45, -0.02, 0]} rotation={[0, 0, 0.6]}>
          <coneGeometry args={[0.07, 0.25, 4]} />
          <meshStandardMaterial color="#FFF0A0" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Right Finger Ring Handle */}
        <mesh position={[-0.7, -0.25, 0]}>
          <torusGeometry args={[0.3, 0.06, 16, 32]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// 3D Floating Styling Comb
function FloatingComb() {
  const combRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (combRef.current) {
      const t = clock.getElapsedTime();
      combRef.current.rotation.y = Math.sin(t * 0.8) * 0.4;
      combRef.current.rotation.x = Math.cos(t * 0.6) * 0.2;
    }
  });

  return (
    <group ref={combRef} position={[-1.6, -0.8, -0.5]} rotation={[0.4, 0.2, -0.3]}>
      {/* Comb Spine */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.8, 0.15, 0.04]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Comb Teeth */}
      {Array.from({ length: 18 }).map((_, i) => (
        <mesh key={i} position={[-0.8 + i * 0.095, -0.25, 0]}>
          <boxGeometry args={[0.025, 0.38, 0.025]} />
          <meshStandardMaterial color="#FFDF78" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

// 3D Floating Hair Strands
function FloatingHairStrands() {
  const strand1 = useRef<THREE.Mesh>(null);
  const strand2 = useRef<THREE.Mesh>(null);
  const strand3 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (strand1.current) {
      strand1.current.rotation.z = Math.sin(t * 1.2) * 0.3;
      strand1.current.position.y = 1.0 + Math.sin(t * 1.5) * 0.15;
    }
    if (strand2.current) {
      strand2.current.rotation.z = Math.cos(t * 1.0) * 0.4;
      strand2.current.position.y = -1.2 + Math.cos(t * 1.3) * 0.12;
    }
    if (strand3.current) {
      strand3.current.rotation.x = Math.sin(t * 0.9) * 0.5;
      strand3.current.position.x = 1.6 + Math.sin(t * 0.7) * 0.1;
    }
  });

  return (
    <group>
      {/* Golden Silk Strand 1 */}
      <mesh ref={strand1} position={[-1.2, 1.0, 0.2]} rotation={[0.2, 0.3, 0.5]}>
        <tubeGeometry
          args={[
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(-0.6, -0.4, 0),
              new THREE.Vector3(-0.2, 0.2, 0.2),
              new THREE.Vector3(0.3, 0.0, -0.1),
              new THREE.Vector3(0.7, 0.5, 0.1),
            ]),
            32,
            0.015,
            8,
            false,
          ]}
        />
        <meshStandardMaterial color="#FFD700" emissive="#554400" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Ebony/Chestnut Strand 2 */}
      <mesh ref={strand2} position={[1.4, -1.0, -0.3]} rotation={[-0.2, -0.4, -0.6]}>
        <tubeGeometry
          args={[
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(-0.5, 0.5, 0),
              new THREE.Vector3(-0.1, 0.1, -0.2),
              new THREE.Vector3(0.2, -0.2, 0.1),
              new THREE.Vector3(0.6, -0.5, 0),
            ]),
            32,
            0.018,
            8,
            false,
          ]}
        />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

interface ThreeLoadingScreenProps {
  onLoaded: () => void;
  liteMode?: boolean;
}

export const ThreeLoadingScreen: React.FC<ThreeLoadingScreenProps> = ({ onLoaded, liteMode }) => {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setFading(true);
          setTimeout(() => {
            onLoaded();
          }, 800);
          return 100;
        }
        // Smooth non-linear progress
        const diff = Math.max(1, Math.floor((100 - prev) * 0.12));
        return Math.min(100, prev + diff);
      });
    }, 45);

    return () => clearInterval(timer);
  }, [onLoaded]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070B14] transition-opacity duration-700 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 3D Canvas Scene */}
      {!liteMode ? (
        <div className="absolute inset-0 w-full h-full">
          <Canvas
            camera={{ position: [0, 0, 4.2], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.9} />
            <directionalLight position={[5, 8, 5]} intensity={2.2} color="#FFF2D6" />
            <pointLight position={[-4, -2, 2]} intensity={1.5} color="#D4AF37" />
            <spotLight position={[0, 5, 2]} angle={0.6} penumbra={1} intensity={2.5} color="#FFE699" />

            <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
              <GoldScissors />
              <FloatingComb />
              <FloatingHairStrands />
            </Float>

            {/* Sparkles */}
            <Sparkles count={45} scale={5} size={3} speed={0.4} color="#D4AF37" />
          </Canvas>
        </div>
      ) : (
        /* Lite Mode Animated Fallback */
        <div className="relative mb-8 flex items-center justify-center">
          <div className="w-28 h-28 rounded-full border border-[#D4AF37]/40 flex items-center justify-center bg-[#0D1527] shadow-[0_0_50px_rgba(212,175,55,0.25)] animate-pulse">
            <span className="text-4xl text-[#D4AF37]">✂️</span>
          </div>
        </div>
      )}

      {/* Overlay Brand & Loading Progress UI */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pointer-events-none select-none mt-40 sm:mt-48">
        {/* Uploaded Salon Logo */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-[#D4AF37]/60 shadow-[0_0_30px_rgba(212,175,55,0.4)] mb-3 bg-[#070B14]">
          <img
            src="/logo.png"
            onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
            alt="Trim & Twisted Logo"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs uppercase tracking-[0.25em] font-medium mb-2 backdrop-blur-md">
          Haute Unisex Lounge
        </div>

        <h1 className="font-['Cinzel'] text-3xl sm:text-5xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#F6E7B4] via-[#D4AF37] to-[#AA7C11] drop-shadow-[0_2px_12px_rgba(212,175,55,0.3)]">
          TRIM & TWISTED
        </h1>

        <p className="font-['Playfair_Display'] italic text-base sm:text-lg text-[#E6DFCA] tracking-wide mt-1">
          &ldquo;Beauty Is You&rdquo;
        </p>

        {/* Progress Bar & Percentage */}
        <div className="w-64 sm:w-80 mt-8 flex flex-col items-center">
          <div className="w-full bg-[#11192A] rounded-full h-1.5 overflow-hidden p-0.5 border border-[#D4AF37]/25 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
            <div
              className="bg-gradient-to-r from-[#D4AF37] via-[#FFF0A5] to-[#AA7C11] h-full rounded-full transition-all duration-150 shadow-[0_0_12px_#D4AF37]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between w-full mt-3 text-xs tracking-widest uppercase">
            <span className="text-[#8E9DB7] font-sans">Crafting Experience</span>
            <span className="text-[#D4AF37] font-semibold">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
