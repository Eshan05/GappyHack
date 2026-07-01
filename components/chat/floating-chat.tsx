"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useUploadDocument } from "@/hooks/use-lemma"
import { useOracleChat } from "@/context/oracle-chat-context"
import { useChatDrawer } from "@/context/chat-drawer-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatInstanceMenu } from "@/components/chat/chat-instances"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  BrainIcon,
  SparklesIcon,
  SendIcon,
  XIcon,
  MicIcon,
  PaperclipIcon,
  Loader2Icon,
  ArrowRightIcon,
  PlusIcon,
} from "lucide-react"
import { toast } from "sonner"
import type { AssistantRenderableMessage } from "lemma-sdk/react"

const defaultSuggestions = [
  "What is the summary of my notes?",
  "What tasks do I have pending?",
  "Find connections between my documents",
  "Explain my latest project notes",
]

export function FloatingChat() {
  const { isOpen, setIsOpen, initialQuery, clearInitialQuery } = useChatDrawer()
  const pathname = usePathname()
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
  const { upload, isSubmitting: isUploading } = useUploadDocument()
  
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pathnameRef = useRef(pathname)
  const initialQueryRef = useRef<string | null>(null)

  useEffect(() => {
    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname
      setIsOpen(false)
      clearInitialQuery()
    }
  }, [pathname, setIsOpen, clearInitialQuery])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-slot='scroll-area-viewport']")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, isLoading])

  // Handle initial query from dashboard quick prompts.
  useEffect(() => {
    if (!isOpen || !initialQuery) return
    if (initialQueryRef.current === initialQuery) return

    initialQueryRef.current = initialQuery
    clearInitialQuery()
    void sendMessage(initialQuery, {
      forceNewConversation: true,
      conversationMetadata: { source: "quick_prompt" },
    })
      .catch(() => {
        toast.error("Failed to send message")
      })
      .finally(() => {
        if (initialQueryRef.current === initialQuery) {
          initialQueryRef.current = null
        }
      })
  }, [isOpen, initialQuery, sendMessage, clearInitialQuery])

  // Send message
  async function handleSend(textToSend?: string) {
    const query = textToSend || input.trim()
    if (!query || isLoading) return
    if (!textToSend) setInput("")
    
    try {
      await sendMessage(query)
    } catch {
      toast.error("Failed to send message")
    }
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

  // File Upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      toast.loading(`Uploading ${file.name}...`)
      await upload(file, { directoryPath: "/knowledge", name: file.name })
      toast.dismiss()
      toast.success(`Uploaded ${file.name} to knowledge base!`)
      
      // Auto-notify the assistant about the upload
      await sendMessage(`I just uploaded a document named ${file.name}. Can you summarize it for me?`)
    } catch {
      toast.dismiss()
      toast.error("Failed to upload document")
    }
    
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function toggleVoiceInput() {
    toast.info("Voice input is not connected yet.")
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

  // Extract last assistant response to generate suggested follow-ups
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant")

  const getSuggestedFollowUps = () => {
    if (!lastAssistantMessage) return defaultSuggestions
    const text = getMessageText(lastAssistantMessage).toLowerCase()
    
    if (text.includes("task") || text.includes("todo")) {
      return ["Show me my high-priority tasks", "How can I complete these tasks?"]
    }
    if (text.includes("note") || text.includes("document")) {
      return ["Find related notes on this", "Summarize this topic further"]
    }
    return [
      "Can you explain that in more detail?",
      "Are there any related ideas in my notes?",
      "What are the next steps?",
    ]
  }

  if (pathname === "/chat") return null

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 focus:outline-none transition-shadow"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <XIcon className="size-6" />
            </motion.div>
          ) : (
            <motion.div
              key="sparkles"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <SparklesIcon className="size-6 animate-pulse" />
              <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="min-h-0 gap-0 overflow-hidden border-gray-100 bg-white p-0 shadow-2xl data-[side=right]:w-full! data-[side=right]:sm:w-[480px]! data-[side=right]:sm:max-w-none! dark:border-zinc-900 dark:bg-zinc-950"
        >
              {/* Header */}
              <SheetHeader className="shrink-0 flex-row items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/50 p-4 dark:border-zinc-900 dark:bg-zinc-900/20">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/10">
                    <BrainIcon className="size-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <SheetTitle className="text-sm font-bold text-foreground">Oracle Assistant</SheetTitle>
                    <ChatInstanceMenu
                      conversations={conversations}
                      activeConversationId={activeConversationId}
                      isLoadingConversations={isLoadingConversations}
                      isLoadingMoreConversations={isLoadingMoreConversations}
                      hasMoreConversations={hasMoreConversations}
                      onSelectConversation={selectConversation}
                      onNewChat={handleNewChat}
                      onLoadMoreConversations={loadMoreConversations}
                      className="mt-1 h-7 max-w-[210px] text-[11px]"
                    />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewChat}
                    className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <PlusIcon className="size-4" />
                    <span className="sr-only">New chat</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              </SheetHeader>

              {/* Chat Conversation Area */}
              <ScrollArea ref={scrollRef} className="min-h-0 flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-5 text-center py-16 px-4">
                    <div className="relative">
                      <div className="rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 p-4">
                        <BrainIcon className="size-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 shadow">
                        <SparklesIcon className="size-2.5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">How can I help you today?</h4>
                      <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
                        Ask about your notes, extract tasks, summarize documents, or explore connections.
                      </p>
                    </div>

                    {/* Default Suggestions */}
                    <div className="w-full max-w-sm space-y-2 mt-2">
                      {defaultSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(suggestion)}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-medium rounded-xl border border-gray-100 bg-white hover:bg-gray-50 hover:border-emerald-500/20 text-gray-700 dark:border-zinc-900 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:text-zinc-300 transition-all"
                        >
                          <span className="truncate">{suggestion}</span>
                          <ArrowRightIcon className="size-3 text-muted-foreground/40 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pb-6">
                    {(() => {
                      // Filter messages to show clean dialogue
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
                        <div key={msg.id} className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
                          {!isUser && (
                            <Avatar className="size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/10 shadow-sm">
                              <BrainIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                            </Avatar>
                          )}
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                              isUser
                                ? "rounded-br-none bg-emerald-600 text-white"
                                : "rounded-bl-none bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-foreground"
                            }`}
                          >
                            {isUser ? (
                              <p className="whitespace-pre-wrap">{text}</p>
                            ) : (
                              <div className="prose prose-xs dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 max-w-none prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-950 prose-pre:p-2 prose-pre:rounded-lg prose-code:text-emerald-600 dark:prose-code:text-emerald-400">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {text}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                          {isUser && (
                            <Avatar className="size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/10 shadow-sm">
                              <span className="text-xs">T</span>
                            </Avatar>
                          )}
                        </div>
                      )
                    })}

                    {isLoading && (
                      <div className="flex gap-3">
                        <Avatar className="size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/10 shadow-sm">
                          <BrainIcon className="size-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                        </Avatar>
                        <div className="flex items-center gap-2 rounded-2xl rounded-bl-none bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 px-4 py-2.5">
                          <Loader2Icon className="size-3.5 animate-spin text-emerald-500" />
                          <span className="text-xs text-muted-foreground font-medium">Thinking...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Chat Input Footer */}
              <div className="shrink-0 p-4 border-t border-gray-100 dark:border-zinc-900 space-y-3 bg-white dark:bg-zinc-950">
                
                {error && <p className="text-xs text-destructive">{error}</p>}

                {/* Suggested follow-ups */}
                {messages.length > 0 && !isLoading && (
                  <div className="flex flex-wrap gap-1.5 max-h-[72px] overflow-y-auto no-scrollbar">
                    {getSuggestedFollowUps().map((followUp, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(followUp)}
                        className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10 transition-colors"
                      >
                        {followUp}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Container */}
                <div className="relative flex items-end gap-2 border border-gray-200 dark:border-zinc-800 rounded-2xl p-2 bg-gray-50/50 dark:bg-zinc-900/40 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all duration-200">
                  {/* File Upload Trigger */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.html,.epub,.txt,.md"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="size-8 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
                  >
                    {isUploading ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <PaperclipIcon className="size-4" />
                    )}
                  </Button>

                  {/* Voice Input Trigger */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={toggleVoiceInput}
                    className="size-8 rounded-xl shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <MicIcon className="size-4" />
                  </Button>

                  {/* Textarea */}
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message Oracle..."
                    rows={1}
                    className="flex-1 min-h-[36px] max-h-[120px] resize-none border-0 bg-transparent py-2 px-1 text-xs shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 leading-normal"
                  />

                  {/* Send Button */}
                  <Button
                    type="button"
                    size="icon"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="size-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10 shrink-0 transition-transform active:scale-95"
                  >
                    <SendIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
