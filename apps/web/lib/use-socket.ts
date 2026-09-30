"use client"

import * as React from "react"
import { io, Socket } from "socket.io-client"
import { obtainToken, getApiHost } from "@/lib/api"

let globalSocket: Socket | null = null
let currentSocketToken: string | null = null
const activeRooms = new Set<string>()

function getSocketUrl(): string {
  return getApiHost();
}

export function updateSocketAuthToken(token: string | null): Socket | null {
  if (typeof window === "undefined") return null
  if (!token) {
    if (globalSocket) {
      globalSocket.disconnect()
      globalSocket = null
      currentSocketToken = null
    }
    return null
  }

  currentSocketToken = token

  if (globalSocket) {
    globalSocket.auth = { token }
    if (globalSocket.disconnected) {
      globalSocket.connect()
    } else {
      // Reconnect with new credentials
      globalSocket.disconnect().connect()
    }
    return globalSocket
  }

  return getSocketInstance(token)
}

export function getSocketInstance(forceToken?: string): Socket | null {
  if (typeof window === "undefined") return null

  const token = forceToken || currentSocketToken || localStorage.getItem("nexora_token")
  if (!token) {
    return null
  }

  currentSocketToken = token

  // If instance already exists, reuse it
  if (globalSocket) {
    if (globalSocket.auth && (globalSocket.auth as any).token !== token) {
      globalSocket.auth = { token }
      globalSocket.disconnect().connect()
    } else if (globalSocket.disconnected) {
      globalSocket.connect()
    }
    return globalSocket
  }

  const wsUrl = getSocketUrl()

  globalSocket = io(wsUrl, {
    auth: { token },
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ["websocket", "polling"],
  })

  globalSocket.on("connect", () => {
    // Rejoin all active rooms on connect or reconnection
    activeRooms.forEach((roomId) => {
      globalSocket?.emit("join_conversation", roomId)
    })
  })

  globalSocket.on("connect_error", async (err) => {
    console.warn("[Nexora Socket Gateway] Connect error:", err.message)
    if (
      err.message.includes("authentication") ||
      err.message.includes("token") ||
      err.message.includes("User inactive")
    ) {
      // Try to re-authenticate with refreshed token once
      try {
        const freshToken = await obtainToken()
        if (freshToken && globalSocket) {
          currentSocketToken = freshToken
          globalSocket.auth = { token: freshToken }
          globalSocket.connect()
        }
      } catch {
        // Ignored
      }
    }
  })

  return globalSocket
}

export function useSocket() {
  const [socket, setSocket] = React.useState<Socket | null>(globalSocket)
  const [isConnected, setIsConnected] = React.useState<boolean>(Boolean(globalSocket?.connected))

  React.useEffect(() => {
    let isMounted = true

    const setupSocket = async () => {
      let s = getSocketInstance()
      if (!s) {
        // If token wasn't in storage yet, obtain it automatically
        const token = await obtainToken()
        if (!isMounted) return
        if (token) {
          s = getSocketInstance(token)
        }
      }

      if (!isMounted || !s) return

      setSocket(s)
      setIsConnected(s.connected)

      const onConnect = () => {
        if (isMounted) setIsConnected(true)
      }
      const onDisconnect = () => {
        if (isMounted) setIsConnected(false)
      }
      const onConnectError = () => {
        if (isMounted) setIsConnected(false)
      }

      s.on("connect", onConnect)
      s.on("disconnect", onDisconnect)
      s.on("connect_error", onConnectError)

      if (s.connected && isMounted) {
        setIsConnected(true)
      }

      return () => {
        s.off("connect", onConnect)
        s.off("disconnect", onDisconnect)
        s.off("connect_error", onConnectError)
      }
    }

    const cleanupPromise = setupSocket()

    // Listen to token updates across tabs/logins
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nexora_token" && e.newValue) {
        const refreshedSocket = updateSocketAuthToken(e.newValue)
        if (refreshedSocket && isMounted) {
          setSocket(refreshedSocket)
          setIsConnected(refreshedSocket.connected)
        }
      }
    }
    window.addEventListener("storage", handleStorageChange)

    return () => {
      isMounted = false
      window.removeEventListener("storage", handleStorageChange)
      cleanupPromise.then((cleanup) => cleanup && cleanup())
    }
  }, [])

  const joinConversation = React.useCallback(
    (conversationId: string) => {
      if (!conversationId) return
      activeRooms.add(conversationId)
      const targetSocket = socket || globalSocket
      if (targetSocket && targetSocket.connected) {
        targetSocket.emit("join_conversation", conversationId)
      }
    },
    [socket]
  )

  const leaveConversation = React.useCallback(
    (conversationId: string) => {
      if (!conversationId) return
      activeRooms.delete(conversationId)
      const targetSocket = socket || globalSocket
      if (targetSocket && targetSocket.connected) {
        targetSocket.emit("leave_conversation", conversationId)
      }
    },
    [socket]
  )

  const sendTypingStart = React.useCallback(
    (conversationId: string) => {
      const targetSocket = socket || globalSocket
      if (targetSocket && targetSocket.connected) {
        targetSocket.emit("typing_start", { conversationId })
      }
    },
    [socket]
  )

  const sendTypingStop = React.useCallback(
    (conversationId: string) => {
      const targetSocket = socket || globalSocket
      if (targetSocket && targetSocket.connected) {
        targetSocket.emit("typing_stop", { conversationId })
      }
    },
    [socket]
  )

  return {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    sendTypingStart,
    sendTypingStop,
  }
}
