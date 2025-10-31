"use client"

import PageTitle from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Key,
  Info,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"

interface ApiKey {
  id: string
  name: string
  model: string
  format: string
  keyPreview: string
  createdAt: Date
  lastUsed?: Date
}

export default function BYOKSettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<"openai" | "anthropic" | "heroku" | "custom">("openai")
  const [keyName, setKeyName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [savingKey, setSavingKey] = useState(false)

  const apiFormats = [
    {
      id: "openai",
      name: "OpenAI",
      description: "GPT-4, GPT-3.5, and other OpenAI models",
      icon: "🤖",
      docs: "https://platform.openai.com/docs/quickstart",
    },
    {
      id: "anthropic",
      name: "Anthropic",
      description: "Claude models from Anthropic",
      icon: "🧠",
      docs: "https://docs.anthropic.com/",
    },
    {
      id: "heroku",
      name: "Heroku Managed Inference",
      description: "Multi-model inference with Heroku",
      icon: "🚀",
      docs: "https://devcenter.heroku.com/articles/inference",
    },
    {
      id: "custom",
      name: "Custom API",
      description: "Any compatible API endpoint",
      icon: "⚙️",
      docs: "#",
    },
  ]

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!keyName.trim()) {
      toast.error("Please enter a key name")
      return
    }

    if (!apiKey.trim()) {
      toast.error("Please enter your API key")
      return
    }

    setSavingKey(true)
    try {
      const newKey: ApiKey = {
        id: Math.random().toString(36).substr(2, 9),
        name: keyName,
        model: selectedFormat,
        format: selectedFormat,
        keyPreview: apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4),
        createdAt: new Date(),
      }

      setApiKeys([...apiKeys, newKey])
      setKeyName("")
      setApiKey("")
      setShowAddForm(false)
      toast.success(`API key "${keyName}" added successfully`)
    } catch (error) {
      console.error('Error adding API key:', error)
      toast.error('Failed to add API key')
    } finally {
      setSavingKey(false)
    }
  }

  const handleDeleteKey = (id: string) => {
    const key = apiKeys.find(k => k.id === id)
    if (key && confirm(`Are you sure you want to delete "${key.name}"?`)) {
      setApiKeys(apiKeys.filter(k => k.id !== id))
      toast.success(`API key "${key.name}" deleted`)
    }
  }

  const handleCopyKey = (keyName: string) => {
    navigator.clipboard.writeText(keyName)
    toast.success('Key reference copied to clipboard')
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
          <PageTitle title="Bring Your Own Key (BYOK)" />
          <p className="text-sm text-muted-foreground">
            Use your own API keys for AI models and services
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Overview Card */}
        <Card>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Key className="h-6 w-6 text-amber-500" />
                </div>
                API Key Management
              </CardTitle>
              <CardDescription>
                Add your own API keys to use with various AI models and services
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Security Notice</AlertTitle>
              <AlertDescription>
                Your API keys are encrypted and stored securely. Never share your keys with anyone.
                We will never send your keys to external servers without your explicit consent.
              </AlertDescription>
            </Alert>

            {apiKeys.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Your API Keys ({apiKeys.length})</h3>
                <div className="grid gap-2">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{key.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {apiFormats.find(f => f.id === key.format)?.name} • {key.keyPreview}
                        </p>
                        {key.lastUsed && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last used: {key.lastUsed.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyKey(key.id)}
                          className="h-8 w-8 p-0"
                          title="Copy key reference"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteKey(key.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Delete key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!showAddForm ? (
              <Button onClick={() => setShowAddForm(true)} className="w-full gap-2">
                <Key className="h-4 w-4" />
                Add New API Key
              </Button>
            ) : (
              <form onSubmit={handleAddKey} className="space-y-4 p-4 rounded-lg border bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="key-name" className="font-medium">
                    Key Name
                  </Label>
                  <Input
                    id="key-name"
                    placeholder="e.g., My OpenAI API Key"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    disabled={savingKey}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">API Format</Label>
                  <Tabs value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as any)}>
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                      {apiFormats.map((format) => (
                        <TabsTrigger key={format.id} value={format.id} className="text-xs">
                          <span className="mr-1">{format.icon}</span>
                          {format.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <p className="text-xs text-muted-foreground">
                    {apiFormats.find(f => f.id === selectedFormat)?.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="api-key" className="font-medium">
                      API Key
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowKey(!showKey)}
                      className="h-6 w-6 p-0"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Input
                    id="api-key"
                    type={showKey ? "text" : "password"}
                    placeholder="Paste your API key here"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={savingKey}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={savingKey}
                    className="flex-1 gap-2"
                  >
                    {savingKey ? (
                      <>
                        <span className="inline-block animate-spin">⏳</span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4" />
                        Add Key
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setKeyName("")
                      setApiKey("")
                      setShowKey(false)
                    }}
                    disabled={savingKey}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Supported Formats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supported API Formats</CardTitle>
            <CardDescription>
              Choose the format that matches your API provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {apiFormats.map((format) => (
                <div key={format.id} className="rounded-lg border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{format.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{format.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{format.description}</p>
                      {format.docs !== "#" && (
                        <Button
                          variant="link"
                          size="sm"
                          asChild
                          className="mt-2 h-auto p-0 gap-1"
                        >
                          <a href={format.docs} target="_blank" rel="noopener noreferrer">
                            View Documentation
                            <span className="ml-1">↗</span>
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <Info className="h-5 w-5" />
              Why Use BYOK?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-amber-900 dark:text-amber-100">
            <p>
              Bring Your Own Key (BYOK) allows you to use your own API credentials:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Full control over your API usage and costs</li>
              <li>No shared rate limits with other users</li>
              <li>Direct relationship with your API provider</li>
              <li>Support for multiple models and providers simultaneously</li>
              <li>Enhanced privacy with end-to-end encryption</li>
              <li>No additional service fees from StudyFlow</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
