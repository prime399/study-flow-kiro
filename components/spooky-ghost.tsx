"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"

interface SpookyGhostProps {
  className?: string
}

export function SpookyGhost({ className }: SpookyGhostProps) {
  const [isScary, setIsScary] = useState(false)
  const [isHiding, setIsHiding] = useState(false)
  const [showBoo, setShowBoo] = useState(false)
  const ghostRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isTransitioning = useRef(false)
  const timeoutRefs = useRef<NodeJS.Timeout[]>([])

  // Clear all pending timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout)
    timeoutRefs.current = []
  }, [])

  // Preload audio on mount
  useEffect(() => {
    const audioPath = "/halloween%20assets/a_cute_sound_effect__%234-1764420995532.mp3"
    audioRef.current = new Audio(audioPath)
    audioRef.current.volume = 0.6
    audioRef.current.preload = "auto"
    audioRef.current.load()

    return () => {
      clearAllTimeouts()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [clearAllTimeouts])

  // Check if mouse is within proximity of ghost
  const isMouseNearGhost = useCallback((mouseX: number, mouseY: number): boolean => {
    if (!ghostRef.current) return false
    
    const rect = ghostRef.current.getBoundingClientRect()
    const proximity = 40 // Reduced by 60% from 100px
    
    // Expand the rect by proximity amount
    const expandedRect = {
      left: rect.left - proximity,
      right: rect.right + proximity,
      top: rect.top - proximity,
      bottom: rect.bottom + proximity,
    }
    
    return (
      mouseX >= expandedRect.left &&
      mouseX <= expandedRect.right &&
      mouseY >= expandedRect.top &&
      mouseY <= expandedRect.bottom
    )
  }, [])

  // Trigger scary state
  const triggerScary = useCallback(() => {
    if (isTransitioning.current || isScary) return
    
    isTransitioning.current = true
    setIsHiding(true)

    const t1 = setTimeout(() => {
      setIsScary(true)
      setIsHiding(false)
      setShowBoo(true)

      // Play sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }

      const t2 = setTimeout(() => {
        setShowBoo(false)
        isTransitioning.current = false
      }, 1500)
      timeoutRefs.current.push(t2)
    }, 300)
    timeoutRefs.current.push(t1)
  }, [isScary])

  // Reset to happy state
  const resetToHappy = useCallback(() => {
    if (isTransitioning.current || !isScary) return
    
    isTransitioning.current = true
    setIsHiding(true)
    setShowBoo(false)

    const t1 = setTimeout(() => {
      setIsScary(false)
      setIsHiding(false)
      isTransitioning.current = false
    }, 300)
    timeoutRefs.current.push(t1)
  }, [isScary])

  // Track mouse movement on document
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const isNear = isMouseNearGhost(e.clientX, e.clientY)
      
      if (isNear && !isScary && !isTransitioning.current) {
        triggerScary()
      } else if (!isNear && isScary && !isTransitioning.current) {
        resetToHappy()
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => document.removeEventListener("mousemove", handleMouseMove)
  }, [isMouseNearGhost, isScary, triggerScary, resetToHappy])

  return (
    <div
      ref={ghostRef}
      className={`absolute pointer-events-none ${className}`}
    >
      {/* Ghost Image */}
      <div
        className={`
          w-full h-full transition-all duration-300 ease-in-out
          ${isHiding ? "opacity-0 scale-75 -translate-x-4" : "opacity-100 scale-100 translate-x-0"}
          ${isScary && !isHiding ? "-translate-x-6 sm:-translate-x-8 md:-translate-x-10" : ""}
        `}
        style={{
          animation: !isHiding && !isScary ? "subtleBounce 10s ease-in-out infinite" : "none",
        }}
      >
        <Image
          src={isScary ? "/halloween assets/Scary Ghost.webp" : "/halloween assets/Happy Ghost.webp"}
          alt={isScary ? "Scary Ghost" : "Happy Ghost peeking"}
          width={112}
          height={112}
          className={`
            w-full h-full object-contain drop-shadow-2xl transition-all duration-300
            ${isScary ? "scale-110" : ""}
          `}
          style={{
            filter: isScary
              ? "drop-shadow(0 0 20px rgba(255, 50, 50, 0.6)) drop-shadow(0 0 40px rgba(255, 0, 0, 0.4))"
              : "drop-shadow(0 8px 24px rgba(255, 255, 255, 0.3))",
          }}
        />
      </div>

      {/* "Boo!" Text Animation */}
      {showBoo && (
        <div
          className="absolute -left-16 sm:-left-20 top-1/2 -translate-y-1/2 pointer-events-none z-50"
          style={{
            animation: "booAppear 0.5s ease-out forwards",
          }}
        >
          <span
            className="text-xl sm:text-2xl font-bold text-red-500 whitespace-nowrap"
            style={{
              textShadow: "0 0 10px rgba(255, 50, 50, 0.8), 0 0 20px rgba(255, 0, 0, 0.5)",
              fontFamily: "var(--font-creepster), cursive",
            }}
          >
            Boo!
          </span>
        </div>
      )}
    </div>
  )
}
