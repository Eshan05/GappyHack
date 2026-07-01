"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { setTestingToken, getTestingToken } from "lemma-sdk"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  SettingsIcon,
  KeyIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  DatabaseIcon,
  Trash2Icon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  CpuIcon,
} from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [token, setToken] = useState("")
  const [hasToken, setHasToken] = useState(false)

  // Load token status on mount
  useEffect(() => {
    const activeToken = getTestingToken()
    if (activeToken) {
      setHasToken(true)
      setToken(activeToken)
    }
  }, [])

  // Handle Token Save
  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      toast.error("Token cannot be empty")
      return
    }
    setTestingToken(token.trim())
    setHasToken(true)
    toast.success("Lemma API Token updated successfully! Reloading...")
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  // Handle Token Clear
  const handleClearToken = () => {
    setTestingToken("")
    setToken("")
    setHasToken(false)
    toast.success("API Token removed. Reloading...")
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  // Handle Clear Local Memory
  const handleClearMemory = () => {
    if (confirm("Are you sure you want to clear your local cache? This will not delete your remote database but will clear active sessions.")) {
      localStorage.clear()
      toast.success("Local cache cleared successfully!")
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-900 text-foreground shadow-sm">
            <SettingsIcon className="size-4.5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure your AI engine, database connections, and preferences.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Section 1: API Configuration */}
        <Card className="rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 shadow-sm bg-white dark:bg-zinc-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyIcon className="size-4.5 text-emerald-500" />
              <CardTitle className="text-base font-semibold">Lemma API Configuration</CardTitle>
            </div>
            <CardDescription>
              Your Second Brain uses Lemma to store notes, index documents, and power the AI Oracle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSaveToken} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Lemma API Token
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="token"
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter your Lemma connection token..."
                    className="flex-1 rounded-xl text-xs h-10 border-gray-200 dark:border-zinc-800 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                  />
                  {hasToken ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearToken}
                      className="rounded-xl text-xs h-10 text-red-500 border-red-500/20 hover:bg-red-50"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="rounded-xl text-xs h-10 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10 px-6"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </form>

            <div className="rounded-xl bg-gray-50 dark:bg-zinc-900/50 p-3.5 flex items-start gap-3 border border-gray-100 dark:border-zinc-900">
              {hasToken ? (
                <>
                  <CheckCircle2Icon className="size-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">Connected to Lemma Cloud</p>
                    <p className="text-muted-foreground">Your Second Brain is active. Notes, search, and AI chat features are fully operational.</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangleIcon className="size-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-amber-700 dark:text-amber-400">Not Connected</p>
                    <p className="text-muted-foreground">Paste a Lemma token above to enable semantic search, document uploads, and AI features.</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Appearance */}
        <Card className="rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 shadow-sm bg-white dark:bg-zinc-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SunIcon className="size-4.5 text-amber-500" />
              <CardTitle className="text-base font-semibold">Appearance</CardTitle>
            </div>
            <CardDescription>
              Customize how Second Brain looks on your device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Theme Mode</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                    theme === "light"
                      ? "border-emerald-500 bg-emerald-500/5 text-emerald-600"
                      : "border-gray-200 hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-muted-foreground"
                  }`}
                >
                  <SunIcon className="size-4" />
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                    theme === "dark"
                      ? "border-emerald-500 bg-emerald-500/5 text-emerald-600"
                      : "border-gray-200 hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-muted-foreground"
                  }`}
                >
                  <MoonIcon className="size-4" />
                  Dark
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                    theme === "system"
                      ? "border-emerald-500 bg-emerald-500/5 text-emerald-600"
                      : "border-gray-200 hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-muted-foreground"
                  }`}
                >
                  <MonitorIcon className="size-4" />
                  System
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: System Status & Database */}
        <Card className="rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 shadow-sm bg-white dark:bg-zinc-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DatabaseIcon className="size-4.5 text-purple-500" />
              <CardTitle className="text-base font-semibold">Database & Storage Status</CardTitle>
            </div>
            <CardDescription>
              Monitor your vector storage, embedding count, and index status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-gray-100 dark:border-zinc-900 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Vector Database</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">MongoDB + Pinecone</span>
                  <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/10 border-none text-[10px] font-medium">Active</Badge>
                </div>
              </div>
              
              <div className="p-3 border border-gray-100 dark:border-zinc-900 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">AI Model Engine</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">GPT-4o / Claude 3.5</span>
                  <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/10 border-none text-[10px] font-medium">Synced</Badge>
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">Clear Local Cache</p>
                <p className="text-[11px] text-muted-foreground">Reset local session data and clear temporary stored states.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearMemory}
                className="text-xs border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl h-9 font-medium"
              >
                <Trash2Icon className="size-3.5 mr-1.5" />
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
