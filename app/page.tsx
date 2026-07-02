"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useNotes, useInsights, useTasks, useCreateNote, useProcessNote } from "@/hooks/use-lemma"
import { useChatDrawer } from "@/context/chat-drawer-context"
import { CreateNoteDialog } from "@/components/notes/create-note-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Link from "next/link"
import { useAuth } from "lemma-sdk/react"
import { getLemmaClient } from "@/lib/lemma"
import { ModeToggle } from "@/components/shared/mode-toggle"
import {
  BrainIcon,
  SearchIcon,
  SendIcon,
  FileTextIcon,
  SparklesIcon,
  ListTodoIcon,
  UploadIcon,
  LightbulbIcon,
  NetworkIcon,
  ChevronRightIcon,
  CheckSquareIcon,
  ArrowRightIcon,
  HistoryIcon,
  LayersIcon,
  WorkflowIcon,
  ShieldCheckIcon,
  CheckCircle2Icon,
  CpuIcon,
  MenuIcon,
  XIcon,
  ExternalLinkIcon,
  type LucideIcon,
} from "lucide-react"

type DashboardRecord = Record<string, unknown>
type DashboardItem = {
  id: string
  title: string
  meta: string
  query: string
  icon: LucideIcon
  timestamp: number
}

type QuickPrompt = {
  text: string
  icon: LucideIcon
}

// Framer Motion Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  },
}

function getText(record: DashboardRecord, key: string) {
  const value = record[key]
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function getTitle(record: DashboardRecord, fallback: string) {
  return getText(record, "title") ?? truncate(getText(record, "content") ?? fallback, 80)
}

function getTimestamp(record: DashboardRecord) {
  const value = getText(record, "created_at") ?? getText(record, "updated_at")
  if (!value) return 0

  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function getDateLabel(record: DashboardRecord) {
  const timestamp = getTimestamp(record)
  if (!timestamp) return "Recent"

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp))
}

function getTags(record: DashboardRecord) {
  return Array.isArray(record.tags)
    ? record.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    : []
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3).trim()}...` : value
}

function uniquePrompts(prompts: QuickPrompt[]) {
  const seen = new Set<string>()
  return prompts.filter((prompt) => {
    const key = prompt.text.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export default function RootPage() {
  return <LandingPage />
}

function LandingPage() {
  const { isAuthenticated, redirectToAuth } = useAuth(getLemmaClient())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignIn = (mode: "login" | "signup" = "login") => {
    localStorage.setItem("secondbrain.auth.returnTo", "/dashboard")
    redirectToAuth({
      mode,
      redirectUri: window.location.origin,
    })
  }

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="relative min-h-screen bg-linear-to-b from-background via-background to-muted/20">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => scrollToSection("hero")}>
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/10">
              <BrainIcon className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
              Second Brain
            </span>
          </div>

          {/* Desktop Navigation Link items */}
          <nav className="hidden md:flex items-center gap-6">
            {["features", "how-to-use", "tech-stack", "lemma-integration"].map((id) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground capitalize transition-colors"
              >
                {id.replace("-", " ")}
              </button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ModeToggle />
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-500/10 transition-all">
                    Go to Dashboard
                    <ArrowRightIcon className="ml-1.5 size-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button
                  onClick={() => handleSignIn("login")}
                  variant="outline"
                  className="h-9 px-4 rounded-xl text-foreground border-border hover:bg-accent font-medium transition-all"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => handleSignIn("signup")}
                  className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-500/10 transition-all"
                >
                  Log In
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ModeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex size-9 items-center justify-center rounded-lg border bg-card text-foreground hover:bg-accent"
            >
              {mobileMenuOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t bg-background px-4 py-4 space-y-4 shadow-lg"
          >
            <div className="flex flex-col gap-3">
              {["features", "how-to-use", "tech-stack", "lemma-integration"].map((id) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="text-left text-sm font-medium text-muted-foreground hover:text-foreground py-1.5 capitalize transition-colors"
                >
                  {id.replace("-", " ")}
                </button>
              ))}
            </div>
            <div className="border-t pt-3 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link href="/dashboard" className="w-full">
                  <Button className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all">
                    Go to Dashboard
                    <ArrowRightIcon className="ml-1.5 size-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Button
                    onClick={() => handleSignIn("login")}
                    variant="outline"
                    className="w-full h-10 rounded-xl text-foreground font-medium transition-all"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => handleSignIn("signup")}
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all"
                  >
                    Log In
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:px-8 text-center space-y-8 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" />
        <div className="absolute top-1/3 left-1/4 -z-10 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-500/5" />

        <div className="space-y-4 max-w-3xl mx-auto">
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-500/10 px-3 py-1 text-xs font-semibold rounded-full border border-emerald-500/20">
            <BrainIcon className="size-3.5 mr-1.5 inline text-emerald-600 dark:text-emerald-400" />
            AI Cognitive Workspace
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
            A Private Second Brain <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
              Built For Your Mind & AI
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Capture notes, upload documents, and track actions. Our autonomous AI agents process, summarize, link, and recall your knowledge base instantly through natural conversation.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/10 h-12 px-6 font-medium transition-all">
                Enter Your Workspace
                <ArrowRightIcon className="ml-1.5 size-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Button
                onClick={() => handleSignIn("signup")}
                size="lg"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/10 h-12 px-6 font-medium transition-all"
              >
                Get Started for Free
                <ArrowRightIcon className="ml-1.5 size-4" />
              </Button>
              <Button
                onClick={() => scrollToSection("features")}
                variant="outline"
                size="lg"
                className="rounded-xl border-border bg-card h-12 px-6 font-medium hover:bg-accent transition-all"
              >
                Learn More
              </Button>
            </>
          )}
        </div>

        {/* Dashboard Mockup */}
        <div className="pt-8">
          <div className="relative mx-auto max-w-5xl rounded-2xl border border-gray-200/80 bg-white/50 p-2 shadow-2xl dark:border-zinc-800/80 dark:bg-zinc-950/50 backdrop-blur-xl transition-all">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800/60 pb-2 px-3">
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-yellow-400" />
                <div className="size-3 rounded-full bg-green-400" />
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-medium bg-gray-100 dark:bg-zinc-900 px-4 py-0.5 rounded-md border border-gray-200/40 dark:border-zinc-800/40 select-none">
                localhost:3000/dashboard
              </div>
              <div className="w-12" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 min-h-[350px] text-left">
              {/* Sidebar Mock */}
              <div className="hidden md:flex flex-col gap-1.5 border-r border-gray-100 dark:border-zinc-900 pr-3">
                <div className="flex items-center gap-2 p-1.5 mb-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  <BrainIcon className="size-4 shrink-0" />
                  <span>Second Brain</span>
                </div>
                {['Dashboard', 'Notes', 'Documents', 'AI Chat', 'Knowledge Graph', 'Tasks', 'Insights'].map((item, idx) => (
                  <div key={item} className={`flex items-center gap-2 p-1.5 rounded-lg text-xs font-medium ${idx === 0 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>
                    <div className="size-2 rounded-full bg-current opacity-60" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              {/* Main mock area */}
              <div className="md:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Center column */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="border border-gray-200/60 dark:border-zinc-800/60 rounded-xl p-3 bg-white/80 dark:bg-zinc-950/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Latest Memory</span>
                      <span className="text-[10px] text-muted-foreground">Processed</span>
                    </div>
                    <h4 className="text-xs font-bold text-foreground">Researching Neural Symbolic Integration</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Neural symbolic AI combines the learning power of deep networks with the reasoning power of classical symbolic logic...
                    </p>
                  </div>
                  
                  <div className="border border-gray-200/60 dark:border-zinc-800/60 rounded-xl p-3 bg-white/80 dark:bg-zinc-950/80 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Active Tasks</span>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { text: 'Analyze symbolic reasoning benchmarks', done: false },
                        { text: 'Set up process-note trigger callback', done: true },
                      ].map((t) => (
                        <div key={t.text} className="flex items-center gap-2 text-[11px]">
                          <div className={`size-3.5 rounded border flex items-center justify-center ${t.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-zinc-700'}`}>
                            {t.done && <CheckSquareIcon className="size-2.5 text-white" />}
                          </div>
                          <span className={t.done ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}>{t.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Right column */}
                <div className="space-y-3">
                  <div className="border border-gray-200/60 dark:border-zinc-800/60 rounded-xl p-3 bg-white/80 dark:bg-zinc-950/80 shadow-sm space-y-2">
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <LightbulbIcon className="size-3" />
                      AI Insight
                    </span>
                    <p className="text-[11px] text-foreground leading-normal font-medium">
                      "Neural logic networks can generalize across tasks that normally require discrete search paradigms."
                    </p>
                  </div>
                  <div className="border border-gray-200/60 dark:border-zinc-800/60 rounded-xl p-3 bg-white/80 dark:bg-zinc-950/80 shadow-sm space-y-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Connected Topics</span>
                    <div className="flex flex-wrap gap-1">
                      {['Neural Logic', 'AI Reasoners', 'Knowledge Graphs', 'Lemma Pods'].map(tag => (
                        <span key={tag} className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/10 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / Second Brain for AI Section */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 space-y-12 border-t border-border/40">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">About Second Brain</span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            A Cognitive Amplifier for Your Ideas
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Traditional note apps are digital graveyards. Second Brain turns your passive workspace into an active partner. It reads your files, maps your ideas, and organizes your life.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Semantic Memory & Search",
              description: "Search your brain conceptually. Ask questions naturally, and retrieve notes or PDFs based on meaning rather than exact keywords.",
              icon: SearchIcon,
              color: "text-blue-500 bg-blue-500/10"
            },
            {
              title: "Autonomous Synthesis",
              description: "When you capture knowledge, an AI librarian breaks it down, summarizes it, extracts tags, and links related notes instantly.",
              icon: SparklesIcon,
              color: "text-emerald-500 bg-emerald-500/10"
            },
            {
              title: "Knowledge Mapping",
              description: "Visualize your connections. Second Brain automatically builds a visual graph showing how your thoughts link together.",
              icon: NetworkIcon,
              color: "text-amber-500 bg-amber-500/10"
            },
            {
              title: "Action Item Extraction",
              description: "Never lose track of goals. Action items buried within your notes are automatically parsed and sent to your interactive task list.",
              icon: ListTodoIcon,
              color: "text-purple-500 bg-purple-500/10"
            }
          ].map((feat) => (
            <Card key={feat.title} className="rounded-2xl border bg-card/50 p-6 hover:shadow-lg hover:border-emerald-500/20 transition-all group duration-300">
              <div className={`flex size-11 items-center justify-center rounded-xl ${feat.color} mb-4 group-hover:scale-110 transition-transform`}>
                <feat.icon className="size-5" />
              </div>
              <h3 className="font-bold text-base mb-2">{feat.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-to-use" className="bg-muted/30 border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Step-by-Step Workflow</span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How to Use Your Second Brain
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Managing knowledge has never been this seamless. Follow the loop to unlock your cognitive enhancement.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: "01",
                title: "Capture Intake",
                description: "Write notes directly or upload documents (PDF, DOCX, PPTX) to your private /knowledge directory.",
                icon: UploadIcon
              },
              {
                step: "02",
                title: "AI Processing",
                description: "The librarian workflow analyzes the note. It automatically extracts key insights, tags, and actions.",
                icon: CpuIcon
              },
              {
                step: "03",
                title: "Relational Mapping",
                description: "New information is cross-referenced with your existing database, mapping logic links with weight coefficients.",
                icon: LayersIcon
              },
              {
                step: "04",
                title: "Recall & Chat",
                description: "Ask the oracle agent anything about your knowledge base. It cites specific sources and creates new tasks as you talk.",
                icon: SendIcon
              }
            ].map((stepItem, index) => (
              <div key={stepItem.title} className="relative bg-card/40 border rounded-2xl p-6 space-y-4 hover:border-emerald-500/20 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-extrabold text-emerald-600/20 group-hover:text-emerald-500/30 transition-colors">
                    {stepItem.step}
                  </span>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <stepItem.icon className="size-4.5" />
                  </div>
                </div>
                <h3 className="font-bold text-sm">{stepItem.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{stepItem.description}</p>

                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-10 text-muted-foreground/30">
                    <ChevronRightIcon className="size-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech-stack" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 space-y-12 border-t border-border/40">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Under the Hood</span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Modern, Resilient Architecture
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Built with state-of-the-art framework technologies, ensuring security, blazing speed, and premium responsiveness.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Next.js 16 & React 19",
              details: ["App Router configuration", "Fast Static Site Generation (SSG)", "Strict client/server component architecture", "Optimized image & metadata rendering"],
              badge: "Frontend Framework"
            },
            {
              title: "Tailwind CSS v4 & Motion",
              details: ["Curated custom theme system", "Beautiful dark and light modes", "Framer Motion layout transitions", "Micro-interactive hover states"],
              badge: "Styling & Animations"
            },
            {
              title: "Lemma SDK & Pods",
              details: ["Multi-agent organization", "Automated custom workflow nodes", "Row-level database separation", "Semantic file storage indexing"],
              badge: "Backend & AI Engine"
            }
          ].map((stack) => (
            <Card key={stack.title} className="rounded-2xl border bg-card/30 p-6 flex flex-col justify-between hover:border-emerald-500/20 transition-all duration-300">
              <div className="space-y-4">
                <Badge variant="outline" className="text-[10px] tracking-wide rounded-md px-2 py-0.5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                  {stack.badge}
                </Badge>
                <h3 className="text-base font-bold">{stack.title}</h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {stack.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2">
                      <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Lemma Integration Section */}
      <section id="lemma-integration" className="bg-muted/20 border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Deep Integration</span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Powered by Lemma Cloud
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Lemma coordinates database records, multi-user permissions, file indexing, and background AI execution in a unified Pod system.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left: Agents details */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CpuIcon className="size-5 text-emerald-500" />
                Collaborative Agent Pods
              </h3>
              <div className="space-y-4">
                <div className="bg-card border rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Librarian Agent</span>
                    <Badge className="bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-[10px] border-none font-medium">Automatic Intake</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Instantiated with read/write access to Notes, Insights, Connections, and Tasks. Triggers when new content arrives to extract meta information and link semantic duplicates.
                  </p>
                </div>

                <div className="bg-card border rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Oracle Agent</span>
                    <Badge className="bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] border-none font-medium">Conversational recall</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Instantiated with read-only access to records and `/knowledge` files, plus write access to Tasks. It searches files semantically, recalls context, and maps task goals interactively.
                  </p>
                </div>
              </div>

              <div className="bg-card border rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Row-Level Security (RLS)</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Second Brain deploys on a single shared Lemma App Pod. However, Lemma's native auth handles strict multi-tenancy. Every transaction is automatically filtered by user_id at the pod database layer, assuring user data isolation.
                </p>
              </div>
            </div>

            {/* Right: Workflows diagram */}
            <div className="border bg-card/60 rounded-3xl p-6 flex flex-col justify-center space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <WorkflowIcon className="size-5 text-emerald-500" />
                Workflow Pipeline Graph
              </h3>

              {/* Styled Pipeline Diagram */}
              <div className="space-y-4 select-none">
                <div className="flex flex-col items-center">
                  <div className="bg-muted border text-muted-foreground text-xs font-semibold px-4 py-2 rounded-xl text-center shadow-xs">
                    New Note Created (Client App)
                  </div>
                  <div className="w-0.5 h-6 bg-border" />
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-4 py-2 rounded-xl text-center shadow-xs">
                    process-note Workflow Triggered
                  </div>
                  <div className="w-0.5 h-6 bg-border" />
                  <div className="bg-card border text-foreground text-xs font-semibold p-4 rounded-xl shadow-md w-full max-w-sm space-y-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Librarian Agent Pipeline</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="flex items-center gap-1 bg-muted/50 p-1.5 rounded border">
                        <CheckCircle2Icon className="size-3 text-emerald-500" />
                        <span>Summarize Note</span>
                      </div>
                      <div className="flex items-center gap-1 bg-muted/50 p-1.5 rounded border">
                        <CheckCircle2Icon className="size-3 text-emerald-500" />
                        <span>Extract Insights</span>
                      </div>
                      <div className="flex items-center gap-1 bg-muted/50 p-1.5 rounded border">
                        <CheckCircle2Icon className="size-3 text-emerald-500" />
                        <span>Discover Links</span>
                      </div>
                      <div className="flex items-center gap-1 bg-muted/50 p-1.5 rounded border">
                        <CheckCircle2Icon className="size-3 text-emerald-500" />
                        <span>Extract Tasks</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-0.5 h-6 bg-border" />
                  <div className="bg-muted border text-muted-foreground text-xs font-semibold px-4 py-2 rounded-xl text-center shadow-xs">
                    App Pod Tables Updated (RLS Scope)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 to-teal-700 px-6 py-16 shadow-2xl dark:from-emerald-950 dark:to-teal-950/40 dark:border border-emerald-500/20 sm:px-12 sm:py-20">
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Unlock Your Cognitive Potential
            </h2>
            <p className="text-emerald-100 dark:text-emerald-200/70 text-sm leading-relaxed">
              Stop letting information slip away. Build your private knowledge workspace with Second Brain today.
            </p>
            <div className="pt-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-xl bg-white hover:bg-gray-100 text-emerald-700 h-12 px-6 font-semibold shadow-md transition-all">
                    Open Your Dashboard
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => handleSignIn("signup")}
                  size="lg"
                  className="rounded-xl bg-white hover:bg-gray-100 text-emerald-700 h-12 px-6 font-semibold shadow-md transition-all"
                >
                  Create Your Second Brain
                </Button>
              )}
            </div>
          </div>

          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-card/20 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <BrainIcon className="size-4 text-emerald-500" />
            <span className="font-semibold text-foreground">Second Brain</span>
            <span>&copy; {new Date().getFullYear()} Second Brain Project.</span>
          </div>

          <div className="flex gap-6">
            <a href="https://docs.lemma.work" target="_blank" rel="noopener noreferrer" className="hover:text-foreground flex items-center gap-1 transition-colors">
              Lemma Docs
              <ExternalLinkIcon className="size-3" />
            </a>
            <button onClick={() => scrollToSection("features")} className="hover:text-foreground transition-colors">Features</button>
            <button onClick={() => scrollToSection("tech-stack")} className="hover:text-foreground transition-colors">Tech Stack</button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export function DashboardHome() {
  const router = useRouter()
  const { records: notes, refresh: refreshNotes } = useNotes()
  const { records: insights } = useInsights()
  const { records: tasks, refresh: refreshTasks } = useTasks()
  const { create: createNote } = useCreateNote()
  const { start: processNote } = useProcessNote()
  const { openWithQuery } = useChatDrawer()

  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Ctrl + K Focus Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Handle Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) return
    router.push(`/search?q=${encodeURIComponent(query)}`)
    setSearchQuery("")
  }

  // Handle Quick Action Card Click
  const handleActionClick = (action: string) => {
    if (action === "create-note") {
      setDialogOpen(true)
    }
  }

  // Create Note Submit
  const handleCreateNote = async (data: Record<string, unknown>) => {
    let newNote: Record<string, unknown> | undefined

    try {
      newNote = await createNote({ ...data, processed: false }) as Record<string, unknown>
      toast.success("Note created successfully")
      setDialogOpen(false)
      refreshNotes()
    } catch {
      toast.error("Failed to create note")
      throw new Error("Failed to create note")
    }

    if (newNote?.id) {
      try {
        await processNote({ note_id: newNote.id as string })
        toast.info("AI is analyzing and linking your note...")
        setTimeout(() => {
          refreshNotes()
          refreshTasks()
        }, 4000)
      } catch {
        toast.error("Note created, but AI processing did not start")
      }
    }
  }

  // Get dynamic counts
  const pendingTasksCount = tasks.filter((t: DashboardRecord) => t.status !== "done").length
  const processedNotesCount = notes.filter((note: DashboardRecord) => note.processed === true).length

  const latestNote = notes[0] as DashboardRecord | undefined
  const latestInsight = insights[0] as DashboardRecord | undefined
  const latestPendingTask = tasks.find((task: DashboardRecord) => task.status !== "done") as DashboardRecord | undefined

  const quickPrompts = useMemo(() => {
    const prompts: QuickPrompt[] = []

    if (latestNote) {
      const title = getTitle(latestNote, "latest note")
      const tags = getTags(latestNote)
      prompts.push({ text: `Summarize "${title}"`, icon: FileTextIcon })
      prompts.push({
        text: tags[0] ? `Find notes related to ${tags[0]}` : `Find notes related to "${title}"`,
        icon: NetworkIcon,
      })
    }

    if (latestInsight) {
      const content = getText(latestInsight, "content")
      if (content) {
        prompts.push({
          text: `Explain this insight: ${truncate(content, 72)}`,
          icon: SparklesIcon,
        })
      }
    }

    if (latestPendingTask) {
      prompts.push({
        text: `Help me finish "${getTitle(latestPendingTask, "my next task")}"`,
        icon: ListTodoIcon,
      })
    }

    if (processedNotesCount > 1) {
      prompts.push({ text: "Compare my processed notes", icon: BrainIcon })
    }

    if (pendingTasksCount > 1) {
      prompts.push({ text: "Prioritize my open tasks", icon: CheckSquareIcon })
    }

    return uniquePrompts(prompts).slice(0, 6)
  }, [latestInsight, latestNote, latestPendingTask, pendingTasksCount, processedNotesCount])

  const recentActivity = useMemo(() => {
    const activity: DashboardItem[] = [
      ...notes.slice(0, 4).map((note: DashboardRecord, index: number) => {
        const title = getTitle(note, "Untitled note")
        return {
          id: `note-${String(note.id ?? index)}`,
          title,
          meta: `Note - ${getDateLabel(note)}`,
          query: `Summarize "${title}"`,
          icon: FileTextIcon,
          timestamp: getTimestamp(note),
        }
      }),
      ...insights.slice(0, 3).map((insight: DashboardRecord, index: number) => {
        const title = truncate(getText(insight, "content") ?? "Insight", 80)
        return {
          id: `insight-${String(insight.id ?? index)}`,
          title,
          meta: `Insight - ${getDateLabel(insight)}`,
          query: `Explain this insight: ${title}`,
          icon: LightbulbIcon,
          timestamp: getTimestamp(insight),
        }
      }),
      ...tasks.slice(0, 3).map((task: DashboardRecord, index: number) => {
        const title = getTitle(task, "Task")
        return {
          id: `task-${String(task.id ?? index)}`,
          title,
          meta: `Task - ${getDateLabel(task)}`,
          query: `Help me with "${title}"`,
          icon: ListTodoIcon,
          timestamp: getTimestamp(task),
        }
      }),
    ]

    return activity
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
  }, [insights, notes, tasks])

  const memoryRecall = useMemo(() => {
    const datedNotes = notes
      .filter((note: DashboardRecord) => getTimestamp(note) > 0)
      .sort((a: DashboardRecord, b: DashboardRecord) => getTimestamp(a) - getTimestamp(b))

    const note = datedNotes.find((item: DashboardRecord) => getText(item, "summary") || getText(item, "content"))
    if (!note || notes.length < 2) return null

    const title = getTitle(note, "older note")
    const detail = truncate(getText(note, "summary") ?? getText(note, "content") ?? title, 130)

    return {
      title,
      detail,
      date: getDateLabel(note),
      query: `Recall what I wrote about "${title}"`,
    }
  }, [notes])

  return (
    <div className="relative min-h-screen">
      {/* Redesigned Three-Column Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">

        {/* Main content (Left & Center Columns on Desktop, spanning 3 cols) */}
        <div className="lg:col-span-3 space-y-10">

          {/* Centered Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-8 space-y-3"
          >
            <div className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 mb-2 shadow-sm">
              <BrainIcon className="size-6" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              What would you like to <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">know</span>?
            </h1>
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              Your AI Second Brain is here to help you connect, recall, and synthesize your knowledge.
            </p>
          </motion.div>

          {/* Large AI Search Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute inset-0 -m-1 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 group-focus-within:opacity-100 blur-md transition-all duration-300 pointer-events-none" />

              <div className="relative flex items-center bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-full py-2.5 pl-5 pr-3 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-300 group-focus-within:border-emerald-500 group-focus-within:ring-2 group-focus-within:ring-emerald-500/10">
                <SearchIcon className="size-5 text-muted-foreground mr-3 shrink-0" />

                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask anything about your notes, documents or ideas..."
                  className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/70"
                />

                <div className="flex items-center gap-2">
                  {/* Ctrl + K Badge */}
                  <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-gray-200 dark:border-zinc-800 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground/80">
                    <span className="text-xs">Ctrl</span>K
                  </kbd>

                  {/* Send Button */}
                  <Button
                    type="submit"
                    size="icon"
                    className="size-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10 shrink-0 transition-transform active:scale-95"
                  >
                    <SendIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>

          {quickPrompts.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="max-w-3xl mx-auto flex flex-wrap justify-center gap-2"
            >
              {quickPrompts.map((prompt) => (
                <motion.button
                  key={prompt.text}
                  variants={itemVariants}
                  onClick={() => openWithQuery(prompt.text)}
                  className="group flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 px-3.5 py-1.5 shadow-sm transition-all duration-200 hover:border-emerald-500/30 hover:text-emerald-600 dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:text-zinc-300 dark:hover:text-emerald-400"
                >
                  <prompt.icon className="size-3.5 text-muted-foreground/80 group-hover:text-emerald-500" />
                  <span>{prompt.text}</span>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Try These Actions Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground/80 uppercase">
              Quick Actions
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* Card 1: Upload Document */}
              <Link href="/documents" className="h-full">
                <motion.div
                  whileHover={{ y: -5, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative flex flex-col justify-between h-full rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-5 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRightIcon className="size-4 text-emerald-500 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                    <UploadIcon className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Upload Document</h4>
                    <p className="mt-1 text-xs text-muted-foreground">Upload PDFs, DOCX, PPTX files to sync.</p>
                  </div>
                </motion.div>
              </Link>

              {/* Card 2: Create Note */}
              <motion.div
                whileHover={{ y: -5, scale: 1.01 }}
                onClick={() => handleActionClick("create-note")}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group relative flex flex-col justify-between h-full rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-5 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRightIcon className="size-4 text-emerald-500 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                  <FileTextIcon className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Create Note</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Write and organize your ideas immediately.</p>
                </div>
              </motion.div>

              {/* Card 3: Generate Insights */}
              <Link href="/insights" className="h-full">
                <motion.div
                  whileHover={{ y: -5, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative flex flex-col justify-between h-full rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-5 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRightIcon className="size-4 text-emerald-500 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                    <SparklesIcon className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Generate Insights</h4>
                    <p className="mt-1 text-xs text-muted-foreground">Discover latent patterns in notes.</p>
                  </div>
                </motion.div>
              </Link>

              {/* Card 4: Convert to Tasks */}
              <Link href="/tasks" className="h-full">
                <motion.div
                  whileHover={{ y: -5, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative flex flex-col justify-between h-full rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-5 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRightIcon className="size-4 text-emerald-500 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                    <CheckSquareIcon className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Convert To Tasks</h4>
                    <p className="mt-1 text-xs text-muted-foreground">Automatically extract action items.</p>
                  </div>
                </motion.div>
              </Link>

            </div>
          </div>

        </div>

        {/* Right Sidebar Column (Desktop Only / Collapses on mobile/tablet) */}
        <div className="space-y-6 lg:border-l lg:border-gray-100 lg:pl-6 dark:lg:border-zinc-800/50">

          {/* Recent Activity */}
          <Card className="rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 shadow-sm bg-white dark:bg-zinc-950 overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-2 border-b border-gray-50 dark:border-zinc-900">
              <HistoryIcon className="size-4 text-muted-foreground" />
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <div className="space-y-1 max-h-[220px] overflow-y-auto no-scrollbar">
                {recentActivity.length > 0 ? (
                  recentActivity.map((item) => {
                    const Icon = item.icon

                    return (
                      <button
                        key={item.id}
                        onClick={() => openWithQuery(item.query)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-zinc-900 group transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="size-4 text-muted-foreground/80 shrink-0 group-hover:text-emerald-500 transition-colors" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground/70">{item.meta}</p>
                          </div>
                        </div>
                        <ChevronRightIcon className="size-3.5 text-muted-foreground/30 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    )
                  })
                ) : (
                  <div className="p-3 text-xs text-muted-foreground">
                    No activity yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Summary */}
          <Card className="rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 shadow-sm bg-white dark:bg-zinc-950">
            <CardHeader className="border-b border-gray-50 dark:border-zinc-900">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Knowledge Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Notes</span>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 border-none rounded-lg font-medium px-2 py-0.5">
                  {notes.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Processed Notes</span>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-none rounded-lg font-medium px-2 py-0.5">
                  {processedNotesCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Insights</span>
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-none rounded-lg font-medium px-2 py-0.5">
                  {insights.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tasks Pending</span>
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 border-none rounded-lg font-medium px-2 py-0.5">
                  {pendingTasksCount}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {memoryRecall && (
            <Card className="rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01] shadow-sm overflow-hidden">
              <CardContent className="">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  <SparklesIcon className="size-3.5" />
                  <span>Memory Recall</span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Revisit <span className="font-semibold text-emerald-700 dark:text-emerald-400">{memoryRecall.title}</span> from {memoryRecall.date}. {memoryRecall.detail}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openWithQuery(memoryRecall.query)}
                  className="w-full text-xs border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-700 text-emerald-600 dark:text-emerald-400 dark:border-emerald-500/10 dark:hover:bg-emerald-500/20 font-medium rounded-xl h-8 transition-colors"
                >
                  Open Memory
                </Button>
              </CardContent>
            </Card>
          )}

        </div>

      </div>

      {/* Note Creation Dialog */}
      <CreateNoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateNote}
      />
    </div>
  )
}
