# Architecture

This document captures the main architecture views for Second Brain: system boundaries, note processing, data relationships, and frontend modules.

## System Architecture

```mermaid
flowchart LR
  User[User] --> Browser[Next.js Static SPA]

  Browser --> Auth[Lemma Auth]
  Browser --> SDK[Lemma SDK Client]

  SDK --> Pod[Second Brain Lemma Pod]

  Pod --> Notes[(notes)]
  Pod --> Insights[(insights)]
  Pod --> Connections[(connections)]
  Pod --> Tasks[(tasks)]
  Pod --> Files["/me/knowledge files"]

  Pod --> Librarian[Librarian Agent]
  Pod --> Oracle[Oracle Agent]

  Librarian --> Notes
  Librarian --> Insights
  Librarian --> Connections
  Librarian --> Tasks

  Oracle --> Notes
  Oracle --> Insights
  Oracle --> Connections
  Oracle --> Tasks
  Oracle --> Files
  Oracle --> Web[Web Search]
```

## Note Processing Workflow

```mermaid
sequenceDiagram
  actor User
  participant App as Next.js App
  participant Lemma as Lemma Pod
  participant Workflow as process-note Workflow
  participant Librarian as Librarian Agent
  participant Tables as Notes / Insights / Connections / Tasks

  User->>App: Create note
  App->>Lemma: Insert note record
  App->>Workflow: Run process-note with note_id
  Workflow->>Librarian: Process note
  Librarian->>Tables: Read note
  Librarian->>Tables: Update summary, tags, processed
  Librarian->>Tables: Create insights
  Librarian->>Tables: Create connections
  Librarian->>Tables: Create tasks
  App->>Lemma: Refetch updated data
```

## Data Model

```mermaid
erDiagram
  notes ||--o{ insights : produces
  notes ||--o{ tasks : creates
  notes ||--o{ connections : source
  notes ||--o{ connections : target

  notes {
    uuid id
    text title
    text content
    enum type
    text source_url
    json tags
    text summary
    boolean processed
  }

  insights {
    uuid id
    text content
    enum type
    uuid note_id
    float confidence
  }

  connections {
    uuid id
    uuid source_id
    uuid target_id
    text relationship
    float strength
  }

  tasks {
    uuid id
    text title
    text description
    uuid note_id
    enum priority
    enum status
    date due_date
  }
```

## Frontend Modules

```mermaid
flowchart TB
  AppRoutes[app routes] --> Shell[App Shell / Sidebar]
  Shell --> Pages[Dashboard, Notes, Documents, Chat, Tasks, Graph, Search]
  Pages --> Hooks[hooks/use-lemma.ts]
  Pages --> Contexts[Chat and Drawer Contexts]
  Hooks --> LemmaClient[lib/lemma.ts]
  LemmaClient --> LemmaSDK[lemma-sdk]
  LemmaSDK --> LemmaPod[Lemma Pod]
```
