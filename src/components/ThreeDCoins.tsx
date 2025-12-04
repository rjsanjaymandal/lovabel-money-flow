import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

function Coin({ color, emissive }: { color: string; emissive: string }) {
  const mesh = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    // Spin animation
    mesh.current.rotation.y += 0.02;
    // Float animation
    mesh.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
  });

  return (
    <group ref={mesh}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* Coin Body */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.15, 32]} />
          <meshStandardMaterial
            color={color}
            metalness={1}
            roughness={0.3}
            emissive={emissive}
            emissiveIntensity={0.2}
          />
        </mesh>
        {/* Inner Detail */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <cylinderGeometry args={[1, 1, 0.16, 32]} />
          <meshStandardMaterial
            color={color}
            metalness={0.8}
            roughness={0.4}
          />
        </mesh>
      </Float>
    </group>
  );
}

export function ThreeDCoins({ type }: { type: "lent" | "borrowed" }) {
  const color = type === "lent" ? "#fbbf24" : "#f43f5e"; // Gold or Rose
  const emissive = type === "lent" ? "#d97706" : "#be123c";

  return (
    <div className="h-[120px] w-full relative">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color={color} />
        
        <Suspense fallback={null}>
          <Coin color={color} emissive={emissive} />
          <Environment preset="city" />
        </Suspense>
        
        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
      </Canvas>
    </div>
  );
}
