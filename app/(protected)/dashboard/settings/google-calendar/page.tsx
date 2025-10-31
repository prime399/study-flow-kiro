"use client"

import PageTitle from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Info,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"

export default function GoogleCalendarSettingsPage() {
  const [connected, setConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncEnabled, setSyncEnabled] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  const handleConnectGoogleCalendar = () => {
    toast.info('Google Calendar integration coming soon!')
  }

  const handleDisconnect = async () => {
    try {
      setConnected(false)
      setSyncEnabled(false)
      toast.success('Google Calendar disconnected')
    } catch (error) {
      console.error('Error disconnecting:', error)
      toast.error('Failed to disconnect Google Calendar')
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      setTimeout(() => {
        setLastSyncTime(new Date())
        toast.success('Calendar synchronized successfully')
        setSyncing(false)
      }, 2000)
    } catch (error) {
      console.error('Error syncing:', error)
      toast.error('Failed to sync calendar')
      setSyncing(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <PageTitle title="Google Calendar Integration" />
          <p className="text-sm text-muted-foreground">
            Sync your study schedule with Google Calendar
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Calendar className="h-6 w-6 text-red-500" />
                  </div>
                  Connection Status
                </CardTitle>
                <CardDescription>
                  Google Calendar account connection and sync settings
                </CardDescription>
              </div>
              <Badge variant={connected ? "default" : "secondary"}>
                {connected ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Not Connected
                  </span>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Coming Soon</AlertTitle>
              <AlertDescription>
                Google Calendar integration is currently in development. This feature will allow you to automatically sync your study sessions and goals to your Google Calendar.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
              <div>
                <h3 className="font-medium mb-2">Planned Features</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Automatically create calendar events for study sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Sync your daily study goals to calendar reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>View calendar events in study dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Automatically block study time in your calendar</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              <Button
                onClick={handleConnectGoogleCalendar}
                disabled
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Connect Google Calendar
              </Button>
              <Button
                variant="outline"
                asChild
                className="gap-2"
              >
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Google Calendar
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sync Settings */}
        {connected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Sync Settings
              </CardTitle>
              <CardDescription>
                Configure how your study data syncs with Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-sync" className="font-medium">
                    Auto Sync
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync study sessions to calendar
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={syncEnabled}
                  onCheckedChange={setSyncEnabled}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Last Sync: {lastSyncTime ? lastSyncTime.toLocaleString() : 'Never'}
                  </p>
                  <Button
                    onClick={handleSync}
                    disabled={syncing}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {syncing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Sync Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information Card */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Info className="h-5 w-5" />
              About Google Calendar Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-900 dark:text-blue-100">
            <p>
              The Google Calendar integration will help you stay organized by syncing your study activities:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>All study sessions are automatically added to your calendar</li>
              <li>Your daily study goals appear as all-day calendar events</li>
              <li>Set calendar reminders for upcoming study sessions</li>
              <li>Block study time to avoid scheduling conflicts</li>
              <li>View your complete schedule in one place</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
