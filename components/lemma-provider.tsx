"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { setTestingToken } from "lemma-sdk"
import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { getLemmaClient, getLemmaConfigError } from "@/lib/lemma"
import { useAuth } from "lemma-sdk/react"
import { AlertTriangleIcon, BrainIcon, KeyIcon, LogInIcon, Loader2Icon, UserPlusIcon } from "lucide-react"

const AUTH_RETURN_TO_KEY = "secondbrain.auth.returnTo"

function getCurrentReturnTo() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function getSafeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null
  return value
}

function AuthConfigError({ message }: { message: string }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="mx-4 w-full max-w-md space-y-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <AlertTriangleIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold">Lemma setup is incomplete</h1>
            <p className="text-sm text-muted-foreground">Second Brain needs a fixed shared pod before anyone signs in.</p>
          </div>
        </div>
        <p className="rounded-lg bg-muted p-3 font-mono text-xs text-muted-foreground">
          {message}
        </p>
      </div>
    </div>
  )
}

function AuthGateInner({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, redirectToAuth } = useAuth(getLemmaClient())
  const router = useRouter()
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [token, setToken] = useState("")
  const showDeveloperToken = process.env.NODE_ENV !== "production"

  useEffect(() => {
    if (!isAuthenticated) return

    const returnTo = getSafeReturnTo(localStorage.getItem(AUTH_RETURN_TO_KEY))
    localStorage.removeItem(AUTH_RETURN_TO_KEY)

    if (returnTo && returnTo !== getCurrentReturnTo()) {
      router.replace(returnTo)
    }
  }, [isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isAuthenticated) return <>{children}</>

  function handleSignIn(mode: "login" | "signup" = "login") {
    localStorage.setItem(AUTH_RETURN_TO_KEY, getCurrentReturnTo())
    redirectToAuth({
      mode,
      redirectUri: window.location.origin,
    })
  }

  function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token.trim()) return
    setTestingToken(token.trim())
    window.location.reload()
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="mx-4 w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-lg bg-emerald-600 shadow-lg shadow-emerald-500/20">
            <BrainIcon className="size-7 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Second Brain</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with Lemma to open your private workspace.
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => handleSignIn()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <LogInIcon className="size-4" />
            Continue with Lemma
          </button>
          <button
            onClick={() => handleSignIn("signup")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            <UserPlusIcon className="size-4" />
            Create Lemma account
          </button>
        </div>
        {showDeveloperToken && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3 text-left">
            <button
              type="button"
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="flex w-full items-center justify-between gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <KeyIcon className="size-3.5" />
                Development token
              </span>
              <span>{showTokenInput ? "Hide" : "Show"}</span>
            </button>
            {showTokenInput && (
              <form onSubmit={handleTokenSubmit} className="space-y-2">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste a development token"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!token.trim()}
                  className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Use development token
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AuthGate({ children }: { children: ReactNode }) {
  const configError = getLemmaConfigError()

  if (configError) {
    return <AuthConfigError message={configError} />
  }

  return <AuthGateInner>{children}</AuthGateInner>
}

export { AuthGate }

export function LemmaProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
