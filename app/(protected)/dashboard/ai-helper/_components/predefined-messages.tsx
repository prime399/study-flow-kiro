"use client"
/**
 * Predefined message suggestions for The Librarian Ghost
 * Provides quick-start options with spooky Halloween theme
 */

import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

export const PREDEFINED_MESSAGES = [
  // Focus & Concentration
  "How can I improve my study focus and avoid distractions?",
  "What techniques can help me concentrate better during long study sessions?",
  "How do I deal with mental fatigue while studying?",
  
  // Study Techniques & Methods
  "What's the best study technique for me based on my study patterns?",
  "Should I use active recall or spaced repetition for better retention?",
  "How can I make my study sessions more effective and productive?",
  "What's the optimal study session length for maximum learning?",
  
  // Time Management & Planning
  "Help me create a personalized study schedule based on my habits",
  "How can I better manage my time between different subjects?",
  "What's the best way to prioritize my study topics?",
  "How do I balance study time with breaks for optimal performance?",
  
  // Performance Analysis
  "Analyze my study completion rate and suggest improvements",
  "What patterns in my study data should I be concerned about?",
  "How does my study performance compare to optimal practices?",
  "What are my biggest study challenges based on my statistics?",
  
  // Motivation & Habits
  "How can I stay motivated when my completion rate is low?",
  "What strategies help build consistent daily study habits?",
  "How do I overcome procrastination and study resistance?",
  "What rewards system would work best for my study goals?",
  
  // Health & Wellness
  "How can I prevent burnout while maintaining good study habits?",
  "What's the ideal balance between study time and rest?",
  "How does my current study schedule affect my well-being?",
  "Tips for maintaining energy levels throughout study sessions",
] as const

interface PredefinedMessagesProps {
  onMessageSelect: (message: string) => void
  isLoading: boolean
}

// Organize messages by category with spooky Halloween theme
const MESSAGE_CATEGORIES = [
  {
    title: "🔮 Focus & Concentration",
    messages: PREDEFINED_MESSAGES.slice(0, 3),
    color: "border-purple-300/50 hover:border-purple-400/70 dark:border-purple-700/50 dark:hover:border-purple-600/70",
  },
  {
    title: "📜 Ancient Study Techniques",
    messages: PREDEFINED_MESSAGES.slice(3, 7),
    color: "border-orange-300/50 hover:border-orange-400/70 dark:border-orange-700/50 dark:hover:border-orange-600/70",
  },
  {
    title: "⏳ Time Management Rituals",
    messages: PREDEFINED_MESSAGES.slice(7, 11),
    color: "border-violet-300/50 hover:border-violet-400/70 dark:border-violet-700/50 dark:hover:border-violet-600/70",
  },
  {
    title: "🕯️ Performance Divination",
    messages: PREDEFINED_MESSAGES.slice(11, 15),
    color: "border-amber-300/50 hover:border-amber-400/70 dark:border-amber-700/50 dark:hover:border-amber-600/70",
  },
  {
    title: "💀 Motivation & Habits",
    messages: PREDEFINED_MESSAGES.slice(15, 19),
    color: "border-rose-300/50 hover:border-rose-400/70 dark:border-rose-700/50 dark:hover:border-rose-600/70",
  },
  {
    title: "🌙 Health & Wellness",
    messages: PREDEFINED_MESSAGES.slice(19),
    color: "border-teal-300/50 hover:border-teal-400/70 dark:border-teal-700/50 dark:hover:border-teal-600/70",
  },
] as const

export function PredefinedMessages({ onMessageSelect, isLoading }: PredefinedMessagesProps) {
  const [showMore, setShowMore] = useState(false)
  
  // Primary categories to show by default
  const primaryCategories = MESSAGE_CATEGORIES.filter(cat => 
    cat.title.includes("Study Techniques") || cat.title.includes("Time Management")
  )
  
  // Additional categories to show in "View More"
  const additionalCategories = MESSAGE_CATEGORIES.filter(cat => 
    !cat.title.includes("Study Techniques") && !cat.title.includes("Time Management")
  )

  return (
    <div className="flex h-full flex-col items-center justify-start py-4 sm:py-8 text-center px-3 sm:px-6 overflow-y-auto">
      <div className="mb-6 sm:mb-8">
        <div className="relative mx-auto mb-3 sm:mb-4 h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-full ring-2 ring-purple-500/50 ring-offset-2 ring-offset-background shadow-lg shadow-purple-500/20 animate-pulse">
          <Image
            src="/skelton pfp.webp"
            alt="The Librarian Ghost"
            fill
            className="object-cover"
            priority
          />
        </div>
        <h3 className="mb-3 text-xl sm:text-2xl font-bold text-foreground font-gothic">
          The Librarian Ghost
        </h3>
        <p className="max-w-lg text-sm sm:text-base text-muted-foreground leading-relaxed italic">
          &quot;Ah, a seeker of knowledge enters my eternal library... 
          I have guided countless souls through their studies. 
          What wisdom do you seek from beyond the veil?&quot;
        </p>
      </div>
      
      <div className="w-full max-w-5xl space-y-6 sm:space-y-8">
        {/* Primary Categories */}
        {primaryCategories.map((category) => (
          <div key={category.title} className="space-y-3 sm:space-y-4">
            <h4 className="text-sm sm:text-base font-semibold text-foreground text-left px-1">
              {category.title}
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {category.messages.map((message) => (
                <Button
                  key={message}
                  variant="outline"
                  className={`h-auto whitespace-normal text-left text-sm sm:text-base p-4 transition-all hover:shadow-md ${category.color} leading-relaxed min-h-[3rem] font-medium`}
                  onClick={() => onMessageSelect(message)}
                  disabled={isLoading}
                >
                  {message}
                </Button>
              ))}
            </div>
          </div>
        ))}
        
        {/* View More Button */}
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            onClick={() => setShowMore(!showMore)}
            className="text-sm sm:text-base font-medium text-primary hover:text-primary/80 gap-2"
            disabled={isLoading}
          >
            {showMore ? (
              <>
                <ChevronUp className="h-4 w-4" />
                View Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                View More Topics
              </>
            )}
          </Button>
        </div>
        
        {/* Additional Categories */}
        {showMore && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {additionalCategories.map((category) => (
              <div key={category.title} className="space-y-3 sm:space-y-4">
                <h4 className="text-sm sm:text-base font-semibold text-foreground text-left px-1">
                  {category.title}
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {category.messages.map((message) => (
                    <Button
                      key={message}
                      variant="outline"
                      className={`h-auto whitespace-normal text-left text-sm sm:text-base p-4 transition-all hover:shadow-md ${category.color} leading-relaxed min-h-[3rem] font-medium`}
                      onClick={() => onMessageSelect(message)}
                      disabled={isLoading}
                    >
                      {message}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-6 sm:mt-8 space-y-3 text-center">
        <div className="text-sm text-muted-foreground px-2 font-medium italic">
          🕯️ Whisper your questions into the void for spectral guidance...
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs text-muted-foreground/80 px-2">
          <div className="flex items-center gap-1">
            <span>Haunted by</span>
            <span className="font-semibold text-purple-500">Heroku Inference and Agents</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <span>Ethereal Study Wisdom</span>
        </div>
      </div>
    </div>
  )
}