"use client"

import { LemmaClient } from "lemma-sdk"

let client: LemmaClient | null = null

export function getConfiguredLemmaPodId() {
  return process.env.NEXT_PUBLIC_LEMMA_POD_ID?.trim() || ""
}

export function getLemmaConfigError() {
  const missing: string[] = []

  if (!process.env.NEXT_PUBLIC_LEMMA_API_URL?.trim()) {
    missing.push("NEXT_PUBLIC_LEMMA_API_URL or VITE_LEMMA_API_URL")
  }

  if (!process.env.NEXT_PUBLIC_LEMMA_AUTH_URL?.trim()) {
    missing.push("NEXT_PUBLIC_LEMMA_AUTH_URL or VITE_LEMMA_AUTH_URL")
  }

  if (!getConfiguredLemmaPodId()) {
    missing.push("NEXT_PUBLIC_LEMMA_POD_ID or VITE_LEMMA_POD_ID")
  }

  if (!missing.length) return null

  return `Missing Lemma configuration: ${missing.join(", ")}`
}

export function getLemmaClient(): LemmaClient {
  if (client) return client

  const apiUrl = process.env.NEXT_PUBLIC_LEMMA_API_URL?.trim()
  const authUrl = process.env.NEXT_PUBLIC_LEMMA_AUTH_URL?.trim()
  const podId = getConfiguredLemmaPodId()

  if (!apiUrl || !authUrl || !podId) {
    throw new Error(getLemmaConfigError() || "Missing Lemma configuration")
  }

  client = new LemmaClient({
    apiUrl,
    authUrl,
    podId,
  })

  return client
}
