export type ProcessingStatus = "idle" | "queued" | "processing" | "processed" | "failed"

export type SourceRef = {
  type: "note" | "file" | "url" | "insight" | "task"
  id?: string
  title?: string
  url?: string
  path?: string
  excerpt?: string
}

export type KnowledgeMetadata = {
  provenance?: {
    source_type?: "manual" | "url" | "file" | "assistant" | "workflow"
    source_url?: string
    captured_at?: string
    updated_at?: string
  }
  processing?: {
    status?: ProcessingStatus
    attempts?: number
    started_at?: string
    completed_at?: string
    error?: string | null
  }
  source_refs?: SourceRef[]
  [key: string]: unknown
}

export function getMetadata(value: unknown): KnowledgeMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as KnowledgeMetadata
}

export function getSourceRefs(value: unknown): SourceRef[] {
  const metadata = getMetadata(value)
  return Array.isArray(metadata.source_refs) ? metadata.source_refs : []
}

export function getProcessingStatus(record: {
  processed?: boolean | null
  metadata?: unknown
}, isProcessing = false): ProcessingStatus {
  if (isProcessing) return "processing"
  if (record.processed) return "processed"

  const status = getMetadata(record.metadata).processing?.status
  if (status === "queued" || status === "processing" || status === "failed") {
    return status
  }

  return "idle"
}

export function getProcessingLabel(status: ProcessingStatus) {
  switch (status) {
    case "queued":
      return "queued"
    case "processing":
      return "processing"
    case "processed":
      return "processed"
    case "failed":
      return "failed"
    default:
      return "unprocessed"
  }
}

export function buildNoteMetadata(input: {
  existing?: unknown
  sourceUrl?: string
  sourceType?: "manual" | "url" | "file" | "assistant" | "workflow"
}) {
  const now = new Date().toISOString()
  const existing = getMetadata(input.existing)
  const sourceUrl = input.sourceUrl?.trim()
  const sourceType = input.sourceType ?? (sourceUrl ? "url" : "manual")

  return {
    ...existing,
    provenance: {
      ...existing.provenance,
      source_type: sourceType,
      source_url: sourceUrl || existing.provenance?.source_url,
      captured_at: existing.provenance?.captured_at ?? now,
      updated_at: now,
    },
    processing: existing.processing ?? {
      status: "idle" as ProcessingStatus,
      attempts: 0,
    },
    source_refs: sourceUrl
      ? [
          {
            type: "url" as const,
            url: sourceUrl,
          },
        ]
      : getSourceRefs(existing),
  }
}

export function markProcessingStarted(existing: unknown) {
  const metadata = getMetadata(existing)
  const attempts = metadata.processing?.attempts ?? 0

  return {
    ...metadata,
    processing: {
      ...metadata.processing,
      status: "processing" as ProcessingStatus,
      attempts: attempts + 1,
      started_at: new Date().toISOString(),
      error: null,
    },
  }
}

export function markProcessingQueued(existing: unknown) {
  const metadata = getMetadata(existing)

  return {
    ...metadata,
    processing: {
      ...metadata.processing,
      status: "queued" as ProcessingStatus,
      error: null,
    },
  }
}

export function markProcessingFailed(existing: unknown, error: string) {
  const metadata = getMetadata(existing)

  return {
    ...metadata,
    processing: {
      ...metadata.processing,
      status: "failed" as ProcessingStatus,
      completed_at: new Date().toISOString(),
      error,
    },
  }
}
