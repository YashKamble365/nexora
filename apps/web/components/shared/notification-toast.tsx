"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  X,
  FileText,
  MessageSquare,
  LifeBuoy,
  Calendar,
  Vote,
  ShieldAlert,
  ArrowRight,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { NotificationType } from "@nexora/types"
import { apiClient } from "@/lib/api"
import { useSocket } from "@/lib/use-socket"

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (item: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a NotificationToastProvider")
  }
  return context
}

function playNotificationChime() {
  if (typeof window === "undefined") return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === "suspended") {
      ctx.resume()
    }
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1) // A5
    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.26)
  } catch {
    // Audio autoplay policy fallback
  }
}

function getToastVisuals(type: NotificationType) {
  switch (type) {
    case "NOTICE":
      return {
        icon: FileText,
        badgeBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        label: "Notice",
      }
    case "MESSAGE":
      return {
        icon: MessageSquare,
        badgeBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        label: "Chat",
      }
    case "COMPLAINT":
      return {
        icon: LifeBuoy,
        badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        label: "Grievance",
      }
    case "EVENT":
      return {
        icon: Calendar,
        badgeBg: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        label: "Event",
      }
    case "POLL":
      return {
        icon: Vote,
        badgeBg: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        label: "Poll",
      }
    case "SYSTEM":
    default:
      return {
        icon: ShieldAlert,
        badgeBg: "bg-primary/10 text-primary border-primary/20",
        label: "Campus Alert",
      }
  }
}

export function NotificationToastProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { socket } = useSocket()
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const seenNotificationIds = React.useRef(new Set<string>())

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = React.useCallback(
    (item: Omit<ToastItem, "id"> & { id?: string }) => {
      const id = item.id || `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      if (seenNotificationIds.current.has(id)) return
      seenNotificationIds.current.add(id)

      const newToast: ToastItem = { ...item, id }

      try {
        playNotificationChime()
      } catch {
        // Autoplay policy fallback
      }

      setToasts((prev) => [newToast, ...prev.filter((t) => t.id !== id).slice(0, 3)])

      // Auto dismiss timer
      const duration = item.duration ?? 5500
      setTimeout(() => {
        dismissToast(id)
      }, duration)
    },
    [dismissToast]
  )

  // Listen to Socket.IO live notifications & background sync events
  React.useEffect(() => {
    const handleNewNotification = (notif: any) => {
      if (!notif) return
      showToast({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        link: notif.link,
      })
    }

    const handleEmergencyBroadcast = (alert: any) => {
      if (!alert) return
      showToast({
        id: alert.id,
        title: `EMERGENCY ALERT: ${alert.title}`,
        message: alert.actionRequired || alert.message,
        type: "SYSTEM",
        link: "/app/emergency",
        duration: 9000,
      })
    }

    const handleSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail) {
        handleNewNotification(customEvent.detail)
      }
    }

    if (socket) {
      socket.on("new_notification", handleNewNotification)
      socket.on("emergency_alert_broadcast", handleEmergencyBroadcast)
    }

    window.addEventListener("nexora_notification_sync", handleSyncEvent)

    return () => {
      if (socket) {
        socket.off("new_notification", handleNewNotification)
        socket.off("emergency_alert_broadcast", handleEmergencyBroadcast)
      }
      window.removeEventListener("nexora_notification_sync", handleSyncEvent)
    }
  }, [socket, showToast])

  const handleToastClick = async (toast: ToastItem) => {
    dismissToast(toast.id)
    if (toast.link) {
      try {
        await apiClient.patch(`/notifications/${toast.id}/read`)
      } catch {
        // Ignored
      }
      router.push(toast.link)
    }
  }

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Floating Popup Toasts Container */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[9999] flex flex-col gap-2.5 max-w-[calc(100vw-2rem)] sm:max-w-md w-full pointer-events-none px-2 sm:px-0"
      >
        {toasts.map((toast) => {
          const visuals = getToastVisuals(toast.type)
          const Icon = visuals.icon

          return (
            <div
              key={toast.id}
              role="alert"
              className={cn(
                "pointer-events-auto group relative flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-2xl transition-all duration-200",
                "animate-in slide-in-from-top-3 fade-in-0 duration-200 hover:shadow-xl"
              )}
            >
              {/* Type Icon Badge */}
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                  visuals.badgeBg
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Toast Content */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => handleToastClick(toast)}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    {visuals.label}
                  </span>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="text-[10px] text-muted-foreground">Just now</span>
                </div>

                <p className="text-xs font-semibold text-foreground truncate">
                  {toast.title}
                </p>

                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                  {toast.message}
                </p>

                {toast.link && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary group-hover:underline">
                    <span>View details</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  dismissToast(toast.id)
                }}
                className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
