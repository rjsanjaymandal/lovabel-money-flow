import { memo } from "react";

// CSS-based lightweight background
export const ZenBackground = memo(() => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-background">
      {/* 
        Optimization Note: 
        Replaced Heavy 3D Canvas with CSS Gradients.
        This saves ~500kb bundle size and heavily reduces GPU usage.
      */}
      
      {/* Orb 1: Indigo */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/20 blur-[100px] animate-float-slow opacity-60 mix-blend-screen"
        style={{ animationDelay: '0s' }}
      />
      
      {/* Orb 2: Purple */}
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-500/20 blur-[120px] animate-float-delayed opacity-50 mix-blend-screen"
        style={{ animationDelay: '-2s' }}
      />
      
      {/* Orb 3: Sky */}
      <div 
        className="absolute top-[30%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-sky-500/10 blur-[80px] animate-float-slow opacity-40 mix-blend-screen"
        style={{ animationDelay: '-5s' }}
      />

      {/* Grid overlay for texture */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
    </div>
  );
});
