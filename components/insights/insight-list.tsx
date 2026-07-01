"use client"

import Link from "next/link"
import { useInsights } from "@/hooks/use-lemma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LightbulbIcon,
  HelpCircleIcon,
  ListTodoIcon,
  LinkIcon,
  FileTextIcon,
  TrendingUpIcon,
} from "lucide-react"

const typeConfig: Record<
  string,
  { icon: typeof LightbulbIcon; color: string }
> = {
  key_point: {
    icon: LightbulbIcon,
    color: "text-yellow-600 dark:text-yellow-400",
  },
  question: {
    icon: HelpCircleIcon,
    color: "text-blue-600 dark:text-blue-400",
  },
  action_item: {
    icon: ListTodoIcon,
    color: "text-green-600 dark:text-green-400",
  },
  connection: {
    icon: LinkIcon,
    color: "text-purple-600 dark:text-purple-400",
  },
  summary: {
    icon: FileTextIcon,
    color: "text-gray-600 dark:text-gray-400",
  },
  pattern: {
    icon: TrendingUpIcon,
    color: "text-orange-600 dark:text-orange-400",
  },
}

export function InsightList() {
  const { records: insights, isLoading } = useInsights()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="rounded-2xl bg-muted/50 p-6">
          <LightbulbIcon className="size-10 text-muted-foreground/40" />
        </div>
        <div className="text-center">
          <p className="font-medium text-muted-foreground">No insights yet</p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Process notes with AI to extract insights automatically.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/notes" />}>
          Go to Notes
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {insights.map((insight: Record<string, unknown>) => {
        const config = typeConfig[(insight.type as string) ?? "key_point"] ?? typeConfig.key_point
        const Icon = config.icon

        return (
          <Card key={insight.id as string} className="transition-shadow hover:shadow-sm">
            <CardContent className="flex items-start gap-3 py-3">
              <Icon className={`mt-0.5 size-4 shrink-0 ${config.color}`} />
              <div className="flex-1 space-y-1">
                <p className="text-sm">{insight.content as string}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {(insight.type as string)?.replace("_", " ")}
                  </Badge>
                  {(insight.confidence as number) != null && (
                    <span className="text-[10px] text-muted-foreground">
                      {((insight.confidence as number) * 100).toFixed(0)}% confidence
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
