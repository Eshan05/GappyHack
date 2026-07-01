"use client"

import Link from "next/link"
import { useTasks, useUpdateTask } from "@/hooks/use-lemma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { toast } from "sonner"
import { ListTodoIcon } from "lucide-react"

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

const statusFilters = ["all", "pending", "in_progress", "done", "cancelled"] as const

export function TaskList() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { records: tasks, isLoading, refresh } = useTasks(
    statusFilter !== "all"
      ? [{ field: "status", op: "eq", value: statusFilter }]
      : undefined
  )
  const { update } = useUpdateTask()

  async function toggleDone(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === "done" ? "pending" : "done"
    try {
      await update({ status: newStatus }, { recordId: taskId })
      toast.success(newStatus === "done" ? "Task completed" : "Task reopened")
      refresh()
    } catch {
      toast.error("Failed to update task")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all"
                  ? "All"
                  : s
                      .split("_")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="rounded-2xl bg-muted/50 p-6">
            <ListTodoIcon className="size-10 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <p className="font-medium text-muted-foreground">No tasks yet</p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              Process notes with AI to generate tasks automatically.
            </p>
          </div>
          <Button variant="outline" render={<Link href="/notes" />}>
            Go to Notes
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task: Record<string, unknown>) => (
            <Card key={task.id as string} className="transition-shadow hover:shadow-sm">
              <CardContent className="flex items-start gap-3 py-3">
                <Checkbox
                  checked={(task.status as string) === "done"}
                  onCheckedChange={() =>
                    toggleDone(task.id as string, task.status as string)
                  }
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <p
                    className={`text-sm font-medium ${
                      (task.status as string) === "done"
                        ? "text-muted-foreground line-through"
                        : ""
                    }`}
                  >
                    {task.title as string}
                  </p>
                  {task.description ? (
                    <p className="text-xs text-muted-foreground">
                      {String(task.description)}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${priorityColors[String(task.priority ?? "medium")] ?? priorityColors.medium}`}
                    >
                      {String(task.priority ?? "medium")}
                    </Badge>
                    {task.due_date ? (
                      <span className="text-[10px] text-muted-foreground">
                        Due: {new Date(String(task.due_date)).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
