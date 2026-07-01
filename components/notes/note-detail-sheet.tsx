"use client"

import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Loader2Icon,
  AlertCircleIcon,
  RotateCcwIcon,
  CheckCircle2Icon,
  CircleIcon,
  GitBranchIcon,
  ListTodoIcon,
  MessageCircleIcon,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useConnections, useInsights, useNotes, useTasks } from "@/hooks/use-lemma"
import { useChatDrawer } from "@/context/chat-drawer-context"
import {
  getMetadata,
  getProcessingLabel,
  getProcessingStatus,
  getSourceRefs,
  type SourceRef,
} from "@/lib/knowledge-metadata"

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
    metadata?: unknown
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (note: NoteDetailSheetProps["note"]) => void
  onDelete: (id: string) => void
  onProcess: (id: string) => void
  isProcessing?: boolean
}

export function NoteDetailSheet({
  note,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onProcess,
  isProcessing = false,
}: NoteDetailSheetProps) {
  const noteId = note?.id ?? "__no_note__"
  const { records: insights } = useInsights(noteId)
  const { records: tasks } = useTasks([{ field: "note_id", op: "eq", value: noteId }])
  const { records: notes } = useNotes()
  const { records: connections } = useConnections()
  const { openWithQuery } = useChatDrawer()

  if (!note) return null

  const config = typeConfig[note.type] ?? typeConfig.note
  const processingStatus = getProcessingStatus(note, isProcessing)
  const metadata = getMetadata(note.metadata)
  const processingError = metadata.processing?.error
  const sourceRefs = getSourceRefs(note.metadata)
  const canProcess = processingStatus === "idle" || processingStatus === "failed"
  const noteMap = new Map(notes.map((item: Record<string, unknown>) => [item.id as string, item]))
  const relatedConnections = connections.filter((connection: Record<string, unknown>) => {
    return connection.source_id === note.id || connection.target_id === note.id
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={`text-[10px] font-medium ${config.badge}`}>
              {config.label}
            </Badge>
            {processingStatus === "processed" && (
              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300">
                <SparklesIcon className="mr-1 size-2.5" />
                processed
              </Badge>
            )}
            {(processingStatus === "queued" || processingStatus === "processing") && (
              <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300">
                <Loader2Icon className="mr-1 size-2.5 animate-spin" />
                {getProcessingLabel(processingStatus)}
              </Badge>
            )}
            {processingStatus === "failed" && (
              <Badge variant="outline" className="border-red-500/20 bg-red-500/10 text-[10px] text-red-700 dark:text-red-300">
                <AlertCircleIcon className="mr-1 size-2.5" />
                failed
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

        <Tabs defaultValue="content" className="px-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-4 space-y-4">
            {note.summary && (
              <div className="rounded-lg border bg-muted/30 p-3">
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

            {note.tags && note.tags.length > 0 && (
              <div>
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
          </TabsContent>

          <TabsContent value="ai" className="mt-4 space-y-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                openWithQuery(
                  `Use this note and cite its title when answering. Note title: ${note.title}. Note id: ${note.id}. Summarize what matters, related tasks, related insights, and what I should do next.`
                )
                onOpenChange(false)
              }}
            >
              <MessageCircleIcon className="mr-1.5 size-3.5" />
              Ask Oracle about this note
            </Button>

            <RelatedSection
              title="Insights"
              empty="No extracted insights yet."
              items={insights}
              icon={<SparklesIcon className="size-3.5 text-yellow-600" />}
              renderItem={(insight) => (
                <>
                  <p className="text-sm">{String(insight.content ?? "Untitled insight")}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {String(insight.type ?? "insight").replace("_", " ")}
                    </Badge>
                    {insight.confidence != null && (
                      <span className="text-[10px] text-muted-foreground">
                        {(Number(insight.confidence) * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>
                </>
              )}
            />

            <RelatedSection
              title="Tasks"
              empty="No tasks were extracted from this note."
              items={tasks}
              icon={<ListTodoIcon className="size-3.5 text-emerald-600" />}
              renderItem={(task) => (
                <>
                  <p className="text-sm font-medium">{String(task.title ?? "Untitled task")}</p>
                  {task.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{String(task.description)}</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {String(task.status ?? "pending")}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {String(task.priority ?? "medium")}
                    </Badge>
                    {task.due_date ? (
                      <span className="text-[10px] text-muted-foreground">
                        Due {new Date(String(task.due_date)).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>
                </>
              )}
            />

            <RelatedSection
              title="Connections"
              empty="No explicit connections yet."
              items={relatedConnections}
              icon={<GitBranchIcon className="size-3.5 text-blue-600" />}
              renderItem={(connection) => {
                const otherId =
                  connection.source_id === note.id
                    ? connection.target_id
                    : connection.source_id
                const otherNote = noteMap.get(otherId as string)

                return (
                  <>
                    <Link
                      href={`/notes?open=${encodeURIComponent(String(otherId))}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {String(otherNote?.title ?? "Related note")}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {String(connection.relationship ?? "Related knowledge")}
                    </p>
                    {connection.strength != null && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        Strength {(Number(connection.strength) * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </>
                )
              }}
            />
          </TabsContent>

          <TabsContent value="sources" className="mt-4 space-y-3">
            {note.source_url && /^https?:\/\//i.test(note.source_url) && (
              <SourceRefCard
                source={{
                  type: "url",
                  url: note.source_url,
                  title: "Original URL",
                }}
              />
            )}
            {sourceRefs.length > 0 ? (
              sourceRefs.map((source, index) => (
                <SourceRefCard
                  key={`${source.type}-${source.id ?? source.url ?? source.path ?? index}`}
                  source={source}
                />
              ))
            ) : !note.source_url ? (
              <EmptyDetail icon={<LinkIcon className="size-4" />} text="No sources captured for this note." />
            ) : null}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-3">
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center gap-2">
                {processingStatus === "processed" ? (
                  <CheckCircle2Icon className="size-4 text-emerald-600" />
                ) : processingStatus === "failed" ? (
                  <AlertCircleIcon className="size-4 text-red-600" />
                ) : (
                  <CircleIcon className="size-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">Processing is {getProcessingLabel(processingStatus)}</p>
                  <p className="text-xs text-muted-foreground">
                    {metadata.processing?.attempts ?? 0} attempt{(metadata.processing?.attempts ?? 0) !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                <HistoryRow label="Captured" value={formatDateTime(metadata.provenance?.captured_at)} />
                <HistoryRow label="Updated" value={formatDateTime(metadata.provenance?.updated_at)} />
                <HistoryRow label="Started" value={formatDateTime(metadata.processing?.started_at)} />
                <HistoryRow label="Completed" value={formatDateTime(metadata.processing?.completed_at)} />
              </div>
            </div>

            {processingStatus === "failed" && processingError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-red-700 dark:text-red-300">
                  Processing failed
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">{processingError}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => onProcess(note.id)}
                >
                  <RotateCcwIcon className="mr-1.5 size-3.5" />
                  Retry processing
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

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
          {canProcess && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={isProcessing}
              onClick={() => {
                onProcess(note.id)
                onOpenChange(false)
              }}
            >
              {processingStatus === "failed" ? (
                <RotateCcwIcon className="mr-1.5 size-3.5" />
              ) : isProcessing ? (
                <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <SparklesIcon className="mr-1.5 size-3.5" />
              )}
              {processingStatus === "failed"
                ? "Retry"
                : isProcessing
                  ? "Processing"
                  : "Process"}
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

function RelatedSection({
  title,
  empty,
  items,
  icon,
  renderItem,
}: {
  title: string
  empty: string
  items: Record<string, unknown>[]
  icon: React.ReactNode
  renderItem: (item: Record<string, unknown>) => React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {title}
        <Badge variant="outline" className="ml-auto text-[10px]">
          {items.length}
        </Badge>
      </div>
      {items.length === 0 ? (
        <EmptyDetail text={empty} />
      ) : (
        <div className="space-y-2">
          {items.slice(0, 6).map((item, index) => (
            <div key={String(item.id ?? index)} className="rounded-lg border bg-background p-3">
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SourceRefCard({ source }: { source: SourceRef }) {
  const label = source.title ?? source.path ?? source.url ?? source.id ?? source.type
  const href = source.url && /^https?:\/\//i.test(source.url) ? source.url : null

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-start gap-2">
        <LinkIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {source.type}
            </Badge>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sm font-medium text-primary hover:underline"
              >
                {label}
              </a>
            ) : (
              <p className="truncate text-sm font-medium">{label}</p>
            )}
            {href && <ExternalLinkIcon className="size-3 shrink-0 text-muted-foreground" />}
          </div>
          {source.excerpt && (
            <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{source.excerpt}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyDetail({
  icon,
  text,
}: {
  icon?: React.ReactNode
  text: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
      {icon}
      {text}
    </div>
  )
}

function HistoryRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null

  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="truncate text-foreground">{value}</span>
    </div>
  )
}

function formatDateTime(value?: string) {
  if (!value) return undefined

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
