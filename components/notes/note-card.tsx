"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  MoreHorizontalIcon,
  TrashIcon,
  PencilIcon,
  SparklesIcon,
  CalendarIcon,
  Loader2Icon,
} from "lucide-react"

interface NoteCardProps {
  note: {
    id: string
    title: string
    content: string
    type: string
    tags: string[] | null
    summary: string | null
    processed: boolean
    created_at: string
  }
  onClick?: (note: NoteCardProps["note"]) => void
  onEdit: (note: NoteCardProps["note"]) => void
  onDelete: (id: string) => void
  onProcess: (id: string) => void
  isProcessing?: boolean
}

const typeConfig: Record<string, { label: string; gradient: string; badge: string }> = {
  note: {
    label: "Note",
    gradient: "from-blue-500/10 to-indigo-500/5",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20",
  },
  link: {
    label: "Link",
    gradient: "from-emerald-500/10 to-green-500/5",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  idea: {
    label: "Idea",
    gradient: "from-purple-500/10 to-violet-500/5",
    badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20",
  },
  snippet: {
    label: "Snippet",
    gradient: "from-orange-500/10 to-amber-500/5",
    badge: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/20",
  },
  bookmark: {
    label: "Bookmark",
    gradient: "from-yellow-500/10 to-amber-500/5",
    badge: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
  },
  document: {
    label: "Document",
    gradient: "from-red-500/10 to-rose-500/5",
    badge: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/20",
  },
}

export function NoteCard({ note, onClick, onEdit, onDelete, onProcess, isProcessing = false }: NoteCardProps) {
  const config = typeConfig[note.type] ?? typeConfig.note
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
    <Card
      className="group relative cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
      onClick={() => onClick?.(note)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-sm font-semibold">
            {note.title || "Untitled"}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Note actions"
                  className="size-7 shrink-0 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(note)}>
                <PencilIcon className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              {!note.processed && (
                <DropdownMenuItem
                  disabled={isProcessing}
                  onClick={() => onProcess(note.id)}
                >
                  {isProcessing ? (
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="mr-2 size-4" />
                  )}
                  {isProcessing ? "Processing..." : "Process with AI"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteOpen(true)
                }}
              >
                <TrashIcon className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={`text-[10px] font-medium ${config.badge}`}
          >
            {config.label}
          </Badge>
          {note.processed && (
            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300">
              <SparklesIcon className="mr-1 size-2.5" />
              processed
            </Badge>
          )}
          {isProcessing && (
            <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300">
              <Loader2Icon className="mr-1 size-2.5 animate-spin" />
              processing
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative pb-3">
        <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {note.summary || note.content || "No content"}
        </p>
        {note.tags && note.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {(note.tags as string[]).slice(0, 4).map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground/50">
          <CalendarIcon className="size-3" />
          {new Date(note.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </CardContent>
    </Card>
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete note?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &ldquo;{note.title}&rdquo;. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onDelete(note.id)}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
