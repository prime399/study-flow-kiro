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
  Shield, 
  Key, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Info,
  ExternalLink,
  RefreshCw,
  Music
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import Image from "next/image"
import { useSpotifyStore } from "@/store/use-spotify-store"

interface TokenInfo {
  user: {
    sub: string
    name: string
    email: string
    picture: string
  }
  tokens: {
    accessToken: string | null
    idToken: string | null
    refreshToken: string | null
  }
  scopes: string[]
}

interface ConsentScope {
  id: string
  name: string
  description: string
  required: boolean
  granted: boolean
}

interface SpotifyConnection {
  connected: boolean
  profile?: {
    id: string
    display_name: string
    email: string
    images: Array<{ url: string }>
    product: string
  }
  hasToken: boolean
  error?: string
  errorCode?: string
  causeCode?: string
  reconnectRequired?: boolean
  configurationRequired?: boolean
}

interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  images: Array<{ url: string }>
  tracks: { total: number }
  uri: string
}

const availableScopes: ConsentScope[] = [
  {
    id: 'openid',
    name: 'OpenID',
    description: 'Basic authentication',
    required: true,
    granted: true,
  },
  {
    id: 'profile',
    name: 'Profile Information',
    description: 'Access to your profile information',
    required: true,
    granted: true,
  },
  {
    id: 'email',
    name: 'Email Address',
    description: 'Access to your email address',
    required: true,
    granted: true,
  },
  {
    id: 'read:user',
    name: 'Read User Data',
    description: 'Read your user data and preferences',
    required: false,
    granted: false,
  },
  {
    id: 'update:user',
    name: 'Update User Data',
    description: 'Update your user profile and settings',
    required: false,
    granted: false,
  },
  {
    id: 'offline_access',
    name: 'Offline Access',
    description: 'Access data when you are offline',
    required: false,
    granted: false,
  },
]

export default function SettingsPage() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [scopes, setScopes] = useState<ConsentScope[]>(availableScopes)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [isAuth0Connected, setIsAuth0Connected] = useState(false)
  
  const [spotifyConnection, setSpotifyConnection] = useState<SpotifyConnection | null>(null)
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [playlistSource, setPlaylistSource] = useState<'user-lofi' | 'search'>('user-lofi')
  const [showAllUserPlaylists, setShowAllUserPlaylists] = useState(false)
  
  const { 
    autoplayEnabled, 
    selectedPlaylist, 
    setAutoplayEnabled, 
    setSelectedPlaylist,
    setIsConnected 
  } = useSpotifyStore()

  const fetchTokenInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/token')
      const data = await response.json()
      
      if (response.ok && data.authenticated !== false) {
        setTokenInfo(data)
        setIsAuth0Connected(true)
        
        const updatedScopes = scopes.map(scope => ({
          ...scope,
          granted: data.scopes.includes(scope.id) || scope.required,
        }))
        setScopes(updatedScopes)
      } else {
        setIsAuth0Connected(false)
      }
    } catch (error) {
      console.error('Error fetching token info:', error)
      setIsAuth0Connected(false)
    } finally {
      setLoading(false)
    }
  }, [scopes])

  const fetchSpotifyConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/spotify/token')
      const data: SpotifyConnection = await response.json()
      setSpotifyConnection(data)
      setIsConnected(data.connected)

      if (!data.connected && data.errorCode) {
        console.warn('Spotify connection error:', data.errorCode, data.error)
      }

      if (data.connected) {
        fetchSpotifyPlaylists(false)
      }
    } catch (error) {
      console.error('Error fetching Spotify connection:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIsConnected])

  useEffect(() => {
    fetchTokenInfo()
    fetchSpotifyConnection()
  }, [fetchTokenInfo, fetchSpotifyConnection])

  const fetchSpotifyPlaylists = async (forceSearch = false) => {
    setLoadingPlaylists(true)
    try {
      if (forceSearch) {
        // Fetch search results
        const searchResponse = await fetch('/api/spotify/playlists?type=search&query=lofi study chill')
        const searchData = await searchResponse.json()

        if (searchResponse.ok) {
          setSpotifyPlaylists(searchData.playlists || [])
          setPlaylistSource('search')
        }
        return
      }

      // First, try to fetch user's own playlists
      const userResponse = await fetch('/api/spotify/playlists?type=user')
      const userData = await userResponse.json()

      let userPlaylists: SpotifyPlaylist[] = []
      let lofiPlaylists: SpotifyPlaylist[] = []

      if (userResponse.ok && userData.playlists) {
        userPlaylists = userData.playlists

        // Filter playlists that match lofi/study/chill keywords
        const lofiKeywords = ['lofi', 'lo-fi', 'lo fi', 'chill', 'study', 'focus', 'relax', 'beats', 'ambient']
        lofiPlaylists = userPlaylists.filter((playlist) => {
          const nameMatch = lofiKeywords.some(keyword => 
            playlist.name.toLowerCase().includes(keyword)
          )
          const descMatch = playlist.description && lofiKeywords.some(keyword => 
            playlist.description.toLowerCase().includes(keyword)
          )
          return nameMatch || descMatch
        })

        console.log(`Found ${lofiPlaylists.length} lofi playlists from user's library out of ${userPlaylists.length} total`)
      }

      // If user has lofi playlists, use those; otherwise fall back to search
      if (lofiPlaylists.length > 0) {
        setSpotifyPlaylists(showAllUserPlaylists ? userPlaylists : lofiPlaylists)
        setPlaylistSource('user-lofi')
        
        // Auto-select first lofi playlist if none selected
        if (!selectedPlaylist) {
          const firstPlaylist = lofiPlaylists[0]
          setSelectedPlaylist({
            id: firstPlaylist.id,
            name: firstPlaylist.name,
            uri: firstPlaylist.uri,
            images: firstPlaylist.images,
          })
          toast.success(`Auto-selected: ${firstPlaylist.name}`)
        }
      } else {
        // Fall back to search if no lofi playlists found
        console.log('No lofi playlists found in user library, falling back to search')
        const searchResponse = await fetch('/api/spotify/playlists?type=search&query=lofi study chill')
        const searchData = await searchResponse.json()

        if (searchResponse.ok) {
          setSpotifyPlaylists(searchData.playlists || [])
          setPlaylistSource('search')
        }
      }
    } catch (error) {
      console.error('Error fetching Spotify playlists:', error)
    } finally {
      setLoadingPlaylists(false)
    }
  }

  const toggleShowAllPlaylists = async () => {
    const newValue = !showAllUserPlaylists
    setShowAllUserPlaylists(newValue)
    
    if (playlistSource === 'user-lofi') {
      // Re-fetch to update the display
      await fetchSpotifyPlaylists()
    }
  }

  const switchToSearchPlaylists = () => {
    fetchSpotifyPlaylists(true)
  }

  const handleConnectSpotify = () => {
    window.location.href = '/api/spotify/connect'
  }

  const handleDisconnectSpotify = async () => {
    setAutoplayEnabled(false)
    setSelectedPlaylist(null)
    setIsConnected(false)
    toast.success('Spotify disconnected')
    
    await handleDisconnectAuth0()
  }

  const handlePlaylistSelect = (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist({
      id: playlist.id,
      name: playlist.name,
      uri: playlist.uri,
      images: playlist.images,
    })
    toast.success(`Selected: ${playlist.name}`)
  }

  const handleConnectAuth0 = () => {
    setConnecting(true)
    window.location.href = '/api/auth/login'
  }

  const handleDisconnectAuth0 = async () => {
    try {
      window.location.href = '/api/auth/logout'
    } catch (error) {
      console.error('Error disconnecting Auth0:', error)
      toast.error('Failed to disconnect Auth0')
    }
  }

  const handleScopeToggle = async (scopeId: string, granted: boolean) => {
    const scope = scopes.find(s => s.id === scopeId)
    
    if (!scope || scope.required) {
      return
    }

    const updatedScopes = scopes.map(s =>
      s.id === scopeId ? { ...s, granted } : s
    )
    setScopes(updatedScopes)

    if (granted && isAuth0Connected) {
      const grantedScopeIds = updatedScopes
        .filter(s => s.granted)
        .map(s => s.id)

      try {
        const response = await fetch('/api/auth/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scopes: grantedScopeIds }),
        })

        if (response.ok) {
          const data = await response.json()
          window.location.href = data.authorizationUrl
        } else {
          throw new Error('Failed to create consent URL')
        }
      } catch (error) {
        console.error('Error updating consent:', error)
        toast.error('Failed to update permissions')
        setScopes(scopes)
      }
    }
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Settings" />

      <div className="space-y-6">
        {/* Auth0 Connection Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Auth0 Integration</CardTitle>
              </div>
              <Badge variant={isAuth0Connected ? "default" : "secondary"}>
                {isAuth0Connected ? (
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
            <CardDescription>
              Secure authentication and authorization with fine-grained user consent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAuth0Connected ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Connect Auth0</AlertTitle>
                <AlertDescription>
                  Connect your Auth0 account to enable advanced authentication features,
                  secure delegation, and fine-grained access control.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-start gap-3">
                    <Image
                      src={tokenInfo?.user.picture || ''}
                      alt={tokenInfo?.user.name || 'User'}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{tokenInfo?.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tokenInfo?.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {tokenInfo?.user.sub}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Access Token</span>
                  </div>
                  <Badge variant="outline">
                    {tokenInfo?.tokens.accessToken ? 'Active' : 'Not Available'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Refresh Token</span>
                  </div>
                  <Badge variant="outline">
                    {tokenInfo?.tokens.refreshToken ? 'Active' : 'Not Available'}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!isAuth0Connected ? (
                <Button
                  onClick={handleConnectAuth0}
                  disabled={connecting}
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Connect Auth0
                </Button>
              ) : (
                <>
                  <Button
                    onClick={fetchTokenInfo}
                    variant="outline"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Status
                  </Button>
                  <Button
                    onClick={handleDisconnectAuth0}
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
                  href="https://auth0.com/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Learn More
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fine-Grained Permissions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>Permission Management</CardTitle>
            </div>
            <CardDescription>
              Control what data and actions the application can access on your behalf
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scopes.map((scope, index) => (
              <div key={scope.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={scope.id} className="font-medium">
                        {scope.name}
                      </Label>
                      {scope.required && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {scope.granted && !scope.required && (
                        <Badge variant="default" className="text-xs">
                          Granted
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {scope.description}
                    </p>
                  </div>
                  <Switch
                    id={scope.id}
                    checked={scope.granted}
                    disabled={scope.required || !isAuth0Connected}
                    onCheckedChange={(checked) =>
                      handleScopeToggle(scope.id, checked)
                    }
                  />
                </div>
              </div>
            ))}

            {!isAuth0Connected && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Connect Auth0 to manage your permissions
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Spotify Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                <CardTitle>Spotify Integration</CardTitle>
              </div>
              <Badge variant={spotifyConnection?.connected ? "default" : "secondary"}>
                {spotifyConnection?.connected ? (
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
            <CardDescription>
              Play lofi music during study sessions to enhance focus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!spotifyConnection?.connected ? (
              <Alert variant={spotifyConnection?.reconnectRequired ? "destructive" : "default"}>
                <Info className="h-4 w-4" />
                <AlertTitle>
                  {spotifyConnection?.configurationRequired 
                    ? 'Auth0 Configuration Required' 
                    : spotifyConnection?.reconnectRequired 
                      ? 'Reconnection Required' 
                      : 'Connect Spotify'}
                </AlertTitle>
                <AlertDescription>
                  {spotifyConnection?.configurationRequired ? (
                    <>
                      <strong>Token Exchange is not enabled in your Auth0 application.</strong><br />
                      Please go to Auth0 Dashboard → Applications → [Your App] → Advanced Settings → Grant Types 
                      and enable &quot;Token Exchange&quot;. See <code>AUTH0_TOKEN_EXCHANGE_SETUP.md</code> for detailed instructions.
                    </>
                  ) : spotifyConnection?.reconnectRequired ? (
                    <>
                      Your Spotify connection needs to be refreshed. Please click &quot;Connect Spotify&quot; below to reconnect.
                      This will ensure proper offline access for background music playback.
                    </>
                  ) : (
                    <>
                      Connect your Spotify account to automatically play lofi playlists during your study sessions.
                      We&apos;ll search your library for lofi/study/chill playlists and auto-select one for you.
                      Requires Spotify Premium for playback.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {spotifyConnection.profile && (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-start gap-3">
                      {spotifyConnection.profile.images?.[0] && (
                        <Image
                          src={spotifyConnection.profile.images[0].url}
                          alt={spotifyConnection.profile.display_name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{spotifyConnection.profile.display_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {spotifyConnection.profile.email}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {spotifyConnection.profile.product}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="spotify-autoplay" className="font-medium">
                      Autoplay Music
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically play lofi playlist when starting study timer
                    </p>
                  </div>
                  <Switch
                    id="spotify-autoplay"
                    checked={autoplayEnabled}
                    onCheckedChange={setAutoplayEnabled}
                  />
                </div>

                {spotifyPlaylists.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">
                          {playlistSource === 'user-lofi' ? 'Your Lofi Playlists' : 'Discover Lofi Playlists'}
                        </Label>
                        <div className="flex gap-2">
                          {playlistSource === 'user-lofi' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleShowAllPlaylists}
                                className="text-xs"
                              >
                                {showAllUserPlaylists ? 'Show Lofi Only' : 'Show All'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={switchToSearchPlaylists}
                                className="text-xs"
                              >
                                Discover More
                              </Button>
                            </>
                          )}
                          {playlistSource === 'search' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fetchSpotifyPlaylists(false)}
                              className="text-xs"
                            >
                              Back to My Playlists
                            </Button>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {playlistSource === 'user-lofi' ? 'Your Library' : 'Discover'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                        {loadingPlaylists ? (
                          <div className="text-center text-sm text-muted-foreground py-4">
                            Loading playlists...
                          </div>
                        ) : (
                          spotifyPlaylists.slice(0, 10).map((playlist) => (
                            <button
                              key={playlist.id}
                              onClick={() => handlePlaylistSelect(playlist)}
                              className={`flex items-center gap-3 p-2 rounded-lg border transition-colors text-left ${
                                selectedPlaylist?.id === playlist.id
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border hover:bg-muted/50'
                              }`}
                            >
                              {playlist.images?.[0] && (
                                <Image
                                  src={playlist.images[0].url}
                                  alt={playlist.name}
                                  width={40}
                                  height={40}
                                  className="rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{playlist.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {playlist.tracks.total} tracks
                                </p>
                              </div>
                              {selectedPlaylist?.id === playlist.id && (
                                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                      {selectedPlaylist && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Selected: {selectedPlaylist.name}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {!spotifyConnection?.connected ? (
                <Button
                  onClick={handleConnectSpotify}
                  className="gap-2"
                >
                  <Music className="h-4 w-4" />
                  Connect Spotify
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => fetchSpotifyPlaylists(false)}
                    variant="outline"
                    className="gap-2"
                    disabled={loadingPlaylists}
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingPlaylists ? 'animate-spin' : ''}`} />
                    Refresh Playlists
                  </Button>
                  <Button
                    onClick={handleDisconnectSpotify}
                    variant="destructive"
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Your Auth0 credentials are securely stored and encrypted
            </p>
            <p>
              • Access tokens are automatically refreshed when needed
            </p>
            <p>
              • You can revoke permissions at any time
            </p>
            <p>
              • All API requests are made over secure HTTPS connections
            </p>
            <p>
              • Spotify Premium required for music playback
            </p>
            <p>
              • We automatically detect lofi playlists from your library using keywords
            </p>
            <p>
              • You can toggle between your library and discover new playlists
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-[200px]" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[250px]" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-[150px]" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
