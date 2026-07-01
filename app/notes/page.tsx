"use client"

import { useEffect, useState } from "react"
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useProcessNote } from "@/hooks/use-lemma"
import { NoteCard } from "@/components/notes/note-card"
import { NoteDetailSheet } from "@/components/notes/note-detail-sheet"
import { CreateNoteDialog } from "@/components/notes/create-note-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { PlusIcon, SearchIcon, FileTextIcon, XIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

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
      await create({ ...data, processed: false })
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
      await update(data, { recordId: editingNote.id as string })
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

  async function handleProcess(id: string) {
    if (processingIds.has(id)) return

    setProcessingIds((prev) => new Set(prev).add(id))
    try {
      await start({ note_id: id })
      toast.success("AI processing started")
      setTimeout(() => {
        refresh()
        setProcessingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }, 4000)
    } catch {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast.error("Failed to process note")
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
        <Button onClick={() => setDialogOpen(true)} className="shadow-md shadow-primary/20">
          <PlusIcon className="mr-2 size-4" />
          New Note
        </Button>
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
