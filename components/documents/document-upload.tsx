"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useKnowledgeFiles, useKnowledgeSearch } from "@/hooks/use-lemma"
import { getLemmaClient } from "@/lib/lemma"
import {
  KNOWLEDGE_DISPLAY_PATH,
  KNOWLEDGE_STORAGE_PATH,
  toKnowledgeDisplayPath,
} from "@/lib/knowledge-files"
import { ensureKnowledgeFolder } from "@/lib/knowledge-files-client"
import { useChatDrawer } from "@/context/chat-drawer-context"
import {
  UploadIcon,
  FileIcon,
  SearchIcon,
  Loader2Icon,
  CheckCircleIcon,
  SparklesIcon,
  AlertCircleIcon,
} from "lucide-react"
import { toast } from "sonner"
import type { DatastoreFileSummary, FileResponse } from "lemma-sdk"

function getFileName(path: string) {
  return path.split("/").pop() ?? "Document"
}

type UploadedFileState = {
  name: string
  path: string
  status: string
  error?: string | null
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Unknown upload error"
}

function normalizeUploadedFile(file: FileResponse): UploadedFileState {
  return {
    name: file.name,
    path: file.path,
    status: file.status,
    error: file.last_processing_error,
  }
}

export function DocumentUpload() {
  const {
    files,
    isLoading: loadingFiles,
    error: filesError,
    refresh: refreshFiles,
  } = useKnowledgeFiles({ autoLoad: false })
  const { search, results, isLoading: searching } = useKnowledgeSearch()
  const { openWithQuery } = useChatDrawer()
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileState[]>([])
  const [uploading, setUploading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const visibleFiles = mergeFiles(uploadedFiles, files)

  useEffect(() => {
    if (typeof window === "undefined") return

    const initialQuery = new URLSearchParams(window.location.search).get("query")?.trim()
    if (!initialQuery) return

    setSearchQuery(initialQuery)
    setHasSearched(true)
    void search({ query: initialQuery, searchMethod: "HYBRID" as never })
  }, [search])

  useEffect(() => {
    void ensureKnowledgeFolder()
      .then(() => refreshFiles())
      .catch((error) => {
        toast.error(`Could not load documents: ${getErrorMessage(error)}`)
      })
  }, [refreshFiles])

  useEffect(() => {
    const pendingFiles = uploadedFiles.filter((file) =>
      ["PENDING", "PROCESSING"].includes(file.status)
    )
    if (pendingFiles.length === 0) return

    const timeout = window.setTimeout(() => {
      void Promise.all(
        pendingFiles.map(async (file) => {
          try {
            const latest = await getLemmaClient().files.get(file.path)
            setUploadedFiles((current) =>
              current.map((item) =>
                item.path === file.path ? normalizeUploadedFile(latest) : item
              )
            )
            if (!["PENDING", "PROCESSING"].includes(latest.status)) {
              void refreshFiles()
            }
          } catch (error) {
            setUploadedFiles((current) =>
              current.map((item) =>
                item.path === file.path
                  ? {
                      ...item,
                      status: "FAILED",
                      error: getErrorMessage(error),
                    }
                  : item
              )
            )
          }
        })
      )
    }, 2500)

    return () => window.clearTimeout(timeout)
  }, [refreshFiles, uploadedFiles])

  async function uploadFiles(filesToUpload: File[]) {
    if (!filesToUpload.length || uploading) return

    setUploading(true)
    try {
      await ensureKnowledgeFolder()

      for (const file of filesToUpload) {
        const uploadedFile = await getLemmaClient().files.upload(file, {
          directoryPath: KNOWLEDGE_STORAGE_PATH,
          name: file.name,
          searchEnabled: true,
        })

        setUploadedFiles((prev) => [normalizeUploadedFile(uploadedFile), ...prev])
        toast.success(`Uploaded ${uploadedFile.name}`)
      }
      await refreshFiles()
    } catch (error) {
      toast.error(`Upload failed: ${getErrorMessage(error)}`)
    } finally {
      setUploading(false)
    }
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files
    if (!selectedFiles?.length) return

    void uploadFiles(Array.from(selectedFiles))

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    void uploadFiles(droppedFiles)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setHasSearched(true)
    void search({ query: searchQuery, searchMethod: "HYBRID" as never })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-all hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {uploading ? (
              <div className="rounded-2xl bg-primary/10 p-4">
                <Loader2Icon className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-2xl bg-muted/80 p-4 transition-colors group-hover:bg-primary/10">
                <UploadIcon className="size-8 text-muted-foreground" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-medium">Click to upload files</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Or drag files here. PDF, DOCX, HTML, EPUB, TXT, MD are indexed for search.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.docx,.html,.epub,.txt,.md"
              onChange={handleUpload}
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground">
              Files in {KNOWLEDGE_DISPLAY_PATH}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void refreshFiles()}
              disabled={loadingFiles}
            >
              {loadingFiles ? <Loader2Icon className="size-3.5 animate-spin" /> : "Refresh"}
            </Button>
          </div>
          {filesError && (
            <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-xs text-red-600 dark:text-red-400">
              {filesError.message}
            </p>
          )}
          {visibleFiles.length > 0 ? (
            <div className="mt-4 space-y-2">
              {visibleFiles.map((file) => (
                <DocumentFileRow key={file.path} file={file} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              {loadingFiles ? "Loading files..." : "No uploaded documents yet."}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Knowledge Base</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your documents..."
              className="flex-1"
            />
            <Button type="submit" disabled={searching}>
              {searching ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SearchIcon className="size-4" />
              )}
            </Button>
          </form>
          {results && results.length > 0 && (
            <div className="mt-4 space-y-3">
              {results.map((result, i) => {
                const fileName = getFileName(result.path)
                const excerpt = result.content ? `\n\nMatched excerpt:\n${result.content.slice(0, 700)}` : ""

                return (
                  <div key={`${result.file_id}-${result.chunk_index}-${i}`} className="rounded-md border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileIcon className="size-4 text-muted-foreground" />
                      {fileName}
                    </div>
                    {result.content && (
                      <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                        {result.content}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      {result.score != null ? (
                        <p className="text-[10px] text-muted-foreground/60">
                          Relevance: {(result.score * 100).toFixed(0)}%
                        </p>
                      ) : (
                        <span />
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          openWithQuery(`Use the document result from ${fileName} to answer: ${searchQuery}${excerpt}`)
                        }}
                      >
                        <SparklesIcon className="size-3.5" />
                        Ask Oracle
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {hasSearched && !searching && results.length === 0 && (
            <div className="mt-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No matching document sections found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function mergeFiles(uploadedFiles: UploadedFileState[], files: DatastoreFileSummary[]) {
  const merged = new Map<string, UploadedFileState>()

  for (const file of files) {
    merged.set(file.path, {
      name: file.name,
      path: file.path,
      status: file.status,
    })
  }

  for (const file of uploadedFiles) {
    merged.set(file.path, file)
  }

  return Array.from(merged.values())
}

function DocumentFileRow({ file }: { file: UploadedFileState }) {
  const displayPath = toKnowledgeDisplayPath(file.path)

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2 text-sm">
        {file.status === "FAILED" ? (
          <AlertCircleIcon className="size-4 text-red-500" />
        ) : file.status === "COMPLETED" || file.status === "NOT_REQUIRED" ? (
          <CheckCircleIcon className="size-4 text-green-500" />
        ) : (
          <Loader2Icon className="size-4 animate-spin text-amber-500" />
        )}
        <span className="min-w-0 flex-1 truncate">{file.name}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          {file.status.toLowerCase().replace("_", " ")}
        </span>
      </div>
      <p className="mt-1 truncate text-[10px] text-muted-foreground">{displayPath}</p>
      {file.error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{file.error}</p>
      )}
    </div>
  )
}
