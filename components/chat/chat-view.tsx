"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar } from "@/components/ui/avatar"
import { useOracleChat } from "@/context/oracle-chat-context"
import { ChatInstanceSidebar, getChatInstanceTitle } from "@/components/chat/chat-instances"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  BrainIcon,
  SendIcon,
  UserIcon,
  Loader2Icon,
  SparklesIcon,
  MessageCircleIcon,
  LightbulbIcon,
  SearchIcon,
} from "lucide-react"
import type { AssistantRenderableMessage } from "lemma-sdk/react"

const suggestions = [
  { text: "What are my most important notes?", icon: SparklesIcon },
  { text: "Find connections between my ideas", icon: SearchIcon },
  { text: "Summarize my recent knowledge", icon: MessageCircleIcon },
  { text: "What action items do I have?", icon: LightbulbIcon },
]

export function ChatView() {
  const {
    messages,
    conversations,
    activeConversationId,
    selectConversation,
    sendMessage,
    isLoading,
    isLoadingConversations,
    isLoadingMoreConversations,
    hasMoreConversations,
    loadMoreConversations,
    error,
  } = useOracleChat()
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeTitle = getChatInstanceTitle(conversations, activeConversationId)

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-slot='scroll-area-viewport']")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    await sendMessage(text)
  }

  function handleNewChat() {
    selectConversation(null)
    setInput("")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function getMessageText(msg: AssistantRenderableMessage): string {
    if (typeof msg.content === "string") return msg.content
    if (Array.isArray(msg.parts)) {
      return msg.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("")
    }
    return ""
  }

  return (
    <div className="grid h-[calc(100svh-9rem)] min-h-0 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <ChatInstanceSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        isLoadingConversations={isLoadingConversations}
        isLoadingMoreConversations={isLoadingMoreConversations}
        hasMoreConversations={hasMoreConversations}
        onSelectConversation={selectConversation}
        onNewChat={handleNewChat}
        onLoadMoreConversations={loadMoreConversations}
        className="max-h-56 lg:max-h-none"
      />

      <div className="flex min-h-0 flex-col rounded-2xl border bg-background p-3 shadow-sm">
        <div className="mb-3 border-b pb-3">
          <h2 className="truncate text-sm font-semibold">{activeTitle}</h2>
          <p className="text-xs text-muted-foreground">
            {activeConversationId ? "Conversation" : "Start a separate chat"}
          </p>
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>

        <ScrollArea className="min-h-0 flex-1 pr-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 py-16 text-center">
              <div className="relative">
                <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-5">
                  <BrainIcon className="size-10 text-emerald-500" />
                </div>
                <div className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
                  <SparklesIcon className="size-3 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Ask your Second Brain</h3>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                  Ask questions about your notes, find connections, or get
                  summaries of your knowledge.
                </p>
              </div>
              <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button
                    key={s.text}
                    className="flex items-center gap-2 rounded-xl border bg-card p-3 text-left text-xs transition-all hover:bg-accent hover:shadow-sm"
                    onClick={() => {
                      setInput(s.text)
                    }}
                  >
                    <s.icon className="size-4 shrink-0 text-muted-foreground" />
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {(() => {
                const keepIds = new Set<string>()
                let lastTextId: string | undefined
                for (const m of messages) {
                  if (m.role === "user" && lastTextId) {
                    keepIds.add(lastTextId)
                    lastTextId = undefined
                  }
                  if (m.role === "assistant" && getMessageText(m)) {
                    lastTextId = m.id
                  }
                }
                if (lastTextId) keepIds.add(lastTextId)
                return messages.filter((msg) => {
                  if (msg.role === "user") return true
                  if (msg.role === "assistant") return keepIds.has(msg.id)
                  return false
                })
              })().map((msg) => {
                const text = getMessageText(msg)
                if (!text) return null
                const isUser = msg.role === "user"
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isUser ? "justify-end" : ""}`}
                  >
                    {!isUser && (
                      <Avatar className="size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10">
                        <BrainIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md bg-muted"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{text}</p>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {text}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    {isUser && (
                      <Avatar className="size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <UserIcon className="size-4" />
                      </Avatar>
                    )}
                  </div>
                )
              })}
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10">
                    <BrainIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </Avatar>
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-2.5">
                    <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        <div className="mt-3 flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your second brain..."
            rows={1}
            className="min-h-10 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0 rounded-xl shadow-md shadow-primary/20"
          >
            <SendIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
