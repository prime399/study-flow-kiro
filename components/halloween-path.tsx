"use client"

import { cn } from "@/lib/utils"

interface HalloweenPathProps {
  className?: string
}

export function HalloweenPath({ className }: HalloweenPathProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none hidden lg:block z-0 overflow-visible", className)}>
      <svg 
        className="w-full h-full opacity-60" 
        preserveAspectRatio="none" 
        viewBox="0 0 100 100"
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff4500" stopOpacity="0" />
            <stop offset="15%" stopColor="#ff4500" stopOpacity="0.6" />
            <stop offset="40%" stopColor="#9333ea" stopOpacity="0" />
            <stop offset="60%" stopColor="#ff4500" stopOpacity="0" />
            <stop offset="85%" stopColor="#ff4500" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff4500" stopOpacity="0" />
          </linearGradient>
          
          <filter id="glow-path">
            <feGaussianBlur stdDeviation="0.4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Main vertical trunk from top title */}
        <path 
          d="M50 0 L50 10" 
          stroke="url(#path-gradient)" 
          strokeWidth="0.3" 
          fill="none"
          filter="url(#glow-path)"
        />
        
        {/* Node at split */}
        <circle cx="50" cy="10" r="0.4" fill="#ff4500" filter="url(#glow-path)" />
        
        {/* Branch to Left Card - Top Segment */}
        <path 
          d="M50 10 C 50 15, 16.6 15, 16.6 25 L 16.6 30" 
          stroke="url(#path-gradient)" 
          strokeWidth="0.3" 
          fill="none"
          strokeDasharray="1 1"
          filter="url(#glow-path)"
        />

        {/* Center Branch - Top Segment */}
        <path 
          d="M50 10 L 50 30" 
          stroke="url(#path-gradient)" 
          strokeWidth="0.3" 
          fill="none"
          filter="url(#glow-path)"
        />

        {/* Branch to Right Card - Top Segment */}
        <path 
          d="M50 10 C 50 15, 83.3 15, 83.3 25 L 83.3 30" 
          stroke="url(#path-gradient)" 
          strokeWidth="0.3" 
          fill="none"
          strokeDasharray="1 1"
          filter="url(#glow-path)"
        />
        
        {/* Bottom Segments - Emerges from below cards */}
        
        {/* Left Bottom */}
        <path 
          d="M16.6 80 L 16.6 85 C 16.6 90, 50 90, 50 95" 
          stroke="url(#path-gradient)" 
          strokeWidth="0.3" 
          fill="none"
          strokeDasharray="1 1"
          filter="url(#glow-path)"
        />

        {/* Center Bottom */}
        <path 
          d="M50 80 L 50 95" 
          stroke="url(#path-gradient)" 
          strokeWidth="0.3" 
          fill="none"
          filter="url(#glow-path)"
        />

        {/* Right Bottom */}
        <path 
          d="M83.3 80 L 83.3 85 C 83.3 90, 50 90, 50 95" 
          stroke="url(#path-gradient)" 
          strokeWidth="0.3" 
          fill="none"
          strokeDasharray="1 1"
          filter="url(#glow-path)"
        />

        {/* Merge Node */}
        <circle cx="50" cy="95" r="0.4" fill="#ff4500" filter="url(#glow-path)" />
        
        {/* Final Path to CTA */}
        <path 
          d="M50 95 L 50 100" 
          stroke="url(#path-gradient)" 
          strokeWidth="0.3" 
          fill="none"
          filter="url(#glow-path)"
        />
      </svg>
    </div>
  )
}
