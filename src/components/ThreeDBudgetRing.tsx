import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Center } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

function Ring({ percentage, color }: { percentage: number; color: string }) {
  const mesh = useRef<THREE.Mesh>(null);
  const [currentArc, setCurrentArc] = useState(0);

  // Target arc (in radians)
  // Cap at slightly less than full circle for style, or full circle if > 100%
  const targetArc = Math.min((percentage / 100) * Math.PI * 2, Math.PI * 2);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    // Animate arc growth
    const speed = 2;
    if (currentArc < targetArc) {
      const newArc = Math.min(currentArc + delta * speed * Math.PI, targetArc);
      setCurrentArc(newArc);
    }
    
    // Rotate slightly for 3D effect
    mesh.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    mesh.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.5) * 0.2;
  });

  // Re-create geometry when arc changes to simulate growth
  // Note: Modifying geometry in useFrame is expensive, but for a simple ring it's okay-ish.
  // Better approach: Use a shader or a pre-built ring with thetaLength.
  // torusGeometry parameters: radius, tube, radialSegments, tubularSegments, arc
  
  return (
    <group>
      {/* Background Ring (Ghost) */}
      <mesh position={[0, 0, -0.1]}>
        <torusGeometry args={[2.5, 0.2, 16, 64, Math.PI * 2]} />
        <meshStandardMaterial color="#334155" opacity={0.3} transparent />
      </mesh>

      {/* Progress Ring */}
      <mesh ref={mesh} rotation={[0, 0, Math.PI / 2]}> 
        {/* Rotate to start from top? No, default starts from right. Math.PI/2 starts from top. */}
        <torusGeometry args={[2.5, 0.25, 16, 64, currentArc]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

export function ThreeDBudgetRing({ budget, spent }: { budget: number; spent: number }) {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  
  let color = "#10b981"; // Emerald (Green)
  if (percentage > 100) color = "#ef4444"; // Red
  else if (percentage > 80) color = "#f59e0b"; // Amber

  return (
    <div className="h-[200px] w-full relative">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Ring percentage={percentage} color={color} />
        
        {/* Center Text */}
        <Center>
          <group>
            <Text 
              position={[0, 0.5, 0]} 
              fontSize={0.5} 
              color="white" 
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff"
            >
              {percentage.toFixed(0)}%
            </Text>
            <Text 
              position={[0, -0.5, 0]} 
              fontSize={0.2} 
              color="#94a3b8"
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff"
            >
              USED
            </Text>
          </group>
        </Center>
      </Canvas>
    </div>
  );
}
