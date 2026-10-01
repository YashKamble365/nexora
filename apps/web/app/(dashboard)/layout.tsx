"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AppShell } from "@/components/shared/app-shell"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { useSocket } from "@/lib/use-socket"
import { NotificationDTO } from "@nexora/types"
import { NotificationToastProvider } from "@/components/shared/notification-toast"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth()
  const { socket } = useSocket()
  const pathname = usePathname()

  const [emergencyAlert, setEmergencyAlert] = React.useState<{
    title: string;
    severity?: 'WARNING' | 'CRITICAL' | 'EVACUATION';
    actionRequired?: string;
  } | null>(null)

  const [counts, setCounts] = React.useState({
    messages: 0,
    notices: 0,
    complaints: 0,
    pendingApprovals: 0,
    events: 0,
    polls: 0,
    files: 0,
  })

  // 1. Emergency Alert Polling
  const fetchActiveEmergency = React.useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/emergency/active')
      if (Array.isArray(res) && res.length > 0) {
        setEmergencyAlert(res[0])
      } else if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setEmergencyAlert(res.data[0])
      } else if (res && res.title) {
        setEmergencyAlert(res)
      } else {
        setEmergencyAlert(null)
      }
    } catch {
      setEmergencyAlert(null)
    }
  }, [])

  // 2. Fetch Live Unread & Pending Counts Across Modules
  const fetchCounts = React.useCallback(async () => {
    if (!user) return

    try {
      // Unread notifications
      const notifsPromise = apiClient.get<NotificationDTO[]>('/notifications').catch(() => [])

      // Pending user/college approvals for verifier roles
      const isVerifier =
        user.role === "SUPER_ADMIN" ||
        user.role === "ADMIN" ||
        (user.role === "FACULTY" && (user.facultyRole === "HOD" || user.facultyRole === "CLASS_COORDINATOR"))

      let approvalsPromise: Promise<number> = Promise.resolve(0)
      if (isVerifier) {
        if (user.role === "SUPER_ADMIN") {
          approvalsPromise = apiClient.get<{ institutes?: any[] }>("/institutes/all")
            .then((res) => (res?.institutes || []).filter((i: any) => i.status === "PENDING_APPROVAL").length)
            .catch(() => 0)
        } else {
          approvalsPromise = apiClient.get<{ pendingUsers?: any[] }>("/approvals/pending")
            .then((res) => (res?.pendingUsers || []).length)
            .catch(() => 0)
        }
      }

      // Open/Submitted complaints count
      let complaintsPromise: Promise<number> = Promise.resolve(0)
      if (["ADMIN", "SUPER_ADMIN", "FACULTY"].includes(user.role)) {
        complaintsPromise = apiClient.get<{ stats?: { submitted?: number } }>("/complaints/stats")
          .then((res) => res?.stats?.submitted || 0)
          .catch(() => 0)
      } else {
        complaintsPromise = apiClient.get<{ complaints?: any[] }>("/complaints")
          .then((res) => (res?.complaints || []).filter((c: any) => c.status !== "RESOLVED").length)
          .catch(() => 0)
      }

      const [notifs, pendingApprovals, pendingComplaints] = await Promise.all([
        notifsPromise,
        approvalsPromise,
        complaintsPromise,
      ])

      const notifList = Array.isArray(notifs) ? notifs : []
      const unreadNotices = notifList.filter((n) => !n.isRead && n.type === "NOTICE").length
      const unreadMessages = notifList.filter((n) => !n.isRead && n.type === "MESSAGE").length
      const unreadEvents = notifList.filter((n) => !n.isRead && n.type === "EVENT").length
      const unreadPolls = notifList.filter((n) => !n.isRead && n.type === "POLL").length
      const unreadFiles = notifList.filter((n) => !n.isRead && n.type === "SYSTEM" && n.link?.includes("/files")).length
      const unreadComplaintsNotifs = notifList.filter((n) => !n.isRead && n.type === "COMPLAINT").length

      setCounts({
        messages: unreadMessages,
        notices: unreadNotices,
        complaints: Math.max(pendingComplaints, unreadComplaintsNotifs),
        pendingApprovals,
        events: unreadEvents,
        polls: unreadPolls,
        files: unreadFiles,
      })
    } catch {
      // Retain existing state
    }
  }, [user])

  React.useEffect(() => {
    fetchActiveEmergency()
    fetchCounts()

    // 15-second background sync keeps all dashboard counts and badges fresh
    const interval = setInterval(() => {
      fetchActiveEmergency()
      fetchCounts()
    }, 15000)

    const onFocus = () => {
      fetchActiveEmergency()
      fetchCounts()
    }

    const onVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchActiveEmergency()
        fetchCounts()
      }
    }

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("nexora_socket_connected", onFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("nexora_socket_connected", onFocus)
    }
  }, [fetchActiveEmergency, fetchCounts])

  // 3. Clear badge for currently viewed section
  React.useEffect(() => {
    if (!pathname) return
    setCounts((prev) => {
      const next = { ...prev }
      if (pathname.startsWith("/app/notices")) next.notices = 0
      if (pathname.startsWith("/app/messages")) next.messages = 0
      if (pathname.startsWith("/app/events")) next.events = 0
      if (pathname.startsWith("/app/polls")) next.polls = 0
      if (pathname.startsWith("/app/files")) next.files = 0
      return next
    })
  }, [pathname])

  // 4. Real-time Socket.IO Listeners
  React.useEffect(() => {
    if (!socket) return

    const handleBroadcast = (alert: any) => {
      setEmergencyAlert(alert)
    }

    const handleDeactivated = () => {
      setEmergencyAlert(null)
    }

    const handleNewNotification = (notif: NotificationDTO) => {
      setCounts((prev) => {
        const next = { ...prev }
        if (notif.type === "NOTICE") next.notices += 1
        else if (notif.type === "MESSAGE") next.messages += 1
        else if (notif.type === "COMPLAINT") next.complaints += 1
        else if (notif.type === "EVENT") next.events += 1
        else if (notif.type === "POLL") next.polls += 1
        else if (notif.type === "SYSTEM") {
          if (notif.link?.includes("/files")) next.files += 1
          else if (notif.link?.includes("/approvals")) next.pendingApprovals += 1
        }
        return next
      })
    }

    const handleNewMessage = () => {
      setCounts((prev) => ({ ...prev, messages: prev.messages + 1 }))
    }

    socket.on("emergency_alert_broadcast", handleBroadcast)
    socket.on("emergency_alert_deactivated", handleDeactivated)
    socket.on("new_notification", handleNewNotification)
    socket.on("new_message", handleNewMessage)

    return () => {
      socket.off("emergency_alert_broadcast", handleBroadcast)
      socket.off("emergency_alert_deactivated", handleDeactivated)
      socket.off("new_notification", handleNewNotification)
      socket.off("new_message", handleNewMessage)
    }
  }, [socket])

  return (
    <NotificationToastProvider>
      <AppShell
        user={
          user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                facultyRole: user.facultyRole,
                coordinatorYear: user.coordinatorYear,
                department: user.department,
                academicYear: user.academicYear,
                instituteName:
                  user.instituteName ||
                  (typeof user.instituteId === "object" ? (user.instituteId as any)?.name : undefined) ||
                  (user.email?.includes("prpcem.edu")
                    ? "P. R. Pote Patil College of Engineering and Management"
                    : undefined),
                avatarUrl: user.avatarUrl,
              }
            : undefined
        }
        unreadCounts={counts}
        hasActiveEmergency={Boolean(emergencyAlert)}
        emergencyAlert={emergencyAlert}
      >
        {children}
      </AppShell>
    </NotificationToastProvider>
  );
}
