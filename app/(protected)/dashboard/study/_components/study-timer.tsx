import NumberFlow from "@number-flow/react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatTimeTimer } from "@/lib/utils"
import { Clock, Pause, Play, RotateCcw } from "lucide-react"
import { useTopsStore } from "@/store/use-tops-store"
import { useEffect } from "react"
import { HalloweenHourglass } from "./halloween-hourglass"

export default function StudyTimer({
  studyTime,
  studyDuration,
  studyType,
  studyTypeOptions,
  isStudying,
  onStudyTypeChange,
  onStartStop,
  onReset,
  halloweenGlow = false,
}: {
  studyTime: number
  studyDuration: number
  studyType: string
  studyTypeOptions: { value: string; label: string }[]
  isStudying: boolean
  onStudyTypeChange: (value: string) => void
  onStartStop: () => void
  onReset: () => void
  halloweenGlow?: boolean
}) {
  const { incrementTops, resetSessionTops } = useTopsStore()
  const progress = (studyTime / studyDuration) * 100
  const hours = Math.floor(studyTime / 3600)
  const minutes = Math.floor((studyTime % 3600) / 60)
  const seconds = studyTime % 60

  useEffect(() => {
    if (!isStudying) return

    const interval = setInterval(() => {
      incrementTops(1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isStudying, incrementTops])

  const handleReset = () => {
    resetSessionTops()
    onReset()
  }
  return (
    <Card className={
        halloweenGlow
          ? "border-2 transition-all duration-500 border-white/5 bg-gradient-to-br from-card/80 to-purple-900/10 backdrop-blur-md shadow-[0_0_20px_-5px_rgba(147,51,234,0.1)] hover:shadow-[0_0_30px_-5px_rgba(251,146,60,0.2)] hover:border-orange-500/30 hover:-translate-y-0.5"
          : "border-2"
      }>
      <CardHeader>
        <CardTitle className="flex items-center justify-center text-2xl font-gothic">
          <Clock className="mr-3 h-8 w-8" />
          Study Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {halloweenGlow && (
          <div className="flex justify-center mb-4">
            <HalloweenHourglass 
              progress={progress} 
              active={isStudying} 
              halloweenGlow={halloweenGlow}
            />
          </div>
        )}
        <div className="text-center text-7xl font-bold tracking-tighter">
          <div className="flex items-center justify-center">
            {hours > 0 && (
              <>
                <NumberFlow value={hours} />
                <span>:</span>
              </>
            )}
            <NumberFlow value={minutes} format={{ minimumIntegerDigits: 2 }} />
            <span>:</span>
            <NumberFlow value={seconds} format={{ minimumIntegerDigits: 2 }} />
          </div>
        </div>
        <Progress 
          value={Math.min(progress, 100)} 
          className={
            halloweenGlow
              ? "h-3 [&>div]:bg-gradient-to-r [&>div]:from-[#fb923c]/60 [&>div]:to-[#9333ea]/60 [&>div]:transition-all [&>div]:duration-1000 bg-primary/5"
              : "h-3"
          }
        />
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-muted-foreground">Study type</p>
          <div className="flex justify-center">
            <Select value={studyType} onValueChange={onStudyTypeChange}>
              <SelectTrigger className="w-56 capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {studyTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="capitalize">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={onStartStop} className="w-32">
            {isStudying ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start
              </>
            )}
          </Button>
          <Button
            size="lg"
            onClick={handleReset}
            variant="outline"
            className="w-32"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
