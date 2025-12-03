"use client"

import { motion } from "motion/react"
import { useEffect, useState } from "react"

const GHOST_COUNT = 8

interface GhostTraits {
  id: number
  x: number // percentage
  y: number // percentage
  scale: number
  duration: number
  delay: number
  bodyType: 'classic' | 'tall' | 'round'
  eyeType: 'round' | 'oval' | 'wink'
  mouthType: 'none' | 'o' | 'smile' | 'wiggle'
}

export function WobblyGhosts() {
  const [ghosts, setGhosts] = useState<GhostTraits[]>([])

  useEffect(() => {
    // Generate ghosts on client side to match hydration
    const generatedGhosts = Array.from({ length: GHOST_COUNT }).map((_, i) => ({
      id: i,
      x: Math.random() * 90 + 5, // 5% to 95%
      y: Math.random() * 80 + 10, // 10% to 90%
      scale: 0.5 + Math.random() * 0.8, // 0.5x to 1.3x
      duration: 3 + Math.random() * 4, // 3s to 7s
      delay: Math.random() * 2,
      bodyType: Math.random() > 0.6 ? 'tall' : Math.random() > 0.3 ? 'round' : 'classic',
      eyeType: Math.random() > 0.6 ? 'oval' : Math.random() > 0.3 ? 'wink' : 'round',
      mouthType: Math.random() > 0.7 ? 'o' : Math.random() > 0.4 ? 'smile' : Math.random() > 0.2 ? 'wiggle' : 'none',
    } as GhostTraits))
    setGhosts(generatedGhosts)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {ghosts.map((ghost) => (
        <Ghost key={ghost.id} {...ghost} />
      ))}
    </div>
  )
}

function Ghost({ x, y, scale, duration, delay, bodyType, eyeType, mouthType }: GhostTraits) {
  // Procedural paths based on types
  
  // Body Paths (100x100 viewBox)
  // Classic: Standard ghost shape
  const classicBody = "M20,80 C20,20 80,20 80,80 C80,90 70,85 65,90 C60,95 55,90 50,95 C45,90 40,95 35,90 C30,85 20,90 20,80"
  // Tall: More elongated
  const tallBody = "M30,85 C30,10 70,10 70,85 C70,95 60,90 55,95 C50,90 45,95 40,90 C35,95 30,95 30,85"
  // Round: Wider
  const roundBody = "M10,75 C10,30 90,30 90,75 C90,85 80,90 70,85 C60,90 50,85 40,90 C30,85 20,90 10,75"

  const bodyPath = bodyType === 'tall' ? tallBody : bodyType === 'round' ? roundBody : classicBody

  return (
    <motion.div
      className="absolute w-24 h-24 mix-blend-screen opacity-20"
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        x: [0, (Math.random() - 0.5) * 200], // Drift horizontally
        y: [0, -20, 0],
        rotate: [-5, 5, -5],
        opacity: [0.1, 0.3, 0.1],
        scale: scale,
      }}
      transition={{
        x: {
          duration: duration * 5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        },
        y: {
          duration: duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay,
        },
        rotate: {
          duration: duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay,
        },
        opacity: {
          duration: duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay,
        },
        scale: {
          duration: duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay,
        }
      }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full fill-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
        <path d={bodyPath} />
        
        {/* Eyes */}
        <g transform={bodyType === 'tall' ? "translate(0, -10)" : bodyType === 'round' ? "translate(0, 5)" : ""}>
            {eyeType === 'round' && (
                <>
                    <circle cx="35" cy="40" r="4" fill="black" opacity="0.7" />
                    <circle cx="65" cy="40" r="4" fill="black" opacity="0.7" />
                </>
            )}
            {eyeType === 'oval' && (
                <>
                    <ellipse cx="35" cy="40" rx="3" ry="6" fill="black" opacity="0.7" />
                    <ellipse cx="65" cy="40" rx="3" ry="6" fill="black" opacity="0.7" />
                </>
            )}
            {eyeType === 'wink' && (
                <>
                    <circle cx="35" cy="40" r="4" fill="black" opacity="0.7" />
                    <path d="M60,40 Q65,35 70,40" stroke="black" strokeWidth="2" fill="none" opacity="0.7" />
                </>
            )}
        </g>

        {/* Mouth */}
        <g transform={bodyType === 'tall' ? "translate(0, -10)" : bodyType === 'round' ? "translate(0, 5)" : ""}>
            {mouthType === 'o' && (
                <circle cx="50" cy="60" r="5" fill="black" opacity="0.7" />
            )}
            {mouthType === 'smile' && (
                <path d="M40,55 Q50,65 60,55" stroke="black" strokeWidth="2" fill="none" opacity="0.7" />
            )}
            {mouthType === 'wiggle' && (
                <path d="M42,60 Q45,55 50,60 Q55,65 58,60" stroke="black" strokeWidth="2" fill="none" opacity="0.7" />
            )}
        </g>
      </svg>
    </motion.div>
  )
}
