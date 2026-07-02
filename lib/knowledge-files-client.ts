"use client"

import { getLemmaClient } from "@/lib/lemma"

export async function ensureKnowledgeFolder() {
  try {
    await getLemmaClient().files.folder.create("knowledge", { directoryPath: "/me" })
  } catch (error) {
    const message =
      error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

    if (
      !message.includes("already") &&
      !message.includes("exists") &&
      !message.includes("409")
    ) {
      throw error
    }
  }
}
