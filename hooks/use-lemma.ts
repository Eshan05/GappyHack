"use client"

import { getLemmaClient } from "@/lib/lemma"
import { KNOWLEDGE_STORAGE_PATH } from "@/lib/knowledge-files"
import type { RecordFilter } from "lemma-sdk"
import {
  useRecords,
  useCreateRecord,
  useUpdateRecord,
  useDeleteRecord,
  useRecord,
  useFileSearch,
  useFiles,
  useGlobalSearch,
  useAssistantController,
  useUploadFile,
  useWorkflowRun,
  useDatastoreQuery,
} from "lemma-sdk/react"

function client() {
  return getLemmaClient()
}

// ── Notes ──

export function useNotes(filters?: RecordFilter[]) {
  return useRecords({
    client: client(),
    tableName: "notes",
    filters,
    sort: [{ field: "created_at", direction: "desc" }],
  })
}

export function useNote(id: string) {
  return useRecord({ client: client(), tableName: "notes", recordId: id })
}

export function useCreateNote() {
  return useCreateRecord({ client: client(), tableName: "notes" })
}

export function useUpdateNote() {
  return useUpdateRecord({ client: client(), tableName: "notes" })
}

export function useDeleteNote() {
  return useDeleteRecord({ client: client(), tableName: "notes" })
}

// ── Insights ──

export function useInsights(noteId?: string) {
  return useRecords({
    client: client(),
    tableName: "insights",
    filters: noteId
      ? [{ field: "note_id", op: "eq", value: noteId }]
      : undefined,
    sort: [{ field: "created_at", direction: "desc" }],
  })
}

export function useCreateInsight() {
  return useCreateRecord({ client: client(), tableName: "insights" })
}

// ── Tasks ──

export function useTasks(filters?: RecordFilter[]) {
  return useRecords({
    client: client(),
    tableName: "tasks",
    filters,
    sort: [{ field: "created_at", direction: "desc" }],
  })
}

export function useCreateTask() {
  return useCreateRecord({ client: client(), tableName: "tasks" })
}

export function useUpdateTask() {
  return useUpdateRecord({ client: client(), tableName: "tasks" })
}

// ── Connections ──

export function useConnections(noteId?: string) {
  return useRecords({
    client: client(),
    tableName: "connections",
    filters: noteId
      ? [{ field: "source_id", op: "eq", value: noteId }]
      : undefined,
  })
}

// ── Search ──

export function useKnowledgeSearch() {
  return useFileSearch({
    client: client(),
    scopePath: KNOWLEDGE_STORAGE_PATH,
    scopeMode: "SUBTREE",
  })
}

export function useKnowledgeFiles(options?: { autoLoad?: boolean; enabled?: boolean }) {
  return useFiles({
    client: client(),
    directoryPath: KNOWLEDGE_STORAGE_PATH,
    limit: 50,
    autoLoad: options?.autoLoad,
    enabled: options?.enabled,
  })
}

export function useSearch() {
  return useGlobalSearch({
    client: client(),
    tables: [
      {
        tableName: "notes",
        searchFields: ["title", "content", "summary"],
        displayField: "title",
        subtitleField: "summary",
        limit: 20,
      },
      {
        tableName: "insights",
        searchFields: ["content"],
        displayField: "content",
        subtitleField: "type",
        limit: 10,
      },
    ],
    autoLoad: false,
  })
}

// ── File upload ──

export function useUploadDocument() {
  return useUploadFile({ client: client() })
}

// ── Agents ──

export function useOracleChat() {
  return useAssistantController({
    client: client(),
    agentName: "oracle",
  })
}

export function useLibrarianChat() {
  return useAssistantController({
    client: client(),
    agentName: "librarian",
  })
}

// ── Workflows ──

export function useProcessNote() {
  return useWorkflowRun({
    client: client(),
    workflowName: "process-note",
  })
}

// ── Raw queries ──

export function useQuery(query: string) {
  return useDatastoreQuery({
    client: client(),
    query,
  })
}
