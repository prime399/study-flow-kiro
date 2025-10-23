import GoToActionButton from "@/components/go-to-action-button"
import Logo from "@/components/logo"
import Header from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Meteors from "@/components/ui/meteors"
import { Highlighter } from "@/components/ui/highlighter"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { Marquee } from "@/components/ui/marquee"
import {
  BarChart,
  BookOpen,
  Clock,
  Github,
  LineChart,
  Star,
  Target,
  Timer,
  Trophy,
  Users,
  Zap,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const features = [
  {
    icon: <Timer className="h-12 w-12" />,
    title: "Focus Timer",
    description: "Customizable study sessions with break reminders",
    badge: "Popular",
  },
  {
    icon: <Trophy className="h-12 w-12" />,
    title: "Competitive Learning",
    description: "Global and group-based leaderboards",
  },
  {
    icon: <Users className="h-12 w-12" />,
    title: "Study Groups",
    description: "Create and join study groups for collaborative learning",
    badge: "New",
  },
  {
    icon: <BarChart className="h-12 w-12" />,
    title: "Progress Analytics",
    description: "Detailed insights into your study patterns",
  },
  {
    icon: <Target className="h-12 w-12" />,
    title: "Goal Setting",
    description: "Set and track daily and weekly study goals",
  },
  {
    icon: <Zap className="h-12 w-12" />,
    title: "Achievements",
    description: "Earn rewards for consistent study habits",
  },
]

const stats = [
  {
    value: "5,000+",
    label: "Active Students",
    icon: <Users className="h-4 w-4" />,
  },
  {
    value: "500K+",
    label: "Study Hours",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    value: "2,500+",
    label: "Study Groups",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    value: "25+",
    label: "Universities",
    icon: <Star className="h-4 w-4" />,
  },
]

const testimonials = [
  {
    name: "Sarah Chen",
    username: "@sarahc_studies",
    body: "StudyFlow helped me improve my GPA from 3.2 to 3.8 in just one semester. The focus timer is a game-changer!",
    img: "https://avatar.vercel.sh/sarah",
  },
  {
    name: "Marcus Rodriguez",
    username: "@marcus_learns",
    body: "The study groups feature connected me with amazing peers. We motivated each other to achieve our goals.",
    img: "https://avatar.vercel.sh/marcus",
  },
  {
    name: "Emily Watson",
    username: "@emily_achieves",
    body: "I love the progress analytics. Seeing my study patterns helped me optimize my learning schedule.",
    img: "https://avatar.vercel.sh/emily",
  },
  {
    name: "David Kim",
    username: "@david_studies",
    body: "The competitive leaderboards make studying fun! I never thought I'd be excited about study sessions.",
    img: "https://avatar.vercel.sh/david",
  },
  {
    name: "Lisa Thompson",
    username: "@lisa_learns",
    body: "StudyFlow's goal setting feature keeps me accountable. I've been more consistent than ever before.",
    img: "https://avatar.vercel.sh/lisa",
  },
  {
    name: "Alex Johnson",
    username: "@alex_focus",
    body: "The AI-powered insights helped me identify my most productive study times. Brilliant!",
    img: "https://avatar.vercel.sh/alex",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Midnight Mist */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 100%, rgba(70, 85, 110, 0.5) 0%, transparent 60%),
            radial-gradient(circle at 50% 100%, rgba(99, 102, 241, 0.4) 0%, transparent 70%),
            radial-gradient(circle at 50% 100%, rgba(181, 184, 208, 0.3) 0%, transparent 80%)
          `,
        }}
      />
      
      <div className="flex min-h-screen flex-col relative z-10">
        <Header />
        <header className="sticky top-0 z-50 hidden w-full border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-sm md:block">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between w-full">
              <Logo />
              <GoToActionButton />
            </div>
          </div>
        </header>

        <main className="relative flex-1">

        <section className="relative mx-auto space-y-6 sm:space-y-8 py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 z-20">
          {/* <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
            <Meteors number={4} />
          </div> */}
          <div className="mx-auto flex max-w-[64rem] flex-col items-center gap-6 sm:gap-8 text-center relative z-20">
            <h1 className="text-pretty text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white leading-tight">
              Study. Connect. <Highlighter 
                action="highlight" 
                color="#6366f1" 
                strokeWidth={1}
                animationDuration={1200}
                isView={true}
                padding={1}
              >
                Achieve.
              </Highlighter>
            </h1>
            <p className="max-w-[42rem] leading-normal text-gray-300 text-base sm:text-lg lg:text-xl lg:leading-8 px-4">
              Your intelligent study companion. Track progress, collaborate with peers, 
              and unlock your academic potential with AI-powered insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 items-center justify-center">
              <Link href="/dashboard">
                <InteractiveHoverButton className="rounded-full bg-blue-600 hover:bg-white text-white border-blue-600 text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8">
                  Get Started
                </InteractiveHoverButton>
              </Link>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full sm:size-lg text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8"
                asChild
              >
                <Link
                  href={"http://github.com/prime399/study-flow/"}
                  target="_blank"
                >
                  <Github className="h-3 w-3 sm:h-4 sm:w-4" />
                  Github
                </Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 px-4">
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
            <div className="relative w-full rounded-[12px] border border-white/10 shadow-xl overflow-hidden bg-white/5 backdrop-blur-sm">
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

        {/* Meteors Section */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Meteors number={10} />
        </div>

        <section className="mx-auto py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
          <div className="mb-12 sm:mb-16 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl xl:text-5xl text-white mb-4 sm:mb-6">
              Everything you need to excel
            </h2>
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed px-4">
              Comprehensive tools designed for serious students who want to maximize their potential
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
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

        <section className="py-12 sm:py-16 lg:py-20 w-full">
          <div className="w-full">
            <div className="text-center mb-8 sm:mb-12 px-4">
              <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl xl:text-5xl text-white mb-4 sm:mb-6">
                What Students Are Saying
              </h2>
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
                Join thousands of students who have transformed their study habits with StudyFlow
              </p>
            </div>
            
            <div className="overflow-hidden">
              <Marquee pauseOnHover className="[--duration:60s] py-2 sm:py-4">
                {testimonials.map((review, idx) => (
                  <div
                    key={idx}
                    className="mx-2 sm:mx-4 w-72 sm:w-80 md:w-96 rounded-xl border border-white/20 bg-white/[0.08] backdrop-blur-md p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-white/30"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <Image
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-white/20 shadow-md"
                        src={review.img}
                        alt={`${review.name} avatar`}
                        width={48}
                        height={48}
                      />
                      <div>
                        <div className="text-sm sm:text-base font-semibold text-white">
                          {review.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">
                          {review.username}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                      &ldquo;{review.body}&rdquo;
                    </p>
                  </div>
                ))}
              </Marquee>
              
              <Marquee reverse pauseOnHover className="[--duration:60s] py-2 sm:py-4">
                {testimonials.slice().reverse().map((review, idx) => (
                  <div
                    key={idx}
                    className="mx-2 sm:mx-4 w-72 sm:w-80 md:w-96 rounded-xl border border-white/20 bg-white/[0.08] backdrop-blur-md p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-white/30"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <Image
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-white/20 shadow-md"
                        src={review.img}
                        alt={`${review.name} avatar`}
                        width={48}
                        height={48}
                      />
                      <div>
                        <div className="text-sm sm:text-base font-semibold text-white">
                          {review.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">
                          {review.username}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                      &ldquo;{review.body}&rdquo;
                    </p>
                  </div>
                ))}
              </Marquee>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 lg:py-20 xl:py-32">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200/50 shadow-lg">
              <div className="absolute inset-0 h-full w-full">
                <Meteors number={8} />
              </div>
              <div className="relative z-10 p-6 sm:p-8 lg:p-12 text-center flex flex-col items-center">
                <LineChart className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-800" />
                <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl lg:text-3xl xl:text-4xl mt-3 sm:mt-4 leading-tight">
                  Ready to Transform Your Study Habits?
                </h2>
                <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base lg:text-lg text-gray-600 px-4">
                  Join thousands of students who are already improving their
                  academic performance with StudyFlow.
                </p>
                <div className="mt-6 sm:mt-8 flex justify-center">
                  <Link href="/dashboard">
                    <InteractiveHoverButton className="rounded-full border-gray-900 bg-gray-900 text-white hover:bg-gray-800 text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8">
                      Start Your Journey
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
                © 2024 StudyFlow. All rights reserved.
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
