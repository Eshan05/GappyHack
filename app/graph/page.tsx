"use client"

import Link from "next/link"
import { useNotes, useConnections } from "@/hooks/use-lemma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useMemo } from "react"
import {
  NetworkIcon,
  FileTextIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "lucide-react"

export default function GraphPage() {
  const { records: notes, isLoading: notesLoading } = useNotes()
  const { records: connections, isLoading: connectionsLoading } = useConnections()
  const [selectedNote, setSelectedNote] = useState<string | null>(null)

  const isLoading = notesLoading || connectionsLoading

  const noteMap = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>()
    for (const note of notes) {
      map.set(note.id as string, note as Record<string, unknown>)
    }
    return map
  }, [notes])

  const tagGroups = useMemo(() => {
    const groups = new Map<string, Record<string, unknown>[]>()
    for (const note of notes) {
      const tags = note.tags as string[] | null
      if (!tags) continue
      for (const tag of tags) {
        const existing = groups.get(tag) ?? []
        existing.push(note as Record<string, unknown>)
        groups.set(tag, existing)
      }
    }
    return groups
  }, [notes])

  const noteConnections = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const conn of connections) {
      const src = conn.source_id as string
      const tgt = conn.target_id as string
      if (!map.has(src)) map.set(src, new Set())
      if (!map.has(tgt)) map.set(tgt, new Set())
      map.get(src)!.add(tgt)
      map.get(tgt)!.add(src)
    }
    // Also connect notes that share tags
    for (const [, tagNotes] of tagGroups) {
      for (let i = 0; i < tagNotes.length; i++) {
        for (let j = i + 1; j < tagNotes.length; j++) {
          const a = tagNotes[i].id as string
          const b = tagNotes[j].id as string
          if (!map.has(a)) map.set(a, new Set())
          if (!map.has(b)) map.set(b, new Set())
          map.get(a)!.add(b)
          map.get(b)!.add(a)
        }
      }
    }
    return map
  }, [connections, tagGroups])

  const selectedConnected = selectedNote
    ? noteConnections.get(selectedNote) ?? new Set<string>()
    : null

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Graph</h1>
          <p className="text-sm text-muted-foreground">
            Visualize connections between your notes.
          </p>
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Knowledge Graph</h1>
        <p className="text-sm text-muted-foreground">
          {connections.length} direct connection{connections.length !== 1 ? "s" : ""} &middot;{" "}
          {tagGroups.size} shared tag{tagGroups.size !== 1 ? "s" : ""} linking your notes.
        </p>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="rounded-2xl bg-muted/50 p-6">
            <NetworkIcon className="size-10 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-muted-foreground">No notes to connect</p>
          <p className="text-sm text-muted-foreground/60">
            Create notes and process them with AI to discover connections.
          </p>
          <Button variant="outline" render={<Link href="/notes" />}>
            Go to Notes
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Graph visualization */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <GraphVisualization
                  notes={notes as Record<string, unknown>[]}
                  noteConnections={noteConnections}
                  selectedNote={selectedNote}
                  onSelect={setSelectedNote}
                />
              </CardContent>
            </Card>
          </div>

          {/* Detail panel */}
          <div className="space-y-4">
            {selectedNote && noteMap.has(selectedNote) ? (
              <>
                <Card>
                  <CardContent className="space-y-3 py-4">
                    <div className="flex items-start gap-2">
                      <FileTextIcon className="mt-0.5 size-4 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {noteMap.get(selectedNote)!.title as string}
                        </p>
                        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                          {(noteMap.get(selectedNote)!.content as string)?.slice(0, 200)}
                        </p>
                      </div>
                    </div>
                    {(noteMap.get(selectedNote)!.tags as string[] | null)?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {(noteMap.get(selectedNote)!.tags as string[]).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Connected Notes ({selectedConnected?.size ?? 0})
                  </p>
                  {selectedConnected && selectedConnected.size > 0 ? (
                    [...selectedConnected].map((id) => {
                      const n = noteMap.get(id)
                      if (!n) return null
                      return (
                        <Card
                          key={id}
                          className="cursor-pointer transition-shadow hover:shadow-sm"
                          onClick={() => setSelectedNote(id)}
                        >
                          <CardContent className="flex items-center gap-2 py-2.5">
                            <ArrowRightIcon className="size-3 text-muted-foreground" />
                            <span className="flex-1 truncate text-sm">
                              {n.title as string}
                            </span>
                            {(n.processed as boolean) && (
                              <SparklesIcon className="size-3 text-emerald-500" />
                            )}
                          </CardContent>
                        </Card>
                      )
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground/60">
                      No connections found. Process this note with AI to discover links.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <NetworkIcon className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Click a node to see its connections
                </p>
              </div>
            )}

            {/* Tag clusters */}
            {tagGroups.size > 0 && (
              <Card>
                <CardContent className="space-y-3 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Tag Clusters
                  </p>
                  {[...tagGroups.entries()].map(([tag, tagNotes]) => (
                    <div key={tag} className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {tagNotes.length} note{tagNotes.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function GraphVisualization({
  notes,
  noteConnections,
  selectedNote,
  onSelect,
}: {
  notes: Record<string, unknown>[]
  noteConnections: Map<string, Set<string>>
  selectedNote: string | null
  onSelect: (id: string | null) => void
}) {
  const positions = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>()
    const count = notes.length
    if (count === 0) return pos

    const cx = 350
    const cy = 200
    if (count === 1) {
      pos.set(notes[0].id as string, { x: cx, y: cy })
      return pos
    }

    const useRings = count > 16
    const innerCount = useRings ? Math.ceil(count * 0.38) : count

    notes.forEach((note, i) => {
      const outerRing = useRings && i >= innerCount
      const ringIndex = outerRing ? i - innerCount : i
      const ringCount = outerRing ? count - innerCount : innerCount
      const radius = useRings
        ? outerRing
          ? 165
          : 82
        : Math.min(150, 50 + count * 20)
      const angleOffset = outerRing ? Math.PI / Math.max(ringCount, 1) : 0
      const angle = (2 * Math.PI * ringIndex) / Math.max(ringCount, 1) - Math.PI / 2 + angleOffset

      pos.set(note.id as string, {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      })
    })
    return pos
  }, [notes])

  const edges: { from: string; to: string }[] = useMemo(() => {
    const seen = new Set<string>()
    const result: { from: string; to: string }[] = []
    for (const [src, targets] of noteConnections) {
      for (const tgt of targets) {
        const key = [src, tgt].sort().join("-")
        if (!seen.has(key)) {
          seen.add(key)
          result.push({ from: src, to: tgt })
        }
      }
    }
    return result
  }, [noteConnections])

  return (
    <svg viewBox="0 0 700 400" className="w-full" role="img" aria-label="Knowledge graph">
      <defs>
        <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Edges */}
      {edges.map(({ from, to }) => {
        const p1 = positions.get(from)
        const p2 = positions.get(to)
        if (!p1 || !p2) return null
        const isHighlighted =
          selectedNote === from || selectedNote === to
        return (
          <line
            key={`${from}-${to}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={isHighlighted ? "var(--color-primary)" : "var(--color-border)"}
            strokeWidth={isHighlighted ? 2 : 1}
            strokeOpacity={isHighlighted ? 0.8 : 0.4}
          />
        )
      })}

      {/* Nodes */}
      {notes.map((note) => {
        const pos = positions.get(note.id as string)
        if (!pos) return null
        const isSelected = selectedNote === note.id
        const title = ((note.title as string) ?? "Untitled").trim() || "Untitled"
        const isConnected =
          selectedNote &&
          noteConnections.get(selectedNote)?.has(note.id as string)
        const dimmed = selectedNote && !isSelected && !isConnected

        return (
          <g
            key={note.id as string}
            role="button"
            tabIndex={0}
            aria-label={`Select ${title}`}
            className="cursor-pointer outline-none"
            onClick={() =>
              onSelect(isSelected ? null : (note.id as string))
            }
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return
              event.preventDefault()
              onSelect(isSelected ? null : (note.id as string))
            }}
          >
            <title>{title}</title>
            {isSelected && (
              <circle cx={pos.x} cy={pos.y} r={30} fill="url(#node-glow)" />
            )}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={isSelected ? 18 : 14}
              fill={
                (note.processed as boolean)
                  ? "var(--color-primary)"
                  : "var(--color-muted)"
              }
              stroke={
                isSelected
                  ? "var(--color-primary)"
                  : isConnected
                    ? "var(--color-primary)"
                    : "var(--color-border)"
              }
              strokeWidth={isSelected || isConnected ? 2.5 : 1.5}
              opacity={dimmed ? 0.3 : 1}
              className="transition-all duration-200"
            />
            <text
              x={pos.x}
              y={pos.y + 30}
              textAnchor="middle"
              className="fill-current text-[10px]"
              opacity={dimmed ? 0.2 : 0.7}
            >
              {title.slice(0, 18)}
              {title.length > 18 ? "…" : ""}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
