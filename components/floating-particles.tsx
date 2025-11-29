"use client";

import { useEffect, useState, useMemo } from "react";

// Halloween color palette
const HALLOWEEN_COLORS = [
  "#fb923c", // Orange
  "#a855f7", // Purple
  "#f8fafc", // Ghostly white
  "#fbbf24", // Amber
  "#c084fc", // Light purple
];

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
  type: "ghost" | "orb";
}

interface FloatingParticlesProps {
  className?: string;
  particleCount?: number;
  colors?: string[];
}

const DESKTOP_PARTICLE_COUNT = 15;
const MOBILE_PARTICLE_COUNT = 8;
const MAX_PARTICLE_COUNT = 20;
const MOBILE_BREAKPOINT = 1024;

function generateParticles(count: number, colors: string[]): Particle[] {
  // Ensure we never exceed max particle count
  const safeCount = Math.min(count, MAX_PARTICLE_COUNT);
  
  return Array.from({ length: safeCount }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 8 + 4, // 4-12px
    duration: Math.random() * 10 + 15, // 15-25s
    delay: Math.random() * 5, // 0-5s delay
    color: colors[Math.floor(Math.random() * colors.length)],
    type: Math.random() > 0.7 ? "ghost" : "orb",
  }));
}

export function FloatingParticles({
  className = "",
  particleCount,
  colors = HALLOWEEN_COLORS,
}: FloatingParticlesProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle mount state
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle responsive detection with cleanup
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Calculate particle count based on viewport
  const effectiveParticleCount = useMemo(() => {
    if (particleCount !== undefined) {
      return Math.min(particleCount, MAX_PARTICLE_COUNT);
    }
    return isMobile ? MOBILE_PARTICLE_COUNT : DESKTOP_PARTICLE_COUNT;
  }, [particleCount, isMobile]);

  // Generate particles
  const particles = useMemo(
    () => generateParticles(effectiveParticleCount, colors),
    [effectiveParticleCount, colors]
  );

  // Don't render on server
  if (!mounted) return null;

  return (
    <div
      className={`pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.type === "ghost" ? 0.6 : 0.4,
            boxShadow:
              particle.type === "ghost"
                ? `0 0 ${particle.size * 2}px ${particle.color}`
                : `0 0 ${particle.size}px ${particle.color}`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* CSS animations for floating effect */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          25% {
            transform: translate(10px, -20px) scale(1.1);
            opacity: 0.6;
          }
          50% {
            transform: translate(-5px, -40px) scale(1);
            opacity: 0.5;
          }
          75% {
            transform: translate(15px, -20px) scale(0.9);
            opacity: 0.6;
          }
        }

        .animate-float {
          animation: float linear infinite;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
}

// Export constants for testing
export {
  HALLOWEEN_COLORS,
  DESKTOP_PARTICLE_COUNT,
  MOBILE_PARTICLE_COUNT,
  MAX_PARTICLE_COUNT,
  MOBILE_BREAKPOINT,
  generateParticles,
};
export type { Particle, FloatingParticlesProps };
