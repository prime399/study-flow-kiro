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
  RefreshCw
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import Image from "next/image"

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

  const fetchTokenInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/token')
      
      if (response.ok) {
        const data: TokenInfo = await response.json()
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

  useEffect(() => {
    fetchTokenInfo()
  }, [fetchTokenInfo])

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
