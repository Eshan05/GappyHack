# Second Brain — System Architecture & Flow

This document details the architecture and data flows of the **Second Brain** application. The app leverages a client-side Next.js single-page application (SPA) that interacts directly with the **Lemma Platform** to secure, store, and intelligently process user knowledge.

---

## 🏗️ Architecture Diagram

The diagram below visualizes how the frontend UI, authentication, database tables, agents, and workflows interact.

graph TD

subgraph Frontend
    UI["User Dashboard & Views"]
    AuthGate["Auth Gate / lemma-provider"]
    SDK["Lemma Client SDK"]
    Graph["Interactive Connections Graph"]
end

subgraph LemmaPlatform
    AuthService["Lemma Auth Service"]

    subgraph Pod
        subgraph Tables
            Notes[(notes)]
            Insights[(insights)]
            Tasks[(tasks)]
            Connections[(connections)]
        end

        subgraph Storage
            Knowledge["knowledge folder"]
        end

        subgraph Workflows
            ProcessNote["process-note Workflow"]
        end

        subgraph Agents
            Librarian["Librarian Agent"]
            Oracle["Oracle Agent"]
        end
    end
end

WebSearch["Web Search API"]

UI --> AuthGate
AuthGate -->|"1. Redirect to Auth"| AuthService
AuthService -->|"2. Return JWT"| AuthGate
AuthGate -->|"3. Initialize SDK"| SDK

UI -->|"4. Save Note"| SDK
SDK -->|"5. Insert Note"| Notes
SDK -->|"6. Trigger Workflow"| ProcessNote

ProcessNote -->|"7. Execute"| Librarian

Librarian -->|"8a. Read Note"| Notes
Librarian -->|"8b. Store Insights"| Insights
Librarian -->|"8c. Create Connections"| Connections
Librarian -->|"8d. Extract Tasks"| Tasks
Librarian -->|"8e. Mark Processed"| Notes

UI -->|"9. Ask Question"| SDK
SDK -->|"10. Start Session"| Oracle

Oracle -->|"11a. Read Notes"| Notes
Oracle -->|"11b. Search Files"| Knowledge
Oracle -->|"11c. Create Tasks"| Tasks
Oracle -->|"11d. Web Search"| WebSearch

Oracle -->|"12. Stream Response"| SDK
SDK -->|"13. Render Response"| UI

Connections -.-> Graph
Notes -.-> Graph
Insights -.-> UI
Tasks -.-> UI

## 🔄 Core Flows

### 1. Authentication & Access Gate
1. When a user navigates to the app, the `AuthGate` checks if a valid session exists.
2. Unauthenticated users are redirected to `https://lemma.work/auth`.
3. After logging in, the token is saved in `localStorage`, and the `LemmaClient` SDK is initialized.
4. The `usePodAccess` hook checks if the user has access to the configured `NEXT_PUBLIC_LEMMA_POD_ID`.
   * **If not**: A request is queued for approval by the pod owner, and the user is held at the "Pod Access Required" screen.

### 2. Note Intake & Processing (Librarian Pipeline)
1. The user saves a note or bookmark in the UI.
2. The note is inserted into the `notes` table with `processed: false`.
3. The client triggers the `process-note` workflow using the note's ID.
4. The **Librarian Agent** runs:
   * Summarizes the note and extracts keywords/tags.
   * Identifies key actions (saves them to `tasks`).
   * Extracts core patterns or questions (saves them to `insights`).
   * Discovers semantic links to existing notes (saves relations to `connections`).
   * Marks the note as `processed: true`.
5. The frontend automatically updates using React Query, updating the dashboards and rendering new links on the interactive relationships graph.

### 3. Interactive Retrieval (Oracle Chat)
1. The user opens the sliding chat panel and submits a query.
2. The Next.js app sends the query to the **Oracle Agent**.
3. The Oracle agent has read-only access to all note tables and the `/knowledge` file folder where PDF/DOCX documents are uploaded.
4. The Oracle uses semantic retrieval (RAG) to find context, searches the web if required, and streams the answer back to the UI.
5. If the user asks the Oracle to do something (e.g., *"remind me to write the report tomorrow"*), the Oracle creates a record in the `tasks` table.
