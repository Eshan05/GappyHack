"use client"

import type { Conversation } from "lemma-sdk"
import {
  CheckIcon,
  ChevronsUpDownIcon,
  Loader2Icon,
  MessageSquareIcon,
  PlusIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type ChatInstanceSelectorProps = {
  conversations: Conversation[]
  activeConversationId: string | null
  isLoadingConversations?: boolean
  isLoadingMoreConversations?: boolean
  hasMoreConversations?: boolean
  onSelectConversation: (conversationId: string | null) => void
  onNewChat?: () => void
  onLoadMoreConversations?: () => Promise<unknown> | void
  className?: string
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
})

function getConversationTitle(conversation: Conversation | null | undefined, fallback: string) {
  return conversation?.title?.trim() || fallback
}

function getConversationDate(conversation: Conversation) {
  const value = conversation.updated_at || conversation.created_at
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "Recent"
  return dateFormatter.format(date)
}

function getStatusLabel(conversation: Conversation) {
  return conversation.status?.toString().toLowerCase() || "ready"
}

function getActiveConversation(
  conversations: Conversation[],
  activeConversationId: string | null
) {
  return conversations.find((conversation) => conversation.id === activeConversationId) ?? null
}

export function getChatInstanceTitle(
  conversations: Conversation[],
  activeConversationId: string | null
) {
  const activeConversation = getActiveConversation(conversations, activeConversationId)
  return getConversationTitle(activeConversation, "New chat")
}

export function ChatInstanceSidebar({
  conversations,
  activeConversationId,
  isLoadingConversations = false,
  isLoadingMoreConversations = false,
  hasMoreConversations = false,
  onSelectConversation,
  onNewChat,
  onLoadMoreConversations,
  className,
}: ChatInstanceSelectorProps) {
  const startNewChat = onNewChat ?? (() => onSelectConversation(null))
  const canLoadMore = hasMoreConversations && onLoadMoreConversations

  return (
    <aside className={cn("flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card p-2 shadow-sm", className)}>
      <Button
        type="button"
        variant={activeConversationId ? "outline" : "secondary"}
        className="w-full justify-start"
        onClick={startNewChat}
      >
        <PlusIcon className="size-4" />
        <span>New chat</span>
      </Button>

      <div className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Chats
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 pr-2">
          {isLoadingConversations ? (
            <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
              <Loader2Icon className="size-3.5 animate-spin" />
              <span>Loading chats</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-2 py-3 text-xs text-muted-foreground">
              No chats yet.
            </div>
          ) : (
            conversations.map((conversation, index) => (
              <ConversationButton
                key={conversation.id}
                conversation={conversation}
                title={getConversationTitle(conversation, `Chat ${index + 1}`)}
                isActive={conversation.id === activeConversationId}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))
          )}
          {canLoadMore && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isLoadingMoreConversations}
              className="mt-1 w-full justify-center text-xs"
              onClick={() => {
                void onLoadMoreConversations?.()
              }}
            >
              {isLoadingMoreConversations && <Loader2Icon className="size-3.5 animate-spin" />}
              <span>{isLoadingMoreConversations ? "Loading more" : "Load more"}</span>
            </Button>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}

export function ChatInstanceMenu({
  conversations,
  activeConversationId,
  isLoadingConversations = false,
  isLoadingMoreConversations = false,
  hasMoreConversations = false,
  onSelectConversation,
  onNewChat,
  onLoadMoreConversations,
  className,
}: ChatInstanceSelectorProps) {
  const startNewChat = onNewChat ?? (() => onSelectConversation(null))
  const activeTitle = getChatInstanceTitle(conversations, activeConversationId)
  const canLoadMore = hasMoreConversations && onLoadMoreConversations

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("min-w-0 justify-start gap-1.5", className)}
          />
        }
      >
        <MessageSquareIcon className="size-3.5 shrink-0" />
        <span className="min-w-0 truncate">{activeTitle}</span>
        <ChevronsUpDownIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuItem onClick={startNewChat}>
          <PlusIcon className="size-4" />
          <span>New chat</span>
          {!activeConversationId && <CheckIcon className="ml-auto size-4" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Chats</DropdownMenuLabel>
        <div className="max-h-72 overflow-y-auto px-1 py-1">
          {isLoadingConversations ? (
            <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
              <Loader2Icon className="size-3.5 animate-spin" />
              <span>Loading chats</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-2 py-3 text-xs text-muted-foreground">
              No chats yet.
            </div>
          ) : (
            conversations.map((conversation, index) => {
              const title = getConversationTitle(conversation, `Chat ${index + 1}`)
              const isActive = conversation.id === activeConversationId

              return (
                <DropdownMenuItem
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className="min-w-0"
                >
                  <MessageSquareIcon className="size-4" />
                  <span className="min-w-0 flex-1 truncate">{title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {getConversationDate(conversation)}
                  </span>
                  {isActive && <CheckIcon className="size-4" />}
                </DropdownMenuItem>
              )
            })
          )}
          {canLoadMore && (
            <button
              type="button"
              disabled={isLoadingMoreConversations}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-md px-2 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              onClick={(event) => {
                event.preventDefault()
                void onLoadMoreConversations?.()
              }}
            >
              {isLoadingMoreConversations && <Loader2Icon className="size-3.5 animate-spin" />}
              <span>{isLoadingMoreConversations ? "Loading more" : "Load more"}</span>
            </button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ConversationButton({
  conversation,
  title,
  isActive,
  onClick,
}: {
  conversation: Conversation
  title: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors",
        isActive
          ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <MessageSquareIcon className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium">{title}</span>
        <span className="block truncate text-[10px] opacity-75">
          {getConversationDate(conversation)} - {getStatusLabel(conversation)}
        </span>
      </span>
      {isActive && <CheckIcon className="size-3.5 shrink-0" />}
    </button>
  )
}
