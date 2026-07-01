"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearch } from "@/hooks/use-lemma"
import { useChatDrawer } from "@/context/chat-drawer-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { SearchIcon, Loader2Icon, GlobeIcon, ChevronRightIcon, MessageCircleIcon, CheckSquareIcon } from "lucide-react"
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

function getResultKey(result: GlobalSearchResult, index: number) {
  const stableId = result.kind === "record" ? result.id : result.path
  return `${result.kind}-${result.kind === "record" ? result.tableName : "file"}-${stableId || result.title || index}`
}

function getResultLabel(result: GlobalSearchResult) {
  return result.kind === "record" ? result.sourceLabel : "Document"
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const { search, results, isLoading, error } = useSearch()
  const { openWithQuery } = useChatDrawer()
  const selectedResults = results.filter((result, index) =>
    selectedKeys.has(getResultKey(result, index))
  )

  useEffect(() => {
    if (typeof window === "undefined") return

    const initialQuery = new URLSearchParams(window.location.search).get("q")?.trim()
    if (!initialQuery) return

    setQuery(initialQuery)
    setHasSearched(true)
    setSelectedKeys(new Set())
    void search({ query: initialQuery })
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setHasSearched(true)
    setSelectedKeys(new Set())
    search({ query })
  }

  function toggleResult(result: GlobalSearchResult, index: number) {
    const key = getResultKey(result, index)
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function askOracle() {
    const scopedContext = selectedResults
      .map((result, index) => {
        const label = getResultLabel(result)
        const subtitle = result.subtitle ? ` - ${result.subtitle}` : ""
        return `${index + 1}. [${label}] ${result.title ?? "Untitled"}${subtitle}`
      })
      .join("\n")

    openWithQuery(
      selectedResults.length > 0
        ? `Answer this search query using the selected sources below. Cite note titles or document paths when possible.\n\nQuery: ${query}\n\nSelected sources:\n${scopedContext}`
        : `Use my notes, insights, tasks, and files to answer this search query with citations: ${query}`
    )
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
                {selectedResults.length > 0
                  ? `${selectedResults.length} selected source${selectedResults.length !== 1 ? "s" : ""}`
                  : `Ask for an answer grounded in the current search: ${query}`}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={askOracle}
            >
              <MessageCircleIcon className="mr-1.5 size-3.5" />
              Ask Oracle
            </Button>
          </div>
          {results.map((result, i) => {
            const resultKey = getResultKey(result, i)
            const selected = selectedKeys.has(resultKey)

            return (
              <Card
                key={resultKey}
                className={`transition-shadow hover:shadow-md ${selected ? "border-emerald-500/40 bg-emerald-500/5" : ""}`}
              >
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleResult(result, i)}
                      aria-label={`Select ${result.title ?? "result"} for Oracle`}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <Link
                        href={getResultHref(result, query)}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {result.title ?? "Result"}
                      </Link>
                      {result.subtitle && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {result.subtitle}
                        </p>
                      )}
                      {selected && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300">
                          <CheckSquareIcon className="size-3" />
                          Included in Oracle prompt
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {getResultLabel(result)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        render={<Link href={getResultHref(result, query)} />}
                        aria-label={`Open ${result.title ?? "result"}`}
                        className="size-7"
                      >
                        <ChevronRightIcon className="size-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
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
