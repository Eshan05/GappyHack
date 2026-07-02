# Second Brain — AI-Powered Knowledge Workspace

Second Brain is a modern, premium Next.js application that integrates with **Lemma** to provide a secure, AI-powered knowledge management system. Users can create notes, upload documents, explore an interactive connection graph, and chat with an AI Oracle that understands their personal knowledge base.

All user data is stored securely in a dedicated **Lemma Pod** with Row-Level Security (RLS) ensuring strict user-level isolation. For a visual representation of how the components, workflows, and agents connect, see the [Architecture Flow Diagram](docs/ARCHITECTURE.md).

---

## 🚀 Features

- **Private Auth Gate**: Integrates with Lemma Auth, keeping all data private and user-isolated.
- **Intelligent Intake (Librarian Agent)**: Notes are processed automatically through a backend workflow that extracts insights, creates tasks, and builds semantic connections to other notes.
- **AI Oracle Chat**: A global sliding drawer powered by Lemma's oracle agent, which can search your personal knowledge base, synthesize info, and create action items.
- **Interactive Connections Graph**: Visualize how your notes link together dynamically.
- **Actionable Tasks Dashboard**: Manage tasks automatically extracted from your notes, categorized by priority and status.
- **Settings & Control Panel**: View configuration status, switch themes, or manage development tokens.

---

## 🛠️ Tech Stack

- **Core**: React 19, Next.js 16 (Static Export), TypeScript
- **Styling**: TailwindCSS, Tailwind Typography, Framer Motion (for smooth micro-animations)
- **Data Management**: React Query (TanStack Query), Lemma SDK
- **Icons & UI**: Lucide React, Shadcn/UI (Base UI, Vaul, Cmdk)

---
## 🏁 Getting Started

### Prerequisites

- **Node.js**: `v22.0.0` or higher.
- **Package Manager**: `pnpm` (v11.5.0 recommended).
- **Lemma CLI**: Installed and authenticated.
  ```bash
  npm install -g @lemma-work/cli   # Or download the official binary
  lemma auth login
  ```

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env` or `.env.local`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your Lemma Pod ID and Organization ID. (See Step 3 to retrieve/create these).

```env
NEXT_PUBLIC_LEMMA_API_URL=https://api.lemma.work
NEXT_PUBLIC_LEMMA_AUTH_URL=https://lemma.work/auth
NEXT_PUBLIC_LEMMA_POD_ID=your-pod-id-here
NEXT_PUBLIC_LEMMA_ORG_ID=your-org-id-here

# Ensure VITE_ prefixes match NEXT_PUBLIC_ prefixes for deployment compatibility
VITE_LEMMA_API_URL=https://api.lemma.work
VITE_LEMMA_AUTH_URL=https://lemma.work/auth
VITE_LEMMA_POD_ID=your-pod-id-here
VITE_LEMMA_ORG_ID=your-org-id-here
```

### Step 3: Setup Lemma Backend

If you haven't configured your Lemma pod yet, follow these quick setup commands (see [docs/SETUP.md](docs/SETUP.md) for full details):

1. **Create the Pod**:
   ```bash
   lemma pods create --name "Second Brain"
   ```
   *Copy the resulting Pod ID to your `.env` file.*

2. **Create Database Tables**:
   ```bash
   lemma tables create notes       --file docs/pod/tables/notes.json
   lemma tables create insights    --file docs/pod/tables/insights.json
   lemma tables create connections --file docs/pod/tables/connections.json
   lemma tables create tasks       --file docs/pod/tables/tasks.json
   ```

3. **Create Knowledge Folder**:
   ```bash
   lemma files mkdir /knowledge
   ```

4. **Create AI Agents**:
   ```bash
   lemma agents create --file docs/pod/agents/librarian/agent.json
   lemma agents create --file docs/pod/agents/oracle/agent.json
   ```

5. **Create Note Processing Workflow**:
   ```bash
   lemma workflows create --file docs/pod/workflows/process-note.json
   ```

### Step 4: Run Locally

```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view your app.

---

## 🚀 Deployment

The application is deployed as a fully client-side static site (SPA) directly to Lemma Apps.

To verify configuration and deploy with a single command:
```bash
pnpm deploy:lemma
```
This runs `scripts/check-lemma-env.mjs`, builds the static assets in `out/`, and runs `lemma apps deploy`.

---
##
