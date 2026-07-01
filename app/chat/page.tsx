"use client"

import { ChatView } from "@/components/chat/chat-view"

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Chat</h1>
        <p className="text-sm text-muted-foreground">
          Talk to Oracle — your AI assistant that knows your entire knowledge base.
        </p>
      </div>
      <ChatView />
    </div>
  )
}
