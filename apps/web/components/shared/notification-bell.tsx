"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  CheckCheck,
  FileText,
  MessageSquare,
  LifeBuoy,
  Calendar,
  Vote,
  ShieldAlert,
  Loader2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { NotificationDTO, NotificationType } from "@nexora/types"
import { apiClient } from "@/lib/api"
import { useSocket } from "@/lib/use-socket"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function formatTimeAgo(isoString: string): string {
  try {
    const diffSeconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
    if (diffSeconds < 60) return "Just now"
    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  } catch {
    return ""
  }
}

function getNotificationVisuals(type: NotificationType) {
  switch (type) {
    case "NOTICE":
      return {
        icon: FileText,
        color: "text-blue-500 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
        label: "Notice",
      }
    case "MESSAGE":
      return {
        icon: MessageSquare,
        color: "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        label: "Chat",
      }
    case "COMPLAINT":
      return {
        icon: LifeBuoy,
        color: "text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
        label: "Grievance",
      }
    case "EVENT":
      return {
        icon: Calendar,
        color: "text-purple-500 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
        label: "Event",
      }
    case "POLL":
      return {
        icon: Vote,
        color: "text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
        label: "Poll",
      }
    case "SYSTEM":
    default:
      return {
        icon: ShieldAlert,
        color: "text-primary bg-primary/10 border-primary/20",
        label: "Campus",
      }
  }
}

export function NotificationBell() {
  const router = useRouter()
  const { socket } = useSocket()
  const [notifications, setNotifications] = React.useState<NotificationDTO[]>([])
  const [unreadCount, setUnreadCount] = React.useState<number>(0)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [open, setOpen] = React.useState<boolean>(false)

  const knownIdsRef = React.useRef<Set<string>>(new Set())
  const hasLoadedRef = React.useRef(false)

  // 1. Load Notifications & Sync New Items
  const fetchNotifications = React.useCallback(async () => {
    try {
      const data = await apiClient.get<NotificationDTO[]>("/notifications")
      if (Array.isArray(data)) {
        // If this is a background sync, detect newly arrived unread notifications
        if (hasLoadedRef.current) {
          data.forEach((item) => {
            if (!item.isRead && !knownIdsRef.current.has(item.id)) {
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("nexora_notification_sync", { detail: item })
                )
              }
            }
          })
        }

        // Update known IDs
        data.forEach((n) => knownIdsRef.current.add(n.id))
        hasLoadedRef.current = true

        setNotifications(data)
        const unread = data.filter((n) => !n.isRead).length
        setUnreadCount(unread)
      }
    } catch {
      // Fallback silently when offline or demo
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-sync notifications on mount, tab focus, visibility change, and interval
  React.useEffect(() => {
    fetchNotifications()

    // 10-second polling interval ensures real-time sync even if WebSockets are throttled
    const interval = setInterval(() => {
      fetchNotifications()
    }, 10000)

    const onFocus = () => fetchNotifications()
    const onVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchNotifications()
      }
    }
    const onSocketConnect = () => fetchNotifications()

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("nexora_socket_connected", onSocketConnect)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("nexora_socket_connected", onSocketConnect)
    }
  }, [fetchNotifications])

  // 2. Realtime Socket.IO listener for live notification broadcasts
  React.useEffect(() => {
    if (!socket) return

    const handleNewNotification = (notification: NotificationDTO) => {
      knownIdsRef.current.add(notification.id)
      setNotifications((prev) => [
        notification,
        ...prev.filter((n) => n.id !== notification.id),
      ])
      setUnreadCount((prev) => prev + 1)
    }

    socket.on("new_notification", handleNewNotification)

    return () => {
      socket.off("new_notification", handleNewNotification)
    }
  }, [socket])

  // 3. Mark Single Notification as Read and Navigate
  const handleNotificationClick = async (notif: NotificationDTO) => {
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      try {
        await apiClient.patch(`/notifications/${notif.id}/read`)
      } catch {
        // Optimistic update retained
      }
    }

    setOpen(false)
    if (notif.link) {
      router.push(notif.link)
    }
  }

  // 4. Mark All As Read
  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
    try {
      await apiClient.patch("/notifications/read-all")
    } catch {
      // Optimistic update retained
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Notifications (${unreadCount} unread)`}
            className="relative flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-sm animate-in fade-in zoom-in">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        }
      />

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 p-0 rounded-xl shadow-xl border-border bg-popover overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5 text-primary" />
              <span>Mark all read</span>
            </Button>
          )}
        </div>

        {/* Notifications Feed */}
        <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Loading campus feed...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                <Bell className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">All caught up</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                No new alerts or activity notifications.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const visuals = getNotificationVisuals(notif.type)
              const Icon = visuals.icon

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/60 text-left",
                    !notif.isRead && "bg-primary/[0.04]"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                      visuals.color
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p
                        className={cn(
                          "text-xs truncate",
                          !notif.isRead ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                        )}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-normal">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {!notif.isRead && (
                    <div className="self-center shrink-0">
                      <span className="flex h-2 w-2 rounded-full bg-primary ring-2 ring-primary/20" />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
