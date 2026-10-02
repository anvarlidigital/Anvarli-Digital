import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// 3D Royal Stylist Throne Chair
function RoyalStylistThrone({ isHovered = false }: { isHovered?: boolean }) {
  const chairRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (chairRef.current) {
      const t = clock.getElapsedTime();
      chairRef.current.rotation.y = Math.sin(t * 0.45) * 0.15;
    }
  });

  return (
    <group ref={chairRef} position={[0, 0, 0]}>
      {/* Ornate Gold Crown finial on top of chair */}
      <mesh position={[0, 2.35, -0.42]}>
        <cylinderGeometry args={[0.08, 0.16, 0.18, 5]} />
        <meshStandardMaterial
          color="#FFDF78"
          metalness={0.95}
          roughness={0.15}
          emissive="#AA7C11"
          emissiveIntensity={isHovered ? 0.7 : 0.25}
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
        <meshStandardMaterial color="#0A111E" roughness={0.75} metalness={0.15} />
      </mesh>

      {/* Royal Gold Cushion Trim Rim */}
      <mesh position={[0, 1.05, 0]}>
        <torusGeometry args={[0.64, 0.025, 16, 32]} />
        <meshStandardMaterial color="#FFDF78" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* High Backrest with Tufted Curve */}
      <group position={[0, 1.68, -0.44]}>
        <mesh>
          <boxGeometry args={[1.05, 1.15, 0.16]} />
          <meshStandardMaterial color="#070C15" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <boxGeometry args={[1.09, 1.19, 0.02]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>

      {/* Golden Armrests */}
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
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Mirror Halo Backlight */}
      <pointLight position={[0, 3.2, 0.4]} intensity={2.4} distance={6} color="#FFE6A3" />

      {/* Marble & Glass Vanity Shelf */}
      <mesh position={[0, 0.95, 0.35]}>
        <boxGeometry args={[3.4, 0.08, 0.7]} />
        <meshStandardMaterial color="#0A0E18" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.92, 0.35]}>
        <boxGeometry args={[3.44, 0.03, 0.74]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.95} />
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
      <mesh position={[0, 0, 0.05]}>
        <cylinderGeometry args={[0.07, 0.07, 0.12, 16]} />
        <meshStandardMaterial color="#FFF5D6" metalness={0.95} />
      </mesh>
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
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[1.1, 0.05, 16, 32]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.15} />
      </mesh>
      <mesh position={[0, -0.35, 0]}>
        <torusGeometry args={[0.7, 0.04, 16, 32]} />
        <meshStandardMaterial color="#FFDF78" metalness={0.95} roughness={0.15} />
      </mesh>

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

      <pointLight position={[0, -0.2, 0]} intensity={3.0} distance={8} color="#FFE8A3" />
    </group>
  );
}

// Interactive Parallax Camera Rig that tracks scroll progress & mouse
function ThroneCameraRig({ cur, cx, cy }: { cur: number; cx: number; cy: number }) {
  useFrame(({ camera }) => {
    // Parallax movement based on scroll progress and mouse coordinates
    const targetX = Math.sin(cur * Math.PI * 2) * 0.6 + cx * 1.2;
    const targetY = 2.1 + Math.cos(cur * Math.PI) * 0.35 - cy * 0.9;
    const targetZ = 4.4 - Math.sin(cur * Math.PI) * 0.8;

    camera.position.x += (targetX - camera.position.x) * 0.06;
    camera.position.y += (targetY - camera.position.y) * 0.06;
    camera.position.z += (targetZ - camera.position.z) * 0.06;

    camera.lookAt(0, 1.7, 0);
  });

  return null;
}

interface Throne3DBackgroundProps {
  cur: number;
  cx: number;
  cy: number;
  liteMode?: boolean;
}

export const Throne3DBackground: React.FC<Throne3DBackgroundProps> = ({
  cur,
  cx,
  cy,
  liteMode = false,
}) => {
  if (liteMode) {
    return (
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#070B14]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#201914_0%,_#070B14_75%)] opacity-80" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Ambient Radial Gradient Background to match the Salon walls template */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,_#2b221a_0%,_#070B14_74%)] opacity-95" />

      {/* 3D Canvas */}
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 2.2, 4.4], fov: 46 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        className="w-full h-full"
      >
        <ThroneCameraRig cur={cur} cx={cx} cy={cy} />

        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 8, 4]} intensity={2.2} color="#FFDF78" />
        <pointLight position={[-3, 3, 2]} intensity={1.6} color="#D4AF37" />

        {/* Polished Black Marble Floor with Geometric Gold Inlays */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[18, 18]} />
          <meshStandardMaterial color="#05070D" roughness={0.12} metalness={0.7} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <ringGeometry args={[2.5, 2.55, 48]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.95} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <ringGeometry args={[3.8, 3.84, 48]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.95} />
        </mesh>

        {/* 3D Throne Setup */}
        <RoyalStylistThrone />
        <GrandArchMirror />
        <FloatingGoldScissors />
        <RoyalChandelier />

        {/* Golden Floating Embers & Dust */}
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <Sparkles count={55} scale={[8, 5, 6]} size={2.5} speed={0.4} color="#D4AF37" />
        </Float>
      </Canvas>
    </div>
  );
};
