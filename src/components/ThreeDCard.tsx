import { Canvas, useFrame } from "@react-three/fiber";
import { Text, RoundedBox, Float, Environment, ContactShadows, PerspectiveCamera } from "@react-three/drei";
import { useRef, useState, Suspense } from "react";
import * as THREE from "three";

function Card({ balance, name }: { balance: number, name: string }) {
  const mesh = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!mesh.current) return;
    
    // Gentle floating animation
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.x = Math.cos(t / 4) / 10 + 0.05;
    mesh.current.rotation.y = Math.sin(t / 4) / 10;
    mesh.current.position.y = (1 + Math.sin(t / 1.5)) / 10;
  });

  const fontUrl = "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff";

  return (
    <group ref={mesh}>
      <Float speed={4} rotationIntensity={0.5} floatIntensity={0.2}>
        {/* Card Body - Darker Premium Indigo */}
        <RoundedBox args={[3.4, 2.1, 0.05]} radius={0.15} smoothness={4}>
          <meshPhysicalMaterial 
            color="#312e81" // Darker Indigo
            emissive="#1e1b4b"
            emissiveIntensity={0.5}
            roughness={0.3}
            metalness={0.8}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </RoundedBox>

        {/* Chip - Gold */}
        <RoundedBox args={[0.45, 0.35, 0.02]} radius={0.05} smoothness={2} position={[-1.2, 0.1, 0.03]}>
          <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.3} />
        </RoundedBox>

        {/* Text Elements */}
        <group position={[0, 0, 0.04]}>
          {/* Top Label */}
          <Text 
            position={[-1.4, 0.75, 0]} 
            fontSize={0.1} 
            color="#a5b4fc" // Indigo 200
            anchorX="left"
            font={fontUrl}
            letterSpacing={0.05}
          >
            CURRENT BALANCE
          </Text>

          {/* Main Balance - Centered & Large */}
          <Text 
            position={[0, 0.1, 0]} 
            fontSize={0.32} 
            color="white" 
            anchorX="center"
            font={fontUrl}
            letterSpacing={0.02}
          >
            ₹ {balance.toLocaleString()}
          </Text>

          {/* Bottom Info Row */}
          <group position={[0, -0.75, 0]}>
            {/* Name */}
            <Text 
              position={[-1.4, 0, 0]} 
              fontSize={0.11} 
              color="#e0e7ff" 
              anchorX="left"
              font={fontUrl}
            >
              {name.toUpperCase()}
            </Text>
          </group>
        </group>
      </Float>
    </group>
  );
}

export function ThreeDCard({ balance, name = "User" }: { balance: number, name?: string }) {
  return (
    <div className="h-[260px] w-full relative z-0">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 3.2]} fov={50} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#818cf8" />
        
        <Suspense fallback={null}>
          <Card balance={balance} name={name} />
          <Environment preset="city" />
        </Suspense>
        
        <ContactShadows position={[0, -1.4, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
      </Canvas>
    </div>
  );
}
