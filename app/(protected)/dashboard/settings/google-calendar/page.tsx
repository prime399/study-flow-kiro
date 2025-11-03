"use client"

import PageTitle from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Info,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import Link from "next/link"

interface GoogleCalendarConnection {
  connected: boolean
  hasToken: boolean
  syncEnabled: boolean
  lastSyncTime?: number
  calendarId?: string
  error?: string
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function GoogleCalendarSettingsPage() {
  const [googleCalendarConnection, setGoogleCalendarConnection] = useState<GoogleCalendarConnection | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchGoogleCalendarConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/google-calendar/status')
      const data: GoogleCalendarConnection = await response.json()
      setGoogleCalendarConnection(data)
    } catch (error) {
      console.error('Error fetching Google Calendar connection:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const initializeConnection = async () => {
      await fetchGoogleCalendarConnection()
    }

    initializeConnection()

    const params = new URLSearchParams(window.location.search)
    const googleCalendarConnected = params.get('google_calendar_connected')
    const googleCalendarError = params.get('google_calendar_error')

    if (googleCalendarConnected === 'true') {
      toast.success('Google Calendar connected successfully!')
      initializeConnection()
      window.history.replaceState({}, '', window.location.pathname)
    } else if (googleCalendarError) {
      let errorMessage = 'Failed to connect Google Calendar'
      switch (googleCalendarError) {
        case 'access_denied':
          errorMessage = 'You denied access to Google Calendar'
          break
        case 'invalid_state':
          errorMessage = 'Invalid authentication state. Please try again.'
          break
        case 'no_code':
          errorMessage = 'No authorization code received from Google'
          break
        case 'callback_failed':
          errorMessage = 'Failed to complete Google Calendar authentication'
          break
      }
      toast.error(errorMessage)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [fetchGoogleCalendarConnection])

  const handleConnectGoogleCalendar = () => {
    window.location.href = '/api/google-calendar/auth?returnTo=/dashboard/settings/google-calendar'
  }

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/google-calendar/disconnect', {
        method: 'POST',
      })

      if (response.ok) {
        setGoogleCalendarConnection(null)
        toast.success('Google Calendar disconnected successfully')
      } else {
        throw new Error('Failed to disconnect')
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error)
      toast.error('Failed to disconnect Google Calendar')
    }
  }

  const handleSyncToggle = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/google-calendar/sync-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ autoSyncEnabled: enabled }),
      })

      if (response.ok) {
        setGoogleCalendarConnection(prev =>
          prev ? { ...prev, syncEnabled: enabled } : null
        )
        toast.success(`Auto sync ${enabled ? 'enabled' : 'disabled'}`)
      }
    } catch (error) {
      console.error('Error updating sync settings:', error)
      toast.error('Failed to update sync settings')
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/google-calendar/sync', {
        method: 'POST',
      })

      if (response.ok) {
        await fetchGoogleCalendarConnection()
        toast.success('Calendar synchronized successfully')
      } else {
        throw new Error('Sync failed')
      }
    } catch (error) {
      console.error('Error syncing:', error)
      toast.error('Failed to sync calendar')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return <LoadingSkeleton />
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
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Calendar className="h-6 w-6 text-blue-500" />
                  </div>
                  Connection Status
                </CardTitle>
                <CardDescription>
                  Google Calendar account connection and sync settings
                </CardDescription>
              </div>
              <Badge variant={googleCalendarConnection?.connected ? "default" : "secondary"}>
                {googleCalendarConnection?.connected ? (
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
            {!googleCalendarConnection?.connected && (
              <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                <div>
                  <h3 className="font-medium mb-2">Features</h3>
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
            )}

            <div className="flex flex-wrap gap-2 pt-4">
              {!googleCalendarConnection?.connected ? (
                <Button
                  onClick={handleConnectGoogleCalendar}
                  className="gap-2 bg-blue-500 hover:bg-blue-600"
                >
                  <Calendar className="h-4 w-4" />
                  Connect Google Calendar
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => fetchGoogleCalendarConnection()}
                    variant="outline"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Status
                  </Button>
                  <Button
                    onClick={handleDisconnect}
                    variant="destructive"
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Disconnect
                  </Button>
                </>
              )}
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
        {googleCalendarConnection?.connected && (
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
                  checked={googleCalendarConnection?.syncEnabled || false}
                  onCheckedChange={handleSyncToggle}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Last Sync: {googleCalendarConnection?.lastSyncTime ? new Date(googleCalendarConnection.lastSyncTime).toLocaleString() : 'Never'}
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
              The Google Calendar integration helps you stay organized by syncing your study activities:
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
