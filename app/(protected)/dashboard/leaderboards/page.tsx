"use client"
import PageTitle from "@/components/page-title"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/convex/_generated/api"
import { cn, formatDuration } from "@/lib/utils"
import { useQuery } from "convex/react"
import { Clock, Crown, Medal, Trophy, User, Users, TrendingUp, Zap, Target, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Ghost } from "lucide-react"
import { ReactNode, useState } from "react"
import { FloatingParticles } from "@/components/floating-particles"
import { SpookyGhost } from "@/components/spooky-ghost"
import { DrippingText } from "@/components/dripping-text"

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  email?: string
  avatar?: string
  totalStudyTime: number
}

interface LeaderboardCardProps {
  title: string
  description: string
  icon: ReactNode
  data: LeaderboardEntry[]
  pagination?: {
    currentPage: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  onPageChange?: (page: number) => void
}

function UndeadAvatar({ src, name, rank }: { src?: string, name: string, rank: number }) {
  const isTopRank = rank <= 3;
  
  return (
    <div className={cn("relative inline-block", isTopRank && "z-10")}>
      {isTopRank && (
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-purple-400/20 to-orange-400/20 rounded-full blur-sm" />
      )}
      <Avatar className={cn(
        "h-11 w-11 border-2 relative transition-transform duration-500",
        isTopRank 
          ? "border-purple-500/30 ring-2 ring-purple-500/20 scale-105" 
          : "border-background/50 shadow-sm"
      )}>
        <AvatarImage src={src} alt={name} className={cn(isTopRank && "sepia-[.1] brightness-110 contrast-110")} />
        <AvatarFallback className={cn(
          "font-bold text-base",
          isTopRank 
            ? "bg-purple-950/50 text-purple-200" 
            : "bg-muted text-muted-foreground"
        )}>
          {name[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {isTopRank && (
         <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
           {rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd"}
         </div>
      )}
    </div>
  )
}

function PersonalStatsCard({ userRanking }: { userRanking: any }) {
  const stats = [
    {
      label: "Soul Rank",
      value: userRanking.rank ? `#${userRanking.rank}` : "Lost Soul",
      icon: <Trophy className="h-4 w-4" />,
      bgColor: "bg-orange-500/5",
      iconColor: "text-orange-600 dark:text-orange-500",
      borderColor: "border-orange-500/10",
    },
    {
      label: "Haunt Time",
      value: formatDuration(userRanking.totalStudyTime || 0),
      icon: <Clock className="h-4 w-4" />,
      bgColor: "bg-purple-500/5",
      iconColor: "text-purple-600 dark:text-purple-500",
      borderColor: "border-purple-500/10",
    },
    {
      label: "Spirit Power",
      value: userRanking.rank && userRanking.rank <= 10 ? "Elite Ghost" : "Rising Spirit",
      icon: <Ghost className="h-4 w-4" />,
      bgColor: "bg-green-500/5",
      iconColor: "text-green-600 dark:text-green-500",
      borderColor: "border-green-500/10",
    },
  ]

  return (
    <Card className="border-border/40 bg-background/60 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg font-medium text-foreground">
          <div className="rounded-md bg-orange-500/10 p-2">
            <User className="h-5 w-5 text-orange-600 dark:text-orange-500" />
          </div>
          Your Haunt Stats
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Track your spectral presence and competition rank
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className={cn(
                "relative overflow-hidden transition-all duration-200 hover:bg-accent/50 border shadow-none",
                stat.bgColor,
                stat.borderColor
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-xl font-bold tracking-tight text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={cn("rounded-full p-2.5 bg-background/50", stat.iconColor)}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function LeaderboardCard({
  title,
  description,
  icon,
  data,
  pagination,
  onPageChange,
}: LeaderboardCardProps) {
  const getRankBadge = (rank: number) => {
    const badges = {
      1: { 
        icon: <Crown className="h-3.5 w-3.5" />, 
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
        textColor: "text-orange-600 dark:text-orange-400",
        borderColor: "border-orange-200 dark:border-orange-800/30"
      },
      2: { 
        icon: <Medal className="h-3.5 w-3.5" />, 
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
        textColor: "text-purple-600 dark:text-purple-400",
        borderColor: "border-purple-200 dark:border-purple-800/30"
      },
      3: { 
        icon: <Medal className="h-3.5 w-3.5" />, 
        bgColor: "bg-green-100 dark:bg-green-900/30",
        textColor: "text-green-600 dark:text-green-400",
        borderColor: "border-green-200 dark:border-green-800/30"
      },
    }
    return badges[rank as keyof typeof badges]
  }

  const getRowStyle = (rank: number) => {
    if (rank <= 3) {
      return "bg-gradient-to-r from-purple-500/5 to-transparent border-l-2 border-l-orange-500"
    }
    return "hover:bg-muted/40 transition-colors"
  }

  return (
    <Card className="border-border/40 bg-background/60 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-3 text-lg font-medium text-foreground">
              <div className="rounded-md bg-orange-500/10 p-2">
                {icon}
              </div>
              {title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground ml-12">
              {description}
            </CardDescription>
          </div>
          <Badge variant="outline" className="px-3 py-1 bg-background/50 font-normal">
            {data.length} Spirits
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b-border/40">
                <TableHead className="w-[100px] font-medium">Rank</TableHead>
                <TableHead className="font-medium">Spirit Name</TableHead>
                <TableHead className="text-right font-medium">Time in Limbo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((leader) => (
                <TableRow 
                  key={leader.userId}
                  className={cn(
                    "border-b-border/40",
                    getRowStyle(leader.rank)
                  )}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      {getRankBadge(leader.rank) ? (
                        <div
                          className={cn(
                            "rounded-full p-1.5 border shadow-sm",
                            getRankBadge(leader.rank)?.bgColor,
                            getRankBadge(leader.rank)?.borderColor
                          )}
                        >
                          <div className={getRankBadge(leader.rank)?.textColor}>
                            {getRankBadge(leader.rank)?.icon}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/30 text-xs font-medium text-muted-foreground">
                          {leader.rank}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <UndeadAvatar src={leader.avatar} name={leader.name} rank={leader.rank} />
                      <div>
                        <span className={cn("font-medium text-sm", leader.rank <= 3 ? "text-foreground" : "text-muted-foreground")}>
                          {leader.name}
                        </span>
                        {leader.rank <= 3 && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Ghost className="h-3 w-3 text-purple-500/70" />
                            <span className="text-[10px] text-purple-500/70 font-medium uppercase tracking-wider">Ancient Spirit</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <div className="space-y-0.5">
                      <div className={cn(
                        "text-sm font-semibold",
                        leader.rank <= 3 ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {formatDuration(leader.totalStudyTime)}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{((pagination.currentPage - 1) * pagination.pageSize) + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)}</span> of{" "}
                <span className="font-medium text-foreground">{pagination.totalCount}</span> spirits
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(1)}
                  disabled={!pagination.hasPrev}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="h-8 px-3"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = pagination.currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.currentPage === pageNum ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onPageChange?.(pageNum)}
                        className={cn(
                          "h-8 w-8 p-0",
                          pagination.currentPage === pageNum && "bg-orange-100 text-orange-900 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-100"
                        )}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="h-8 px-3"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(pagination.totalPages)}
                  disabled={!pagination.hasNext}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingState() {
  return (
    <div className="space-y-8 py-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>
      
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-[180px]" />
              <Skeleton className="h-4 w-[250px]" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LeaderboardsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const globalLeaderboard = useQuery(api.leaderboards.getStudyTimeLeaderboard, { 
    page: currentPage, 
    pageSize 
  })
  const userRanking = useQuery(api.leaderboards.getUserRanking)
  const myGroups = useQuery(api.groups.listMyGroups)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!globalLeaderboard || !userRanking || !myGroups) {
    return <LoadingState />
  }

  if (!globalLeaderboard.data || globalLeaderboard.data.length === 0) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <PageTitle title="Undead Leaderboard" />
          <p className="text-lg text-muted-foreground">
            Track your ranking and compete with other spirits to escape the haunted library
          </p>
        </div>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="flex flex-col items-center p-12 text-center">
            <div className="rounded-full bg-primary/10 p-6 mb-6">
              <Trophy className="h-16 w-16 text-primary" />
            </div>
            <h3 className="mb-4 text-2xl font-bold font-gothic">Ready to Compete?</h3>
            <p className="text-muted-foreground text-lg mb-6 max-w-md">
              Complete some study sessions to see the leaderboard and start competing with other spirits!
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Haunt Time Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Global Rankings</span>
              </div>
              <div className="flex items-center gap-2">
                <Medal className="h-4 w-4" />
                <span>Achievement Badges</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <FloatingParticles className="fixed inset-0 z-0" />
      <SpookyGhost className="fixed bottom-4 left-4 w-16 h-16 z-10" />
      
      <div className="relative z-10 space-y-8">
        <div className="space-y-3">
          <PageTitle>
             <DrippingText text="Undead Leaderboard" color="#fb923c" />
          </PageTitle>
          <div className="flex items-center justify-between">
            <p className="text-lg text-muted-foreground">
              Track your ranking and compete with other spirits to escape the haunted library
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Ghost className="h-4 w-4 text-purple-400" />
              <span>{globalLeaderboard.pagination.totalCount} Restless Spirits</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-8">
          <PersonalStatsCard userRanking={userRanking} />
          <LeaderboardCard
            title="Top Spirits"
            description="Most powerful spirits haunting the library"
            icon={<Trophy className="h-5 w-5 text-orange-500" />}
            data={globalLeaderboard.data}
            pagination={globalLeaderboard.pagination}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </>
  )
}
