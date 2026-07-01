import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LemmaProvider } from "@/components/lemma-provider"
import { ChatDrawerProvider } from "@/context/chat-drawer-context"
import { AppShell } from "@/components/app-shell"
import { Toaster } from "@/components/ui/sonner"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: "Second Brain",
  description:
    "AI-powered second brain that connects your notes, extracts insights, and turns knowledge into action.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
    >
      <body>
        <ThemeProvider>
          <LemmaProvider>
            <ChatDrawerProvider>
              <AppShell>{children}</AppShell>
              <Toaster />
            </ChatDrawerProvider>
          </LemmaProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
