"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const noteTypes = ["note", "article", "bookmark", "link", "idea", "snippet"] as const

interface CreateNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    title: string
    content: string
    type: string
    source_url?: string
    tags?: string[]
  }) => void | Promise<void>
  initial?: {
    id?: string
    title: string
    content: string
    type: string
    source_url?: string
    tags?: string[] | null
  }
}

export function CreateNoteDialog({
  open,
  onOpenChange,
  onSubmit,
  initial,
}: CreateNoteDialogProps) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [content, setContent] = useState(initial?.content ?? "")
  const [type, setType] = useState(initial?.type ?? "note")
  const [sourceUrl, setSourceUrl] = useState(initial?.source_url ?? "")
  const [tagsInput, setTagsInput] = useState(
    initial?.tags?.join(", ") ?? ""
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmitting) return
    setFormError(null)

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    const trimmedUrl = sourceUrl.trim()

    if (!trimmedTitle || !trimmedContent) {
      setFormError("Title and content are required.")
      return
    }

    if (trimmedUrl && !/^https?:\/\//i.test(trimmedUrl)) {
      setFormError("Use a full URL that starts with http:// or https://.")
      return
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    setIsSubmitting(true)
    try {
      await onSubmit({
        title: trimmedTitle,
        content: trimmedContent,
        type,
        source_url: trimmedUrl || undefined,
        tags: tags.length > 0 ? tags : undefined,
      })
      if (!initial) {
        setTitle("")
        setContent("")
        setType("note")
        setSourceUrl("")
        setTagsInput("")
      }
      onOpenChange(false)
    } catch {
      setFormError(initial ? "Failed to save note." : "Failed to create note.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Note" : "New Note"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v ?? "note")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {noteTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts..."
              rows={6}
              required
            />
          </div>
          {(type === "article" || type === "bookmark" || type === "link") && (
            <div className="space-y-2">
              <Label htmlFor="source_url">URL</Label>
              <Input
                id="source_url"
                type="url"
                value={sourceUrl}
                onChange={(e) => {
                  setSourceUrl(e.target.value)
                  setFormError(null)
                }}
                placeholder="https://..."
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ai, research, ideas"
            />
          </div>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (initial ? "Saving..." : "Creating...") : initial ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
