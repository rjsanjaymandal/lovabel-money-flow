import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Html, RoundedBox, OrbitControls, Environment } from "@react-three/drei";
import { useState, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";

// Individual 3D Bar Component
function Bar({ position, height, color, label, value, delay }: any) {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [targetHeight, setTargetHeight] = useState(0);

  // Animate height on load
  useEffect(() => {
    const timer = setTimeout(() => setTargetHeight(height), delay);
    return () => clearTimeout(timer);
  }, [height, delay]);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    // Smooth lerp for height
    mesh.current.scale.y = THREE.MathUtils.lerp(mesh.current.scale.y, targetHeight, delta * 4);
    // Hover effect
    const targetScale = hovered ? 1.1 : 1;
    mesh.current.scale.x = THREE.MathUtils.lerp(mesh.current.scale.x, targetScale, delta * 10);
    mesh.current.scale.z = THREE.MathUtils.lerp(mesh.current.scale.z, targetScale, delta * 10);
  });

  return (
    <group position={position}>
      <mesh
        ref={mesh}
        position={[0, height / 2, 0]} // Pivot from bottom
        scale={[1, 0, 1]} // Start with 0 height
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.6, 1, 0.6]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </mesh>

      {/* Label below */}
      <Text
        position={[0, -0.5, 0.5]}
        fontSize={0.25}
        color="#94a3b8"
        anchorX="center"
        anchorY="top"
        rotation={[-Math.PI / 4, 0, 0]}
      >
        {label.length > 8 ? label.substring(0, 8) + ".." : label}
      </Text>

      {/* Tooltip on Hover */}
      {hovered && (
        <Html position={[0, height + 0.5, 0]} center>
          <div className="bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border border-white/10 shadow-xl">
            {label}: ₹{value.toLocaleString()}
          </div>
        </Html>
      )}
    </group>
  );
}

export const ThreeDChart = ({ userId, selectedMonth }: { userId: string; selectedMonth: Date }) => {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (userId && selectedMonth) {
      fetchChartData();
    }
  }, [userId, selectedMonth]);

  const fetchChartData = async () => {
    const startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
    const endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (!transactions) return;

    const categoryMap = new Map();
    transactions.forEach((t) => {
      const existing = categoryMap.get(t.category) || { income: 0, expense: 0 };
      if (t.type === "income") existing.income += t.amount;
      else existing.expense += t.amount;
      categoryMap.set(t.category, existing);
    });

    const data = Array.from(categoryMap.entries())
      .map(([category, values]: [string, any]) => ({
        category,
        value: values.expense, // Focus on expenses for the chart
        color: "#f43f5e", // Rose color for expense
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories

    setChartData(data);
  };

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Add transactions to see your 3D Spending Pillars
      </div>
    );
  }

  // Normalize heights
  const maxValue = Math.max(...chartData.map(d => d.value));
  const maxHeight = 4; // Max height in 3D units

  return (
    <div className="h-[350px] w-full">
      <Canvas camera={{ position: [0, 4, 8], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#818cf8" />

        <group position={[-(chartData.length * 1) / 2, -1, 0]}>
          {chartData.map((item, index) => (
            <Bar
              key={item.category}
              position={[index * 1.2, 0, 0]}
              height={(item.value / maxValue) * maxHeight}
              color={item.color}
              label={item.category}
              value={item.value}
              delay={index * 100}
            />
          ))}
        </group>

        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2.5} 
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};
