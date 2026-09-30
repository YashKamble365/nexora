"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth-context"
import { useSocket } from "@/lib/use-socket"
import {
  MessageDTO,
  ConversationDTO,
  GroupInviteDTO,
  DiscoverableGroupDTO,
  GroupAccessMode,
  MessageAttachment,
  DMPermission,
  Role,
} from "@nexora/types"
import {
  MessageSquare,
  Hash,
  Send,
  Paperclip,
  Smile,
  ShieldAlert,
  Search,
  MoreVertical,
  Check,
  CheckCheck,
  Plus,
  Users,
  Lock,
  Radio,
  FileText,
  Image as ImageIcon,
  Download,
  AlertTriangle,
  X,
  UserCheck,
  UserX,
  Settings,
  ChevronRight,
  Info,
  ArrowLeft,
  UserPlus,
  LogOut,
  Trash2,
  Crown,
  Compass,
  ShieldCheck,
  Globe,
  Unlock,
  Sparkles,
  Undo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function getApiHost(): string {
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "https:" : "http:"
    const hostname = window.location.hostname || "localhost"
    return `${protocol}//${hostname}:4000`
  }
  return "http://localhost:4000"
}

const API_BASE = getApiHost()

interface DirectoryUser {
  id: string
  name: string
  role: Role
  department: string
  academicYear?: string
  semester?: string
  institutionalId: string
  avatarUrl?: string
  isOnline: boolean
  dmPermission: DMPermission
}

export default function MessagesPage() {
  const { user } = useAuth()
  const { socket, isConnected, joinConversation, leaveConversation, sendTypingStart, sendTypingStop } = useSocket()

  // Conversations and active selection
  const [conversations, setConversations] = React.useState<ConversationDTO[]>([])
  const [selectedConversation, setSelectedConversation] = React.useState<ConversationDTO | null>(null)
  const [messages, setMessages] = React.useState<MessageDTO[]>([])
  const [pendingRequests, setPendingRequests] = React.useState<any[]>([])
  const [sentRequests, setSentRequests] = React.useState<any[]>([])
  const [groupInvites, setGroupInvites] = React.useState<GroupInviteDTO[]>([])
  const [requestsDirection, setRequestsDirection] = React.useState<"INCOMING" | "SENT" | "GROUPS">("INCOMING")

  // Group Discovery state
  const [discoverGroups, setDiscoverGroups] = React.useState<DiscoverableGroupDTO[]>([])
  const [isLoadingDiscover, setIsLoadingDiscover] = React.useState(false)
  const [discoverSearch, setDiscoverSearch] = React.useState("")
  const [discoverScope, setDiscoverScope] = React.useState<"ALL" | "CAMPUS" | "DEPARTMENT">("ALL")
  const [discoverDeptFilter, setDiscoverDeptFilter] = React.useState<string>("ALL")
  const [actionGroupId, setActionGroupId] = React.useState<string | null>(null)

  // UI state
  const [activeTab, setActiveTab] = React.useState<"ALL" | "CHANNELS" | "DIRECT" | "REQUESTS" | "EXPLORE">("ALL")
  const [searchFilter, setSearchFilter] = React.useState("")
  const [messageText, setMessageText] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [stagedAttachment, setStagedAttachment] = React.useState<MessageAttachment | null>(null)
  const [typingUsers, setTypingUsers] = React.useState<{ [key: string]: string }>({})
  const [showDetailsDrawer, setShowDetailsDrawer] = React.useState(false)

  // Modals
  const [showNewDmModal, setShowNewDmModal] = React.useState(false)
  const [showReportModal, setShowReportModal] = React.useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = React.useState(false)
  const [showNewGroupModal, setShowNewGroupModal] = React.useState(false)
  const [showInviteModal, setShowInviteModal] = React.useState(false)
  const [showNewChannelModal, setShowNewChannelModal] = React.useState(false)

  // Channel creation state (Faculty & Admin)
  const [channelName, setChannelName] = React.useState("")
  const [channelDescription, setChannelDescription] = React.useState("")
  const [channelScope, setChannelScope] = React.useState<"CAMPUS" | "DEPARTMENT" | "BATCH" | "SUBJECT">("CAMPUS")
  const [channelDepartment, setChannelDepartment] = React.useState<string>("")
  const [channelAcademicYear, setChannelAcademicYear] = React.useState<string>("")
  const [channelSemester, setChannelSemester] = React.useState<string>("")
  const [channelSubjectName, setChannelSubjectName] = React.useState<string>("")
  const [facultyAssignments, setFacultyAssignments] = React.useState<
    { academicYear: string; semester: string; subjectName: string; subjectCode?: string; division?: string }[]
  >([])
  const [channelIsAnnouncementOnly, setChannelIsAnnouncementOnly] = React.useState<boolean>(true)
  const [isCreatingChannel, setIsCreatingChannel] = React.useState(false)
  const [channelError, setChannelError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (user?.role === "FACULTY") {
      const token = localStorage.getItem("nexora_token")
      fetch(`${API_BASE}/api/users/profile/me`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user?.teachingAssignments) {
            setFacultyAssignments(data.user.teachingAssignments)
          }
        })
        .catch(() => {})
    }
  }, [user?.role])

  // Directory search in DM modal
  const [directoryUsers, setDirectoryUsers] = React.useState<DirectoryUser[]>([])
  const [dirSearch, setDirSearch] = React.useState("")
  const [selectedRecipient, setSelectedRecipient] = React.useState<DirectoryUser | null>(null)
  const [initialDmMessage, setInitialDmMessage] = React.useState("")
  const [isCreatingDm, setIsCreatingDm] = React.useState(false)
  const [dmError, setDmError] = React.useState<string | null>(null)

  // Student Group creation state
  const [groupName, setGroupName] = React.useState("")
  const [groupDescription, setGroupDescription] = React.useState("")
  const [groupLevel, setGroupLevel] = React.useState<"CAMPUS" | "DEPARTMENT">("DEPARTMENT")
  const [groupAccessMode, setGroupAccessMode] = React.useState<GroupAccessMode>("APPROVAL_REQUIRED")
  const [groupIsDiscoverable, setGroupIsDiscoverable] = React.useState<boolean>(true)
  const [groupSearch, setGroupSearch] = React.useState("")
  const [groupDirectoryUsers, setGroupDirectoryUsers] = React.useState<DirectoryUser[]>([])
  const [selectedGroupMembers, setSelectedGroupMembers] = React.useState<DirectoryUser[]>([])
  const [isCreatingGroup, setIsCreatingGroup] = React.useState(false)
  const [groupError, setGroupError] = React.useState<string | null>(null)
  const [groupDeptFilter, setGroupDeptFilter] = React.useState<string>("ALL")
  const [groupYearFilter, setGroupYearFilter] = React.useState<string>("ALL")

  // Group Member Invitation state (drawer)
  const [inviteSearch, setInviteSearch] = React.useState("")
  const [inviteDirectoryUsers, setInviteDirectoryUsers] = React.useState<DirectoryUser[]>([])
  const [selectedInviteMembers, setSelectedInviteMembers] = React.useState<DirectoryUser[]>([])
  const [isInviting, setIsInviting] = React.useState(false)
  const [inviteDeptFilter, setInviteDeptFilter] = React.useState<string>("ALL")
  const [inviteYearFilter, setInviteYearFilter] = React.useState<string>("ALL")

  // Academic structure cache
  const [configuredDepts, setConfiguredDepts] = React.useState<string[]>([])
  const [configuredYears, setConfiguredYears] = React.useState<string[]>([])

  // Report Harassment state
  const [reportReason, setReportReason] = React.useState("Unsolicited inappropriate messages or stalking")
  const [reportNotes, setReportNotes] = React.useState("")
  const [isSubmittingReport, setIsSubmittingReport] = React.useState(false)
  const [reportSuccess, setReportSuccess] = React.useState<string | null>(null)

  // Privacy setting state
  const [myPrivacy, setMyPrivacy] = React.useState<DMPermission>(user?.privacySettings?.dmPermission || "ALLOW_ALL")
  const [isSavingPrivacy, setIsSavingPrivacy] = React.useState(false)

  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // 1. Fetch conversations
  const fetchConversations = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        const unique = Array.from(new Map(data.map((c: ConversationDTO) => [c.id, c])).values()) as ConversationDTO[]
        setConversations(unique)
        setSelectedConversation((current) => {
          if (!current && unique.length > 0) return unique[0]
          if (current) {
            const fresh = unique.find((c) => c.id === current.id)
            return fresh || current
          }
          return null
        })
      }
    } catch (err) {
      console.warn("Error fetching conversations:", err)
    }
  }, [])

  // 2. Fetch pending requests
  const fetchPendingRequests = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/requests`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setPendingRequests(data)
      }
    } catch (err) {
      console.warn("Error fetching requests:", err)
    }
  }, [])

  // 2b. Fetch sent message requests
  const fetchSentRequests = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/requests?direction=sent`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setSentRequests(data)
      }
    } catch (err) {
      console.warn("Error fetching sent requests:", err)
    }
  }, [])

  // 2c. Fetch group invitations
  const fetchGroupInvites = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/groups/invites`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setGroupInvites(data)
      }
    } catch (err) {
      console.warn("Error fetching group invites:", err)
    }
  }, [])

  // 2d. Fetch discoverable groups directory
  const fetchDiscoverGroups = React.useCallback(async (searchQuery?: string, scopeFilter?: string, deptFilter?: string) => {
    setIsLoadingDiscover(true)
    try {
      const token = localStorage.getItem("nexora_token")
      const params = new URLSearchParams()
      const s = searchQuery !== undefined ? searchQuery : discoverSearch
      const sc = scopeFilter !== undefined ? scopeFilter : discoverScope
      const d = deptFilter !== undefined ? deptFilter : discoverDeptFilter

      if (s.trim()) params.append("search", s.trim())
      if (sc !== "ALL") params.append("scope", sc)
      if (d !== "ALL") params.append("department", d)

      const res = await fetch(`${API_BASE}/api/conversations/groups/discover?${params.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setDiscoverGroups(data)
      }
    } catch (err) {
      console.warn("Error fetching discoverable groups:", err)
    } finally {
      setIsLoadingDiscover(false)
    }
  }, [discoverSearch, discoverScope, discoverDeptFilter])

  // 3. Fetch messages for active conversation
  const fetchMessages = React.useCallback(async (conversationId: string) => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/messages/${conversationId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (err) {
      console.warn("Error fetching messages:", err)
    }
  }, [])

  // 4. Fetch institute academic structure (departments and years)
  const fetchInstituteStructure = React.useCallback(async () => {
    if (!user?.instituteId) return
    try {
      const res = await fetch(`${API_BASE}/api/institutes/${user.instituteId}/structure`)
      if (res.ok) {
        const data = await res.json()
        if (data.departments && Array.isArray(data.departments)) {
          setConfiguredDepts(data.departments)
        }
        if (data.academicYears && Array.isArray(data.academicYears)) {
          setConfiguredYears(data.academicYears)
        }
      }
    } catch (err) {
      console.warn("Error fetching structure:", err)
    }
  }, [user?.instituteId])

  // Load initial data
  React.useEffect(() => {
    fetchConversations()
    fetchPendingRequests()
    fetchSentRequests()
    fetchGroupInvites()
    fetchDiscoverGroups()
    fetchInstituteStructure()
  }, [fetchConversations, fetchPendingRequests, fetchSentRequests, fetchGroupInvites, fetchDiscoverGroups, fetchInstituteStructure])

  // Socket room joining and events
  React.useEffect(() => {
    if (!selectedConversation) return

    joinConversation(selectedConversation.id)
    fetchMessages(selectedConversation.id)

    return () => {
      leaveConversation(selectedConversation.id)
    }
  }, [selectedConversation, joinConversation, leaveConversation, fetchMessages])

  // Socket listener registration
  React.useEffect(() => {
    if (!socket) return

    const handleNewMessage = (msg: MessageDTO) => {
      if (selectedConversation && msg.conversationId === selectedConversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? { ...c, lastMessage: msg, updatedAt: new Date().toISOString() }
            : c
        )
      )
    }

    const handleUserTyping = (data: { conversationId: string; userId: string; name: string }) => {
      if (selectedConversation && data.conversationId === selectedConversation.id && data.userId !== user?.id) {
        setTypingUsers((prev) => ({ ...prev, [data.userId]: data.name }))
      }
    }

    const handleUserStopTyping = (data: { conversationId: string; userId: string }) => {
      setTypingUsers((prev) => {
        const updated = { ...prev }
        delete updated[data.userId]
        return updated
      })
    }

    const handleNewDmRequest = () => {
      fetchPendingRequests()
      fetchSentRequests()
    }

    const handleDmAccepted = () => {
      fetchConversations()
      fetchPendingRequests()
      fetchSentRequests()
    }

    const handleDmDeclined = () => {
      fetchSentRequests()
    }

    const handleGroupInvitation = () => {
      fetchGroupInvites()
    }

    const handleMemberJoinedGroup = (data: { conversationId: string; user: any }) => {
      fetchConversations()
      if (selectedConversation && selectedConversation.id === data.conversationId) {
        setSelectedConversation((prev) => {
          if (!prev) return prev
          const alreadyIn = prev.participants?.some((p) => p.id === data.user.id)
          if (alreadyIn) return prev
          return {
            ...prev,
            participants: [...(prev.participants || []), data.user],
            pendingInvites: (prev.pendingInvites || []).filter((p) => p.id !== data.user.id),
          }
        })
      }
    }

    const handleMemberLeftGroup = (data: { conversationId: string; userId: string }) => {
      fetchConversations()
      if (selectedConversation && selectedConversation.id === data.conversationId) {
        setSelectedConversation((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            participants: (prev.participants || []).filter((p) => p.id !== data.userId),
          }
        })
      }
    }

    const handleGroupDisbanded = (data: { conversationId: string }) => {
      fetchConversations()
      if (selectedConversation && selectedConversation.id === data.conversationId) {
        setSelectedConversation(null)
      }
    }

    const handleGroupJoinRequested = () => {
      fetchConversations()
    }

    const handleGroupJoinAccepted = () => {
      fetchConversations()
      fetchDiscoverGroups()
    }

    const handleGroupJoinRejected = () => {
      fetchDiscoverGroups()
    }

    const handleGroupAdminUpdated = () => {
      fetchConversations()
    }

    const handleMessageUnsent = (payload: { conversationId: string; messageId: string; content?: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId
            ? { ...m, isUnsent: true, content: payload.content || "This message was unsent", attachments: [] }
            : m
        )
      )
    }

    socket.on("new_message", handleNewMessage)
    socket.on("message_unsent", handleMessageUnsent)
    socket.on("user_typing", handleUserTyping)
    socket.on("user_stop_typing", handleUserStopTyping)
    socket.on("new_dm_request", handleNewDmRequest)
    socket.on("dm_request_accepted", handleDmAccepted)
    socket.on("dm_request_declined", handleDmDeclined)
    socket.on("group_invitation", handleGroupInvitation)
    socket.on("member_joined_group", handleMemberJoinedGroup)
    socket.on("member_left_group", handleMemberLeftGroup)
    socket.on("group_disbanded", handleGroupDisbanded)
    socket.on("group_join_requested", handleGroupJoinRequested)
    socket.on("group_join_accepted", handleGroupJoinAccepted)
    socket.on("group_join_rejected", handleGroupJoinRejected)
    socket.on("group_admin_updated", handleGroupAdminUpdated)

    return () => {
      socket.off("new_message", handleNewMessage)
      socket.off("message_unsent", handleMessageUnsent)
      socket.off("user_typing", handleUserTyping)
      socket.off("user_stop_typing", handleUserStopTyping)
      socket.off("new_dm_request", handleNewDmRequest)
      socket.off("dm_request_accepted", handleDmAccepted)
      socket.off("dm_request_declined", handleDmDeclined)
      socket.off("group_invitation", handleGroupInvitation)
      socket.off("member_joined_group", handleMemberJoinedGroup)
      socket.off("member_left_group", handleMemberLeftGroup)
      socket.off("group_disbanded", handleGroupDisbanded)
      socket.off("group_join_requested", handleGroupJoinRequested)
      socket.off("group_join_accepted", handleGroupJoinAccepted)
      socket.off("group_join_rejected", handleGroupJoinRejected)
      socket.off("group_admin_updated", handleGroupAdminUpdated)
    }
  }, [socket, selectedConversation, user, fetchConversations, fetchPendingRequests, fetchSentRequests, fetchGroupInvites, fetchDiscoverGroups])

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value)
    if (!selectedConversation) return

    sendTypingStart(selectedConversation.id)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(selectedConversation.id)
    }, 2000)
  }

  // Handle Cloudinary file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: formData,
      })

      if (res.ok) {
        const uploadedData = await res.json()
        setStagedAttachment(uploadedData)
      } else {
        const err = await res.json()
        alert(err.error || "File upload failed")
      }
    } catch (err) {
      console.warn("Upload error:", err)
      alert("Failed to upload file")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedConversation) return
    if (!messageText.trim() && !stagedAttachment) return

    setIsSending(true)
    try {
      const token = localStorage.getItem("nexora_token")
      const payload: any = {
        content: messageText.trim(),
      }
      if (stagedAttachment) {
        payload.attachments = [stagedAttachment]
      }

      const res = await fetch(`${API_BASE}/api/messages/${selectedConversation.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const sentMessage = await res.json()
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMessage.id)) return prev
          return [...prev, sentMessage]
        })
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation.id
              ? { ...c, lastMessage: sentMessage, updatedAt: new Date().toISOString() }
              : c
          )
        )
        setMessageText("")
        setStagedAttachment(null)
        sendTypingStop(selectedConversation.id)
      } else {
        const err = await res.json()
        alert(err.error || "Failed to send message")
      }
    } catch (err) {
      console.warn("Send message error:", err)
    } finally {
      setIsSending(false)
    }
  }

  // Unsend message
  const handleUnsendMessage = async (messageId: string) => {
    if (!selectedConversation) return
    const confirmUnsend = window.confirm("Are you sure you want to unsend this message for everyone?")
    if (!confirmUnsend) return

    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/messages/${selectedConversation.id}/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })

      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isUnsent: true, content: "This message was unsent", attachments: [] }
              : m
          )
        )
      } else {
        const err = await res.json()
        alert(err.error || "Failed to unsend message")
      }
    } catch (err) {
      console.warn("Unsend message error:", err)
      alert("Network error: Failed to unsend message")
    }
  }

  // Fetch Directory Users for DM Modal
  const fetchDirectory = async (q: string) => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/users/directory?search=${encodeURIComponent(q)}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setDirectoryUsers(data)
      }
    } catch (err) {
      console.warn("Directory fetch error:", err)
    }
  }

  const openDmModal = () => {
    setDmError(null)
    setSelectedRecipient(null)
    setInitialDmMessage("")
    setDirSearch("")
    fetchDirectory("")
    setShowNewDmModal(true)
  }

  const handleStartDm = async () => {
    if (!selectedRecipient) return
    setIsCreatingDm(true)
    setDmError(null)

    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/dm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify({
          recipientId: selectedRecipient.id,
          initialMessage: initialDmMessage.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setDmError(data.error || "Unable to send direct message")
        return
      }

      setShowNewDmModal(false)
      await fetchConversations()
      await fetchPendingRequests()
      await fetchSentRequests()
      if (data.status === "REQUEST_PENDING") {
        setActiveTab("REQUESTS")
        setRequestsDirection("SENT")
      } else {
        const found = conversations.find((c) => c.id === data.id)
        if (found) setSelectedConversation(found)
      }
    } catch (err: any) {
      setDmError(err.message || "Failed to initiate conversation")
    } finally {
      setIsCreatingDm(false)
    }
  }

  // Accept DM Request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/${requestId}/accept`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        fetchConversations()
        fetchPendingRequests()
        fetchSentRequests()
        setActiveTab("ALL")
      }
    } catch (err) {
      console.warn("Accept error:", err)
    }
  }

  // Decline DM Request
  const handleDeclineRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/${requestId}/decline`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        fetchPendingRequests()
        fetchSentRequests()
      }
    } catch (err) {
      console.warn("Decline error:", err)
    }
  }

  // Withdraw / Cancel Sent DM Request
  const handleWithdrawRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/requests/${requestId}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        fetchSentRequests()
      }
    } catch (err) {
      console.warn("Withdraw request error:", err)
    }
  }

  // Directory Search for Group Creation Modal
  const fetchGroupDirectory = async (q: string = groupSearch, dept: string = groupDeptFilter, year: string = groupYearFilter) => {
    try {
      const token = localStorage.getItem("nexora_token")
      const params = new URLSearchParams()
      if (q.trim()) params.append("search", q.trim())
      if (dept && dept !== "ALL") params.append("department", dept)
      if (year && year !== "ALL") params.append("academicYear", year)

      const res = await fetch(`${API_BASE}/api/users/directory?${params.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setGroupDirectoryUsers(data)
      }
    } catch (err) {
      console.warn("Group directory fetch error:", err)
    }
  }

  const openNewGroupModal = () => {
    setGroupError(null)
    setGroupName("")
    setGroupDescription("")
    const initLevel = user?.department ? "DEPARTMENT" : "CAMPUS"
    setGroupLevel(initLevel)
    const initDept = initLevel === "DEPARTMENT" ? (user?.department || "ALL") : "ALL"
    setGroupDeptFilter(initDept)
    setGroupYearFilter("ALL")
    setSelectedGroupMembers([])
    setGroupSearch("")
    fetchGroupDirectory("", initDept, "ALL")
    setShowNewGroupModal(true)
  }

  // Open New Channel Modal (Faculty & Admin)
  const openNewChannelModal = () => {
    setChannelName("")
    setChannelDescription("")
    setChannelScope("CAMPUS")
    setChannelDepartment(user?.department || configuredDepts[0] || "")
    setChannelAcademicYear(configuredYears[0] || "Final Year")
    setChannelIsAnnouncementOnly(true)
    setChannelError(null)
    setShowNewChannelModal(true)
  }

  // Create Channel (Faculty & Admin)
  const handleCreateChannel = async () => {
    if (!channelName.trim()) {
      setChannelError("Please specify a channel name")
      return
    }
    setIsCreatingChannel(true)
    setChannelError(null)

    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify({
          name: channelName.trim(),
          description: channelDescription.trim() || undefined,
          scope: channelScope,
          department: channelScope !== "CAMPUS" ? (channelDepartment || user?.department) : undefined,
          academicYear: (channelScope === "BATCH" || channelScope === "SUBJECT") ? (channelAcademicYear || undefined) : undefined,
          semester: channelScope === "SUBJECT" ? (channelSemester || undefined) : undefined,
          subjectName: channelScope === "SUBJECT" ? (channelSubjectName || undefined) : undefined,
          isAnnouncementOnly: channelIsAnnouncementOnly,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setChannelError(data.error || "Failed to create channel")
        return
      }

      setShowNewChannelModal(false)
      await fetchConversations()
      setSelectedConversation(data)
      setActiveTab("CHANNELS")
    } catch (err: any) {
      setChannelError(err.message || "Failed to create channel")
    } finally {
      setIsCreatingChannel(false)
    }
  }

  // Create Student Group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setGroupError("Please specify a group name")
      return
    }
    setIsCreatingGroup(true)
    setGroupError(null)

    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim() || undefined,
          level: groupLevel,
          accessMode: groupAccessMode,
          isDiscoverable: groupIsDiscoverable,
          invitedUserIds: selectedGroupMembers.map((m) => m.id),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setGroupError(data.error || "Failed to create group")
        return
      }

      setShowNewGroupModal(false)
      await fetchConversations()
      await fetchDiscoverGroups()
      setSelectedConversation(data)
      setActiveTab("CHANNELS")
    } catch (err: any) {
      setGroupError(err.message || "Failed to create group")
    } finally {
      setIsCreatingGroup(false)
    }
  }

  // Request to Join or Open Join a Discoverable Group
  const handleRequestJoinGroup = async (groupId: string) => {
    setActionGroupId(groupId)
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/groups/${groupId}/request-join`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok) {
        if (data.status === "JOINED") {
          await fetchConversations()
          setDiscoverGroups((prev) =>
            prev.map((g) => (g.id === groupId ? { ...g, isMember: true, memberCount: g.memberCount + 1 } : g))
          )
          if (data.group) {
            setSelectedConversation(data.group)
            setActiveTab("CHANNELS")
          }
        } else {
          setDiscoverGroups((prev) =>
            prev.map((g) => (g.id === groupId ? { ...g, hasRequestedJoin: true } : g))
          )
        }
      } else {
        alert(data.error || "Failed to join group")
      }
    } catch (err) {
      console.warn("Failed to join group:", err)
    } finally {
      setActionGroupId(null)
    }
  }

  // Cancel Join Request
  const handleCancelJoinRequest = async (groupId: string) => {
    setActionGroupId(groupId)
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/groups/${groupId}/cancel-join-request`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        setDiscoverGroups((prev) =>
          prev.map((g) => (g.id === groupId ? { ...g, hasRequestedJoin: false } : g))
        )
      } else {
        const data = await res.json()
        alert(data.error || "Failed to cancel join request")
      }
    } catch (err) {
      console.warn("Failed to cancel join request:", err)
    } finally {
      setActionGroupId(null)
    }
  }

  // Group Admin: Approve Join Request
  const handleApproveJoinRequest = async (groupId: string, applicantId: string) => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/groups/${groupId}/approve-join-request`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify({ applicantId }),
      })
      if (res.ok) {
        setSelectedConversation((prev) => {
          if (!prev || prev.id !== groupId) return prev
          const applicant = (prev.joinRequests || []).find((j: any) => j.id === applicantId)
          return {
            ...prev,
            joinRequests: (prev.joinRequests || []).filter((j: any) => j.id !== applicantId),
            participants: applicant ? [...(prev.participants || []), applicant] : prev.participants,
          }
        })
        fetchConversations()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to approve join request")
      }
    } catch (err) {
      console.warn("Failed to approve join request:", err)
    }
  }

  // Group Admin: Reject Join Request
  const handleRejectJoinRequest = async (groupId: string, applicantId: string) => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/groups/${groupId}/reject-join-request`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify({ applicantId }),
      })
      if (res.ok) {
        setSelectedConversation((prev) => {
          if (!prev || prev.id !== groupId) return prev
          return {
            ...prev,
            joinRequests: (prev.joinRequests || []).filter((j: any) => j.id !== applicantId),
          }
        })
        fetchConversations()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to reject join request")
      }
    } catch (err) {
      console.warn("Failed to reject join request:", err)
    }
  }

  // Group Creator: Promote to Admin
  const handlePromoteAdmin = async (groupId: string, targetUserId: string) => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/groups/${groupId}/promote-admin`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify({ targetUserId }),
      })
      if (res.ok) {
        setSelectedConversation((prev) => {
          if (!prev || prev.id !== groupId) return prev
          const adminIds = prev.adminIds || []
          return {
            ...prev,
            adminIds: adminIds.includes(targetUserId) ? adminIds : [...adminIds, targetUserId],
          }
        })
        fetchConversations()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to promote admin")
      }
    } catch (err) {
      console.warn("Failed to promote admin:", err)
    }
  }

  // Group Creator: Demote from Admin
  const handleDemoteAdmin = async (groupId: string, targetUserId: string) => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/groups/${groupId}/demote-admin`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify({ targetUserId }),
      })
      if (res.ok) {
        setSelectedConversation((prev) => {
          if (!prev || prev.id !== groupId) return prev
          return {
            ...prev,
            adminIds: (prev.adminIds || []).filter((id) => id !== targetUserId),
          }
        })
        fetchConversations()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to demote admin")
      }
    } catch (err) {
      console.warn("Failed to demote admin:", err)
    }
  }

  // Accept Group Invite
  const handleAcceptGroupInvite = async (groupId: string) => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/groups/${groupId}/accept-invite`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        await fetchConversations()
        await fetchGroupInvites()
        if (data.group) {
          setSelectedConversation(data.group)
        }
        setActiveTab("CHANNELS")
      } else {
        const data = await res.json()
        alert(data.error || "Failed to accept group invite")
      }
    } catch (err) {
      console.warn("Accept group invite error:", err)
    }
  }

  // Decline Group Invite
  const handleDeclineGroupInvite = async (groupId: string) => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/groups/${groupId}/decline-invite`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        await fetchGroupInvites()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to decline group invite")
      }
    } catch (err) {
      console.warn("Decline group invite error:", err)
    }
  }

  // Directory Search for Inviting to Existing Group
  const fetchInviteDirectory = async (q: string = inviteSearch, dept: string = inviteDeptFilter, year: string = inviteYearFilter) => {
    try {
      const token = localStorage.getItem("nexora_token")
      const params = new URLSearchParams()
      if (q.trim()) params.append("search", q.trim())
      if (dept && dept !== "ALL") params.append("department", dept)
      if (year && year !== "ALL") params.append("academicYear", year)

      const res = await fetch(`${API_BASE}/api/users/directory?${params.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setInviteDirectoryUsers(data)
      }
    } catch (err) {
      console.warn("Invite directory fetch error:", err)
    }
  }

  const openInviteModal = () => {
    setSelectedInviteMembers([])
    setInviteSearch("")
    const initDept = selectedConversation?.department || "ALL"
    setInviteDeptFilter(initDept)
    setInviteYearFilter("ALL")
    fetchInviteDirectory("", initDept, "ALL")
    setShowInviteModal(true)
  }

  // Invite Peers to Existing Group
  const handleInviteMoreMembers = async () => {
    if (!selectedConversation || selectedInviteMembers.length === 0) return
    setIsInviting(true)
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/groups/${selectedConversation.id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify({
          userIds: selectedInviteMembers.map((m) => m.id),
        }),
      })
      if (res.ok) {
        setShowInviteModal(false)
        setSelectedInviteMembers([])
        await fetchConversations()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to send group invitations")
      }
    } catch (err) {
      console.warn("Invite peers error:", err)
    } finally {
      setIsInviting(false)
    }
  }

  // Leave Group
  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to leave this group?")) return
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/groups/${groupId}/leave`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        setSelectedConversation(null)
        await fetchConversations()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to leave group")
      }
    } catch (err) {
      console.warn("Leave group error:", err)
    }
  }

  // Disband Group
  const handleDisbandGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to disband and delete this group? All message history will be permanently deleted.")) return
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/conversations/groups/${groupId}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        setSelectedConversation(null)
        await fetchConversations()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to disband group")
      }
    } catch (err) {
      console.warn("Disband group error:", err)
    }
  }

  // Submit Harassment Report
  const handleSubmitReport = async () => {
    if (!selectedConversation) return
    setIsSubmittingReport(true)
    setReportSuccess(null)

    const otherMember = selectedConversation.participants?.find((p) => p.id !== user?.id)
    if (!otherMember) {
      alert("No reported user found in this conversation")
      setIsSubmittingReport(false)
      return
    }

    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify({
          reportedUserId: otherMember.id,
          conversationId: selectedConversation.id,
          reason: `${reportReason}. Details: ${reportNotes}`,
        }),
      })

      if (res.ok) {
        setReportSuccess("Report registered with campus administration. Evidence log snapshot secured.")
        setTimeout(() => {
          setShowReportModal(false)
          setReportSuccess(null)
          setReportNotes("")
        }, 2200)
      } else {
        const err = await res.json()
        alert(err.error || "Failed to submit report")
      }
    } catch (err) {
      console.warn("Submit report error:", err)
    } finally {
      setIsSubmittingReport(false)
    }
  }

  // Save Privacy Setting
  const handleSavePrivacy = async () => {
    setIsSavingPrivacy(true)
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/users/privacy`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify({ dmPermission: myPrivacy }),
      })
      if (res.ok) {
        setShowPrivacyModal(false)
      } else {
        alert("Failed to update privacy preference")
      }
    } catch (err) {
      console.warn("Privacy update error:", err)
    } finally {
      setIsSavingPrivacy(false)
    }
  }

  // Filtered conversation list
  const filteredConversations = conversations.filter((c) => {
    if (activeTab === "CHANNELS" && c.type !== "CHANNEL") return false
    if (activeTab === "DIRECT" && c.type !== "DIRECT") return false

    if (searchFilter.trim().length > 0) {
      const q = searchFilter.toLowerCase()
      const matchName = c.name?.toLowerCase().includes(q)
      const matchDesc = c.description?.toLowerCase().includes(q)
      return matchName || matchDesc
    }
    return true
  })

  const isCurrentChannelAnnouncementOnly =
    selectedConversation?.type === "CHANNEL" &&
    selectedConversation?.isAnnouncementOnly &&
    !["ADMIN", "SUPER_ADMIN", "FACULTY"].includes(user?.role || "")

  const activeOtherParticipant =
    selectedConversation?.type === "DIRECT"
      ? selectedConversation.participants?.find((p) => p.id !== user?.id)
      : null

  return (
    <div className="flex h-[calc(100vh-4.25rem)] overflow-hidden bg-background">
      {/* ================= COLUMN 1: SIDEBAR GRID ================= */}
      <div className={cn("w-full md:w-80 shrink-0 border-r border-border flex flex-col bg-card/40 min-w-0 max-w-full", (selectedConversation || activeTab === "EXPLORE") ? "hidden md:flex" : "flex")}>
        {/* Header */}
        <div className="p-3.5 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Radio className="size-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight">Communication Grid</h1>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className={`size-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  {isConnected ? "Real-time Synced" : "Reconnecting..."}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {["ADMIN", "SUPER_ADMIN", "FACULTY"].includes(user?.role || "") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openNewChannelModal}
                  className="h-8 gap-1 text-xs font-semibold border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10"
                  title="Create Official Campus / Department Channel"
                >
                  <Hash className="size-3.5" />
                  <span className="hidden sm:inline">Channel</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={openNewGroupModal}
                className="h-8 gap-1 text-xs font-medium border-border hover:bg-muted"
                title="Create Custom Student Group"
              >
                <Users className="size-3.5" />
                <span className="hidden sm:inline">Group</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openDmModal}
                className="h-8 gap-1 text-xs font-medium border-primary/20 text-primary hover:bg-primary/5"
              >
                <Plus className="size-3.5" />
                New DM
              </Button>
            </div>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search channels & DMs..."
              className="h-8 pl-8 text-xs bg-background/60"
            />
          </div>

          {/* Navigation Filter Tabs */}
          <div className="grid grid-cols-5 p-0.5 bg-muted/50 rounded-lg text-[11px] font-medium text-center">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`py-1 rounded-md transition-colors ${activeTab === "ALL" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("CHANNELS")}
              className={`py-1 rounded-md transition-colors ${activeTab === "CHANNELS" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"}`}
            >
              Channels
            </button>
            <button
              onClick={() => setActiveTab("DIRECT")}
              className={`py-1 rounded-md transition-colors ${activeTab === "DIRECT" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"}`}
            >
              DMs
            </button>
            <button
              onClick={() => setActiveTab("REQUESTS")}
              className={`py-1 rounded-md transition-colors relative ${activeTab === "REQUESTS" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"}`}
            >
              Requests
              {(pendingRequests.length + groupInvites.length) > 0 && (
                <span className="absolute -top-1 -right-1 size-4 bg-primary text-[10px] text-primary-foreground font-bold rounded-full flex items-center justify-center">
                  {pendingRequests.length + groupInvites.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("EXPLORE")
                fetchDiscoverGroups()
              }}
              className={`py-1 rounded-md transition-colors flex items-center justify-center gap-1 ${activeTab === "EXPLORE" ? "bg-primary text-primary-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Compass className="size-3" />
              <span>Explore</span>
            </button>
          </div>
        </div>

        {/* Conversation List / Requests View */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
          {activeTab === "REQUESTS" ? (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Lock className="size-3.5 text-primary" />
                  <span>Incoming & Outgoing Requests</span>
                </div>
              </div>

              {/* Sub-toggle: Received vs Sent vs Groups */}
              <div className="flex items-center p-0.5 rounded-lg bg-muted/60 text-xs">
                <button
                  type="button"
                  onClick={() => setRequestsDirection("INCOMING")}
                  className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
                    requestsDirection === "INCOMING"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  DMs ({pendingRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestsDirection("SENT")}
                  className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
                    requestsDirection === "SENT"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sent ({sentRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestsDirection("GROUPS")}
                  className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all relative ${
                    requestsDirection === "GROUPS"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Groups ({groupInvites.length})
                </button>
              </div>

              {requestsDirection === "GROUPS" ? (
                groupInvites.length === 0 ? (
                  <div className="text-center py-10 px-4 text-xs text-muted-foreground">
                    No pending group invitations. When classmates invite you to study circles or project teams, invitations appear here for your consent.
                  </div>
                ) : (
                  groupInvites.map((invite) => (
                    <div key={invite.id} className="p-3 rounded-lg border border-border bg-card/70 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-semibold flex items-center gap-1.5">
                            <Users className="size-3.5 text-primary" />
                            {invite.name}
                          </div>
                          {invite.department ? (
                            <div className="text-[10px] text-muted-foreground">
                              Department: {invite.department}
                            </div>
                          ) : (
                            <div className="text-[10px] text-muted-foreground">
                              Campus-Wide Group
                            </div>
                          )}
                          {invite.creator && (
                            <div className="text-[10px] text-muted-foreground">
                              Invited by: <span className="text-foreground font-medium">{invite.creator.name}</span> ({invite.creator.role})
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {invite.memberCount} {invite.memberCount === 1 ? "member" : "members"}
                        </Badge>
                      </div>

                      {invite.description && (
                        <p className="text-xs p-2 rounded bg-muted/60 text-muted-foreground line-clamp-2">
                          {invite.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptGroupInvite(invite.id)}
                          className="h-7 text-xs flex-1 gap-1"
                        >
                          <UserCheck className="size-3.5" />
                          Join Group
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineGroupInvite(invite.id)}
                          className="h-7 text-xs flex-1 gap-1 text-muted-foreground"
                        >
                          <UserX className="size-3.5" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))
                )
              ) : requestsDirection === "INCOMING" ? (
                pendingRequests.length === 0 ? (
                  <div className="text-center py-10 px-4 text-xs text-muted-foreground">
                    No pending message requests. New direct messages from students outside your mutual network appear here for consent.
                  </div>
                ) : (
                  pendingRequests.map((req) => (
                    <div key={req.id} className="p-3 rounded-lg border border-border bg-card/70 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-semibold">{req.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {req.initiator?.department} • {req.initiator?.academicYear || req.initiator?.role}
                          </div>
                          <div className="text-[10px] font-mono text-primary/80">
                            Roll: {req.initiator?.institutionalId}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          Pending
                        </Badge>
                      </div>

                      {req.lastMessage && (
                        <div className="text-xs p-2 rounded bg-muted/60 text-muted-foreground line-clamp-2">
                          &quot;{req.lastMessage.content}&quot;
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(req.id)}
                          className="h-7 text-xs flex-1 gap-1"
                        >
                          <UserCheck className="size-3.5" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineRequest(req.id)}
                          className="h-7 text-xs flex-1 gap-1 text-muted-foreground"
                        >
                          <UserX className="size-3.5" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                sentRequests.length === 0 ? (
                  <div className="text-center py-10 px-4 text-xs text-muted-foreground">
                    No outgoing message requests. Direct message requests you send to other students appear here until accepted.
                  </div>
                ) : (
                  sentRequests.map((req) => {
                    const recipient = req.recipient || req.otherUser;
                    const isDeclined = req.status === "DECLINED";

                    return (
                      <div key={req.id} className="p-3 rounded-lg border border-border bg-card/70 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-xs font-semibold">To: {recipient?.name || req.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {recipient?.department} • {recipient?.academicYear || recipient?.role}
                            </div>
                            <div className="text-[10px] font-mono text-primary/80">
                              Roll: {recipient?.institutionalId}
                            </div>
                          </div>
                          <Badge
                            variant={isDeclined ? "destructive" : "outline"}
                            className={`text-[10px] ${
                              !isDeclined ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : ""
                            }`}
                          >
                            {isDeclined ? "Declined" : "Awaiting Consent"}
                          </Badge>
                        </div>

                        {req.lastMessage && (
                          <div className="text-xs p-2 rounded bg-muted/60 text-muted-foreground line-clamp-2">
                            &quot;{req.lastMessage.content}&quot;
                          </div>
                        )}

                        <div className="flex items-center justify-end pt-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleWithdrawRequest(req.id)}
                            className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
                          >
                            <X className="size-3.5" />
                            Withdraw Request
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          ) : activeTab === "EXPLORE" ? (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Compass className="size-3.5 text-primary" />
                  <span>Public Directory ({discoverGroups.length})</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openNewGroupModal}
                  className="h-6 px-1.5 text-[11px] text-primary hover:text-primary gap-1"
                >
                  <Plus className="size-3" />
                  Create
                </Button>
              </div>

              {/* Scope filter pills */}
              <div className="flex items-center p-0.5 rounded-lg bg-muted/60 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setDiscoverScope("ALL")
                    fetchDiscoverGroups(discoverSearch, "ALL", discoverDeptFilter)
                  }}
                  className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
                    discoverScope === "ALL"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscoverScope("CAMPUS")
                    fetchDiscoverGroups(discoverSearch, "CAMPUS", discoverDeptFilter)
                  }}
                  className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
                    discoverScope === "CAMPUS"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Campus
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscoverScope("DEPARTMENT")
                    fetchDiscoverGroups(discoverSearch, "DEPARTMENT", discoverDeptFilter)
                  }}
                  className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
                    discoverScope === "DEPARTMENT"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Dept
                </button>
              </div>

              {/* Department selector */}
              <div>
                <select
                  value={discoverDeptFilter}
                  onChange={(e) => {
                    const val = e.target.value
                    setDiscoverDeptFilter(val)
                    fetchDiscoverGroups(discoverSearch, discoverScope, val)
                  }}
                  className="w-full h-8 text-xs rounded-md border border-border bg-background px-2 text-foreground truncate"
                >
                  <option value="ALL">All Departments</option>
                  {configuredDepts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Group list in sidebar */}
              <div className="space-y-1.5">
                {isLoadingDiscover ? (
                  <div className="text-center py-8 text-xs text-muted-foreground animate-pulse">
                    Scanning campus directory...
                  </div>
                ) : discoverGroups.length === 0 ? (
                  <div className="text-center py-8 px-2 text-xs text-muted-foreground">
                    No public groups found. Create the first student group for your peers!
                  </div>
                ) : (
                  discoverGroups.map((group) => (
                    <div
                      key={group.id}
                      className="p-2.5 rounded-lg border border-border/70 hover:border-primary/40 bg-card/60 hover:bg-card transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <div className="font-semibold text-xs truncate text-foreground flex items-center gap-1.5">
                            <span>{group.name}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {group.department ? `${group.department}` : "Campus-Wide"} • {group.memberCount} members
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1 py-0 h-4 shrink-0 gap-0.5 ${
                            group.accessMode === "OPEN"
                              ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                              : "border-amber-500/30 text-amber-600 bg-amber-500/5"
                          }`}
                        >
                          {group.accessMode === "OPEN" ? (
                            <>
                              <Unlock className="size-2.5" />
                              <span>Open</span>
                            </>
                          ) : (
                            <>
                              <Lock className="size-2.5" />
                              <span>Approval</span>
                            </>
                          )}
                        </Badge>
                      </div>

                      {group.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {group.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[10px] text-muted-foreground">
                          {group.creator?.name ? `by ${group.creator.name}` : ""}
                        </div>

                        {group.isMember ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const found = conversations.find((c) => c.id === group.id)
                              if (found) setSelectedConversation(found)
                              setActiveTab("CHANNELS")
                            }}
                            className="h-6 text-[10px] px-2 text-primary border-primary/30 hover:bg-primary/10"
                          >
                            Open Chat
                          </Button>
                        ) : group.hasRequestedJoin ? (
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-[9px] h-6 px-1.5 text-amber-600 bg-amber-500/10">
                              Pending
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelJoinRequest(group.id)}
                              disabled={actionGroupId === group.id}
                              className="h-6 text-[10px] px-1 text-muted-foreground hover:text-destructive"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : group.accessMode === "OPEN" ? (
                          <Button
                            size="sm"
                            onClick={() => handleRequestJoinGroup(group.id)}
                            disabled={actionGroupId === group.id}
                            className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                          >
                            <UserPlus className="size-2.5" />
                            <span>Join</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleRequestJoinGroup(group.id)}
                            disabled={actionGroupId === group.id}
                            className="h-6 text-[10px] px-2 bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
                          >
                            <ShieldCheck className="size-2.5" />
                            <span>Request</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="py-1">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 px-4 text-xs text-muted-foreground">
                  No active conversations found matching your filter.
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConversation?.id === conv.id
                  const isChannel = conv.type === "CHANNEL"
                  const isCustomGroup = isChannel && conv.scope === "CUSTOM"
                  const other = conv.participants?.find((p) => p.id !== user?.id)

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-3 transition-colors flex items-start gap-2.5 relative border-l-2 ${
                        isSelected
                          ? "bg-primary/5 border-l-primary"
                          : "border-l-transparent hover:bg-muted/40"
                      }`}
                    >
                      {/* Avatar / Channel Icon */}
                      <div className="relative shrink-0">
                        {isCustomGroup ? (
                          <div className="size-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-semibold text-xs">
                            <Users className="size-4" />
                          </div>
                        ) : isChannel ? (
                          <div className="size-9 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground font-semibold text-xs">
                            <Hash className="size-4 text-primary" />
                          </div>
                        ) : (
                          <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-xs relative">
                            {conv.name?.substring(0, 2).toUpperCase() || "DM"}
                            {other?.isOnline && (
                              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold truncate text-foreground flex items-center gap-1">
                            {conv.name}
                            {isCustomGroup && (
                              <Badge variant="outline" className="text-[9px] h-3.5 px-1 py-0 border-indigo-500/30 text-indigo-500">
                                Group
                              </Badge>
                            )}
                            {conv.isAnnouncementOnly && (
                              <Lock className="size-2.5 text-muted-foreground" />
                            )}
                          </span>
                          {conv.lastMessage && (
                            <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                              {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {conv.lastMessage
                            ? `${conv.lastMessage.sender.name.split(" ")[0]}: ${conv.lastMessage.content || "Attached file"}`
                            : conv.description || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Footer: Privacy Setting Action */}
        <div className="p-3 border-t border-border bg-card/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            <Lock className="size-3.5 text-primary" />
            <span>DM Mode: <strong className="text-foreground">{myPrivacy.replace(/_/g, " ")}</strong></span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPrivacyModal(true)}
            className="h-7 px-2 text-xs"
          >
            <Settings className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ================= COLUMN 2: ACTIVE CHAT CANVAS OR EXPLORE DIRECTORY ================= */}
      <div className={cn("flex-1 flex flex-col min-w-0 bg-background overflow-hidden w-full max-w-full", (!selectedConversation && activeTab !== "EXPLORE") ? "hidden md:flex" : "flex")}>
        {activeTab === "EXPLORE" ? (
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto w-full min-w-0">
            {/* Mobile Return to Messages Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("ALL")}
                className="h-8 -ml-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                <span>Back to Messages</span>
              </Button>
            </div>

            {/* Hero Header */}
            <div className="p-4 sm:p-6 rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 via-card to-background relative overflow-hidden space-y-4">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-semibold">
                    <Sparkles className="size-3" />
                    <span>Open Campus Group Discovery</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                    Find Study Circles, Project Teams & Clubs
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Discover interest groups, hackathon squads, and committees across departments. Send an inbound request to join or jump directly into open public rooms.
                  </p>
                </div>
                <Button
                  onClick={openNewGroupModal}
                  size="sm"
                  className="gap-2 font-semibold shadow-md self-start md:self-center shrink-0"
                >
                  <Plus className="size-4" />
                  <span>Create Student Group</span>
                </Button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card/50">
              <div className="relative w-full md:w-72 min-w-0">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={discoverSearch}
                  onChange={(e) => {
                    setDiscoverSearch(e.target.value)
                    fetchDiscoverGroups(e.target.value, discoverScope, discoverDeptFilter)
                  }}
                  placeholder="Search groups by topic or keywords..."
                  className="h-8 pl-8 text-xs bg-background w-full"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center p-0.5 rounded-lg bg-muted text-xs overflow-x-auto max-w-full">
                  <button
                    onClick={() => {
                      setDiscoverScope("ALL")
                      fetchDiscoverGroups(discoverSearch, "ALL", discoverDeptFilter)
                    }}
                    className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                      discoverScope === "ALL" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      setDiscoverScope("CAMPUS")
                      fetchDiscoverGroups(discoverSearch, "CAMPUS", discoverDeptFilter)
                    }}
                    className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                      discoverScope === "CAMPUS" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    Campus-Wide
                  </button>
                  <button
                    onClick={() => {
                      setDiscoverScope("DEPARTMENT")
                      fetchDiscoverGroups(discoverSearch, "DEPARTMENT", discoverDeptFilter)
                    }}
                    className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                      discoverScope === "DEPARTMENT" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    My Department
                  </button>
                </div>

                <select
                  value={discoverDeptFilter}
                  onChange={(e) => {
                    const val = e.target.value
                    setDiscoverDeptFilter(val)
                    fetchDiscoverGroups(discoverSearch, discoverScope, val)
                  }}
                  className="h-8 text-xs rounded-md border border-border bg-background px-2 text-foreground truncate w-full sm:w-auto sm:max-w-44"
                >
                  <option value="ALL">All Departments</option>
                  {configuredDepts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Groups Grid */}
            {isLoadingDiscover ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-40 rounded-xl border border-border bg-card/30 animate-pulse" />
                ))}
              </div>
            ) : discoverGroups.length === 0 ? (
              <div className="text-center py-16 p-6 rounded-xl border border-dashed border-border space-y-3">
                <div className="size-12 rounded-xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <Compass className="size-6" />
                </div>
                <h3 className="text-sm font-semibold">No Groups Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  No discoverable groups match the current query. Be the first to start a group for your department or campus!
                </p>
                <Button size="sm" onClick={openNewGroupModal} className="text-xs gap-1.5">
                  <Plus className="size-3.5" />
                  Create Group
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {discoverGroups.map((group) => (
                  <div
                    key={group.id}
                    className="p-4 sm:p-5 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/30 transition-all flex flex-col justify-between space-y-4 min-w-0 overflow-hidden"
                  >
                    <div className="space-y-2.5 min-w-0">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm text-foreground flex items-center gap-1.5 truncate">
                            <span className="text-primary font-bold">#</span>
                            <span className="truncate">{group.name.replace(/^#/, "")}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <Badge variant="outline" className="text-[10px] font-normal truncate max-w-[180px] sm:max-w-[220px]">
                              {group.department ? `${group.department}` : "Campus-Wide"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] gap-1 shrink-0 ${
                                group.accessMode === "OPEN"
                                  ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                                  : "border-amber-500/30 text-amber-600 bg-amber-500/5"
                              }`}
                            >
                              {group.accessMode === "OPEN" ? (
                                <>
                                  <Unlock className="size-3" />
                                  <span>Open Join</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="size-3" />
                                  <span>Approval Required</span>
                                </>
                              )}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium shrink-0 pt-0.5">
                          <Users className="size-3.5 text-muted-foreground" />
                          <span>{group.memberCount}</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed break-words">
                        {group.description || "No description provided by group creator."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0 max-w-[65%]">
                        <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {group.creator?.name ? group.creator.name.charAt(0) : "U"}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          Created by <strong className="text-foreground font-medium">{group.creator?.name || "Student"}</strong>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {group.isMember ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const found = conversations.find((c) => c.id === group.id)
                              if (found) setSelectedConversation(found)
                              setActiveTab("CHANNELS")
                            }}
                            className="h-8 text-xs font-medium border-primary/40 text-primary hover:bg-primary/10"
                          >
                            Open Channel
                          </Button>
                        ) : group.hasRequestedJoin ? (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-xs py-1 px-2 text-amber-600 bg-amber-500/10">
                              Pending Approval
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelJoinRequest(group.id)}
                              disabled={actionGroupId === group.id}
                              className="h-8 text-xs text-muted-foreground hover:text-destructive"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : group.accessMode === "OPEN" ? (
                          <Button
                            size="sm"
                            onClick={() => handleRequestJoinGroup(group.id)}
                            disabled={actionGroupId === group.id}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 font-medium"
                          >
                            <UserPlus className="size-3.5" />
                            <span>Join Group</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleRequestJoinGroup(group.id)}
                            disabled={actionGroupId === group.id}
                            className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-medium"
                          >
                            <ShieldCheck className="size-3.5" />
                            <span>Request to Join</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-14 px-3 sm:px-4 border-b border-border flex items-center justify-between shrink-0 bg-card/30 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden size-8 -ml-1 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                {selectedConversation.scope === "CUSTOM" ? (
                  <div className="size-8 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                    <Users className="size-4" />
                  </div>
                ) : selectedConversation.type === "CHANNEL" ? (
                  <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Hash className="size-4" />
                  </div>
                ) : (
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs relative shrink-0">
                    {selectedConversation.name?.substring(0, 2).toUpperCase()}
                    {activeOtherParticipant?.isOnline && (
                      <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                    )}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h2 className="text-sm font-semibold truncate text-foreground">
                      {selectedConversation.name}
                    </h2>
                    {selectedConversation.scope === "CUSTOM" ? (
                      <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 py-0 font-medium border-indigo-500/30 text-indigo-500 shrink-0">
                        {selectedConversation.department ? selectedConversation.department : "Campus Group"}
                      </Badge>
                    ) : selectedConversation.scope ? (
                      <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 py-0 font-medium shrink-0">
                        {selectedConversation.scope}
                      </Badge>
                    ) : null}
                    {selectedConversation.isAnnouncementOnly && (
                      <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 py-0 gap-1 shrink-0">
                        <Lock className="size-2.5" />
                        <span className="hidden sm:inline">Announcement Only</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {selectedConversation.scope === "CUSTOM"
                      ? `${selectedConversation.participants?.length || 1} members • ${selectedConversation.description || "Student Study & Project Group"}`
                      : selectedConversation.type === "CHANNEL"
                      ? selectedConversation.description || "Official Institute Channel"
                      : activeOtherParticipant
                      ? `${activeOtherParticipant.department} • Roll: ${activeOtherParticipant.institutionalId}`
                      : "Direct Communication"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {selectedConversation.type === "DIRECT" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReportModal(true)}
                    className="h-8 gap-1.5 text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                    title="Report Misuse"
                  >
                    <ShieldAlert className="size-3.5" />
                    <span className="hidden sm:inline">Report Misuse</span>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailsDrawer(!showDetailsDrawer)}
                  className="h-8 px-2"
                >
                  <Info className="size-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <MessageSquare className="size-6" />
                  </div>
                  <h3 className="text-sm font-semibold">Start the conversation</h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    {selectedConversation.type === "CHANNEL"
                      ? "This is the beginning of the channel history. Broadcasts and discussions will appear here."
                      : "Verified direct communication channel. All interactions adhere to campus code of conduct."}
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender.id === user?.id
                  const isStaff = ["FACULTY", "ADMIN", "SUPER_ADMIN"].includes(msg.sender.role)

                  return (
                    <div
                      key={msg.id ? `${msg.id}-${idx}` : idx}
                      className={`flex gap-3 group ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      {!isMe && (
                        <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center text-foreground font-semibold text-xs shrink-0 mt-0.5">
                          {msg.sender.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className={`max-w-[85%] sm:max-w-[70%] space-y-1.5 ${isMe ? "items-end" : "items-start"}`}>
                        {/* Sender info */}
                        <div className={`flex items-center gap-2 text-[11px] ${isMe ? "justify-end" : "justify-start"}`}>
                          {isMe && !msg.isUnsent && (
                            <button
                              type="button"
                              onClick={() => handleUnsendMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground hover:text-rose-500 flex items-center gap-1 font-medium px-1.5 py-0.5 rounded hover:bg-rose-500/10 mr-1"
                              title="Unsend message for everyone"
                            >
                              <Undo2 className="size-3" />
                              <span>Unsend</span>
                            </button>
                          )}
                          <span className="font-semibold text-foreground">{msg.sender.name}</span>
                          {isStaff && (
                            <Badge variant="secondary" className="text-[9px] h-3.5 px-1 py-0 font-bold">
                              {msg.sender.role}
                            </Badge>
                          )}
                          <span className="text-muted-foreground text-[10px]">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        {/* Bubble */}
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            msg.isUnsent
                              ? "bg-muted/40 text-muted-foreground/80 border border-dashed border-border/80 italic rounded-tr-xs"
                              : isMe
                              ? "bg-primary text-primary-foreground rounded-tr-xs"
                              : "bg-muted/70 text-foreground border border-border/60 rounded-tl-xs"
                          }`}
                        >
                          {msg.isUnsent ? (
                            <p className="flex items-center gap-1.5 opacity-80 select-none">
                              <Undo2 className="size-3.5 shrink-0" />
                              <span>This message was unsent</span>
                            </p>
                          ) : (
                            <>
                              {/* Text content */}
                              {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}

                              {/* Cloudinary Attachments */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                  {msg.attachments.map((att, aIdx) => {
                                    const isImg = att.mimeType.startsWith("image/")
                                    return (
                                      <div key={aIdx} className="rounded-lg overflow-hidden border border-border/40 bg-background/20 p-2">
                                        {isImg ? (
                                          <div className="space-y-1">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                              src={att.url}
                                              alt={att.name}
                                              className="max-h-60 rounded object-cover cursor-pointer hover:opacity-95"
                                              onClick={() => window.open(att.url, "_blank")}
                                            />
                                            <span className="text-[10px] opacity-80 truncate block">{att.name}</span>
                                          </div>
                                        ) : (
                                          <a
                                            href={att.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 hover:underline"
                                          >
                                            <FileText className="size-4 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                              <div className="text-[11px] font-medium truncate">{att.name}</div>
                                              <div className="text-[9px] opacity-75">
                                                {(att.size / 1024).toFixed(1)} KB
                                              </div>
                                            </div>
                                            <Download className="size-3.5 shrink-0 opacity-80" />
                                          </a>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Reactions */}
                        {!msg.isUnsent && msg.reactions && msg.reactions.length > 0 && (
                          <div className={`flex items-center gap-1 pt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                            {msg.reactions.map((r, rIdx) => (
                              <span
                                key={rIdx}
                                className="px-1.5 py-0.5 rounded-full text-[10px] bg-muted border border-border"
                              >
                                {r.emoji}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}

              {/* Typing indicator */}
              {Object.keys(typingUsers).length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground italic pl-2">
                  <div className="flex gap-1">
                    <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                    <span className="size-1.5 rounded-full bg-primary animate-bounce delay-150" />
                    <span className="size-1.5 rounded-full bg-primary animate-bounce delay-300" />
                  </div>
                  <span>{Object.values(typingUsers).join(", ")} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Staged Cloudinary Attachment Preview */}
            {stagedAttachment && (
              <div className="px-4 py-2 border-t border-border bg-card/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  {stagedAttachment.mimeType.startsWith("image/") ? (
                    <ImageIcon className="size-4 text-primary" />
                  ) : (
                    <FileText className="size-4 text-primary" />
                  )}
                  <span className="font-medium truncate max-w-xs">{stagedAttachment.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    ({(stagedAttachment.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStagedAttachment(null)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-border bg-card/40">
              {isCurrentChannelAnnouncementOnly ? (
                <div className="p-3 rounded-lg border border-border/80 bg-muted/40 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Lock className="size-4 text-primary" />
                  <span>This channel is broadcast-only. Only faculty and institute administrators can publish circulars.</span>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.zip"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                    title="Attach file (Cloudinary CDN)"
                  >
                    <Paperclip className={`size-4 ${isUploading ? "animate-spin text-primary" : ""}`} />
                  </Button>

                  <Input
                    value={messageText}
                    onChange={handleInputChange}
                    placeholder="Type message... (Enter to send)"
                    className="flex-1 h-9 text-xs"
                    disabled={isSending}
                  />

                  <Button
                    type="submit"
                    size="sm"
                    disabled={(!messageText.trim() && !stagedAttachment) || isSending}
                    className="h-9 px-3 gap-1.5 text-xs font-semibold"
                  >
                    <Send className="size-3.5" />
                    <span>Send</span>
                  </Button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <MessageSquare className="size-8" />
            </div>
            <h2 className="text-base font-semibold">Select a Conversation</h2>
            <p className="text-xs text-muted-foreground max-w-sm">
              Join your campus batch channels, connect with department faculty, or initiate a verified direct message.
            </p>
            <Button onClick={openDmModal} size="sm" className="gap-1.5 text-xs">
              <Plus className="size-3.5" />
              New Direct Message
            </Button>
          </div>
        )}
      </div>

      {/* ================= COLUMN 3: DETAILS DRAWER ================= */}
      {showDetailsDrawer && selectedConversation && (() => {
        const uniqueParticipants = Array.from(
          new Map(
            (selectedConversation.participants || []).map((p) => [p.id || (p as any)._id, p])
          ).values()
        )
        const uniqueJoinRequests = Array.from(
          new Map(
            (selectedConversation.joinRequests || []).map((u: any) => [u.id || u._id, u])
          ).values()
        )
        const uniquePendingInvites = Array.from(
          new Map(
            (selectedConversation.pendingInvites || []).map((u: any) => [u.id || u._id, u])
          ).values()
        )

        return (
          <>
            {/* Mobile Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
              onClick={() => setShowDetailsDrawer(false)}
            />
            <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] border-l border-border bg-card p-4 space-y-4 overflow-y-auto shadow-2xl lg:static lg:w-72 lg:z-auto lg:shadow-none lg:bg-card/30 lg:shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-xs font-semibold">Details & Safety</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailsDrawer(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="size-3.5" />
                </Button>
              </div>

              {selectedConversation.scope === "CUSTOM" ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 text-center space-y-1.5">
                    <div className="size-11 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-bold text-sm mx-auto">
                      <Users className="size-5" />
                    </div>
                    <div className="font-semibold text-foreground">{selectedConversation.name}</div>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-500">
                        {selectedConversation.department ? `${selectedConversation.department} Circle` : "Campus-Wide Group"}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {selectedConversation.accessMode === "OPEN" ? "Open Join" : "Approval Required"}
                      </Badge>
                    </div>
                  </div>

                  {selectedConversation.description && (
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">About</span>
                      <p className="font-medium mt-0.5 text-muted-foreground">{selectedConversation.description}</p>
                    </div>
                  )}

                  {/* Join Requests Section (Group Admins only) */}
                  {(selectedConversation.creatorId === user?.id ||
                    (selectedConversation.adminIds || []).includes(user?.id || "") ||
                    ["ADMIN", "SUPER_ADMIN"].includes(user?.role || "")) &&
                    uniqueJoinRequests.length > 0 && (
                      <div className="space-y-2 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1.5">
                            <Lock className="size-3.5" />
                            <span>Join Requests ({uniqueJoinRequests.length})</span>
                          </span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {uniqueJoinRequests.map((reqUser: any, idx: number) => (
                            <div key={`joinreq-${reqUser.id || (reqUser as any)._id || idx}`} className="p-2 rounded-md bg-background/80 border border-border/60 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="min-w-0 pr-1">
                                  <div className="font-semibold text-xs truncate">{reqUser.name}</div>
                                  <div className="text-[10px] text-muted-foreground truncate">
                                    {reqUser.department || "Student"} • {reqUser.academicYear || "Enrolled"}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 pt-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveJoinRequest(selectedConversation.id, reqUser.id)}
                                  className="flex-1 h-6 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                                >
                                  <Check className="size-3" />
                                  <span>Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectJoinRequest(selectedConversation.id, reqUser.id)}
                                  className="h-6 text-[10px] text-destructive hover:bg-destructive/10 px-2"
                                >
                                  <X className="size-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Members List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Members ({uniqueParticipants.length})
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={openInviteModal}
                        className="h-6 px-1.5 text-[11px] text-primary hover:text-primary gap-1"
                      >
                        <UserPlus className="size-3" />
                        Invite
                      </Button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto divide-y divide-border/40">
                      {uniqueParticipants.map((p, idx) => {
                        const isMemberCreator = selectedConversation.creatorId === p.id
                        const isMemberAdmin = isMemberCreator || (selectedConversation.adminIds || []).includes(p.id)
                        const isMe = p.id === user?.id
                        const canManageAdmin = selectedConversation.creatorId === user?.id && !isMemberCreator

                        return (
                          <div key={`part-${p.id || (p as any)._id || idx}`} className="pt-1.5 flex items-center justify-between text-xs group">
                            <div className="min-w-0">
                              <div className="font-medium truncate flex items-center gap-1">
                                <span>{p.name}</span>
                                {isMe && <span className="text-muted-foreground text-[10px]">(You)</span>}
                                {isMemberCreator ? (
                                  <Crown className="size-3 text-amber-500 fill-amber-500 shrink-0" title="Creator" />
                                ) : isMemberAdmin ? (
                                  <ShieldCheck className="size-3 text-indigo-500 shrink-0" title="Admin" />
                                ) : null}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {p.department || p.role}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {isMemberCreator ? (
                                <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 text-amber-600 border-amber-500/30">
                                  Creator
                                </Badge>
                              ) : isMemberAdmin ? (
                                <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 text-indigo-600 border-indigo-500/30">
                                  Admin
                                </Badge>
                              ) : null}
                              {canManageAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (isMemberAdmin) {
                                      handleDemoteAdmin(selectedConversation.id, p.id)
                                    } else {
                                      handlePromoteAdmin(selectedConversation.id, p.id)
                                    }
                                  }}
                                  className="h-5 px-1 text-[9px] text-muted-foreground hover:text-foreground opacity-70 group-hover:opacity-100"
                                  title={isMemberAdmin ? "Demote to Member" : "Promote to Admin"}
                                >
                                  {isMemberAdmin ? "Demote" : "+Admin"}
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Pending Invites */}
                  {uniquePendingInvites.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Pending Invites ({uniquePendingInvites.length})
                      </span>
                      <div className="space-y-1 max-h-28 overflow-y-auto">
                        {uniquePendingInvites.map((inv, idx) => (
                          <div key={`inv-${inv.id || (inv as any)._id || idx}`} className="flex items-center justify-between text-[11px] py-0.5">
                            <span className="truncate text-muted-foreground">{inv.name}</span>
                            <Badge variant="secondary" className="text-[9px] h-3.5 px-1 py-0">
                              Invited
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons: Leave / Disband */}
                  <div className="pt-3 border-t border-border space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLeaveGroup(selectedConversation.id)}
                      className="w-full h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <LogOut className="size-3.5" />
                      Leave Group
                    </Button>

                    {(selectedConversation.creatorId === user?.id || ["ADMIN", "SUPER_ADMIN"].includes(user?.role || "")) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDisbandGroup(selectedConversation.id)}
                        className="w-full h-8 text-xs gap-1.5"
                      >
                        <Trash2 className="size-3.5" />
                        Disband Group
                      </Button>
                    )}
                  </div>
                </div>
              ) : selectedConversation.type === "CHANNEL" ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Channel Scope</span>
                    <p className="font-medium mt-0.5">{selectedConversation.scope || "CAMPUS"}</p>
                  </div>
                  {selectedConversation.department && (
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Department</span>
                      <p className="font-medium mt-0.5">{selectedConversation.department}</p>
                    </div>
                  )}
                  {selectedConversation.academicYear && (
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Academic Year</span>
                      <p className="font-medium mt-0.5">{selectedConversation.academicYear}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Permissions</span>
                    <p className="font-medium mt-0.5">
                      {selectedConversation.isAnnouncementOnly
                        ? "Broadcast Mode (Faculty / Admin Post)"
                        : "Interactive Discussion"}
                    </p>
                  </div>
                </div>
              ) : (
                activeOtherParticipant && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-lg border border-border bg-muted/40 text-center space-y-1.5">
                      <div className="size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm mx-auto">
                        {activeOtherParticipant.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="font-semibold text-foreground">{activeOtherParticipant.name}</div>
                      <Badge variant="outline" className="text-[10px]">
                        {activeOtherParticipant.role}
                      </Badge>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Department</span>
                      <p className="font-medium mt-0.5">{activeOtherParticipant.department}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Institutional Roll No</span>
                      <p className="font-medium font-mono mt-0.5">{activeOtherParticipant.institutionalId}</p>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowReportModal(true)}
                        className="w-full h-8 text-xs gap-1.5"
                      >
                        <ShieldAlert className="size-3.5" />
                        Report Misuse to HoD
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )
      })()}

      {/* ================= MODAL: START DIRECT MESSAGE ================= */}
      {showNewDmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl shadow-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold">Start Direct Message</h3>
                <p className="text-xs text-muted-foreground">Search verified members within your college</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewDmModal(false)}
                className="h-7 w-7 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>

            {dmError && (
              <div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{dmError}</span>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={dirSearch}
                onChange={(e) => {
                  setDirSearch(e.target.value)
                  fetchDirectory(e.target.value)
                }}
                placeholder="Search by student name or roll number..."
                className="h-9 pl-8 text-xs"
              />
            </div>

            {/* Results List */}
            <div className="max-h-48 overflow-y-auto divide-y divide-border border border-border rounded-lg">
              {directoryUsers.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No verified members found.
                </div>
              ) : (
                directoryUsers.map((u) => {
                  const isSelected = selectedRecipient?.id === u.id
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedRecipient(u)}
                      className={`w-full p-2.5 text-left flex items-center justify-between transition-colors ${
                        isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          {u.name}
                          <Badge variant="outline" className="text-[9px] h-3.5 px-1 py-0">
                            {u.role}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {u.department} • Roll: {u.institutionalId}
                        </div>
                      </div>

                      {u.dmPermission === "FACULTY_ONLY" && user?.role === "STUDENT" && (
                        <Badge variant="secondary" className="text-[9px] gap-1">
                          <Lock className="size-2.5" />
                          Faculty Only
                        </Badge>
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {/* Initial Message (Optional) */}
            {selectedRecipient && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  First Message Preview (Requires Recipient Consent)
                </label>
                <Input
                  value={initialDmMessage}
                  onChange={(e) => setInitialDmMessage(e.target.value)}
                  placeholder="State the purpose of your message..."
                  className="h-8 text-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewDmModal(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleStartDm}
                disabled={!selectedRecipient || isCreatingDm}
                className="h-8 text-xs font-semibold"
              >
                {isCreatingDm ? "Connecting..." : "Send Request"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REPORT HARASSMENT ================= */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-card border border-destructive/30 rounded-xl shadow-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="size-5" />
                <h3 className="text-sm font-semibold">Report Safety Violation</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReportModal(false)}
                className="h-7 w-7 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>

            {reportSuccess ? (
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs text-center font-medium">
                {reportSuccess}
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Nexora Campus enforces zero-tolerance for stalking, intimidation, or inappropriate messages. Submitting this report freezes an audit snapshot of recent messages and notifies the Head of Department and Campus Administrator.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Violation Type</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full h-8 text-xs rounded-md border border-border bg-background px-2.5"
                  >
                    <option value="Unsolicited inappropriate messages or stalking">
                      Unsolicited inappropriate messages or stalking
                    </option>
                    <option value="Harassment or intimidating behavior">
                      Harassment or intimidating behavior
                    </option>
                    <option value="Impersonation or academic fraud">
                      Impersonation or academic fraud
                    </option>
                    <option value="Unwanted spam or promotional content">
                      Unwanted spam or promotional content
                    </option>
                    <option value="Other safety violation">Other safety violation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Additional Details (Optional)</label>
                  <textarea
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    placeholder="Provide context for campus administration..."
                    rows={3}
                    className="w-full text-xs rounded-md border border-border bg-background p-2.5 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReportModal(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleSubmitReport}
                    disabled={isSubmittingReport}
                    className="h-8 text-xs font-semibold"
                  >
                    {isSubmittingReport ? "Securing Audit..." : "Submit Formal Report"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: DM PRIVACY SETTINGS ================= */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl shadow-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Direct Message Privacy Shield</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPrivacyModal(false)}
                className="h-7 w-7 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Configure who is permitted to send you direct message requests. Faculty and administrators can always reach you for academic communications.
            </p>

            <div className="space-y-2 pt-1">
              <label
                onClick={() => setMyPrivacy("ALLOW_ALL")}
                className={`p-3 rounded-lg border cursor-pointer block transition-colors ${
                  myPrivacy === "ALLOW_ALL" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Allow All Members</span>
                  {myPrivacy === "ALLOW_ALL" && <Check className="size-4 text-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Any approved student or faculty member in your institute can send a message request.
                </p>
              </label>

              <label
                onClick={() => setMyPrivacy("SAME_DEPARTMENT_ONLY")}
                className={`p-3 rounded-lg border cursor-pointer block transition-colors ${
                  myPrivacy === "SAME_DEPARTMENT_ONLY" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Same Department Only</span>
                  {myPrivacy === "SAME_DEPARTMENT_ONLY" && <Check className="size-4 text-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Only classmates and faculty within your department ({user?.department}) can DM you.
                </p>
              </label>

              <label
                onClick={() => setMyPrivacy("FACULTY_ONLY")}
                className={`p-3 rounded-lg border cursor-pointer block transition-colors ${
                  myPrivacy === "FACULTY_ONLY" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">Faculty & Coordinators Only (Protected)</span>
                  {myPrivacy === "FACULTY_ONLY" && <Check className="size-4 text-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Block all student direct message requests. Only teachers, coordinators, and administrators can message you.
                </p>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPrivacyModal(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSavePrivacy}
                disabled={isSavingPrivacy}
                className="h-8 text-xs font-semibold"
              >
                {isSavingPrivacy ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE OFFICIAL CHANNEL (FACULTY/ADMIN) ================= */}
      {showNewChannelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl shadow-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Hash className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Create Official Channel</h3>
                  <p className="text-xs text-muted-foreground">Campus-wide or departmental broadcast & discussion channels</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewChannelModal(false)}
                className="h-7 w-7 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>

            {channelError && (
              <div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{channelError}</span>
              </div>
            )}

            {/* Channel Name & Preview */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Channel Name *</label>
                <Input
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. placement-cell-2026, exam-announcements"
                  className="h-8 text-xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Channel handle: <span className="font-semibold text-foreground">#{channelName ? channelName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-") : "channel-name"}</span>
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Description (Optional)</label>
                <Input
                  value={channelDescription}
                  onChange={(e) => setChannelDescription(e.target.value)}
                  placeholder="Purpose of channel, notice frequency, guidelines..."
                  className="h-8 text-xs"
                />
              </div>

              {/* Faculty Quick Broadcast Auto-Target */}
              {facultyAssignments.length > 0 && (
                <div className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 space-y-1">
                  <label className="text-[11px] font-semibold text-primary block">
                    Auto-Target Enrolled Teaching Class
                  </label>
                  <select
                    onChange={(e) => {
                      const idx = Number(e.target.value)
                      if (idx >= 0 && facultyAssignments[idx]) {
                        const a = facultyAssignments[idx]
                        setChannelScope("SUBJECT")
                        setChannelDepartment(user?.department || "")
                        setChannelAcademicYear(a.academicYear)
                        setChannelSemester(a.semester)
                        setChannelSubjectName(a.subjectName)
                        setChannelName(`${a.subjectName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${a.semester.toLowerCase().replace(/[^a-z0-9]/g, "-")}`)
                        setChannelDescription(`Official course announcement channel for ${a.subjectName} (${a.academicYear}, ${a.semester})`)
                        setChannelIsAnnouncementOnly(true)
                      }
                    }}
                    defaultValue=""
                    className="w-full h-8 text-xs rounded border border-border bg-background px-2"
                  >
                    <option value="" disabled>-- Select Your Assigned Class & Subject --</option>
                    {facultyAssignments.map((a, i) => (
                      <option key={i} value={i}>
                        {a.subjectName} ({a.academicYear} • {a.semester})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Target Scope */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Channel Scope</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setChannelScope("CAMPUS")}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      channelScope === "CAMPUS" ? "border-primary bg-primary/5 font-semibold text-foreground" : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div>Campus-Wide</div>
                    <div className="text-[9px] text-muted-foreground font-normal">All college</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setChannelScope("DEPARTMENT")
                      if (!channelDepartment) setChannelDepartment(user?.department || configuredDepts[0] || "")
                    }}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      channelScope === "DEPARTMENT" ? "border-primary bg-primary/5 font-semibold text-foreground" : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div>Department</div>
                    <div className="text-[9px] text-muted-foreground font-normal">Branch only</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setChannelScope("BATCH")
                      if (!channelDepartment) setChannelDepartment(user?.department || configuredDepts[0] || "")
                      if (!channelAcademicYear) setChannelAcademicYear(configuredYears[0] || "Final Year")
                    }}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      channelScope === "BATCH" ? "border-primary bg-primary/5 font-semibold text-foreground" : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div>Class Batch</div>
                    <div className="text-[9px] text-muted-foreground font-normal">Year & branch</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setChannelScope("SUBJECT")
                      if (!channelDepartment) setChannelDepartment(user?.department || configuredDepts[0] || "")
                      if (!channelAcademicYear) setChannelAcademicYear(configuredYears[0] || "Second Year")
                      if (!channelSemester) setChannelSemester("Semester 3")
                    }}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      channelScope === "SUBJECT" ? "border-primary bg-primary/5 font-semibold text-foreground" : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div>Class & Subject</div>
                    <div className="text-[9px] text-muted-foreground font-normal">Course students</div>
                  </button>
                </div>
              </div>

              {/* Department Dropdown (if not CAMPUS) */}
              {channelScope !== "CAMPUS" && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Department *</label>
                  <select
                    value={channelDepartment}
                    onChange={(e) => setChannelDepartment(e.target.value)}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    {(configuredDepts.length > 0 ? configuredDepts : [
                      "Computer Science & Engineering",
                      "Information Technology",
                      "Electronics & Telecommunication",
                      "Mechanical Engineering",
                      "Civil Engineering",
                      "Electrical Engineering"
                    ]).map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Academic Year Dropdown (if BATCH or SUBJECT) */}
              {(channelScope === "BATCH" || channelScope === "SUBJECT") && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Academic Year / Class *</label>
                  <select
                    value={channelAcademicYear}
                    onChange={(e) => setChannelAcademicYear(e.target.value)}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    {(configuredYears.length > 0 ? configuredYears : [
                      "First Year",
                      "Second Year",
                      "Third Year",
                      "Final Year"
                    ]).map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Semester & Subject (if SUBJECT) */}
              {channelScope === "SUBJECT" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Semester *</label>
                    <select
                      value={channelSemester}
                      onChange={(e) => setChannelSemester(e.target.value)}
                      className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 text-foreground"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={`Semester ${s}`}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Subject Name</label>
                    <Input
                      value={channelSubjectName}
                      onChange={(e) => setChannelSubjectName(e.target.value)}
                      placeholder="e.g. Data Structures"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Permission Mode: Broadcast vs Interactive */}
              <div className="space-y-1.5 pt-1 border-t border-border">
                <label className="text-[11px] font-semibold text-muted-foreground">Channel Mode & Permissions</label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setChannelIsAnnouncementOnly(true)}
                    className={`w-full p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-colors ${
                      channelIsAnnouncementOnly
                        ? "border-amber-500/50 bg-amber-500/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className="size-6 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Lock className="size-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        Broadcast Feed (Announcement Only)
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">Recommended</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                        Only Faculty and Admins can publish circulars and media. Students receive updates in real-time and can add emoji reactions.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannelIsAnnouncementOnly(false)}
                    className={`w-full p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-colors ${
                      !channelIsAnnouncementOnly
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className="size-6 rounded-md bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Radio className="size-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Interactive Forum (Two-Way)</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                        Open discussion. All enrolled students and faculty within scope can post messages, collaborate, and share course files.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewChannelModal(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateChannel}
                disabled={isCreatingChannel || !channelName.trim()}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                <Hash className="size-3.5" />
                {isCreatingChannel ? "Creating..." : "Create Channel"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE STUDENT GROUP ================= */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl shadow-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                  <Users className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Create Student Group</h3>
                  <p className="text-xs text-muted-foreground">Study circle, project team, or club committee</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewGroupModal(false)}
                className="h-7 w-7 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>

            {groupError && (
              <div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{groupError}</span>
              </div>
            )}

            {/* Group Name & Description */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Group Name *</label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. AI Project Team, Algo Study Circle..."
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Description (Optional)</label>
                <Input
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Goals, meeting notes, project scope..."
                  className="h-8 text-xs"
                />
              </div>

              {/* Group Level / Scope */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Audience / Level</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setGroupLevel("DEPARTMENT")
                      const d = user?.department || "ALL"
                      setGroupDeptFilter(d)
                      fetchGroupDirectory(groupSearch, d, groupYearFilter)
                    }}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      groupLevel === "DEPARTMENT" ? "border-primary bg-primary/5 font-semibold text-foreground" : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div>Department Circle</div>
                    <div className="text-[10px] text-muted-foreground font-normal">
                      {user?.department || "My Department"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGroupLevel("CAMPUS")
                      setGroupDeptFilter("ALL")
                      fetchGroupDirectory(groupSearch, "ALL", groupYearFilter)
                    }}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      groupLevel === "CAMPUS" ? "border-primary bg-primary/5 font-semibold text-foreground" : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div>Campus-Wide</div>
                    <div className="text-[10px] text-muted-foreground font-normal">
                      Inter-departmental team
                    </div>
                  </button>
                </div>
              </div>

              {/* Group Access Mode */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Access & Discovery</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setGroupAccessMode("APPROVAL_REQUIRED")}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      groupAccessMode === "APPROVAL_REQUIRED" ? "border-primary bg-primary/5 font-semibold text-foreground" : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      <Lock className="size-3 text-amber-500" />
                      <span>Require Approval</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                      Admins review inbound requests
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGroupAccessMode("OPEN")}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      groupAccessMode === "OPEN" ? "border-primary bg-primary/5 font-semibold text-foreground" : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      <Unlock className="size-3 text-emerald-500" />
                      <span>Open Join</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                      Peers join without approval
                    </div>
                  </button>
                </div>
              </div>

              {/* Member Selection Tags */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Invite Peers (Consent Required) {selectedGroupMembers.length > 0 && `• ${selectedGroupMembers.length} selected`}
                </label>
                {selectedGroupMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-border/60 bg-muted/30 max-h-20 overflow-y-auto">
                    {selectedGroupMembers.map((m) => (
                      <Badge key={m.id} variant="secondary" className="text-[10px] gap-1 pr-1">
                        <span>{m.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedGroupMembers((prev) => prev.filter((u) => u.id !== m.id))}
                          className="hover:text-destructive"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Filter Dropdowns: Department and Academic Year */}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={groupDeptFilter}
                    onChange={(e) => {
                      const val = e.target.value
                      setGroupDeptFilter(val)
                      fetchGroupDirectory(groupSearch, val, groupYearFilter)
                    }}
                    className="h-8 text-xs rounded-md border border-border bg-background px-2 text-foreground truncate"
                  >
                    <option value="ALL">All Departments</option>
                    {configuredDepts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <select
                    value={groupYearFilter}
                    onChange={(e) => {
                      const val = e.target.value
                      setGroupYearFilter(val)
                      fetchGroupDirectory(groupSearch, groupDeptFilter, val)
                    }}
                    className="h-8 text-xs rounded-md border border-border bg-background px-2 text-foreground truncate"
                  >
                    <option value="ALL">All Academic Years</option>
                    {(configuredYears.length > 0
                      ? configuredYears
                      : ["First Year", "Second Year", "Third Year", "Final Year"]
                    ).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Directory Search */}
                <div className="relative">
                  <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={groupSearch}
                    onChange={(e) => {
                      setGroupSearch(e.target.value)
                      fetchGroupDirectory(e.target.value, groupDeptFilter, groupYearFilter)
                    }}
                    placeholder="Search peers by name or roll number..."
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                {/* Peer List */}
                <div className="max-h-36 overflow-y-auto divide-y divide-border border border-border rounded-lg">
                  {groupDirectoryUsers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No members found matching query.
                    </div>
                  ) : (
                    groupDirectoryUsers
                      .filter((u) => u.id !== user?.id)
                      .map((u) => {
                        const isAdded = selectedGroupMembers.some((m) => m.id === u.id)
                        return (
                          <div
                            key={u.id}
                            className="p-2 text-left flex items-center justify-between hover:bg-muted/40 transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-medium truncate">{u.name}</div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {u.department} • Roll: {u.institutionalId}
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant={isAdded ? "secondary" : "outline"}
                              onClick={() => {
                                if (isAdded) {
                                  setSelectedGroupMembers((prev) => prev.filter((m) => m.id !== u.id))
                                } else {
                                  setSelectedGroupMembers((prev) => [...prev, u])
                                }
                              }}
                              className="h-6 px-2 text-[10px]"
                            >
                              {isAdded ? "Added" : "+ Add"}
                            </Button>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewGroupModal(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || isCreatingGroup}
                className="h-8 text-xs font-semibold"
              >
                {isCreatingGroup ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: INVITE PEERS TO GROUP ================= */}
      {showInviteModal && selectedConversation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl shadow-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <UserPlus className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Invite to {selectedConversation.name}</h3>
                  <p className="text-xs text-muted-foreground">Send group join invitation to classmates</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInviteModal(false)}
                className="h-7 w-7 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Selected Tags */}
            {selectedInviteMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-border/60 bg-muted/30 max-h-20 overflow-y-auto">
                {selectedInviteMembers.map((m) => (
                  <Badge key={m.id} variant="secondary" className="text-[10px] gap-1 pr-1">
                    <span>{m.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedInviteMembers((prev) => prev.filter((u) => u.id !== m.id))}
                      className="hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Department & Academic Year Filter Dropdowns */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={inviteDeptFilter}
                onChange={(e) => {
                  const val = e.target.value
                  setInviteDeptFilter(val)
                  fetchInviteDirectory(inviteSearch, val, inviteYearFilter)
                }}
                className="h-8 text-xs rounded-md border border-border bg-background px-2 text-foreground truncate"
              >
                <option value="ALL">All Departments</option>
                {configuredDepts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={inviteYearFilter}
                onChange={(e) => {
                  const val = e.target.value
                  setInviteYearFilter(val)
                  fetchInviteDirectory(inviteSearch, inviteDeptFilter, val)
                }}
                className="h-8 text-xs rounded-md border border-border bg-background px-2 text-foreground truncate"
              >
                <option value="ALL">All Academic Years</option>
                {(configuredYears.length > 0
                  ? configuredYears
                  : ["First Year", "Second Year", "Third Year", "Final Year"]
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={inviteSearch}
                onChange={(e) => {
                  setInviteSearch(e.target.value)
                  fetchInviteDirectory(e.target.value, inviteDeptFilter, inviteYearFilter)
                }}
                placeholder="Search peers by name or roll number..."
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* List */}
            <div className="max-h-48 overflow-y-auto divide-y divide-border border border-border rounded-lg">
              {inviteDirectoryUsers.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  No peers found matching query.
                </div>
              ) : (
                inviteDirectoryUsers
                  .filter(
                    (u) =>
                      u.id !== user?.id &&
                      !selectedConversation.participants?.some((p) => p.id === u.id) &&
                      !selectedConversation.pendingInvites?.some((p) => p.id === u.id)
                  )
                  .map((u) => {
                    const isAdded = selectedInviteMembers.some((m) => m.id === u.id)
                    return (
                      <div
                        key={u.id}
                        className="p-2 text-left flex items-center justify-between hover:bg-muted/40 transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-medium truncate">{u.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {u.department} • Roll: {u.institutionalId}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={isAdded ? "secondary" : "outline"}
                          onClick={() => {
                            if (isAdded) {
                              setSelectedInviteMembers((prev) => prev.filter((m) => m.id !== u.id))
                            } else {
                              setSelectedInviteMembers((prev) => [...prev, u])
                            }
                          }}
                          className="h-6 px-2 text-[10px]"
                        >
                          {isAdded ? "Added" : "+ Add"}
                        </Button>
                      </div>
                    )
                  })
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInviteModal(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleInviteMoreMembers}
                disabled={selectedInviteMembers.length === 0 || isInviting}
                className="h-8 text-xs font-semibold"
              >
                {isInviting ? "Sending Invites..." : `Dispatch (${selectedInviteMembers.length}) Invites`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
