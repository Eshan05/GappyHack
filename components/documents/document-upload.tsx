"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useUploadDocument, useKnowledgeSearch } from "@/hooks/use-lemma"
import { useChatDrawer } from "@/context/chat-drawer-context"
import {
  UploadIcon,
  FileIcon,
  SearchIcon,
  Loader2Icon,
  CheckCircleIcon,
  SparklesIcon,
} from "lucide-react"
import { toast } from "sonner"

function getFileName(path: string) {
  return path.split("/").pop() ?? "Document"
}

export function DocumentUpload() {
  const { upload, isSubmitting: uploading } = useUploadDocument()
  const { search, results, isLoading: searching } = useKnowledgeSearch()
  const { openWithQuery } = useChatDrawer()
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const initialQuery = new URLSearchParams(window.location.search).get("query")?.trim()
    if (!initialQuery) return

    setSearchQuery(initialQuery)
    setHasSearched(true)
    void search({ query: initialQuery, searchMethod: "HYBRID" as never })
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return

    for (const file of Array.from(files)) {
      try {
        await upload(file, { directoryPath: "/knowledge", name: file.name })
        setUploadedFiles((prev) => [...prev, file.name])
        toast.success(`Uploaded ${file.name}`)
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setHasSearched(true)
    search({ query: searchQuery, searchMethod: "HYBRID" as never })
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
                PDF, DOCX, HTML, EPUB, TXT — auto-indexed for search
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
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Recently uploaded
              </p>
              {uploadedFiles.map((name) => (
                <div key={name} className="flex items-center gap-2 text-sm">
                  <CheckCircleIcon className="size-4 text-green-500" />
                  {name}
                </div>
              ))}
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
