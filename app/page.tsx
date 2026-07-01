"use client"

import { useState, useEffect, useRef } from "react"
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
  MessageSquareIcon,
  ChevronRightIcon,
  CheckSquareIcon,
  BookOpenIcon,
  CompassIcon,
  PlusIcon,
  ArrowRightIcon,
  HistoryIcon,
} from "lucide-react"

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

const recentConversations = [
  { topic: "RAG Architecture", time: "2h ago" },
  { topic: "Summarize Research Paper", time: "1d ago" },
  { topic: "What are Vector Databases?", time: "3d ago" },
  { topic: "ML vs Deep Learning", time: "1w ago" },
]

const quickPrompts = [
  { text: "Summarize my notes", icon: FileTextIcon },
  { text: "Find related notes", icon: NetworkIcon },
  { text: "Generate insights", icon: SparklesIcon },
  { text: "Convert to tasks", icon: ListTodoIcon },
  { text: "Create flashcards", icon: BrainIcon },
  { text: "Explain this topic", icon: LightbulbIcon },
  { text: "Write documentation", icon: BookOpenIcon },
  { text: "Research mode", icon: CompassIcon },
]

export default function DashboardPage() {
  const { records: notes, refresh: refreshNotes } = useNotes()
  const { records: insights } = useInsights()
  const { records: tasks, refresh: refreshTasks } = useTasks()
  const { create: createNote } = useCreateNote()
  const { start: processNote } = useProcessNote()
  const { openWithQuery } = useChatDrawer()

  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Document count - stored locally or fallback to default
  const [docCount, setDocCount] = useState(3)

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
    if (!searchQuery.trim()) return
    openWithQuery(searchQuery.trim())
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
    try {
      const newNote = await createNote({ ...data, processed: false })
      toast.success("Note created successfully")
      setDialogOpen(false)
      refreshNotes()

      // Automatically trigger AI processing
      if (newNote && newNote.id) {
        await processNote({ note_id: newNote.id as string })
        toast.info("AI is analyzing and linking your note...")
        setTimeout(() => {
          refreshNotes()
          refreshTasks()
        }, 4000)
      }
    } catch {
      toast.error("Failed to create note")
    }
  }

  // Get dynamic counts
  const pendingTasksCount = tasks.filter((t: Record<string, unknown>) => t.status !== "done").length

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

          {/* Quick Prompt Pills */}
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
                className="flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 px-3.5 py-1.5 shadow-sm transition-all duration-200 hover:border-emerald-500/30 hover:text-emerald-600 dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:text-zinc-300 dark:hover:text-emerald-400"
              >
                <prompt.icon className="size-3.5 text-muted-foreground/80 group-hover:text-emerald-500" />
                <span>{prompt.text}</span>
              </motion.button>
            ))}
          </motion.div>

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
          
          {/* Recent Conversations */}
          <Card className="rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 shadow-sm bg-white dark:bg-zinc-950 overflow-hidden">
            <CardHeader className="py-4 px-4 flex flex-row items-center gap-2 border-b border-gray-50 dark:border-zinc-900">
              <HistoryIcon className="size-4 text-muted-foreground" />
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recent Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1 max-h-[220px] overflow-y-auto no-scrollbar">
                {recentConversations.map((chat, idx) => (
                  <button
                    key={idx}
                    onClick={() => openWithQuery(`Tell me about ${chat.topic}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-zinc-900 group transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MessageSquareIcon className="size-4 text-muted-foreground/80 shrink-0 group-hover:text-emerald-500 transition-colors" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {chat.topic}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70">{chat.time}</p>
                      </div>
                    </div>
                    <ChevronRightIcon className="size-3.5 text-muted-foreground/30 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Summary */}
          <Card className="rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 shadow-sm bg-white dark:bg-zinc-950">
            <CardHeader className="py-4 px-4 border-b border-gray-50 dark:border-zinc-900">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Today's Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Notes Created</span>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 border-none rounded-lg font-medium px-2 py-0.5">
                  {notes.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Documents Uploaded</span>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-none rounded-lg font-medium px-2 py-0.5">
                  {docCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Insights Generated</span>
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

          {/* Memory Recall */}
          <Card className="rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01] shadow-sm overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <SparklesIcon className="size-3.5" />
                <span>Memory Recall</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                You worked on <span className="font-semibold text-emerald-700 dark:text-emerald-400">Crime Analytics</span> two months ago. Suggested because today's queries show a similar pattern.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openWithQuery("Show me the Crime Analytics notes from two months ago")}
                className="w-full text-xs border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-700 text-emerald-600 dark:text-emerald-400 dark:border-emerald-500/10 dark:hover:bg-emerald-500/20 font-medium rounded-xl h-8 transition-colors"
              >
                Open Memory
              </Button>
            </CardContent>
          </Card>

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
