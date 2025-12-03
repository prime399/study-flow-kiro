"use client"

import { useMemo } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface GhostAvatarProps {
  src: string
  alt: string
  className?: string
  showStatus?: boolean
}

const GHOST_COLORS = [
  "#ffffff", // Classic White
  "#e0f2fe", // Sky Blue
  "#dcfce7", // Green
  "#fae8ff", // Purple
  "#ffedd5", // Orange
  "#fee2e2", // Red
]

// Simple deterministic random based on string seed
function seededRandom(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Return a function that generates numbers
  return () => {
    const x = Math.sin(hash++) * 10000
    return x - Math.floor(x)
  }
}

export function GhostAvatar({ src, alt, className, showStatus = true }: GhostAvatarProps) {
  const traits = useMemo(() => {
    const rng = seededRandom(src) // Use src as seed for consistency
    
    return {
      bodyType: rng() > 0.6 ? 'tall' : rng() > 0.3 ? 'round' : 'classic',
      eyeType: rng() > 0.6 ? 'happy' : rng() > 0.3 ? 'oval' : 'round',
      mouthType: rng() > 0.7 ? 'o' : rng() > 0.4 ? 'smile' : 'smirk',
      color: GHOST_COLORS[Math.floor(rng() * GHOST_COLORS.length)],
      wobbleSpeed: 3 + rng() * 4, // 3-7s
      wobbleDelay: rng() * 2,
      scale: 0.9 + rng() * 0.2, // Slight size variation
      floatY: 5 + rng() * 10, // How much it floats
    }
  }, [src])

  // Body Paths (100x100 viewBox)
  // Optimized to be roughly centered and fill the space well
  const paths = {
    classic: "M20,80 C20,20 80,20 80,80 C80,90 70,85 65,90 C60,95 55,90 50,95 C45,90 40,95 35,90 C30,85 20,90 20,80",
    tall: "M30,85 C30,10 70,10 70,85 C70,95 60,90 55,95 C50,90 45,95 40,90 C35,95 30,95 30,85",
    round: "M10,75 C10,30 90,30 90,75 C90,85 80,90 70,85 C60,90 50,85 40,90 C30,85 20,90 10,75"
  }

  const bodyPath = paths[traits.bodyType as keyof typeof paths]
  const uniqueId = `ghost-mask-${src.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <motion.div
      className={cn("relative inline-block select-none", className)}
      initial={{ y: 0 }}
      animate={{ 
        y: [-traits.floatY/2, traits.floatY/2, -traits.floatY/2],
        rotate: [-2, 2, -2]
      }}
      transition={{
        duration: traits.wobbleSpeed,
        repeat: Infinity,
        ease: "easeInOut",
        delay: traits.wobbleDelay
      }}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <pattern id={`${uniqueId}-pattern`} patternUnits="userSpaceOnUse" width="100" height="100">
            {/* Center and scale image to cover the 100x100 area roughly */}
            <image href={src} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" />
          </pattern>
          <mask id={`${uniqueId}-mask`}>
            <path d={bodyPath} fill="white" />
          </mask>
          <filter id={`${uniqueId}-cheek-blur`}>
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* 1. The Ghost Shape Background (Tinted) */}
        <path 
            d={bodyPath} 
            fill={traits.color}
            stroke="rgba(255,255,255,0.5)" 
            strokeWidth="2"
        />

        {/* 2. The Image masked by the Ghost Shape */}
        {/* We use a slightly smaller path or just the same path with opacity to blend */}
        <path 
            d={bodyPath} 
            fill={`url(#${uniqueId}-pattern)`} 
            opacity="0.8"
            style={{ mixBlendMode: 'overlay' }}
        />
        
        <path 
            d={bodyPath} 
            fill={`url(#${uniqueId}-pattern)`} 
            opacity="0.6"
            style={{ mixBlendMode: 'normal' }}
        />

        {/* 3. Facial Features Overlay */}
        <g transform={traits.bodyType === 'tall' ? "translate(0, -10)" : traits.bodyType === 'round' ? "translate(0, 5)" : ""}>
          {/* Eyes */}
          <g fill="black" opacity="0.6">
            {traits.eyeType === 'round' && (
              <>
                <circle cx="35" cy="40" r="4" />
                <circle cx="65" cy="40" r="4" />
              </>
            )}
            {traits.eyeType === 'oval' && (
              <>
                <ellipse cx="35" cy="40" rx="3" ry="6" />
                <ellipse cx="65" cy="40" rx="3" ry="6" />
              </>
            )}
            {traits.eyeType === 'happy' && (
              <>
                <path d="M31,42 Q35,38 39,42" stroke="black" strokeWidth="3" fill="none" />
                <path d="M61,42 Q65,38 69,42" stroke="black" strokeWidth="3" fill="none" />
              </>
            )}
          </g>

          {/* Mouth */}
          <g fill="black" opacity="0.6">
            {traits.mouthType === 'o' && (
              <circle cx="50" cy="60" r="4" />
            )}
            {traits.mouthType === 'smile' && (
              <path d="M40,55 Q50,65 60,55" stroke="black" strokeWidth="3" fill="none" strokeLinecap="round" />
            )}
            {traits.mouthType === 'smirk' && (
              <path d="M42,60 Q50,62 58,58" stroke="black" strokeWidth="3" fill="none" strokeLinecap="round" />
            )}
          </g>

          {/* Cheeks (Rosy/Subtle) */}
          <g fill="#ff9999" opacity="0.4" style={{ mixBlendMode: 'multiply' }} filter={`url(#${uniqueId}-cheek-blur)`}>
             <circle cx="30" cy="50" r="5" />
             <circle cx="70" cy="50" r="5" />
          </g>
        </g>

        {/* 4. A spectral overlay/highlight */}
        <path 
            d={bodyPath} 
            fill={`url(#ghost-gradient-${uniqueId})`} 
            opacity="0.4"
            style={{ mixBlendMode: 'screen' }}
        />
        
        <linearGradient id={`ghost-gradient-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="50%" stopColor={traits.color} stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </linearGradient>
      </svg>

      {/* Status Indicator - moving with the ghost */}
      {showStatus && (
        <motion.div 
            className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-black shadow-sm z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
        />
      )}
    </motion.div>
  )
}
