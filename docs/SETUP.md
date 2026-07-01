# AI Second Brain — Lemma Pod Setup

Complete guide to recreating the Lemma backend pod for the Second Brain app.
All JSON config files are in `docs/pod/` — the CLI commands below reference them via `--file`.

## Prerequisites

- [Lemma CLI](https://docs.lemma.work) installed and authenticated (`lemma auth login`)
- A Lemma organization (`lemma orgs list`)

## 1. Create the Pod

```bash
lemma pods create --name "Second Brain"
```

Note your Pod ID from the output — you'll need it for `.env.local`.

## 2. Create Tables

All tables use RLS (row-level security) by default — each user only sees their own data.
The `id`, `created_at`, `updated_at`, and `user_id` columns are auto-generated.

```bash
lemma tables create notes       --file docs/pod/tables/notes.json
lemma tables create insights    --file docs/pod/tables/insights.json
lemma tables create connections --file docs/pod/tables/connections.json
lemma tables create tasks       --file docs/pod/tables/tasks.json
```

| Table | Purpose |
|-------|---------|
| `notes` | User-created notes, articles, bookmarks. Has `processed` flag and `tags` (JSON array). |
| `insights` | AI-extracted key points, questions, patterns. Linked to notes via `note_id`. |
| `connections` | Links between related notes. `source_id` → `target_id` with `relationship` text and `strength` float. |
| `tasks` | Action items extracted from notes. Has `priority` and `status` enums. |

## 3. Create the Knowledge Folder

```bash
lemma files mkdir /knowledge
```

Uploaded documents (PDF, DOCX, etc.) go here and are auto-indexed for semantic search.

## 4. Create Agents

Each agent is defined by a JSON config + an instruction markdown file.
The `{"$file": "instruction.md"}` reference in the JSON resolves relative to the JSON file.

```bash
lemma agents create --file docs/pod/agents/librarian/agent.json
lemma agents create --file docs/pod/agents/oracle/agent.json
```

### librarian

- **Toolsets**: `POD`, `WORKSPACE_CLI`
- **Grants**: read + write on all 4 tables, read on `/knowledge`
- **Role**: processes new notes — extracts summary, tags, insights, discovers connections, creates tasks
- **Config**: [`docs/pod/agents/librarian/agent.json`](pod/agents/librarian/agent.json)
- **Instruction**: [`docs/pod/agents/librarian/instruction.md`](pod/agents/librarian/instruction.md)

### oracle

- **Toolsets**: `POD`, `WEB_SEARCH`, `WORKSPACE_CLI`
- **Grants**: read on notes/connections/insights, read + write on tasks, read on `/knowledge`
- **Role**: answers questions from the knowledge base, surfaces forgotten context, creates tasks
- **Config**: [`docs/pod/agents/oracle/agent.json`](pod/agents/oracle/agent.json)
- **Instruction**: [`docs/pod/agents/oracle/instruction.md`](pod/agents/oracle/instruction.md)

## 5. Create the Workflow

A 3-node workflow: **Form (intake) → Agent (librarian) → End**

```bash
lemma workflows create --file docs/pod/workflows/process-note.json
```

- **Config**: [`docs/pod/workflows/process-note.json`](pod/workflows/process-note.json)
- **Trigger**: `MANUAL` — the app calls it when a note is created
- **Input**: `{ "note_id": "<UUID>" }` — passed to the librarian agent

To trigger manually:

```bash
lemma workflows run process-note --data '{"note_id": "<NOTE_UUID>"}'
```

## 6. Frontend Environment

Create `.env.local` in the Next.js project root:

```env
NEXT_PUBLIC_LEMMA_API_URL=/lemma-api
NEXT_PUBLIC_LEMMA_AUTH_URL=https://lemma.work/auth
NEXT_PUBLIC_LEMMA_POD_ID=<your-pod-id>
NEXT_PUBLIC_LEMMA_ORG_ID=<your-org-id>
VITE_LEMMA_API_URL=/lemma-api
VITE_LEMMA_AUTH_URL=https://lemma.work/auth
VITE_LEMMA_POD_ID=<your-pod-id>
VITE_LEMMA_ORG_ID=<your-org-id>
```

For production, set the API URL to the real Lemma API URL (e.g. `https://api.lemma.work`).

`NEXT_PUBLIC_LEMMA_POD_ID` and `VITE_LEMMA_POD_ID` should point at the same shared pod. The Next app accepts either prefix at build time, but keeping both in sync avoids CLI/deploy confusion. The pod is intentionally not derived from the signed-in user. If this value is missing or points at the wrong pod, collaborators can end up reading or writing data in a different Lemma pod.

## 7. Verify Setup

```bash
lemma pods describe          # should show 4 tables, 2 agents, 1 workflow
lemma tables list            # notes, connections, insights, tasks
lemma agents list            # oracle, librarian
lemma workflows list         # process-note
lemma files ls /knowledge    # should exist (empty is fine)
```

## 8. Quick Test

1. Create a test note:
   ```bash
   lemma records create notes --data '{"title": "Test Note", "content": "The Feynman Technique is a learning method where you explain a concept in simple terms.", "type": "note", "processed": false}'
   ```

2. Get the note ID from the output, then trigger processing:
   ```bash
   lemma workflows run process-note --data '{"note_id": "<NOTE_ID>"}'
   ```

3. Check that it was processed:
   ```bash
   lemma records list notes --limit 5
   lemma records list insights --limit 10
   ```

## File Structure

```
docs/pod/
├── tables/
│   ├── notes.json
│   ├── insights.json
│   ├── connections.json
│   └── tasks.json
├── agents/
│   ├── librarian/
│   │   ├── agent.json          # config + permissions + grants
│   │   └── instruction.md      # agent prompt
│   └── oracle/
│       ├── agent.json
│       └── instruction.md
└── workflows/
    └── process-note.json       # nodes, edges, input schema
```

## 9. Deploy to Lemma

The app is a fully client-side Next.js SPA — no server-side features — so it exports as static files.

### Configure for static export

In `next.config.ts`:

```ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "export",
}

export default nextConfig
```

In `.env.local`, point the SDK directly at the Lemma API (no rewrite proxy in static mode):

```env
NEXT_PUBLIC_LEMMA_API_URL=https://api.lemma.work
NEXT_PUBLIC_LEMMA_AUTH_URL=https://lemma.work/auth
NEXT_PUBLIC_LEMMA_POD_ID=<your-pod-id>
NEXT_PUBLIC_LEMMA_ORG_ID=<your-org-id>
VITE_LEMMA_API_URL=https://api.lemma.work
VITE_LEMMA_AUTH_URL=https://lemma.work/auth
VITE_LEMMA_POD_ID=<your-pod-id>
VITE_LEMMA_ORG_ID=<your-org-id>
```

### Build and deploy

```bash
rm -rf .next out
pnpm check:lemma-env

pnpm build                    # produces out/ directory with static HTML/JS/CSS

VITE_LEMMA_API_URL=https://api.lemma.work \
VITE_LEMMA_AUTH_URL=https://lemma.work/auth \
VITE_LEMMA_POD_ID=<your-pod-id> \
lemma apps deploy secondbrain --dist-dir out --create --yes
```

The deploy command commonly uses `VITE_LEMMA_*` because the Lemma CLI validates those names. `next.config.ts` mirrors `VITE_LEMMA_*` into the baked Next client env at build time, so building with only `VITE_LEMMA_*` now works.

Before building/deploying, confirm the printed pod is the shared Second Brain pod. Signed-in collaborators must also have access to that pod; authentication identifies the user, while the configured pod id selects the workspace.

### Make it public

By default the app is `POD` visibility (pod members only). To make it publicly accessible:

```bash
lemma apps update secondbrain --data '{"visibility": "PUBLIC"}'
```

### Result

The app will be live at `https://secondbrain.apps.lemma.work`.
Users need to be logged into Lemma for auth to work (the SDK reads the auth token from `localStorage`).
