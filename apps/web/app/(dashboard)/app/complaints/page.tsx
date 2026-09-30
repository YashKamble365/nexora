"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth-context"
import {
  ComplaintDTO,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintCategory,
  MessageAttachment,
} from "@nexora/types"
import {
  LifeBuoy,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  Plus,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Download,
  User,
  Lock,
  RefreshCw,
  Copy,
  Check,
  X,
  Send,
  UserCheck,
  AlertTriangle,
  MapPin,
  Calendar,
  Building2,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { apiClient, getApiBase } from "@/lib/api"

const API_BASE = getApiBase()

export default function ComplaintsPage() {
  const { user } = useAuth()

  // State
  const [complaints, setComplaints] = React.useState<ComplaintDTO[]>([])
  const [stats, setStats] = React.useState<{
    total: number
    submitted: number
    underReview: number
    inProgress: number
    resolved: number
    urgent: number
    resolutionRate: number
  } | null>(null)

  const [isLoading, setIsLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL")
  const [priorityFilter, setPriorityFilter] = React.useState<string>("ALL")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [boardScope, setBoardScope] = React.useState<"MY" | "ALL">(user?.role === "STUDENT" ? "MY" : "ALL")

  // Selected ticket for timeline drawer
  const [selectedTicket, setSelectedTicket] = React.useState<ComplaintDTO | null>(null)

  // Modals & Tracking Portal State
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [showTrackModal, setShowTrackModal] = React.useState(false)
  const [trackTicketInput, setTrackTicketInput] = React.useState("")
  const [trackedTicketData, setTrackedTicketData] = React.useState<ComplaintDTO | null>(null)
  const [isTracking, setIsTracking] = React.useState(false)
  const [trackError, setTrackError] = React.useState<string | null>(null)
  const [trackFollowupNote, setTrackFollowupNote] = React.useState("")
  const [isSubmittingFollowup, setIsSubmittingFollowup] = React.useState(false)
  const [copiedTicket, setCopiedTicket] = React.useState<string | null>(null)

  // Creation form state
  const [newSubject, setNewSubject] = React.useState("")
  const [newCategory, setNewCategory] = React.useState<ComplaintCategory>("INFRASTRUCTURE")
  const [newPriority, setNewPriority] = React.useState<ComplaintPriority>("MEDIUM")
  const [newLocation, setNewLocation] = React.useState("")
  const [newDescription, setNewDescription] = React.useState("")
  const [isAnonymous, setIsAnonymous] = React.useState(false)
  const [stagedAttachments, setStagedAttachments] = React.useState<MessageAttachment[]>([])
  const [isUploading, setIsUploading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  // Action / Timeline note form state
  const [actionStatus, setActionStatus] = React.useState<ComplaintStatus>("IN_PROGRESS")
  const [actionNote, setActionNote] = React.useState("")
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false)
  const [newTimelineComment, setNewTimelineComment] = React.useState("")
  const [isAddingComment, setIsAddingComment] = React.useState(false)

  // Safety / DM Misuse Reports state
  const [activeView, setActiveView] = React.useState<"GRIEVANCES" | "SAFETY_REPORTS">("GRIEVANCES")
  const [safetyReports, setSafetyReports] = React.useState<any[]>([])
  const [selectedSafetyReport, setSelectedSafetyReport] = React.useState<any | null>(null)
  const [isLoadingReports, setIsLoadingReports] = React.useState(false)
  const [reportFilterStatus, setReportFilterStatus] = React.useState<string>("ALL")
  const [reportActionStatus, setReportActionStatus] = React.useState<"RESOLVED" | "DISMISSED">("RESOLVED")
  const [reportResolutionNotes, setReportResolutionNotes] = React.useState("")
  const [blockUserInConversation, setBlockUserInConversation] = React.useState(false)
  const [isUpdatingReport, setIsUpdatingReport] = React.useState(false)

  const isStaff = ["FACULTY", "ADMIN", "SUPER_ADMIN"].includes(user?.role || "")

  const fetchSafetyReports = React.useCallback(async () => {
    if (!isStaff) return
    setIsLoadingReports(true)
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/reports`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setSafetyReports(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.warn("Fetch safety reports error:", err)
    } finally {
      setIsLoadingReports(false)
    }
  }, [isStaff])

  const handleUpdateSafetyReport = async () => {
    if (!selectedSafetyReport) return
    setIsUpdatingReport(true)
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/reports/${selectedSafetyReport.id || selectedSafetyReport._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify({
          status: reportActionStatus,
          resolutionNotes: reportResolutionNotes.trim() || undefined,
          blockUserInConversation,
        }),
      })

      if (res.ok) {
        await fetchSafetyReports()
        setSelectedSafetyReport(null)
        setReportResolutionNotes("")
        setBlockUserInConversation(false)
      } else {
        const err = await res.json()
        alert(err.error || "Failed to update safety report")
      }
    } catch (err: any) {
      alert(err.message || "Failed to update report")
    } finally {
      setIsUpdatingReport(false)
    }
  }

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Accessible Escape key listener to close modal or drawer
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showCreateModal) setShowCreateModal(false)
        else if (showTrackModal) setShowTrackModal(false)
        else if (selectedTicket) setSelectedTicket(null)
        else if (selectedSafetyReport) setSelectedSafetyReport(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showCreateModal, showTrackModal, selectedTicket, selectedSafetyReport])

  React.useEffect(() => {
    if (isStaff) {
      fetchSafetyReports()
    }
  }, [isStaff, fetchSafetyReports])

  // Track Grievance Status Action
  const handleTrackTicket = async (ticketToSearch?: string) => {
    const num = (ticketToSearch || trackTicketInput).trim()
    if (!num) {
      setTrackError("Please enter a ticket number to track.")
      return
    }

    setIsTracking(true)
    setTrackError(null)
    try {
      const data = await apiClient.get<{ complaint: ComplaintDTO; stage: any }>(
        `/complaints/track/${encodeURIComponent(num)}`
      )
      if (data?.complaint) {
        setTrackedTicketData({
          ...data.complaint,
          stage: data.stage,
        })
      } else {
        setTrackError("Ticket record not found.")
      }
    } catch (err: any) {
      setTrackError(err.message || `No grievance ticket found matching "${num}". Please check the format (e.g. TKT-202609-1234).`)
      setTrackedTicketData(null)
    } finally {
      setIsTracking(false)
    }
  }

  // Student post follow-up note to tracked ticket
  const handleStudentSubmitFollowup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackedTicketData || !trackFollowupNote.trim()) return

    setIsSubmittingFollowup(true)
    try {
      const res = await apiClient.post<{ message: string; timeline: any[] }>(
        `/complaints/${trackedTicketData.id}/timeline`,
        { note: trackFollowupNote.trim() }
      )
      if (res?.timeline) {
        setTrackedTicketData((prev) => (prev ? { ...prev, timeline: res.timeline } : null))
        setTrackFollowupNote("")
        fetchComplaints()
      }
    } catch (err: any) {
      alert(err.message || "Failed to post follow-up note.")
    } finally {
      setIsSubmittingFollowup(false)
    }
  }

  // 1. Fetch complaints
  const fetchComplaints = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("nexora_token")
      const params = new URLSearchParams()
      if (statusFilter !== "ALL") params.append("status", statusFilter)
      if (categoryFilter !== "ALL") params.append("category", categoryFilter)
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter)
      if (searchQuery.trim().length > 0) params.append("search", searchQuery.trim())
      if (user?.role === "STUDENT" && boardScope === "ALL") params.append("scope", "ALL")

      const res = await fetch(`${API_BASE}/api/complaints?${params.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        const items = data.complaints || []
        setComplaints(items)
        // If drawer is open, keep selected ticket updated in memory without re-triggering fetch
        setSelectedTicket((prev) => {
          if (!prev) return null
          return items.find((c: ComplaintDTO) => c.id === prev.id) || prev
        })
      }
    } catch (err) {
      console.warn("Fetch complaints error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, categoryFilter, priorityFilter, searchQuery, boardScope, user?.role])

  // 2. Fetch stats
  const fetchStats = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/complaints/stats`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (err) {
      console.warn("Fetch stats error:", err)
    }
  }, [])

  React.useEffect(() => {
    fetchComplaints()
    fetchStats()
  }, [fetchComplaints, fetchStats])

  // Copy ticket number helper
  const handleCopyTicket = (num: string) => {
    navigator.clipboard.writeText(num)
    setCopiedTicket(num)
    setTimeout(() => setCopiedTicket(null), 1800)
  }

  // Cloudinary Attachment Upload
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
        const data = await res.json()
        setStagedAttachments((prev) => [...prev, data])
      } else {
        const err = await res.json()
        alert(err.error || "File upload failed")
      }
    } catch (err) {
      console.warn("Upload error:", err)
      alert("Failed to upload evidence file")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Submit new grievance
  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.trim() || !newDescription.trim()) {
      setFormError("Please provide subject and detailed description.")
      return
    }

    if (stagedAttachments.length === 0) {
      setFormError("Supporting evidence is mandatory. Please upload at least one photo, screenshot, or diagnostic document.")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify({
          subject: newSubject.trim(),
          category: newCategory,
          priority: newPriority,
          location: newLocation.trim() || undefined,
          description: newDescription.trim(),
          isAnonymous,
          attachments: stagedAttachments,
        }),
      })

      if (res.ok) {
        setShowCreateModal(false)
        setNewSubject("")
        setNewDescription("")
        setNewLocation("")
        setIsAnonymous(false)
        setStagedAttachments([])
        await fetchComplaints()
        await fetchStats()
      } else {
        const err = await res.json()
        setFormError(err.message || "Failed to submit grievance")
      }
    } catch (err: any) {
      setFormError(err.message || "Submission failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Staff Update Status
  const handleUpdateStatus = async () => {
    if (!selectedTicket) return
    setIsUpdatingStatus(true)

    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/complaints/${selectedTicket.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify({
          status: actionStatus,
          note: actionNote.trim() || undefined,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setSelectedTicket(updated.complaint)
        setActionNote("")
        await fetchComplaints()
        await fetchStats()
      } else {
        const err = await res.json()
        alert(err.message || "Failed to update status")
      }
    } catch (err) {
      console.warn("Update status error:", err)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Add Remark to Timeline
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !newTimelineComment.trim()) return

    setIsAddingComment(true)
    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/complaints/${selectedTicket.id}/timeline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify({
          note: newTimelineComment.trim(),
        }),
      })

      if (res.ok) {
        setNewTimelineComment("")
        const refreshed = await fetch(`${API_BASE}/api/complaints/${selectedTicket.id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          credentials: "include",
        })
        if (refreshed.ok) {
          const freshData = await refreshed.json()
          setSelectedTicket(freshData)
        }
        await fetchComplaints()
      }
    } catch (err) {
      console.warn("Add comment error:", err)
    } finally {
      setIsAddingComment(false)
    }
  }

  const getPriorityColor = (p: ComplaintPriority) => {
    switch (p) {
      case "URGENT":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20"
      case "HIGH":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "MEDIUM":
        return "bg-sky-500/10 text-sky-500 border-sky-500/20"
      case "LOW":
        return "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }
  }

  const getStatusBadge = (s: ComplaintStatus) => {
    switch (s) {
      case "SUBMITTED":
        return <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-[10px]">Submitted</Badge>
      case "UNDER_REVIEW":
        return <Badge variant="secondary" className="bg-sky-500/10 text-sky-500 border border-sky-500/20 text-[10px]">Under Review</Badge>
      case "ASSIGNED":
        return <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px]">Assigned</Badge>
      case "IN_PROGRESS":
        return <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] animate-pulse">In Progress</Badge>
      case "RESOLVED":
        return <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-[10px]">Resolved</Badge>
      case "REJECTED":
        return <Badge variant="destructive" className="text-[10px]">Rejected</Badge>
      case "CLOSED":
        return <Badge variant="outline" className="text-muted-foreground text-[10px]">Closed</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <LifeBuoy className="size-6 text-primary" />
              Grievance & Whistleblower Redressal
            </h1>
            <Badge variant="outline" className="text-xs">
              SLA Monitored
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Institutional multi-stage ticket tracking, confidential whistleblower protection & verifiable audit timelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchComplaints()
              fetchStats()
              if (isStaff) fetchSafetyReports()
            }}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTrackError(null)
              setShowTrackModal(true)
            }}
            className="h-9 gap-1.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10 shadow-xs"
          >
            <Search className="size-3.5" />
            Track Ticket #
          </Button>

          {activeView === "GRIEVANCES" && (user?.role === "STUDENT" || user?.role === "FACULTY") && (
            <Button
              size="sm"
              onClick={() => {
                setFormError(null)
                setShowCreateModal(true)
              }}
              className="h-9 gap-1.5 text-xs font-semibold shadow-xs"
            >
              <Plus className="size-3.5" />
              File Grievance / Whistleblower
            </Button>
          )}
        </div>
      </div>

      {/* Staff View Switcher: Campus Grievances vs Safety Reports */}
      {isStaff && (
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <button
            onClick={() => setActiveView("GRIEVANCES")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeView === "GRIEVANCES"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <LifeBuoy className="size-3.5" />
            <span>Campus Grievances</span>
            {complaints.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeView === "GRIEVANCES" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {complaints.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveView("SAFETY_REPORTS")
              fetchSafetyReports()
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeView === "SAFETY_REPORTS"
                ? "bg-rose-500 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <ShieldAlert className="size-3.5" />
            <span>Direct Message Safety Reports</span>
            {safetyReports.filter((r) => r.status === "PENDING").length > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-rose-600 animate-pulse">
                {safetyReports.filter((r) => r.status === "PENDING").length} Pending Review
              </span>
            ) : safetyReports.length > 0 ? (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeView === "SAFETY_REPORTS" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                {safetyReports.length}
              </span>
            ) : null}
          </button>
        </div>
      )}

      {/* Conditional: Grievances View vs Safety Reports View */}
      {activeView === "GRIEVANCES" ? (
        <>
          {/* 2. KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Logged
          </span>
          <div className="text-2xl font-bold text-foreground">
            {stats?.total ?? "—"}
          </div>
          <div className="text-[11px] text-muted-foreground">All institutional tickets</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
          <span className="text-[11px] font-semibold text-sky-500 uppercase tracking-wider">
            Under Review
          </span>
          <div className="text-2xl font-bold text-foreground">
            {stats?.underReview ?? "—"}
          </div>
          <div className="text-[11px] text-muted-foreground">Awaiting triage/assignee</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
            Active in Progress
          </span>
          <div className="text-2xl font-bold text-foreground">
            {stats?.inProgress ?? "—"}
          </div>
          <div className="text-[11px] text-muted-foreground">Staff assigned & repairing</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
          <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">
            Resolution Rate
          </span>
          <div className="text-2xl font-bold text-foreground flex items-baseline gap-1.5">
            {stats?.resolutionRate ?? 100}%
            <span className="text-xs font-normal text-muted-foreground">({stats?.resolved ?? 0} resolved)</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats?.resolutionRate ?? 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Filters & Scope Controls */}
      <div className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {["ALL", "SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Student Scope Switch: My Filed Tickets vs Campus Public Board */}
          {user?.role === "STUDENT" && (
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg text-xs self-start md:self-auto shrink-0">
              <button
                onClick={() => setBoardScope("MY")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  boardScope === "MY"
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Filed Grievances
              </button>
              <button
                onClick={() => setBoardScope("ALL")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  boardScope === "ALL"
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Campus Public Board
              </button>
            </div>
          )}
        </div>

        {/* Dropdown Filters and Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border/50">
          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket #, title, or keywords..."
              className="h-8.5 pl-8 text-xs bg-background/80"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8.5 rounded-md border border-border bg-background/80 px-2.5 text-xs text-foreground"
          >
            <option value="ALL">All Categories</option>
            <option value="ACADEMIC">Academic</option>
            <option value="INFRASTRUCTURE">Infrastructure</option>
            <option value="HOSTEL">Hostel</option>
            <option value="HARASSMENT">Harassment & Ragging</option>
            <option value="ADMINISTRATIVE">Administrative</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8.5 rounded-md border border-border bg-background/80 px-2.5 text-xs text-foreground"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* 4. Tickets Grid / List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <RefreshCw className="size-5 animate-spin text-primary" />
            <span>Loading grievance registry...</span>
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-3">
            <div className="size-12 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
              <CheckCircle2 className="size-6 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">No Grievances Found</p>
              <p className="text-muted-foreground">There are no complaints matching your specified filters.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {complaints.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="p-4 hover:bg-muted/30 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Left block: Ticket ID, Subject, Category, Location */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyTicket(ticket.ticketNumber)
                      }}
                      className="font-mono text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                    >
                      {ticket.ticketNumber}
                      {copiedTicket === ticket.ticketNumber ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
                      )}
                    </button>

                    <Badge variant="outline" className="text-[10px] font-semibold">
                      {ticket.category}
                    </Badge>

                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>

                    {ticket.isAnonymous && (
                      <Badge variant="secondary" className="text-[10px] gap-1 text-amber-500 bg-amber-500/10 border-amber-500/20">
                        <Lock className="size-2.5" />
                        Whistleblower Protected
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {ticket.subject}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 className="size-3 text-muted-foreground" />
                      {ticket.department}
                    </span>

                    {ticket.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3 text-muted-foreground" />
                        {ticket.location}
                      </span>
                    )}

                    <span className="flex items-center gap-1">
                      <Calendar className="size-3 text-muted-foreground" />
                      {new Date(ticket.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Right block: Status, Assignee, Inspect button */}
                <div className="flex items-center gap-3 md:gap-4 shrink-0">
                  <div className="text-right space-y-1">
                    <div>{getStatusBadge(ticket.status)}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {ticket.assignedTo ? (
                        <span>Assigned: <strong className="text-foreground">{ticket.assignedTo.name.split(" ")[0]}</strong></span>
                      ) : (
                        <span className="text-amber-500 italic">Unassigned</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTrackTicketInput(ticket.ticketNumber)
                        setShowTrackModal(true)
                        handleTrackTicket(ticket.ticketNumber)
                      }}
                      className="h-8 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10"
                    >
                      Track
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-semibold gap-1 group-hover:border-primary/40 group-hover:bg-primary/5"
                    >
                      Inspect
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      ) : (
        /* ================= SAFETY REPORTS VIEW (HOD / ADMIN) ================= */
        <div className="space-y-5">
          {/* Safety Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Safety Reports
              </span>
              <div className="text-2xl font-bold text-foreground">
                {safetyReports.length}
              </div>
              <div className="text-[11px] text-muted-foreground">Frozen audit snapshots</div>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
              <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">
                Pending Review
              </span>
              <div className="text-2xl font-bold text-amber-500">
                {safetyReports.filter((r) => r.status === "PENDING").length}
              </div>
              <div className="text-[11px] text-muted-foreground">Requires HoD/Admin action</div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">
                Resolved Action
              </span>
              <div className="text-2xl font-bold text-emerald-500">
                {safetyReports.filter((r) => r.status === "RESOLVED").length}
              </div>
              <div className="text-[11px] text-muted-foreground">Disciplinary action applied</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Dismissed
              </span>
              <div className="text-2xl font-bold text-foreground">
                {safetyReports.filter((r) => r.status === "DISMISSED").length}
              </div>
              <div className="text-[11px] text-muted-foreground">Inconclusive / false report</div>
            </div>
          </div>

          {/* Safety Filter Tabs */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card/40">
            <div className="flex items-center gap-1.5">
              {(["ALL", "PENDING", "RESOLVED", "DISMISSED"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setReportFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    reportFilterStatus === st
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {st === "ALL" ? "All Reports" : st === "PENDING" ? "Pending Review" : st === "RESOLVED" ? "Resolved" : "Dismissed"}
                </button>
              ))}
            </div>

            <div className="text-xs text-muted-foreground">
              Showing {safetyReports.filter((r) => reportFilterStatus === "ALL" || r.status === reportFilterStatus).length} report(s)
            </div>
          </div>

          {/* Safety Reports List */}
          {isLoadingReports ? (
            <div className="text-center py-16 text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="size-4 animate-spin text-primary" />
              <span>Loading reported safety incidents...</span>
            </div>
          ) : safetyReports.filter((r) => reportFilterStatus === "ALL" || r.status === reportFilterStatus).length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card/20 space-y-2">
              <ShieldAlert className="size-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-semibold text-foreground">No safety reports found</p>
              <p className="text-xs text-muted-foreground">No direct messaging misuse incidents reported matching this status.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {safetyReports
                .filter((r) => reportFilterStatus === "ALL" || r.status === reportFilterStatus)
                .map((report) => {
                  const reporter = report.reporterId
                  const offender = report.reportedUserId
                  return (
                    <div
                      key={report.id || report._id}
                      className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            report.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse"
                              : report.status === "RESOLVED"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : "bg-muted text-muted-foreground border-border"
                          }`}>
                            {report.status}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            Report ID: #{((report.id || report._id) as string).slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {new Date(report.createdAt).toLocaleString()}
                        </div>
                      </div>

                      {/* Parties involved */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg border border-border bg-muted/30 space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Complainant (Reporter)
                          </span>
                          <div className="font-semibold text-foreground">{reporter?.name || "Student"}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {reporter?.department || "Department"} • Roll: {reporter?.institutionalId || "N/A"}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 space-y-1">
                          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                            Reported Offender
                          </span>
                          <div className="font-semibold text-foreground">{offender?.name || "Reported User"}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {offender?.department || "Department"} • Roll: {offender?.institutionalId || "N/A"}
                          </div>
                        </div>
                      </div>

                      {/* Complaint reason */}
                      <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          Allegation / Incident Reason
                        </span>
                        <p className="text-foreground leading-relaxed">{report.reason}</p>
                      </div>

                      {/* Action trigger */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[11px] text-muted-foreground">
                          {report.resolutionNotes ? `Resolution: ${report.resolutionNotes}` : "Pending administrative investigation"}
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedSafetyReport(report)
                            setReportActionStatus(report.status === "DISMISSED" ? "DISMISSED" : "RESOLVED")
                            setReportResolutionNotes(report.resolutionNotes || "")
                            setBlockUserInConversation(false)
                          }}
                          className="h-8 gap-1.5 text-xs font-semibold"
                        >
                          <ShieldAlert className="size-3.5" />
                          <span>Inspect Forensic Chat & Resolve</span>
                        </Button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* ================= DRAWER: TICKET INSPECTOR & TIMELINE ================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-end p-0">
          <div className="w-full max-w-xl h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/60">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">
                    {selectedTicket.ticketNumber}
                  </span>
                  {getStatusBadge(selectedTicket.status)}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <h2 className="text-sm font-semibold truncate max-w-md text-foreground">
                  {selectedTicket.subject}
                </h2>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTicket(null)}
                aria-label="Close grievance details"
                className="h-7 w-7 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Whistleblower Alert Banner */}
              {selectedTicket.isAnonymous && (
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs flex items-center gap-2.5">
                  <Lock className="size-4 shrink-0" />
                  <div>
                    <strong className="block font-semibold">Whistleblower Identity Concealed</strong>
                    <span>Author identity is protected under campus anti-retaliation and ragging prevention guidelines.</span>
                  </div>
                </div>
              )}

              {/* 5-Stage Visual Stepper */}
              <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Resolution Stage Pipeline
                  </span>
                  <span className="font-bold text-primary text-[11px]">
                    {selectedTicket.stage?.label || selectedTicket.status}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {[
                    { step: 1, label: "Filed" },
                    { step: 2, label: "Review" },
                    { step: 3, label: "Assigned" },
                    { step: 4, label: "Action" },
                    { step: 5, label: "Resolved" },
                  ].map((s) => {
                    const cur = selectedTicket.stage?.step || (selectedTicket.status === "RESOLVED" || selectedTicket.status === "CLOSED" ? 5 : selectedTicket.status === "IN_PROGRESS" ? 4 : selectedTicket.status === "ASSIGNED" ? 3 : selectedTicket.status === "UNDER_REVIEW" ? 2 : 1)
                    const isDone = cur > s.step || (cur === 5 && s.step === 5)
                    const isCurrent = cur === s.step
                    return (
                      <div key={s.step} className="flex flex-col items-center text-center space-y-1">
                        <div
                          className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            isDone
                              ? "bg-emerald-500 text-white"
                              : isCurrent
                              ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isDone ? <Check className="size-3" /> : s.step}
                        </div>
                        <span
                          className={`text-[9px] font-medium leading-tight ${
                            isCurrent
                              ? "text-primary font-bold"
                              : isDone
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Description & Location */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Grievance Description
                </span>
                <p className="text-foreground leading-relaxed p-3 rounded-lg bg-muted/40 border border-border whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Category</span>
                    <p className="font-medium text-foreground">{selectedTicket.category}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Location</span>
                    <p className="font-medium text-foreground">{selectedTicket.location || "General Campus"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Department</span>
                    <p className="font-medium text-foreground">{selectedTicket.department}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Submitter</span>
                    <p className="font-medium text-foreground">
                      {selectedTicket.submittedBy?.name || "Student"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cloudinary Evidence Attachments */}
              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div className="space-y-2">
                  <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Supporting Evidence ({selectedTicket.attachments.length})
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTicket.attachments.map((att, idx) => {
                      const isImg = att.mimeType?.startsWith("image/") || att.url.match(/\.(jpeg|jpg|png|webp)/i)
                      return (
                        <div key={idx} className="p-2 rounded-lg border border-border bg-muted/30 space-y-1.5">
                          {isImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={att.url}
                              alt={att.name}
                              className="h-28 w-full object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(att.url, "_blank")}
                            />
                          ) : (
                            <div className="h-28 flex flex-col items-center justify-center bg-muted/60 rounded text-muted-foreground">
                              <FileText className="size-8 text-primary/70 mb-1" />
                              <span className="text-[10px] px-2 truncate max-w-full">{att.name}</span>
                            </div>
                          )}
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 justify-center"
                          >
                            <ExternalLink className="size-3" />
                            View Evidence
                          </a>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Redressal Lifecycle Timeline */}
              <div className="space-y-3">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Verifiable Audit Timeline
                </span>
                <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {selectedTicket.timeline.map((step, idx) => (
                    <div key={idx} className="relative text-xs space-y-1">
                      {/* Node circle */}
                      <span className="absolute -left-6 top-0.5 size-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                        <span className="size-1.5 rounded-full bg-primary" />
                      </span>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(step.status)}
                        <span className="font-semibold text-foreground">{step.actor.name}</span>
                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 py-0">
                          {step.actor.role}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {new Date(step.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {step.note && (
                        <p className="text-muted-foreground bg-muted/40 p-2.5 rounded-md border border-border/60">
                          {step.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff Action Hub */}
              {isStaff && (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <UserCheck className="size-4" />
                    Administrative Redressal Controls
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      Transition Ticket Status
                    </label>
                    <select
                      value={actionStatus}
                      onChange={(e) => setActionStatus(e.target.value as ComplaintStatus)}
                      className="w-full h-8 text-xs rounded-md border border-border bg-background px-2.5"
                    >
                      <option value="UNDER_REVIEW">UNDER_REVIEW (Awaiting Inspection)</option>
                      <option value="IN_PROGRESS">IN_PROGRESS (Staff Dispatched / Ordered)</option>
                      <option value="RESOLVED">RESOLVED (Action Complete & Tested)</option>
                      <option value="REJECTED">REJECTED (Invalid / Out of Scope)</option>
                      <option value="CLOSED">CLOSED (Archived)</option>
                    </select>

                    <Input
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="Add formal justification or work order summary..."
                      className="h-8 text-xs"
                    />

                    <Button
                      size="sm"
                      onClick={handleUpdateStatus}
                      disabled={isUpdatingStatus}
                      className="w-full h-8 text-xs font-semibold"
                    >
                      {isUpdatingStatus ? "Applying Transition..." : "Update Status & Log Timeline"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Add Progress Note */}
              <form onSubmit={handleAddComment} className="space-y-2 pt-2 border-t border-border">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Post Progress Remark to Audit Trail
                </label>
                <div className="flex gap-2">
                  <Input
                    value={newTimelineComment}
                    onChange={(e) => setNewTimelineComment(e.target.value)}
                    placeholder="Enter remark or diagnostic update..."
                    className="h-8 text-xs"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newTimelineComment.trim() || isAddingComment}
                    className="h-8 px-3 text-xs"
                  >
                    <Send className="size-3.5" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= DRAWER: SAFETY REPORT FORENSIC AUDIT (HOD / ADMIN) ================= */}
      {selectedSafetyReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-end p-0">
          <div className="w-full max-w-xl h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/60">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-rose-500">
                    REPORT #{((selectedSafetyReport.id || selectedSafetyReport._id) as string).slice(-6).toUpperCase()}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    selectedSafetyReport.status === "PENDING"
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      : selectedSafetyReport.status === "RESOLVED"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                      : "bg-muted text-muted-foreground border-border"
                  }`}>
                    {selectedSafetyReport.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Direct Message Misuse Investigation
                </h3>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSafetyReport(null)}
                className="h-8 w-8 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Involved Parties */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg border border-border bg-muted/40 space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Complainant</div>
                  <div className="font-semibold text-foreground">{selectedSafetyReport.reporterId?.name || "Student"}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {selectedSafetyReport.reporterId?.department} • Roll: {selectedSafetyReport.reporterId?.institutionalId || "N/A"}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 space-y-1">
                  <div className="text-[10px] font-bold text-rose-500 uppercase">Reported Offender</div>
                  <div className="font-semibold text-foreground">{selectedSafetyReport.reportedUserId?.name || "Reported User"}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {selectedSafetyReport.reportedUserId?.department} • Roll: {selectedSafetyReport.reportedUserId?.institutionalId || "N/A"}
                  </div>
                </div>
              </div>

              {/* Allegation details */}
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-1 text-xs">
                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                  Alleged Misuse & Notes
                </div>
                <p className="text-foreground leading-relaxed">{selectedSafetyReport.reason}</p>
                <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                  <Clock className="size-3" />
                  Filed: {new Date(selectedSafetyReport.createdAt).toLocaleString()}
                </div>
              </div>

              {/* FORENSIC CHAT LOG EVIDENCE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Lock className="size-3.5 text-primary" />
                    Forensic Chat Evidence (Frozen Snapshot)
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Tamper-Proof
                  </Badge>
                </div>

                {(() => {
                  let messages: any[] = []
                  try {
                    if (selectedSafetyReport.contextSnapshot) {
                      messages = JSON.parse(selectedSafetyReport.contextSnapshot)
                    }
                  } catch {
                    messages = []
                  }

                  if (!Array.isArray(messages) || messages.length === 0) {
                    return (
                      <div className="p-4 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                        No previous messages were logged in this thread snapshot.
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-2 p-3 rounded-xl border border-border bg-card/60 max-h-64 overflow-y-auto">
                      {messages.map((msg: any, idx: number) => {
                        const isOffender = msg.id === selectedSafetyReport.reportedUserId?.institutionalId || msg.sender === selectedSafetyReport.reportedUserId?.name
                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                              isOffender
                                ? "border-rose-500/30 bg-rose-500/5 ml-4"
                                : "border-border bg-muted/40 mr-4"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className={`font-semibold ${isOffender ? "text-rose-500" : "text-foreground"}`}>
                                {msg.sender || "User"} ({msg.role || "MEMBER"})
                              </span>
                              <span className="text-muted-foreground">
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                              </span>
                            </div>
                            <p className="text-foreground">{msg.content || "[Empty message body]"}</p>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>

              {/* Resolution Info (if already resolved) */}
              {selectedSafetyReport.resolutionNotes && (
                <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs space-y-1">
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    Past Administrative Resolution
                  </div>
                  <p className="text-foreground">{selectedSafetyReport.resolutionNotes}</p>
                  {selectedSafetyReport.resolvedAt && (
                    <div className="text-[10px] text-muted-foreground pt-1">
                      Resolved: {new Date(selectedSafetyReport.resolvedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Administrative Triage Action Form */}
              <div className="p-3 rounded-xl border border-border bg-card/80 space-y-3 pt-3">
                <div className="text-xs font-bold text-foreground">
                  Administrative Redressal Action
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground">Status Decision</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setReportActionStatus("RESOLVED")}
                      className={`p-2 rounded-lg border text-center transition-colors ${
                        reportActionStatus === "RESOLVED"
                          ? "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Resolve / Disciplinary Action
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportActionStatus("DISMISSED")}
                      className={`p-2 rounded-lg border text-center transition-colors ${
                        reportActionStatus === "DISMISSED"
                          ? "border-muted-foreground bg-muted font-semibold text-foreground"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Dismiss (False Alarm)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Action Notes / Disciplinary Justification *</label>
                  <textarea
                    value={reportResolutionNotes}
                    onChange={(e) => setReportResolutionNotes(e.target.value)}
                    placeholder="Enter formal disciplinary note, verbal warning summary, or investigation finding..."
                    rows={3}
                    className="w-full text-xs rounded-md border border-input bg-background p-2.5 text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="blockConversationCheck"
                    checked={blockUserInConversation}
                    onChange={(e) => setBlockUserInConversation(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary size-4"
                  />
                  <label htmlFor="blockConversationCheck" className="text-xs font-medium text-foreground cursor-pointer">
                    Block thread between these users (Sets conversation to BLOCKED)
                  </label>
                </div>

                <Button
                  size="sm"
                  onClick={handleUpdateSafetyReport}
                  disabled={isUpdatingReport}
                  className="w-full h-8 text-xs font-semibold gap-1.5"
                >
                  <Check className="size-3.5" />
                  {isUpdatingReport ? "Logging Action..." : "Confirm & Record Resolution"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: FILE GRIEVANCE / WHISTLEBLOWER ================= */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="complaint-modal-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <LifeBuoy className="size-5 text-primary" aria-hidden="true" />
                <h3 id="complaint-modal-title" className="text-sm font-semibold">File Formal Grievance</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close grievance dialog"
                className="h-7 w-7 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>

            {formError && (
              <div role="alert" className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateComplaint} className="space-y-3.5">
              {/* Subject */}
              <div className="space-y-1">
                <label htmlFor="complaint-subject" className="text-xs font-semibold">Grievance Subject *</label>
                <Input
                  id="complaint-subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Broken monitor in Lab 3 or Timetable slot collision"
                  className="h-8.5 text-xs"
                  required
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="complaint-category" className="text-xs font-semibold">Category *</label>
                  <select
                    id="complaint-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ComplaintCategory)}
                    className="w-full h-8.5 text-xs rounded-md border border-border bg-background px-2.5"
                  >
                    <option value="INFRASTRUCTURE">Infrastructure & Labs</option>
                    <option value="ACADEMIC">Academic & Syllabus</option>
                    <option value="HOSTEL">Hostel & Amenities</option>
                    <option value="HARASSMENT">Harassment & Ragging</option>
                    <option value="ADMINISTRATIVE">Administrative & Fees</option>
                    <option value="OTHER">Other Issues</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="complaint-priority" className="text-xs font-semibold">Priority</label>
                  <select
                    id="complaint-priority"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as ComplaintPriority)}
                    className="w-full h-8.5 text-xs rounded-md border border-border bg-background px-2.5"
                  >
                    <option value="LOW">Low (General suggestion)</option>
                    <option value="MEDIUM">Medium (Standard issue)</option>
                    <option value="HIGH">High (Impacts classroom/lab)</option>
                    <option value="URGENT">Urgent (Safety / Harassment)</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label htmlFor="complaint-location" className="text-xs font-semibold">Location / Specific Area</label>
                <Input
                  id="complaint-location"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. CCF Lab 3, Row D or Classroom C-204"
                  className="h-8.5 text-xs"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label htmlFor="complaint-description" className="text-xs font-semibold">Detailed Description *</label>
                <textarea
                  id="complaint-description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the issue, frequency, and impact on students..."
                  rows={4}
                  className="w-full text-xs rounded-md border border-border bg-background p-2.5 resize-none"
                  required
                />
              </div>

              {/* Anonymous Whistleblower Switch */}
              <div
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  isAnonymous
                    ? "border-amber-500 bg-amber-500/10 text-amber-500"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4" />
                    <span className="text-xs font-semibold">File as Confidential Whistleblower</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="size-4 accent-amber-500"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Your identity is encrypted. Your name and roll number will be concealed from all teachers and department staff. Only ticket details are visible.
                </p>
              </div>

              {/* Cloudinary Evidence Attachment - MANDATORY */}
              <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold flex items-center gap-1">
                    <span>Supporting Evidence Attachment</span>
                    <span className="text-destructive font-bold">*</span>
                  </label>
                  <Badge
                    variant={stagedAttachments.length > 0 ? "outline" : "destructive"}
                    className="text-[10px] py-0"
                  >
                    {stagedAttachments.length > 0 ? `${stagedAttachments.length} Evidence Attached` : "Mandatory Proof Required"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Grievances require verified photo, diagnostic screenshot, or document proof to be processed by administrative authorities.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full h-9 text-xs gap-2 border-dashed ${
                    stagedAttachments.length === 0
                      ? "border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 text-foreground"
                      : "border-border bg-background"
                  }`}
                >
                  <Paperclip className={`size-3.5 ${isUploading ? "animate-spin text-primary" : ""}`} />
                  {isUploading ? "Uploading to Cloudinary..." : "Upload Evidence Photo / Document *"}
                </Button>

                {stagedAttachments.length === 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" />
                    Please upload at least 1 image or document to enable grievance submission.
                  </p>
                )}

                {stagedAttachments.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {stagedAttachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-background border border-border text-xs">
                        <div className="flex items-center gap-2 truncate max-w-xs">
                          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{att.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setStagedAttachments(stagedAttachments.filter((_, i) => i !== idx))}
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="h-8.5 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || isUploading || stagedAttachments.length === 0}
                  className="h-8.5 text-xs font-semibold"
                >
                  {isSubmitting ? "Registering..." : "Submit Grievance Ticket"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TRACK GRIEVANCE (STUDENT / WHISTLEBLOWER LOOKUP) ================= */}
      {showTrackModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="track-modal-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Search className="size-5 text-primary" aria-hidden="true" />
                <div>
                  <h3 id="track-modal-title" className="text-sm font-bold text-foreground">
                    Track Grievance & Whistleblower Status
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Live stage verification, assigned grievance handler, and audit trail.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowTrackModal(false)
                  setTrackedTicketData(null)
                  setTrackError(null)
                }}
                aria-label="Close tracking dialog"
                className="h-7 w-7 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Ticket Search Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleTrackTicket()
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={trackTicketInput}
                  onChange={(e) => setTrackTicketInput(e.target.value)}
                  placeholder="Enter Ticket ID (e.g. TKT-202609-4821)..."
                  className="pl-9 text-xs h-9 font-mono"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={!trackTicketInput.trim() || isTracking}
                className="h-9 px-4 text-xs font-semibold gap-1.5"
              >
                {isTracking ? <RefreshCw className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
                Track Ticket
              </Button>
            </form>

            {/* Error Message */}
            {trackError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{trackError}</span>
              </div>
            )}

            {/* Found Grievance Ticket Data */}
            {trackedTicketData && (
              <div className="space-y-4 pt-2 border-t border-border">
                {/* Header Card */}
                <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                        #{trackedTicketData.ticketNumber}
                      </span>
                      {getStatusBadge(trackedTicketData.status)}
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {trackedTicketData.category}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Logged {new Date(trackedTicketData.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-foreground">
                    {trackedTicketData.subject}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {trackedTicketData.description}
                  </p>
                </div>

                {/* 5-Stage Stepper */}
                <div className="p-3.5 rounded-xl border border-border bg-card space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                      Live Resolution Stage
                    </span>
                    <span className="font-bold text-primary text-[11px]">
                      {trackedTicketData.stage?.label || trackedTicketData.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {[
                      { step: 1, label: "Filed" },
                      { step: 2, label: "Review" },
                      { step: 3, label: "Assigned" },
                      { step: 4, label: "In Action" },
                      { step: 5, label: "Resolved" },
                    ].map((s) => {
                      const cur = trackedTicketData.stage?.step || (trackedTicketData.status === "RESOLVED" || trackedTicketData.status === "CLOSED" ? 5 : trackedTicketData.status === "IN_PROGRESS" ? 4 : trackedTicketData.status === "ASSIGNED" ? 3 : trackedTicketData.status === "UNDER_REVIEW" ? 2 : 1)
                      const isDone = cur > s.step || (cur === 5 && s.step === 5)
                      const isCurrent = cur === s.step
                      return (
                        <div key={s.step} className="flex flex-col items-center text-center space-y-1">
                          <div
                            className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                              isDone
                                ? "bg-emerald-500 text-white"
                                : isCurrent
                                ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isDone ? <Check className="size-3" /> : s.step}
                        </div>
                        <span
                          className={`text-[9px] font-medium leading-tight ${
                            isCurrent
                              ? "text-primary font-bold"
                              : isDone
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

                {/* Handler Details & Department */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg border border-border bg-muted/20 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Department</span>
                    <p className="font-semibold text-foreground">{trackedTicketData.department}</p>
                    {trackedTicketData.location && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-3 text-rose-500" />
                        {trackedTicketData.location}
                      </p>
                    )}
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-muted/20 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Assigned Officer</span>
                    <p className="font-semibold text-foreground">
                      {trackedTicketData.assignedTo?.name || "Pending Officer Assignment"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {trackedTicketData.assignedTo ? trackedTicketData.assignedTo.role : "Under queue review"}
                    </p>
                  </div>
                </div>

                {/* Verifiable Audit Timeline */}
                <div className="space-y-2">
                  <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Timeline & History ({trackedTicketData.timeline?.length || 0})
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-2.5 p-2 rounded-lg border border-border bg-muted/10 text-xs">
                    {trackedTicketData.timeline?.map((step, idx) => (
                      <div key={idx} className="p-2 rounded bg-card border border-border/60 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-foreground">{step.actor?.name || "System"}</span>
                          <span className="text-muted-foreground text-[10px]">
                            {new Date(step.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {step.note && <p className="text-muted-foreground text-xs">{step.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Student Follow-Up Remark Composer */}
                {trackedTicketData.status !== "RESOLVED" && trackedTicketData.status !== "CLOSED" && (
                  <form onSubmit={handleStudentSubmitFollowup} className="space-y-2 pt-2 border-t border-border">
                    <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                      <Send className="size-3 text-primary" />
                      Post Student Follow-Up / Additional Clarification
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={trackFollowupNote}
                        onChange={(e) => setTrackFollowupNote(e.target.value)}
                        placeholder="Append message, additional details, or questions..."
                        className="h-8.5 text-xs"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!trackFollowupNote.trim() || isSubmittingFollowup}
                        className="h-8.5 px-3 text-xs font-semibold"
                      >
                        {isSubmittingFollowup ? "Posting..." : "Send Note"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
