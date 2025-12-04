import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Text, Center } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function SimpleRing({ fillPercentage, color }: { fillPercentage: number; color: string }) {
  const ringRef = useRef<THREE.Group>(null);

  // Clamp percentage between 0 and 1
  const clampedFill = Math.min(Math.max(fillPercentage, 0.001), 1);
  
  // Calculate arc length (2 * PI * percentage)
  const arcLength = clampedFill * Math.PI * 2;

  useFrame((state) => {
    if (ringRef.current) {
      // Gentle floating rotation
      ringRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      ringRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={ringRef} rotation={[0, 0, 0]}>
      {/* Background Track (Grey Ring) */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[1.8, 0.15, 32, 100, Math.PI * 2]} />
        <meshStandardMaterial 
          color="#e2e8f0" 
          transparent 
          opacity={0.3} 
          roughness={0.1} 
          metalness={0.5} 
        />
      </mesh>

      {/* Progress Ring (Colored Arc) */}
      {/* We rotate it -90 deg (Math.PI/2) to start from top */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[1.8, 0.16, 32, 100, arcLength]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Percentage Text */}
      <Center>
        <Text
          fontSize={1}
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
          color={color}
          characters="0123456789%"
        >
          {Math.round(fillPercentage * 100)}%
        </Text>
      </Center>
    </group>
  );
}

export function ThreeDEnergyCore({ budget, spent }: { budget: number; spent: number }) {
  const percentage = budget > 0 ? spent / budget : 0;
  
  // Color logic - Premium Palette
  let color = "#06b6d4"; // Cyan (Safe)
  if (percentage > 0.8) color = "#f97316"; // Orange (Warning)
  if (percentage > 1.0) color = "#ec4899"; // Pink/Rose (Danger)

  return (
    <div className="h-full w-full relative">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="white" />
        
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
          <SimpleRing fillPercentage={percentage} color={color} />
        </Float>
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
