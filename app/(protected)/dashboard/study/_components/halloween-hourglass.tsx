"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface HalloweenHourglassProps {
  progress: number // 0 to 100
  active: boolean
  halloweenGlow?: boolean
  className?: string
}

export function HalloweenHourglass({
  progress,
  active,
  halloweenGlow = false,
  className,
}: HalloweenHourglassProps) {
  const sandColor = halloweenGlow ? "#fb923c" : "#eab308"
  
  // Refined paths for tighter layout
  const glassPath = `
    M35,25 
    Q25,25 25,50 
    Q25,70 48,75 
    Q25,80 25,100 
    Q25,125 35,125 
    H65 
    Q75,125 75,100 
    Q75,80 52,75 
    Q75,70 75,50 
    Q75,25 65,25 
    Z
  `
  
  const framePath = `
    M25,20 H75 L80,25 H20 L25,20 Z 
    M20,125 H80 L75,130 H25 L20,125 Z
  `

  // Adjusted Sand levels for new geometry
  const topSandHeight = 50 // max height of sand in top bulb
  const bottomSandHeight = 50 // max height of sand in bottom bulb
  const topSandY = 25 + (progress / 100) * topSandHeight 
  const bottomSandY = 125 - (progress / 100) * bottomSandHeight

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 100 150"
        className={cn(
          "h-40 w-auto transition-all duration-500",
          halloweenGlow && "drop-shadow-[0_0_8px_rgba(147,51,234,0.3)]"
        )}
      >
        <defs>
          <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="20%" stopColor="#fff" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="80%" stopColor="#fff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="sandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={sandColor} />
            <stop offset="100%" stopColor={halloweenGlow ? "#ea580c" : "#ca8a04"} />
          </linearGradient>

          <linearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3f3f46" />
            <stop offset="50%" stopColor="#71717a" />
            <stop offset="100%" stopColor="#3f3f46" />
          </linearGradient>
          
          <filter id="glow">
             <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
             <feMerge>
                 <feMergeNode in="coloredBlur"/>
                 <feMergeNode in="SourceGraphic"/>
             </feMerge>
          </filter>
        </defs>

        {/* Stand/Frame - Back Pillars */}
        <path d="M30,25 V125" stroke="#27272a" strokeWidth="2.5" />
        <path d="M70,25 V125" stroke="#27272a" strokeWidth="2.5" />

        {/* Glass Container Background */}
        <path
          d={glassPath}
          fill="url(#glassGradient)"
          stroke={halloweenGlow ? "rgba(147,51,234,0.3)" : "rgba(255,255,255,0.2)"}
          strokeWidth="1"
        />

        {/* Interior Clip Path for Falling Sand */}
        <clipPath id="interiorClip">
          <path d={glassPath} />
        </clipPath>

        {/* Top Sand Mask */}
        <clipPath id="topSandClip">
          <path d="M25,25 Q25,50 25,70 Q48,75 50,75 Q52,75 75,70 Q75,50 75,25 Z" />
        </clipPath>

        {/* Bottom Sand Mask */}
        <clipPath id="bottomSandClip">
          <path d="M25,100 Q25,125 35,125 H65 Q75,125 75,100 Q75,80 52,75 Q50,75 48,75 Q25,80 25,100 Z" />
        </clipPath>
        <g clipPath="url(#topSandClip)">
           <rect
             x="0"
             y={topSandY}
             width="100"
             height="80"
             fill="url(#sandGradient)"
             className="transition-all duration-1000 ease-linear"
           />
           {/* Top Surface Ellipse */}
            <ellipse
              cx="50"
              cy={topSandY}
              rx="25"
              ry="3"
              fill={sandColor}
              fillOpacity="0.8"
              className="transition-all duration-1000 ease-linear"
            />
        </g>

        {/* Bottom Sand (Mound) */}
        <g clipPath="url(#bottomSandClip)">
          {/* Base rectangle for volume */}
          <rect
            x="0"
            y={bottomSandY}
            width="100"
            height="80"
            fill="url(#sandGradient)"
            className="transition-all duration-1000 ease-linear"
          />
          {/* Mound effect using a path that grows */}
          {/* Logic: A triangle/curve that rises above the rect level to simulate piling */}
        </g>
        
        {/* Active Stream - Grainy Effect */}
        {active && progress < 99 && (
          <g clipPath="url(#interiorClip)">
             {/* Stream composed of multiple dashed lines moving at different speeds to simulate grains */}
             <line
               x1="50" y1="75" x2="50" y2={bottomSandY + 5}
               stroke={sandColor}
               strokeWidth="2"
               strokeDasharray="1 3"
               className="animate-sand-stream-1 opacity-80"
             />
             <line
               x1="50" y1="75" x2="50" y2={bottomSandY + 5}
               stroke={sandColor}
               strokeWidth="2"
               strokeDasharray="1 4"
               className="animate-sand-stream-2 opacity-60"
             />
             
             {/* Splash Effect at Bottom */}
             <circle cx="48" cy={bottomSandY} r="0.5" fill={sandColor} className="animate-splash-1" />
             <circle cx="52" cy={bottomSandY} r="0.5" fill={sandColor} className="animate-splash-2" />
             <circle cx="49" cy={bottomSandY - 2} r="0.5" fill={sandColor} className="animate-splash-3" />
             <circle cx="51" cy={bottomSandY - 2} r="0.5" fill={sandColor} className="animate-splash-4" />
          </g>
        )}

        {/* Glass Reflections (Front) */}
        <path d="M30 35 Q30 50 35 60" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M70 110 Q70 120 65 125" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" />

        {/* Frame Top/Bottom Plates */}
        <path d="M25,20 H75 L80,25 H20 L25,20 Z" fill="url(#frameGradient)" stroke="#27272a" strokeWidth="1" />
        <path d="M20,125 H80 L75,130 H25 L20,125 Z" fill="url(#frameGradient)" stroke="#27272a" strokeWidth="1" />
        
        {/* Gothic Ornamentation on Frame (Corners) */}
        {halloweenGlow && (
           <>
             <circle cx="25" cy="25" r="1.5" fill="#9333ea" className="animate-pulse" />
             <circle cx="75" cy="25" r="1.5" fill="#9333ea" className="animate-pulse" />
             <circle cx="25" cy="125" r="1.5" fill="#9333ea" className="animate-pulse" />
             <circle cx="75" cy="125" r="1.5" fill="#9333ea" className="animate-pulse" />
           </>
        )}
      </svg>
      
      <style jsx>{`
        @keyframes sand-stream {
          to { stroke-dashoffset: -20; }
        }
        .animate-sand-stream-1 { animation: sand-stream 0.5s linear infinite; }
        .animate-sand-stream-2 { animation: sand-stream 0.7s linear infinite reverse; }

        @keyframes splash {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), -5px) scale(0); opacity: 0; }
        }
        .animate-splash-1 { --tx: -4px; animation: splash 0.4s ease-out infinite; }
        .animate-splash-2 { --tx: 4px; animation: splash 0.5s ease-out infinite 0.1s; }
        .animate-splash-3 { --tx: -2px; animation: splash 0.3s ease-out infinite 0.2s; }
        .animate-splash-4 { --tx: 2px; animation: splash 0.45s ease-out infinite 0.15s; }
      `}</style>
    </div>
  )
}
