"use client"

import { useEffect, useState } from "react"
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useProcessNote } from "@/hooks/use-lemma"
import { NoteCard } from "@/components/notes/note-card"
import { NoteDetailSheet } from "@/components/notes/note-detail-sheet"
import { CreateNoteDialog } from "@/components/notes/create-note-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircleIcon,
  FileTextIcon,
  Loader2Icon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  buildNoteMetadata,
  getProcessingStatus,
  markProcessingFailed,
  markProcessingStarted,
  type ProcessingStatus,
} from "@/lib/knowledge-metadata"

export default function NotesPage() {
  const { records: notes, isLoading, refresh } = useNotes()
  const { create } = useCreateNote()
  const { update } = useUpdateNote()
  const { remove } = useDeleteNote()
  const { start } = useProcessNote()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Record<string, unknown> | null>(null)
  const [selectedNote, setSelectedNote] = useState<Record<string, unknown> | null>(null)
  const [search, setSearch] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [openedFromUrl, setOpenedFromUrl] = useState<string | null>(null)

  const allTags = Array.from(
    new Set(
      notes.flatMap((n: Record<string, unknown>) =>
        Array.isArray(n.tags) ? (n.tags as string[]) : []
      )
    )
  ).sort()

  const filtered = notes.filter((n: Record<string, unknown>) => {
    const matchesSearch =
      !search ||
      ((n.title as string) ?? "").toLowerCase().includes(search.toLowerCase()) ||
      ((n.content as string) ?? "").toLowerCase().includes(search.toLowerCase())
    const matchesTag =
      !selectedTag ||
      (Array.isArray(n.tags) && (n.tags as string[]).includes(selectedTag))
    return matchesSearch && matchesTag
  })

  const processingStats = notes.reduce<Record<ProcessingStatus, number>>(
    (acc, note: Record<string, unknown>) => {
      const status = getProcessingStatus(
        {
          processed: note.processed as boolean | null | undefined,
          metadata: note.metadata,
        },
        processingIds.has(note.id as string)
      )

      acc[status] += 1
      return acc
    },
    {
      idle: 0,
      queued: 0,
      processing: 0,
      processed: 0,
      failed: 0,
    }
  )

  const unprocessedNoteIds = notes
    .filter((note: Record<string, unknown>) =>
      getProcessingStatus(
        {
          processed: note.processed as boolean | null | undefined,
          metadata: note.metadata,
        },
        processingIds.has(note.id as string)
      ) === "idle"
    )
    .map((note: Record<string, unknown>) => note.id as string)

  const failedNoteIds = notes
    .filter((note: Record<string, unknown>) =>
      getProcessingStatus(
        {
          processed: note.processed as boolean | null | undefined,
          metadata: note.metadata,
        },
        processingIds.has(note.id as string)
      ) === "failed"
    )
    .map((note: Record<string, unknown>) => note.id as string)

  useEffect(() => {
    if (typeof window === "undefined" || notes.length === 0) return

    const noteId = new URLSearchParams(window.location.search).get("open")
    if (!noteId || openedFromUrl === noteId) return

    const note = notes.find((item: Record<string, unknown>) => item.id === noteId)
    if (note) {
      setSelectedNote(note as Record<string, unknown>)
      setOpenedFromUrl(noteId)
    }
  }, [notes, openedFromUrl])

  async function handleCreate(data: Record<string, unknown>) {
    try {
      await create({
        ...data,
        processed: false,
        metadata: buildNoteMetadata({
          sourceUrl: data.source_url as string | undefined,
        }),
      })
      toast.success("Note created")
      refresh()
    } catch {
      toast.error("Failed to create note")
      throw new Error("Failed to create note")
    }
  }

  async function handleUpdate(data: Record<string, unknown>) {
    if (!editingNote) return
    try {
      await update(
        {
          ...data,
          metadata: buildNoteMetadata({
            existing: editingNote.metadata,
            sourceUrl: data.source_url as string | undefined,
          }),
        },
        { recordId: editingNote.id as string }
      )
      toast.success("Note updated")
      refresh()
    } catch {
      toast.error("Failed to update note")
      throw new Error("Failed to update note")
    }
  }

  async function handleDelete(id: string) {
    try {
      await remove({ recordId: id })
      toast.success("Note deleted")
      refresh()
    } catch {
      toast.error("Failed to delete note")
    }
  }

  async function handleProcess(id: string, options: { silent?: boolean } = {}) {
    if (processingIds.has(id)) return false

    const note = notes.find((item: Record<string, unknown>) => item.id === id)
    setProcessingIds((prev) => new Set(prev).add(id))
    try {
      await update(
        {
          processed: false,
          metadata: markProcessingStarted(note?.metadata),
        },
        { recordId: id }
      )
      await start({ note_id: id })
      if (!options.silent) toast.success("AI processing started")
      setTimeout(() => {
        refresh()
        setProcessingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }, 4000)
      return true
    } catch {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      await update(
        {
          processed: false,
          metadata: markProcessingFailed(note?.metadata, "Could not start AI processing."),
        },
        { recordId: id }
      ).catch(() => undefined)
      refresh()
      if (!options.silent) toast.error("Failed to process note")
      return false
    }
  }

  async function handleProcessBatch(ids: string[], label: string) {
    const nextIds = ids.filter((id) => !processingIds.has(id))
    if (nextIds.length === 0) return

    const loadingToast = toast.loading(`${label} ${nextIds.length} note${nextIds.length !== 1 ? "s" : ""}...`)
    let started = 0

    for (const id of nextIds) {
      const didStart = await handleProcess(id, { silent: true })
      if (didStart) started += 1
    }

    toast.dismiss(loadingToast)
    if (started > 0) {
      toast.success(`Started AI processing for ${started} note${started !== 1 ? "s" : ""}`)
    } else {
      toast.error("Could not start AI processing")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground">
            {notes.length} note{notes.length !== 1 ? "s" : ""} in your second brain
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Popover>
            <PopoverTrigger
              render={<Button variant="outline" size="sm" />}
            >
              {processingStats.failed > 0 ? (
                <AlertCircleIcon className="mr-1.5 size-3.5 text-red-600" />
              ) : processingStats.processing + processingStats.queued > 0 ? (
                <Loader2Icon className="mr-1.5 size-3.5 animate-spin text-amber-600" />
              ) : (
                <SparklesIcon className="mr-1.5 size-3.5 text-emerald-600" />
              )}
              Processing
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <PopoverHeader>
                <PopoverTitle>Processing health</PopoverTitle>
                <PopoverDescription>
                  Track AI extraction across your notes.
                </PopoverDescription>
              </PopoverHeader>
              <div className="grid grid-cols-2 gap-2">
                <ProcessingStat label="Unprocessed" value={processingStats.idle} />
                <ProcessingStat label="Processed" value={processingStats.processed} />
                <ProcessingStat label="In flight" value={processingStats.processing + processingStats.queued} />
                <ProcessingStat label="Failed" value={processingStats.failed} tone="red" />
              </div>
              <div className="mt-2 grid gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={unprocessedNoteIds.length === 0}
                  onClick={() => void handleProcessBatch(unprocessedNoteIds, "Processing")}
                >
                  <SparklesIcon className="mr-1.5 size-3.5" />
                  Process unprocessed
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={failedNoteIds.length === 0}
                  onClick={() => void handleProcessBatch(failedNoteIds, "Retrying")}
                >
                  <RotateCcwIcon className="mr-1.5 size-3.5" />
                  Retry failed
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={() => setDialogOpen(true)} className="shadow-md shadow-primary/20">
            <PlusIcon className="mr-2 size-4" />
            New Note
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter notes..."
            className="pl-9"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Tags:
            </span>
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "secondary"}
                className="cursor-pointer text-xs transition-colors"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                {tag}
                {selectedTag === tag && <XIcon className="ml-1 size-3" />}
              </Badge>
            ))}
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="rounded-2xl bg-muted/50 p-6">
            <FileTextIcon className="size-10 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <p className="font-medium text-muted-foreground">
              {search ? "No matching notes" : "No notes yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              {search
                ? "Try a different search term"
                : "Create your first note to start building your knowledge base."}
            </p>
          </div>
          {!search && (
            <Button
              variant="outline"
              onClick={() => setDialogOpen(true)}
              className="mt-2"
            >
              <PlusIcon className="mr-2 size-4" />
              Create Note
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note: Record<string, unknown>) => (
            <NoteCard
              key={note.id as string}
              note={note as never}
              onClick={(n) => setSelectedNote(n as unknown as Record<string, unknown>)}
              onEdit={(n) => {
                setEditingNote(n as unknown as Record<string, unknown>)
              }}
              onDelete={handleDelete}
              onProcess={handleProcess}
              isProcessing={processingIds.has(note.id as string)}
            />
          ))}
        </div>
      )}

      <NoteDetailSheet
        note={selectedNote as never}
        open={!!selectedNote}
        onOpenChange={(open) => {
          if (!open) setSelectedNote(null)
        }}
        onEdit={(n) => setEditingNote(n as unknown as Record<string, unknown>)}
        onDelete={handleDelete}
        onProcess={handleProcess}
        isProcessing={selectedNote ? processingIds.has(selectedNote.id as string) : false}
      />

      <CreateNoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
      />

      {editingNote && (
        <CreateNoteDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingNote(null)
          }}
          onSubmit={handleUpdate}
          initial={editingNote as never}
        />
      )}
    </div>
  )
}

function ProcessingStat({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number
  tone?: "default" | "red"
}) {
  return (
    <div className="rounded-lg border bg-background p-2">
      <p className={`text-lg font-semibold ${tone === "red" && value > 0 ? "text-red-600" : ""}`}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}
