"use client"

import { motion, AnimatePresence } from "motion/react"
import { useEffect, useState } from "react"
import Logo from "@/components/logo"
import { cn } from "@/lib/utils"

interface LoadingScreenProps {
  isReady: boolean
}

export function LoadingScreen({ isReady }: LoadingScreenProps) {
  const [shouldRender, setShouldRender] = useState(true)

  useEffect(() => {
    if (isReady) {
      // Keep the loading screen for a minimum time or just wait for exit animation
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 800) // Wait for exit animation to finish visually
      return () => clearTimeout(timer)
    }
  }, [isReady])

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            filter: "blur(10px)",
            scale: 1.1,
            transition: { duration: 0.8, ease: "easeInOut" }
          }}
        >
          {/* Background Mist/Fog Effect */}
          <div className="absolute inset-0 overflow-hidden opacity-30">
            <div 
              className="absolute inset-0 animate-pulse"
              style={{
                background: `radial-gradient(circle at 50% 50%, #4c1d95 0%, transparent 60%)`,
                filter: 'blur(60px)',
                transform: 'scale(1.5)'
              }} 
            />
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col items-center gap-8"
          >
            {/* Logo with Glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
              <Logo />
            </div>

            {/* Loading Text & Progress */}
            <div className="flex flex-col items-center gap-3">
              <motion.p 
                className="text-gray-400 font-gothic text-lg tracking-wider"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Summoning the Library...
              </motion.p>
              
              {/* Progress Bar */}
              <div className="h-1 w-48 bg-gray-900 rounded-full overflow-hidden border border-white/10">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-600 via-orange-500 to-purple-600"
                  animate={{ 
                    x: ["-100%", "100%"],
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Spooky decorative elements */}
          <div className="absolute bottom-10 text-xs text-gray-600 font-mono">
            Establishing connection to the netherworld...
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
