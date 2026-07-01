"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { UseAssistantControllerResult } from "lemma-sdk/react"
import { useOracleChat as useOracleChatController } from "@/hooks/use-lemma"

const OracleChatContext = createContext<UseAssistantControllerResult | null>(null)

export function OracleChatProvider({ children }: { children: ReactNode }) {
  const oracleChat = useOracleChatController()

  return (
    <OracleChatContext.Provider value={oracleChat}>
      {children}
    </OracleChatContext.Provider>
  )
}

export function useOracleChat() {
  const context = useContext(OracleChatContext)

  if (!context) {
    throw new Error("useOracleChat must be used within an OracleChatProvider")
  }

  return context
}
