import { spawnSync } from "node:child_process"
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
  }
}

for (const [key, value] of Object.entries(process.env)) {
  rawEnv[key] = value ?? ""
}

function resolveValue(key, seen = new Set()) {
  if (seen.has(key)) return ""
  seen.add(key)

  return String(rawEnv[key] ?? "")
    .replace(/(^|[^\\])\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, prefix, refKey) => {
      return `${prefix}${resolveValue(refKey, seen)}`
    })
    .replace(/\\\$/g, "$")
}

const childEnv = { ...process.env }

for (const name of ["API_URL", "AUTH_URL", "POD_ID", "ORG_ID"]) {
  const nextKey = `NEXT_PUBLIC_LEMMA_${name}`
  const viteKey = `VITE_LEMMA_${name}`
  const value = (resolveValue(nextKey) || resolveValue(viteKey)).trim()

  if (value) {
    childEnv[nextKey] = value
    childEnv[viteKey] = value
  }
}

function run(command, args) {
  const result =
    process.platform === "win32"
      ? spawnSync([command, ...args].join(" "), {
          env: childEnv,
          shell: true,
          stdio: "inherit",
        })
      : spawnSync(command, args, {
          env: childEnv,
          stdio: "inherit",
        })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run("pnpm", ["-s", "check:lemma-env"])
run("pnpm", ["-s", "build"])
run("lemma", ["apps", "deploy", "secondbrain", "--dist-dir", "out", "--create", "--yes"])
