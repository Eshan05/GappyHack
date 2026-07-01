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
  const productAreas = [
    { title: "Capture", description: "Save notes, URLs, snippets, and documents.", icon: FileTextIcon },
    { title: "Understand", description: "Extract summaries, insights, tasks, and links.", icon: SparklesIcon },
    { title: "Recall", description: "Search and ask Oracle with source-backed answers.", icon: SearchIcon },
  ]

  return (
    <div className="mx-auto flex min-h-[calc(100svh-8rem)] max-w-6xl flex-col justify-center gap-8">
      <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <BrainIcon className="size-3.5 text-emerald-600" />
            AI knowledge workspace
          </div>
          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              A private second brain for notes, documents, tasks, and recall.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
              Capture knowledge once, let the system process it, then search, chat, and reconnect it when you need it.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button render={<Link href="/dashboard" />} className="h-10 rounded-lg">
              Open Dashboard
              <ArrowRightIcon className="ml-1.5 size-4" />
            </Button>
            <Button render={<Link href="/notes" />} variant="outline" className="h-10 rounded-lg">
              Add Knowledge
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <div>
              <p className="text-sm font-semibold">Second Brain loop</p>
              <p className="text-xs text-muted-foreground">Capture, process, retrieve, act</p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              App pod
            </Badge>
          </div>
          <div className="space-y-3">
            {productAreas.map((area, index) => (
              <div key={area.title} className="flex items-start gap-3 rounded-lg border bg-background p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <area.icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm font-medium">{area.title}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{area.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
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
            <CardContent className="p-2">
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
            <CardContent className="p-4 space-y-3">
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
