import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatTimeTimer } from "@/lib/utils"
import { History } from "lucide-react"

export default function RecentSessions({ sessions, halloweenGlow = false }: { sessions: any[], halloweenGlow?: boolean }) {
  const formatType = (type?: string) =>
    type
      ? type
          .split(/[-_]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : "Study"
  return (
    <Card className={
        halloweenGlow
          ? "h-full transition-all duration-500 border-white/5 bg-gradient-to-br from-card/80 to-purple-900/10 backdrop-blur-md shadow-[0_0_20px_-5px_rgba(147,51,234,0.1)] hover:shadow-[0_0_30px_-5px_rgba(251,146,60,0.2)] hover:border-orange-500/30 hover:-translate-y-0.5"
          : "h-full"
      }>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="mr-2 h-5 w-5" /> Study History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session._id}
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <div>
                <p className="font-medium">{formatType(session.type)} Session</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(session.startTime).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatTimeTimer(session.duration)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {session.completed ? "Completed" : "Incomplete"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
