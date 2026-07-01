import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const nodeEnv = process.env.NODE_ENV || "development"
const envFiles = [
  ".env",
  `.env.${nodeEnv}`,
  ".env.local",
  `.env.${nodeEnv}.local`,
]

const rawEnv = {}
const sources = {}

for (const file of envFiles) {
  const path = resolve(process.cwd(), file)
  if (!existsSync(path)) continue

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue

    let value = match[2].trim()
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    rawEnv[match[1]] = value
    sources[match[1]] = file
  }
}

for (const [key, value] of Object.entries(process.env)) {
  if (!key.includes("LEMMA_")) continue
  rawEnv[key] = value ?? ""
  sources[key] = "process"
}

function resolveValue(key, seen = new Set()) {
  if (seen.has(key)) return ""
  seen.add(key)

  return String(rawEnv[key] ?? "").replace(/(^|[^\\])\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, prefix, refKey) => {
    return `${prefix}${resolveValue(refKey, seen)}`
  }).replace(/\\\$/g, "$")
}

function readPair(name) {
  const nextKey = `NEXT_PUBLIC_LEMMA_${name}`
  const viteKey = `VITE_LEMMA_${name}`
  const nextValue = resolveValue(nextKey).trim()
  const viteValue = resolveValue(viteKey).trim()

  return {
    nextKey,
    viteKey,
    nextValue,
    viteValue,
    value: nextValue || viteValue,
    source: nextValue ? sources[nextKey] : sources[viteKey],
  }
}

const fields = {
  API_URL: readPair("API_URL"),
  AUTH_URL: readPair("AUTH_URL"),
  POD_ID: readPair("POD_ID"),
  ORG_ID: readPair("ORG_ID"),
}

let failed = false

console.log("Lemma build environment")
for (const [name, field] of Object.entries(fields)) {
  const source = field.source ? ` (${field.source})` : ""
  console.log(`${name}: ${field.value || "(missing)"}${source}`)

  if (field.nextValue && field.viteValue && field.nextValue !== field.viteValue) {
    console.error(`Mismatch: ${field.nextKey} and ${field.viteKey} differ.`)
    failed = true
  }
}

for (const name of ["API_URL", "AUTH_URL", "POD_ID"]) {
  if (!fields[name].value) {
    console.error(`Missing Lemma ${name}. Set NEXT_PUBLIC_LEMMA_${name} or VITE_LEMMA_${name}.`)
    failed = true
  }
}

if (failed) {
  process.exit(1)
}
