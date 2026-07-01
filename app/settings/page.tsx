"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { clearTestingToken, getTestingToken, setTestingToken } from "lemma-sdk"
import { useAuth } from "lemma-sdk/react"
import { getConfiguredLemmaPodId, getLemmaClient } from "@/lib/lemma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  KeyIcon,
  Loader2Icon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SunIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth(getLemmaClient())
  const [token, setToken] = useState("")
  const [hasDeveloperToken, setHasDeveloperToken] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const showDeveloperToken = process.env.NODE_ENV !== "production" || hasDeveloperToken
  const displayName = user?.name || user?.email?.split("@")[0] || "Signed-in user"
  const displayEmail = user?.email || ""
  const podId = getConfiguredLemmaPodId()

  useEffect(() => {
    const activeToken = getTestingToken()
    if (activeToken) {
      setHasDeveloperToken(true)
      setToken(activeToken)
    }
  }, [])

  const handleSaveDeveloperToken = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      toast.error("Development token cannot be empty")
      return
    }

    setTestingToken(token.trim())
    setHasDeveloperToken(true)
    toast.success("Development token saved. Reloading...")
    setTimeout(() => {
      window.location.reload()
    }, 800)
  }

  const handleClearDeveloperToken = () => {
    clearTestingToken()
    setToken("")
    setHasDeveloperToken(false)
    toast.success("Development token removed. Reloading...")
    setTimeout(() => {
      window.location.reload()
    }, 800)
  }

  const handleSignOut = async () => {
    if (isSigningOut) return
    setIsSigningOut(true)

    try {
      const signedOut = await getLemmaClient().auth.signOut()

      if (!signedOut) {
        toast.message("Opening Lemma logout...")
        await getLemmaClient().auth.redirectToFederatedLogout({
          redirectUri: window.location.origin,
        })
        return
      }

      toast.success("Signed out")
      window.location.assign("/")
    } catch {
      toast.error("Could not sign out. Try clearing local browser data.")
      setIsSigningOut(false)
    }
  }

  const handleClearMemory = () => {
    if (
      confirm(
        "Clear local browser data for this app? This removes cached session markers and preferences, but does not delete notes or documents."
      )
    ) {
      localStorage.clear()
      setToken("")
      setHasDeveloperToken(false)
      toast.success("Local browser data cleared. Reloading...")
      setTimeout(() => {
        window.location.reload()
      }, 800)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-gray-100 text-foreground shadow-sm dark:bg-zinc-900">
            <SettingsIcon className="size-4" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account, appearance, and local browser data.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="rounded-lg border border-gray-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="size-4 text-emerald-500" />
              <CardTitle className="text-base font-semibold">Account</CardTitle>
            </div>
            <CardDescription>
              Lemma handles sign-in and keeps this workspace private to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3.5 dark:border-zinc-900 dark:bg-zinc-900/50 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/15 bg-emerald-500/10 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  {displayName[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {displayEmail || "Authenticated with Lemma"}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Workspace pod: <span className="font-mono">{podId}</span>
                  </p>
                </div>
              </div>
              <Badge className="w-fit border-none bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
                <ShieldCheckIcon className="mr-1 size-3" />
                Signed in
              </Badge>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">End this session</p>
                <p className="text-[11px] text-muted-foreground">
                  Sign out of Second Brain on this browser.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="h-9 rounded-lg text-xs sm:w-auto"
              >
                {isSigningOut ? (
                  <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <LogOutIcon className="mr-1.5 size-3.5" />
                )}
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {showDeveloperToken && (
          <Card className="rounded-lg border border-gray-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyIcon className="size-4 text-amber-500" />
                <CardTitle className="text-base font-semibold">Development Token</CardTitle>
              </div>
              <CardDescription>
                Optional local override for development builds and test sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSaveDeveloperToken} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="developer-token"
                    className="text-xs font-semibold uppercase text-muted-foreground/80"
                  >
                    Lemma development token
                  </Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="developer-token"
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste a development token"
                      className="h-10 flex-1 rounded-lg border-gray-200 text-xs focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-zinc-800"
                    />
                    {hasDeveloperToken ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClearDeveloperToken}
                        className="h-10 rounded-lg border-red-500/20 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="h-10 rounded-lg bg-emerald-600 px-6 text-xs text-white shadow-md shadow-emerald-600/10 hover:bg-emerald-500"
                      >
                        Use token
                      </Button>
                    )}
                  </div>
                </div>
              </form>

              <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3.5 dark:border-zinc-900 dark:bg-zinc-900/50">
                {hasDeveloperToken ? (
                  <>
                    <CheckCircle2Icon className="mt-0.5 size-4 text-emerald-500" />
                    <div className="space-y-0.5 text-xs">
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                        Development token active
                      </p>
                      <p className="text-muted-foreground">
                        Requests use the local token instead of the browser session.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangleIcon className="mt-0.5 size-4 text-amber-500" />
                    <div className="space-y-0.5 text-xs">
                      <p className="font-semibold text-amber-700 dark:text-amber-400">
                        No development token
                      </p>
                      <p className="text-muted-foreground">
                        Normal Lemma sign-in is active.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-lg border border-gray-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SunIcon className="size-4 text-amber-500" />
              <CardTitle className="text-base font-semibold">Appearance</CardTitle>
            </div>
            <CardDescription>Choose how Second Brain looks on this device.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground/80">
                Theme
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-medium transition-all ${
                    theme === "light"
                      ? "border-emerald-500 bg-emerald-500/5 text-emerald-600"
                      : "border-gray-200 text-muted-foreground hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  }`}
                >
                  <SunIcon className="size-4" />
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-medium transition-all ${
                    theme === "dark"
                      ? "border-emerald-500 bg-emerald-500/5 text-emerald-600"
                      : "border-gray-200 text-muted-foreground hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  }`}
                >
                  <MoonIcon className="size-4" />
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-medium transition-all ${
                    theme === "system"
                      ? "border-emerald-500 bg-emerald-500/5 text-emerald-600"
                      : "border-gray-200 text-muted-foreground hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  }`}
                >
                  <MonitorIcon className="size-4" />
                  System
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-gray-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DatabaseIcon className="size-4 text-sky-500" />
              <CardTitle className="text-base font-semibold">Local Browser Data</CardTitle>
            </div>
            <CardDescription>
              Clear cached app state from this browser without deleting your workspace data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator className="opacity-50" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">Clear local cache</p>
                <p className="text-[11px] text-muted-foreground">
                  Removes cached session markers, preferences, and temporary local state.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearMemory}
                className="h-9 rounded-lg border-red-500/20 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2Icon className="mr-1.5 size-3.5" />
                Clear cache
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
