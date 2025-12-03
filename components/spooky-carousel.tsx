"use client"

import { useRef, useState, useEffect } from "react"
import { useAnimationFrame } from "motion/react"
import { cn } from "@/lib/utils"

interface CarouselProps {
  children: React.ReactNode[]
  className?: string
}

export function SpookyCarousel({ children, className }: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<(HTMLDivElement | null)[]>([])
  const [width, setWidth] = useState(1000)

  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })
    
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useAnimationFrame((t) => {
    if (!itemsRef.current.length) return

    const count = children.length
    // Slower rotation: t is milliseconds. Divide by larger number for slower speed.
    // t / 50 is decent speed. 
    const rotationOffset = t / 5000 * Math.PI * 2 // 5 seconds per radian? No, that's slow. 
    // Let's try to complete a full circle in roughly 40s like the marquee
    // 40s = 40000ms. 2PI / 40000 * t
    
    const speed = 0.00015 // Tuned for gentle float
    const angleBase = t * speed

    // Responsive radii
    const isMobile = width < 640
    const isTablet = width < 1024 && width >= 640

    const xRadius = isMobile 
        ? width / 1.2  // Wider on mobile relative to screen
        : isTablet 
            ? width / 1.5 
            : width / 2.0

    const zRadius = isMobile ? 60 : isTablet ? 90 : 120
    const baseScale = isMobile ? 0.6 : 0.75 // Smaller cards on mobile

    itemsRef.current.forEach((item, i) => {
      if (!item) return

      const rawAngle = angleBase + (i / count) * Math.PI * 2
      
      // Non-linear angle distortion to increase density at the front (z > 0)
      // Front is at angle = PI/2 (sin(PI/2) = 1)
      // We want the slope of angle change to be LOWER at PI/2 (so items move slower/bunch up)
      // We use: angle = raw + k * cos(raw)
      // Derivative d(angle)/d(raw) = 1 - k * sin(raw)
      // At PI/2, sin=1, slope = 1-k (min) -> High density
      // At 3PI/2, sin=-1, slope = 1+k (max) -> Low density
      const distortionStrength = 0.4
      const angle = rawAngle + distortionStrength * Math.cos(rawAngle)
      
      const x = Math.cos(angle) * xRadius
      const z = Math.sin(angle) * zRadius
      
      // Calculate depth properties
      // Normalize Z from [-zRadius, zRadius] to [0, 1]
      // 1 is front (closest), 0 is back (farthest)
      const zNorm = (z + zRadius) / (2 * zRadius)
      
      // Blur: 0px at front, up to 6px at back
      // We use a non-linear ease so it stays sharp longer
      const blur = Math.pow(1 - zNorm, 2) * 8
      
      // Scale: 1.0 at front, baseScale at back
      // Mobile needs slightly different scaling curve to keep front item readable
      const scale = (baseScale + ((1 - baseScale) * zNorm))
      
      // Opacity: 1.0 at front, 0.4 at back
      const opacity = 0.4 + (0.6 * zNorm)
      
      // Apply styles directly for performance
      item.style.transform = `translate3d(${x}px, 0, ${z}px) scale(${scale})`
      item.style.zIndex = Math.round(z).toString()
      item.style.filter = `blur(${blur}px)`
      item.style.opacity = opacity.toString()
    })
  })

  return (
    <div 
      ref={containerRef}
      className={cn("relative h-[300px] sm:h-[350px] md:h-[400px] w-full flex items-center justify-center perspective-[1000px] overflow-hidden sm:overflow-visible", className)}
    >
      {children.map((child, i) => (
        <div
          key={i}
          ref={(el) => {
            itemsRef.current[i] = el
          }}
          className="absolute will-change-transform backface-visible"
          style={{
            // Initial center position, animation moves it
            left: '50%',
            top: '50%',
            marginLeft: '-140px', // Mobile width default
            marginTop: '-100px', // Mobile height default
            width: '280px', // Default mobile width
          }}
        >
          <div className="w-full h-full sm:w-[320px] sm:-ml-[20px]">
             {child}
          </div>
        </div>
      ))}
    </div>
  )
}
