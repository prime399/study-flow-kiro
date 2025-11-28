"use client";

import { useEffect, useState } from "react";

interface DrippingTextProps {
  text: string;
  className?: string;
  color?: string; // Base color for the text (defaults to orange)
}

export function DrippingText({ text, className = "", color = "#fb923c" }: DrippingTextProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={`relative inline-block ${className}`}>
      {/* Main text - use the color directly, no gradient override */}
      <span
        className="relative z-10"
        style={{ color }}
      >
        {text}
      </span>
      
      {/* Subtle drip effects - fewer, smaller, more elegant */}
      <svg
        className="absolute left-0 top-full w-full overflow-visible opacity-60"
        style={{ height: "20px", marginTop: "-2px" }}
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
      >
        {/* Drip 1 - small */}
        <ellipse
          cx="15"
          cy="8"
          rx="1.5"
          ry="6"
          fill="url(#subtleDripGradient)"
          className="animate-drip-subtle-1"
        />
        {/* Drip 2 - medium */}
        <ellipse
          cx="52"
          cy="10"
          rx="1.2"
          ry="8"
          fill="url(#subtleDripGradient)"
          className="animate-drip-subtle-2"
        />
        {/* Drip 3 - tiny */}
        <ellipse
          cx="85"
          cy="6"
          rx="1"
          ry="4"
          fill="url(#subtleDripGradient)"
          className="animate-drip-subtle-3"
        />
        
        <defs>
          <linearGradient id="subtleDripGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>

      {/* Inline styles for animations */}
      <style jsx>{`
        @keyframes subtleDrip {
          0%, 100% {
            transform: scaleY(0);
            opacity: 0;
          }
          15% {
            opacity: 0.6;
          }
          40% {
            transform: scaleY(1);
            opacity: 0.6;
          }
          70% {
            transform: scaleY(0.8);
            opacity: 0.4;
          }
          90% {
            transform: scaleY(0.2);
            opacity: 0;
          }
        }
        
        .animate-drip-subtle-1 {
          transform-origin: top;
          animation: subtleDrip 4s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        
        .animate-drip-subtle-2 {
          transform-origin: top;
          animation: subtleDrip 5s ease-in-out infinite;
          animation-delay: 2s;
        }
        
        .animate-drip-subtle-3 {
          transform-origin: top;
          animation: subtleDrip 4.5s ease-in-out infinite;
          animation-delay: 3.5s;
        }
      `}</style>
    </span>
  );
}
