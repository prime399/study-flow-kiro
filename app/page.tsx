"use client"

import GoToActionButton from "@/components/go-to-action-button"
import Logo from "@/components/logo"
import Header from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Meteors from "@/components/ui/meteors"
import { Highlighter } from "@/components/ui/highlighter"
import { DrippingText } from "@/components/dripping-text"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { Marquee } from "@/components/ui/marquee"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { SpookyGhost } from "@/components/spooky-ghost"
import { cn } from "@/lib/utils"
import {
  BarChart,
  BookOpen,
  Check,
  Clock,
  Crown,
  Github,
  Key,
  Rocket,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  Users,
  Zap,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Suspense } from "react"

// Loading placeholder for 3D model
function ModelLoadingPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
    </div>
  )
}

// Dynamically import ThreeHeroModel with SSR disabled
const ThreeHeroModel = dynamic(
  () => import("@/components/three-hero-model").then((mod) => mod.ThreeHeroModel),
  {
    ssr: false,
    loading: () => <ModelLoadingPlaceholder />,
  }
)

const features = [
  {
    icon: <Timer className="h-12 w-12" />,
    title: "Ghost Mode Timer",
    description: "Haunting hourglass with dripping sand & ghost particles floating during sessions",
    badge: "Spooky",
  },
  {
    icon: <Trophy className="h-12 w-12" />,
    title: "Undead Leaderboard",
    description: "Become spirits competing to escape the haunted library",
  },
  {
    icon: <Users className="h-12 w-12" />,
    title: "Coven Groups",
    description: "Summon your study coven for collaborative dark academia sessions",
    badge: "New",
  },
  {
    icon: <BarChart className="h-12 w-12" />,
    title: "Graveyard Analytics",
    description: "Study stats displayed as tombstones in a misty graveyard",
  },
  {
    icon: <Target className="h-12 w-12" />,
    title: "Potion Progress",
    description: "Track goals as bubbling cauldrons filling with glowing liquid",
  },
  {
    icon: <Zap className="h-12 w-12" />,
    title: "Cursed Achievements",
    description: "Unlock dark relics and haunted badges for your dedication",
  },
]

const stats = [
  {
    value: "5,000+",
    label: "Haunted Souls",
    icon: <Users className="h-4 w-4" />,
  },
  {
    value: "500K+",
    label: "Midnight Hours",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    value: "2,500+",
    label: "Study Covens",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    value: "25+",
    label: "Haunted Halls",
    icon: <Star className="h-4 w-4" />,
  },
]

const testimonials = [
  {
    name: "Sarah Chen",
    username: "@sarahc_haunted",
    body: "The Ghost Mode Timer kept me focused through the witching hours. My GPA rose from the dead - 3.2 to 3.8!",
    img: "https://avatar.vercel.sh/sarah",
  },
  {
    name: "Marcus Rodriguez",
    username: "@marcus_spirit",
    body: "My study coven and I escaped the haunted library together. The Undead Leaderboard keeps us competing!",
    img: "https://avatar.vercel.sh/marcus",
  },
  {
    name: "Emily Watson",
    username: "@emily_phantom",
    body: "The Graveyard Analytics revealed my study patterns from beyond. Now I know my most powerful midnight hours.",
    img: "https://avatar.vercel.sh/emily",
  },
  {
    name: "David Kim",
    username: "@david_specter",
    body: "Racing to the top of the Undead Leaderboard is addictive! Never thought I'd be excited to haunt the library.",
    img: "https://avatar.vercel.sh/david",
  },
  {
    name: "Lisa Thompson",
    username: "@lisa_wraith",
    body: "Watching my Potion Progress bars fill with glowing liquid keeps me brewing knowledge every night.",
    img: "https://avatar.vercel.sh/lisa",
  },
  {
    name: "Alex Johnson",
    username: "@alex_ghost",
    body: "The Librarian Ghost AI whispered secrets about my most productive study times. Eerily brilliant!",
    img: "https://avatar.vercel.sh/alex",
  },
]

const pricingTiers = [
  {
    name: "Apprentice",
    price: "$0",
    period: "moon",
    description: "Begin your journey into the haunted library",
    icon: Sparkles,
    earlyBird: true,
    features: [
      "Basic dark rituals",
      "Limited spirit selection",
      "20 séances monthly",
      "Ghost Mode timer & cauldron tracking",
      "Coven community access",
    ],
    cta: "Enter the Crypt",
    popular: false,
  },
  {
    name: "Warlock",
    price: "$9",
    period: "moon",
    description: "Unlock powerful dark academia enchantments",
    icon: Rocket,
    discount: "Most Haunted",
    earlyBird: true,
    features: [
      "Spotify & Calendar summoning",
      "Advanced Librarian Ghost AI",
      "100 séances monthly",
      "Graveyard Analytics unlocked",
      "Priority spectral support",
      "Forbidden API access",
    ],
    cta: "Begin the Ritual",
    popular: true,
  },
  {
    name: "Necromancer",
    price: "$19",
    period: "moon",
    description: "Bring your own cursed key for limitless power",
    icon: Key,
    note: "Blood Pact Required",
    earlyBird: true,
    features: [
      "Your own OpenAI or Anthropic grimoire",
      "Unlimited séances (soul-metered)",
      "Granular curse controls",
      "Potion usage & cost visibility",
      "Coven-level access policies",
      "Dedicated necromancy support",
    ],
    cta: "Bind Your Soul",
    popular: false,
  },
  {
    name: "Immortal",
    price: "Custom",
    period: "",
    description: "For those who seek eternal knowledge",
    icon: Crown,
    earlyBird: false,
    features: [
      "All dark powers unlocked",
      "Eternal updates from beyond",
      "Unlimited Librarian Ghost queries",
      "Export your haunted progress",
      "White-shroud implementation",
      "Priority phantom support",
    ],
    cta: "Claim Immortality",
    popular: false,
  },
]

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-black relative overflow-x-hidden">
      {/* Midnight Mist */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 100%, rgba(70, 85, 110, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 50% 100%, rgba(99, 102, 241, 0.12) 0%, transparent 70%),
            radial-gradient(circle at 50% 100%, rgba(181, 184, 208, 0.08) 0%, transparent 80%)
          `,
        }}
      />
      
      <div className="flex min-h-screen flex-col relative z-10 overflow-x-hidden">
        <Header />
        <header className="sticky top-0 z-50 hidden w-full border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-sm md:block">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between w-full">
              <Logo />
              <GoToActionButton />
            </div>
          </div>
        </header>

        <main className="relative flex-1 overflow-x-hidden">

        <section className="relative mx-auto py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
          {/* Halloween themed background - spans full hero section */}
          <div 
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 90% 70% at 70% 30%, rgba(255, 80, 0, 0.25) 0%, transparent 55%),
                radial-gradient(ellipse 70% 50% at 80% 50%, rgba(180, 60, 10, 0.18) 0%, transparent 45%),
                radial-gradient(ellipse 60% 55% at 60% 40%, rgba(120, 40, 140, 0.12) 0%, transparent 50%),
                radial-gradient(ellipse 100% 100% at 70% 60%, rgba(15, 5, 25, 0.7) 0%, transparent 70%),
                radial-gradient(ellipse 80% 50% at 60% 100%, rgba(255, 100, 0, 0.2) 0%, transparent 70%),
                radial-gradient(ellipse 60% 40% at 70% 95%, rgba(80, 20, 100, 0.1) 0%, transparent 60%)
              `,
            }}
          />
          {/* Animated fog/mist effect */}
          <div 
            className="pointer-events-none absolute inset-0 opacity-40 animate-pulse"
            style={{
              background: `
                radial-gradient(ellipse 50% 40% at 75% 25%, rgba(130, 50, 160, 0.25) 0%, transparent 55%),
                radial-gradient(ellipse 45% 35% at 85% 60%, rgba(255, 120, 40, 0.2) 0%, transparent 50%),
                radial-gradient(ellipse 40% 30% at 65% 80%, rgba(255, 60, 0, 0.18) 0%, transparent 45%)
              `,
              animationDuration: "4s",
            }}
          />
          {/* Meteors for mobile/tablet only */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
            <Meteors number={4} />
          </div>
          
          {/* Two-column grid layout: text left, 3D model right on desktop */}
          <div className="mx-auto max-w-[80rem] grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left column: Text content */}
            <div className="flex flex-col items-center lg:items-start gap-6 sm:gap-8 text-center lg:text-left relative z-10">
              <h1 className="text-pretty text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white leading-tight">
                Study. Haunt. <span className="lg:hidden"><Highlighter 
                  action="highlight" 
                  color="#ff4500" 
                  strokeWidth={1}
                  animationDuration={1200}
                  isView={true}
                  padding={1}
                >
                  <span className="font-[family-name:var(--font-creepster)] text-orange-400">Survive.</span>
                </Highlighter></span><span className="hidden lg:inline"><DrippingText text="Survive." className="font-[family-name:var(--font-creepster)] text-orange-400" /></span>
              </h1>
              <p className="max-w-[42rem] leading-normal text-gray-300 text-base sm:text-lg lg:text-xl lg:leading-8">
                Your haunted study companion. Summon the Librarian Ghost, join your coven, 
                and escape the haunted library with AI-powered dark academia insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 items-center lg:items-start justify-center lg:justify-start">
                <Link href="/dashboard">
                  <InteractiveHoverButton className="rounded-full bg-red-700 hover:bg-amber-500 text-white border-red-700 hover:border-amber-500 text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8">
                    Get Started
                  </InteractiveHoverButton>
                </Link>
                <Button
                  variant="outline"
                  className="rounded-full text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8 h-auto"
                  asChild
                >
                  <Link
                    href={"http://github.com/prime399/study-flow/"}
                    target="_blank"
                  >
                    <Github className="h-4 w-4 sm:h-5 sm:w-5" />
                    Github
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Right column: 3D Model (desktop only) */}
            <div className="hidden lg:block relative h-[480px] xl:h-[580px]">
              <Suspense fallback={<ModelLoadingPlaceholder />}>
                <ThreeHeroModel className="w-full h-full" />
              </Suspense>
            </div>
          </div>
          
          {/* Stats section */}
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 px-4 mt-12 sm:mt-16">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1 sm:gap-2 p-3 sm:p-4">
                <div className="flex items-center gap-1 sm:gap-2 text-white">
                  {stat.icon}
                  <span className="text-lg sm:text-xl lg:text-2xl font-bold">{stat.value}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 text-center">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto max-w-5xl p-2 sm:p-4">
            <div className="relative w-full rounded-[12px] border border-white/10 shadow-xl overflow-visible bg-white/5 backdrop-blur-sm">

              {/* Happy Ghost - Peeking from behind left middle */}
              <SpookyGhost className="-left-6 sm:-left-8 md:-left-10 lg:-left-12 top-1/2 -translate-y-1/2 z-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28" />

              {/* Grim Reaper - Bottom Right */}
              <div className="absolute -bottom-8 -right-8 sm:-bottom-12 sm:-right-12 md:-bottom-16 md:-right-16 z-20 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56">
                <Image
                  src="/halloween assets/Grim Reaper Halloween.webp"
                  alt="Grim Reaper"
                  width={224}
                  height={224}
                  className="w-full h-full object-contain drop-shadow-2xl"
                  style={{
                    filter: 'drop-shadow(0 10px 30px rgba(255, 69, 0, 0.5))',
                  }}
                />
              </div>
              
              <div className="relative w-full">
                <Image
                  src="/main-dashboard.webp"
                  alt="StudyFlow Dashboard Preview"
                  width={1200}
                  height={800}
                  className="w-full h-auto object-contain rounded-[12px]"
                  priority
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
          <div className="mb-12 sm:mb-16 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl xl:text-5xl text-white mb-4 sm:mb-6">
              Dark tools to escape the crypt
            </h2>
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed px-4">
              Haunted features for dedicated spirits who dare to master the dark academia arts
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto w-full">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative p-6 sm:p-8 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:bg-white/[0.04] hover:border-white/10"
              >
                <div className="mb-4 sm:mb-6">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 text-white/70 group-hover:text-white group-hover:bg-white/10 transition-all duration-300">
                    {feature.icon}
                  </div>
                  {feature.badge && (
                    <Badge variant="secondary" className="mt-2 bg-white/10 text-white/80 border-white/20 text-xs">
                      {feature.badge}
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12 sm:py-16 lg:py-20 w-full overflow-hidden">
          <div className="w-full">
            <div className="text-center mb-8 sm:mb-12 px-4">
              <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl xl:text-5xl text-white mb-4 sm:mb-6">
                Whispers from the Haunted Library
              </h2>
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
                Join thousands of spirits who have escaped academic purgatory with StudyFlow
              </p>
            </div>

            {/* Mobile: Horizontal Scroll */}
            <div className="md:hidden px-4">
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4">
                {testimonials.map((review, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 w-[85vw] max-w-sm snap-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <Image
                          className="h-11 w-11 rounded-full border-2 border-white/10 ring-2 ring-white/5 object-cover"
                          src={review.img}
                          alt={`${review.name} avatar`}
                          width={56}
                          height={56}
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-black" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white tracking-tight">
                          {review.name}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {review.username}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed font-light">
                      &ldquo;{review.body}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: Auto-play Marquee */}
            <div className="hidden md:block overflow-x-hidden">
              <Marquee pauseOnHover repeat={6} className="[--duration:60s] py-2 sm:py-4">
                {testimonials.map((review, idx) => (
                  <div
                    key={idx}
                    className="mx-2 sm:mx-4 w-72 sm:w-80 md:w-96 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 sm:p-7 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.6)] transition-all duration-500 hover:border-white/20 hover:bg-white/[0.05] hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                      <div className="relative">
                        <Image
                          className="h-11 w-11 sm:h-14 sm:w-14 rounded-full border-2 border-white/10 ring-2 ring-white/5 object-cover"
                          src={review.img}
                          alt={`${review.name} avatar`}
                          width={56}
                          height={56}
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-green-500 border-2 border-black" />
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-semibold text-white tracking-tight">
                          {review.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 font-medium">
                          {review.username}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light">
                      &ldquo;{review.body}&rdquo;
                    </p>
                  </div>
                ))}
              </Marquee>

              <Marquee reverse pauseOnHover repeat={6} className="[--duration:60s] py-2 sm:py-4">
                {testimonials.slice().reverse().map((review, idx) => (
                  <div
                    key={idx}
                    className="mx-2 sm:mx-4 w-72 sm:w-80 md:w-96 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 sm:p-7 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.6)] transition-all duration-500 hover:border-white/20 hover:bg-white/[0.05] hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                      <div className="relative">
                        <Image
                          className="h-11 w-11 sm:h-14 sm:w-14 rounded-full border-2 border-white/10 ring-2 ring-white/5 object-cover"
                          src={review.img}
                          alt={`${review.name} avatar`}
                          width={56}
                          height={56}
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-green-500 border-2 border-black" />
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-semibold text-white tracking-tight">
                          {review.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 font-medium">
                          {review.username}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light">
                      &ldquo;{review.body}&rdquo;
                    </p>
                  </div>
                ))}
              </Marquee>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
          <div className="mx-auto max-w-7xl w-full">
            <div className="text-center mb-12 sm:mb-16 px-4">
              <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl xl:text-5xl text-white mb-4 sm:mb-6">
                Choose your dark path
              </h2>
              <p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-3xl mx-auto">
                Select your level of power. All paths include a 14-night free haunting.
              </p>
            </div>
            
            <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 max-w-7xl mx-auto w-full">
              {pricingTiers.map((tier, i) => {
                const Icon = tier.icon
                const button = (
                  <Button
                    size="lg"
                    className={cn(
                      "relative z-10 w-full rounded-full text-sm sm:text-base py-2.5 sm:py-3 transition-colors duration-200",
                      tier.popular
                        ? "bg-white text-black hover:bg-slate-200"
                        : "border-white/20 text-white hover:border-white/40 hover:bg-white/10"
                    )}
                    variant={tier.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/dashboard">{tier.cta}</Link>
                  </Button>
                )

                return (
                  <div
                    key={i}
                    className={cn(
                      "relative flex h-full flex-col rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-8 md:p-10 transition-all duration-300 hover:-translate-y-2",
                      tier.popular
                        ? "border-white/40 bg-white/[0.06] shadow-[0_24px_80px_-24px_rgba(99,102,241,0.6)] hover:border-white/60"
                        : "hover:border-white/20 hover:bg-white/[0.04]"
                    )}
                  >
                    {tier.popular && (
                      <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 w-max">
                        <div className="relative inline-flex rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 p-[1.5px] shadow-[0_18px_48px_-18px_rgba(76,29,149,0.7)]">
                          <div className="absolute inset-0 rounded-full bg-white/20 blur-md" />
                          <span className="relative inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-black/85 px-3 sm:px-4 py-1 text-[0.6rem] sm:text-[0.65rem] font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-white whitespace-nowrap">
                            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-200 flex-shrink-0" />
                            <span>{tier.discount}</span>
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mb-6 sm:mb-8 flex flex-col">
                      {tier.earlyBird && (
                        <div className="mb-4 sm:mb-5 inline-flex items-center gap-1.5 sm:gap-2 self-start rounded-full bg-white text-black px-2.5 sm:px-3 py-1.5 text-[0.6rem] sm:text-[0.625rem] font-bold uppercase tracking-[0.12em] sm:tracking-[0.15em] shadow-[0_2px_8px_rgba(255,255,255,0.15)] border border-white/20">
                          <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">Early Bird · 100% OFF</span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "mb-4 sm:mb-6 inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl border border-white/10 text-white/80 transition-colors duration-300",
                          tier.popular ? "bg-white text-black" : "bg-white/5"
                        )}
                      >
                        <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-semibold text-white">{tier.name}</h3>
                      <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">{tier.price}</span>
                        {tier.period && <span className="text-xs sm:text-sm uppercase tracking-wide text-gray-500">/ {tier.period}</span>}
                      </div>
                      <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-400 leading-relaxed">
                        {tier.description}
                      </p>
                    </div>

                    <ul className="mb-8 sm:mb-10 space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-300">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 sm:gap-3">
                          <Check className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-green-400" />
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto">
                      {tier.note && (
                        <p className="mb-3 sm:mb-4 text-[0.6rem] sm:text-[0.65rem] font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-white/60">
                          {tier.note}
                        </p>
                      )}
                      {tier.popular ? (
                        <div className="relative isolate rounded-full p-[1.5px]">
                          <GlowingEffect
                            spread={40}
                            glow
                            disabled={false}
                            proximity={64}
                            inactiveZone={0.01}
                            borderWidth={1.5}
                            className="rounded-full"
                          />
                          {button}
                        </div>
                      ) : (
                        button
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 lg:py-20 xl:py-32 overflow-x-hidden">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 w-full">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black via-purple-950/30 to-orange-950/20 border border-orange-500/20">
              <div className="absolute inset-0 h-full w-full opacity-50">
                <Meteors number={12} color="orange" />
              </div>
              {/* Halloween gradient overlay */}
              <div 
                className="absolute inset-0"
                style={{
                  background: `
                    radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255, 80, 0, 0.15) 0%, transparent 60%),
                    radial-gradient(ellipse 60% 40% at 20% 20%, rgba(138, 43, 226, 0.1) 0%, transparent 50%),
                    radial-gradient(ellipse 60% 40% at 80% 30%, rgba(255, 100, 0, 0.1) 0%, transparent 50%)
                  `,
                }}
              />
              
              <div className="relative z-10 p-8 sm:p-12 lg:p-16 xl:p-20 text-center flex flex-col items-center">
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl xl:text-5xl leading-tight max-w-3xl">
                  Ready to Escape the Haunted Library?
                </h2>
                
                <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg lg:text-xl text-gray-300 leading-relaxed font-light">
                  Join thousands of spirits who are already conquering their
                  academic nightmares with StudyFlow.
                </p>
                
                <div className="mt-8 sm:mt-10 lg:mt-12 flex flex-col sm:flex-row gap-4 items-center justify-center">
                  <Link href="/dashboard">
                    <InteractiveHoverButton className="rounded-full bg-red-700 hover:bg-amber-500 text-white border-red-700 hover:border-amber-500 text-base sm:text-lg py-3 sm:py-4 px-8 sm:px-10 font-semibold transition-all duration-300">
                      Begin Your Haunting
                    </InteractiveHoverButton>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        </main>

        <footer className="relative border-t bg-[#0a0a0a]/80 backdrop-blur-sm border-white/5 w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
              <p className="text-sm text-gray-400">
                © 2025 StudyFlow. All rights reserved.
              </p>
              <Link
                href={"https://www.study-flow.tech/#"}
                className="text-sm text-gray-400 underline hover:text-white transition-colors"
                target="_blank"
              >
                Learn More
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
