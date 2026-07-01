"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface ChatDrawerContextType {
  isOpen: boolean
  openWithQuery: (query: string) => void
  close: () => void
  setIsOpen: (open: boolean) => void
  initialQuery: string
  clearInitialQuery: () => void
}

const ChatDrawerContext = createContext<ChatDrawerContextType | undefined>(undefined)

export function ChatDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState("")

  const openWithQuery = (query: string) => {
    setInitialQuery(query)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setInitialQuery("")
  }

  const clearInitialQuery = () => {
    setInitialQuery("")
  }

  return (
    <ChatDrawerContext.Provider
      value={{
        isOpen,
        openWithQuery,
        close,
        setIsOpen,
        initialQuery,
        clearInitialQuery,
      }}
    >
      {children}
    </ChatDrawerContext.Provider>
  )
}

export function useChatDrawer() {
  const context = useContext(ChatDrawerContext)
  if (!context) {
    throw new Error("useChatDrawer must be used within a ChatDrawerProvider")
  }
  return context
}
