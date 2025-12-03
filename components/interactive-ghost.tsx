"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface InteractiveGhostProps {
  className?: string
}

export function InteractiveGhost({ className }: InteractiveGhostProps) {
  const ghostRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isFleeing, setIsFleeing] = useState(false)
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ghostRef.current) return

      const rect = ghostRef.current.getBoundingClientRect()
      const ghostCenterX = rect.left + rect.width / 2
      const ghostCenterY = rect.top + rect.height / 2

      // Calculate distance between mouse and ghost center
      const deltaX = e.clientX - ghostCenterX
      const deltaY = e.clientY - ghostCenterY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      const triggerDistance = 300 // Distance to start fleeing
      const maxFleeDistance = 400 // Max distance it will move away

      // Calculate eye movement (looking at mouse)
      // Limit eye movement radius
      const maxEyeOffset = 8 // Increased from 3 for more prominence
      const angle = Math.atan2(deltaY, deltaX)
      
      // Eyes follow mouse even when fleeing, but maybe less intensely? 
      // Actually standard behavior is fine, just clamped.
      // If distance is 0 (directly on top), don't move eyes wildly
      const eyeDistance = Math.min(distance / 15, maxEyeOffset)
      const eyeX = Math.cos(angle) * eyeDistance
      const eyeY = Math.sin(angle) * eyeDistance
      setEyePosition({ x: eyeX, y: eyeY })


      if (distance < triggerDistance) {
        setIsFleeing(true)
        // Calculate flee vector (opposite to mouse)
        // const angle = Math.atan2(deltaY, deltaX) // Already calculated
        const moveDistance = (1 - distance / triggerDistance) * maxFleeDistance
        
        // Move away from mouse
        const moveX = -Math.cos(angle) * moveDistance
        const moveY = -Math.sin(angle) * moveDistance

        setPosition({ x: moveX, y: moveY })
      } else {
        setIsFleeing(false)
        setPosition({ x: 0, y: 0 })
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div
      ref={ghostRef}
      className={cn(
        "absolute z-20 pointer-events-none transition-transform duration-300 ease-out will-change-transform",
        className
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <div className={cn(
        "relative w-16 h-16 md:w-24 md:h-24 transition-all duration-300",
        // Idle animation only when not fleeing
        !isFleeing && "animate-float" 
      )}>
        {/* Ghost Body */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            "w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-transform duration-200",
             isFleeing && "scale-110 skew-x-6" // Slight distortion when fleeing
          )}
        >
          <path
            d="M50 5C25.1472 5 5 25.1472 5 50V95L16.25 85L27.5 95L38.75 85L50 95L61.25 85L72.5 95L83.75 85L95 95V50C95 25.1472 74.8528 5 50 5Z"
            className={cn(
              "fill-white/90 transition-all duration-200 ease-linear",
              isFleeing && "animate-ghost-wobble"
            )}
          />
          
          {/* Eyes Container - Follows Mouse */}
          <g style={{ 
            transform: !isFleeing ? `translate(${eyePosition.x}px, ${eyePosition.y}px)` : undefined,
            transition: 'transform 0.1s ease-out'
          }}>
            {/* Blinking Container */}
            <g className={cn("transition-all duration-200", !isFleeing && "animate-blink")}>
              {isFleeing ? (
                // Squinting Eyes
                <>
                  <path d="M29 42 L41 38" stroke="black" strokeWidth="3" strokeLinecap="round" />
                  <path d="M29 38 L41 42" stroke="black" strokeWidth="3" strokeLinecap="round" />
                  
                  <path d="M59 42 L71 38" stroke="black" strokeWidth="3" strokeLinecap="round" />
                  <path d="M59 38 L71 42" stroke="black" strokeWidth="3" strokeLinecap="round" />
                </>
              ) : (
                // Normal Cute Eyes
                <>
                  <ellipse cx="35" cy="40" rx="6" ry="8" className="fill-black" />
                  <ellipse cx="65" cy="40" rx="6" ry="8" className="fill-black" />
                  <circle cx="37" cy="38" r="2" className="fill-white" />
                  <circle cx="67" cy="38" r="2" className="fill-white" />
                </>
              )}
            </g>
          </g>

          {/* Blush */}
          <ellipse cx="25" cy="55" rx="5" ry="3" className="fill-pink-300/40" />
          <ellipse cx="75" cy="55" rx="5" ry="3" className="fill-pink-300/40" />

          {/* Mouth */}
          {isFleeing ? (
             // Scared/Wobbly Mouth
             <path 
               d="M42 60 Q 50 55, 58 60" 
               stroke="black" 
               strokeWidth="2" 
               fill="none"
               className="animate-shiver"
             />
          ) : (
             // Cute small o mouth
             <circle cx="50" cy="55" r="3" className="fill-black" />
          )}
        </svg>
      </div>
      
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes blink {
          0%, 96%, 100% { transform: scaleY(1); }
          98% { transform: scaleY(0.1); }
        }
        @keyframes ghost-wobble {
          0% { d: path("M50 5C25.1472 5 5 25.1472 5 50V95L16.25 85L27.5 95L38.75 85L50 95L61.25 85L72.5 95L83.75 85L95 95V50C95 25.1472 74.8528 5 50 5Z"); }
          25% { d: path("M50 5C25.1472 5 5 25.1472 5 50V92L16.25 98L27.5 90L38.75 98L50 90L61.25 98L72.5 90L83.75 98L95 92V50C95 25.1472 74.8528 5 50 5Z"); }
          50% { d: path("M50 5C25.1472 5 5 25.1472 5 50V95L16.25 85L27.5 95L38.75 85L50 95L61.25 85L72.5 95L83.75 85L95 95V50C95 25.1472 74.8528 5 50 5Z"); }
          75% { d: path("M50 5C25.1472 5 5 25.1472 5 50V98L16.25 90L27.5 98L38.75 90L50 98L61.25 90L72.5 98L83.75 90L95 98V50C95 25.1472 74.8528 5 50 5Z"); }
          100% { d: path("M50 5C25.1472 5 5 25.1472 5 50V95L16.25 85L27.5 95L38.75 85L50 95L61.25 85L72.5 95L83.75 85L95 95V50C95 25.1472 74.8528 5 50 5Z"); }
        }
        @keyframes shiver {
            0% { transform: translateX(-1px); }
            50% { transform: translateX(1px); }
            100% { transform: translateX(-1px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-blink {
          transform-origin: center;
          animation: blink 4s infinite;
        }
        .animate-ghost-wobble {
          animation: ghost-wobble 0.4s linear infinite;
        }
        .animate-shiver {
            animation: shiver 0.1s linear infinite;
        }
      `}</style>
    </div>
  )
}
