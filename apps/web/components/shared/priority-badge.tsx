import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type PriorityType = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL" | "NORMAL" | "IMPORTANT";

interface PriorityBadgeProps {
  priority: PriorityType;
  className?: string;
}

const priorityConfig: Record<
  PriorityType,
  { label: string; badgeClass: string }
> = {
  LOW: {
    label: "Low",
    badgeClass: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  },
  NORMAL: {
    label: "Normal",
    badgeClass: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  },
  IMPORTANT: {
    label: "Important",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  },
  HIGH: {
    label: "High",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  },
  URGENT: {
    label: "Urgent",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900 font-semibold",
  },
  CRITICAL: {
    label: "Critical",
    badgeClass: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-400 dark:border-red-900 font-semibold",
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.LOW;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs border rounded-md uppercase tracking-wider text-[10px]",
        config.badgeClass,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
