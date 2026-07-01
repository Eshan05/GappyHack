"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  SparklesIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  TagIcon,
  LinkIcon,
  ExternalLinkIcon,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const typeConfig: Record<string, { label: string; badge: string }> = {
  note: {
    label: "Note",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20",
  },
  link: {
    label: "Link",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  idea: {
    label: "Idea",
    badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20",
  },
  snippet: {
    label: "Snippet",
    badge: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/20",
  },
  bookmark: {
    label: "Bookmark",
    badge: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
  },
  document: {
    label: "Document",
    badge: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/20",
  },
}

interface NoteDetailSheetProps {
  note: {
    id: string
    title: string
    content: string
    type: string
    tags: string[] | null
    summary: string | null
    processed: boolean
    source_url?: string
    created_at: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (note: NoteDetailSheetProps["note"]) => void
  onDelete: (id: string) => void
  onProcess: (id: string) => void
}

export function NoteDetailSheet({
  note,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onProcess,
}: NoteDetailSheetProps) {
  if (!note) return null

  const config = typeConfig[note.type] ?? typeConfig.note

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={`text-[10px] font-medium ${config.badge}`}>
              {config.label}
            </Badge>
            {note.processed && (
              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300">
                <SparklesIcon className="mr-1 size-2.5" />
                processed
              </Badge>
            )}
          </div>
          <SheetTitle className="text-lg">{note.title || "Untitled"}</SheetTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarIcon className="size-3" />
              {new Date(note.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </SheetHeader>

        <div className="px-4">
          {note.summary && (
            <div className="mb-4 rounded-lg border bg-muted/30 p-3">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                AI Summary
              </p>
              <p className="text-sm leading-relaxed">{note.summary}</p>
            </div>
          )}

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {note.content || "No content"}
            </ReactMarkdown>
          </div>

          {note.source_url && /^https?:\/\//i.test(note.source_url) && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border p-3">
              <LinkIcon className="size-4 text-muted-foreground" />
              <a
                href={note.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate text-sm text-primary hover:underline"
              >
                {note.source_url}
              </a>
              <ExternalLinkIcon className="size-3 text-muted-foreground" />
            </div>
          )}

          {note.tags && note.tags.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <TagIcon className="size-3" />
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {note.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mx-4 mt-6 flex gap-2 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              onEdit(note)
              onOpenChange(false)
            }}
          >
            <PencilIcon className="mr-1.5 size-3.5" />
            Edit
          </Button>
          {!note.processed && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                onProcess(note.id)
                onOpenChange(false)
              }}
            >
              <SparklesIcon className="mr-1.5 size-3.5" />
              Process
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                />
              }
            >
              <TrashIcon className="size-3.5" />
            </AlertDialogTrigger>
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
                  onClick={() => {
                    onDelete(note.id)
                    onOpenChange(false)
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  )
}
