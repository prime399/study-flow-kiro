"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SessionCounts {
  completed: number;
  incomplete: number;
}

interface ProcessedData {
  [key: string]: SessionCounts;
}

interface ChartDataPoint extends SessionCounts {
  date: string;
}

const chartConfig = {
  completed: {
    label: "Completed",
    color: "oklch(var(--chart-1))",
  },
  incomplete: {
    label: "Incomplete", 
    color: "oklch(var(--chart-2))",
  },
} satisfies ChartConfig;

const HalloweenChartPattern = () => {
  return (
    <>
      <pattern id="completedPattern" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
        <rect width="100%" height="100%" fill="#9333ea" fillOpacity="0.8" />
        <circle cx="10" cy="10" r="2" fill="#fb923c" fillOpacity="0.5" />
      </pattern>
      
      <pattern id="incompletePattern" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(-45)">
        <rect width="100%" height="100%" fill="#fb923c" fillOpacity="0.2" />
        <circle cx="10" cy="10" r="2" fill="#9333ea" fillOpacity="0.5" />
      </pattern>

      <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9333ea" stopOpacity="1" />
        <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.8" />
      </linearGradient>

      <linearGradient id="incompleteGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fb923c" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#f97316" stopOpacity="0.6" />
      </linearGradient>
    </>
  );
};

export default function StudySessionDistribution({
  recentSessions,
}: {
  recentSessions: {
    startTime: string;
    endTime: string | null;
    duration: number;
    type: string;
    completed: boolean;
  }[];
}) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [weekOffset, setWeekOffset] = React.useState(0); // 0 = current week, 1 = last week, etc.

  // Process data before any conditional returns
  const processedData = React.useMemo(() => {
    return recentSessions.reduce<ProcessedData>((acc, session) => {
      const date = new Date(session.startTime).toISOString().split('T')[0]; // Use YYYY-MM-DD format
      if (!acc[date]) {
        acc[date] = { completed: 0, incomplete: 0 };
      }
      session.completed ? acc[date].completed++ : acc[date].incomplete++;
      return acc;
    }, {});
  }, [recentSessions]);

  const data: ChartDataPoint[] = React.useMemo(() => {
    const allData = Object.entries(processedData)
      .map(([date, counts]) => ({
        date,
        completed: counts.completed,
        incomplete: counts.incomplete,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate week ranges
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - (weekOffset * 7));
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);

    // Filter data for the selected week
    return allData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [processedData, weekOffset]);

  // Calculate if there are previous/next weeks available
  const { hasPreviousWeek, hasNextWeek } = React.useMemo(() => {
    const allDates = Object.keys(processedData).map(date => new Date(date));
    if (allDates.length === 0) return { hasPreviousWeek: false, hasNextWeek: false };
    
    const oldestDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - ((weekOffset + 1) * 7) + 1);
    
    return {
      hasPreviousWeek: oldestDate < currentWeekStart,
      hasNextWeek: weekOffset > 0
    };
  }, [processedData, weekOffset]);

  // Get current week period for display
  const weekPeriod = React.useMemo(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - (weekOffset * 7));
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    
    return {
      start: startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      end: endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      isCurrentWeek: weekOffset === 0
    };
  }, [weekOffset]);

  const activeData = React.useMemo(() => {
    if (activeIndex === null) return null;
    return data[activeIndex];
  }, [activeIndex, data]);

  // Early return after all hooks
  if (!recentSessions.length) {
    return (
      <Card className="h-[300px]">
        <CardHeader className="flex items-center justify-center">
          <CardTitle className="font-gothic">Daily Study Sessions</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col items-center gap-4 py-10">
          <p className="text-balance text-center text-muted-foreground">
            No study sessions recorded yet. Complete your first session to see
            your daily progress!
          </p>
          <Button asChild>
            <Link href="/dashboard/study">Start Studying</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalCompleted = data.reduce((sum, item) => sum + item.completed, 0);
  const totalIncomplete = data.reduce((sum, item) => sum + item.incomplete, 0);
  const totalSessions = totalCompleted + totalIncomplete;
  const completionRate = totalSessions > 0 ? (totalCompleted / totalSessions) * 100 : 0;

  const getTrendIcon = () => {
    if (completionRate >= 70) {
      return <TrendingUp className="h-4 w-4" />;
    }
    return <TrendingDown className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (completionRate >= 70) {
      return "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50";
    }
    return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50";
  };

  return (
    <Card className="overflow-hidden transition-all duration-500 border-white/5 bg-gradient-to-br from-card/80 to-purple-900/10 backdrop-blur-md shadow-[0_0_20px_-5px_rgba(147,51,234,0.1)] hover:shadow-[0_0_30px_-5px_rgba(251,146,60,0.2)] hover:border-orange-500/30 hover:-translate-y-0.5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold font-gothic">Daily Study Sessions</CardTitle>
            <Badge
              variant="outline"
              className={`${getTrendColor()} border-none font-medium px-2.5 py-1`}
            >
              {getTrendIcon()}
              <span className="ml-1">{completionRate.toFixed(1)}%</span>
            </Badge>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setWeekOffset(prev => prev + 1)}
              disabled={!hasPreviousWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="px-3 py-1 text-xs font-medium text-muted-foreground min-w-[100px] text-center">
              {weekPeriod.isCurrentWeek ? "This Week" : `${weekPeriod.start} - ${weekPeriod.end}`}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setWeekOffset(prev => prev - 1)}
              disabled={!hasNextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <CardDescription className="text-sm">
          {activeData ? (
            <div className="flex items-center gap-4 text-xs">
              <span className="font-medium">{new Date(activeData.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#9333ea]"></div>
                  <span>Completed: {activeData.completed}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#fb923c]"></div>
                  <span>Incomplete: {activeData.incomplete}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span>Hover over bars to see daily breakdown</span>
              <span className="text-xs text-muted-foreground/70">
                {data.length > 0 ? `${data.length} days with sessions` : "No sessions this week"}
              </span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ top: 20, right: 30, bottom: 20, left: 40 }}
            onMouseLeave={() => setActiveIndex(null)}
            barCategoryGap="25%"
          >
            <defs>
              <HalloweenChartPattern />
            </defs>
            
            {/* Cartesian Grid for better data reading */}
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="oklch(var(--border))"
              opacity={0.4}
              vertical={false}
            />
            
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={12}
              axisLine={false}
              className="text-xs text-muted-foreground"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs text-muted-foreground"
              tickFormatter={(value) => `${value}`}
              domain={[0, 'dataMax + 1']}
            />
            <ChartTooltip
              cursor={{ fill: "oklch(var(--muted))", opacity: 0.1 }}
              content={<ChartTooltipContent 
                indicator="dot" 
                labelClassName="font-medium"
                className="rounded-lg border bg-background/95 backdrop-blur-sm shadow-lg"
              />}
            />
            <Bar 
              dataKey="completed" 
              fill="url(#completedGradient)"
              stroke="url(#completedPattern)" 
              strokeWidth={2}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-completed-${index}`}
                  fillOpacity={activeIndex === null ? 1 : activeIndex === index ? 1 : 0.6}
                  stroke={activeIndex === index ? "#d8b4fe" : "none"}
                  strokeWidth={activeIndex === index ? 2 : 0}
                  onMouseEnter={() => setActiveIndex(index)}
                  className="transition-all duration-300 ease-in-out cursor-pointer"
                />
              ))}
            </Bar>
            <Bar 
              dataKey="incomplete" 
              fill="url(#incompleteGradient)"
              stroke="url(#incompletePattern)"
              strokeWidth={2} 
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-incomplete-${index}`}
                  fillOpacity={activeIndex === null ? 1 : activeIndex === index ? 1 : 0.6}
                  stroke={activeIndex === index ? "#fdba74" : "none"}
                  strokeWidth={activeIndex === index ? 2 : 0}
                  onMouseEnter={() => setActiveIndex(index)}
                  className="transition-all duration-300 ease-in-out cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-sm bg-[#9333ea]"></div>
            <span className="text-muted-foreground">Completed Sessions</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-sm bg-[#fb923c]"></div>
            <span className="text-muted-foreground">Incomplete Sessions</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
