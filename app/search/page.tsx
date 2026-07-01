"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearch } from "@/hooks/use-lemma"
import { useChatDrawer } from "@/context/chat-drawer-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SearchIcon, Loader2Icon, GlobeIcon, ChevronRightIcon, MessageCircleIcon } from "lucide-react"
import type { GlobalSearchResult } from "lemma-sdk/react"

function getResultHref(result: GlobalSearchResult, query: string) {
  if (result.kind === "file") {
    return `/documents?query=${encodeURIComponent(query)}`
  }

  if (result.tableName === "notes") {
    return `/notes?open=${encodeURIComponent(result.id)}`
  }

  if (result.tableName === "tasks") return "/tasks"
  if (result.tableName === "insights") return "/insights"
  return "/search"
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const { search, results, isLoading, error } = useSearch()
  const { openWithQuery } = useChatDrawer()

  useEffect(() => {
    if (typeof window === "undefined") return

    const initialQuery = new URLSearchParams(window.location.search).get("q")?.trim()
    if (!initialQuery) return

    setQuery(initialQuery)
    setHasSearched(true)
    void search({ query: initialQuery })
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setHasSearched(true)
    search({ query })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">
          Search across all notes, documents, and knowledge.
        </p>
      </div>
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything..."
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={isLoading} className="shadow-md shadow-primary/20">
          {isLoading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </form>

      {error && <p className="text-xs text-destructive">{error.message}</p>}

      {results && results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Use these results with Oracle</p>
              <p className="truncate text-xs text-muted-foreground">
                Ask for an answer grounded in the current search: {query}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                openWithQuery(
                  `Use my notes, insights, tasks, and files to answer this search query with citations: ${query}`
                )
              }}
            >
              <MessageCircleIcon className="mr-1.5 size-3.5" />
              Ask Oracle
            </Button>
          </div>
          {results.map((result, i) => (
            <Link
              key={`${result.kind}-${i}-${result.title}`}
              href={getResultHref(result, query)}
              className="block"
            >
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-medium">
                        {result.title ?? "Result"}
                      </p>
                      {result.subtitle && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {result.kind === "record" ? result.sourceLabel : "Document"}
                      </Badge>
                      <ChevronRightIcon className="size-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {hasSearched && !isLoading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="rounded-2xl bg-muted/50 p-6">
            <GlobeIcon className="size-10 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <p className="font-medium text-muted-foreground">No results found</p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              Try different keywords or upload documents to build your knowledge base.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
