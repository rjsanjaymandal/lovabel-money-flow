import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function FloatingShape({ position, color, speed, rotationIntensity, floatIntensity, scale }: any) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    // Subtle rotation
    mesh.current.rotation.x = t * speed * 0.2;
    mesh.current.rotation.y = t * speed * 0.1;
  });

  return (
    <Float 
      speed={speed} 
      rotationIntensity={rotationIntensity} 
      floatIntensity={floatIntensity} 
      position={position}
    >
      <mesh ref={mesh} scale={scale}>
        <icosahedronGeometry args={[1, 0]} />
        <meshPhysicalMaterial 
          color={color}
          roughness={0.1}
          metalness={0.1}
          transmission={0.5} // Glass-like
          thickness={1}
          clearcoat={1}
          opacity={0.6}
          transparent
        />
      </mesh>
    </Float>
  );
}

export function ZenBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.5} />
        
        {/* Floating Orbs */}
        <FloatingShape 
          position={[-4, 2, -5]} 
          color="#818cf8" // Indigo
          speed={1.5} 
          rotationIntensity={1} 
          floatIntensity={2} 
          scale={1.5}
        />
        <FloatingShape 
          position={[4, -3, -5]} 
          color="#c084fc" // Purple
          speed={1.2} 
          rotationIntensity={1.5} 
          floatIntensity={1.5} 
          scale={2}
        />
        <FloatingShape 
          position={[0, 4, -8]} 
          color="#38bdf8" // Sky
          speed={1} 
          rotationIntensity={0.5} 
          floatIntensity={1} 
          scale={1.2}
        />

        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
