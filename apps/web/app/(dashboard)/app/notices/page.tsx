"use client"

import * as React from "react"
import {
  Bell,
  Clock,
  Filter,
  PlusCircle,
  Search,
  CheckCircle2,
  Trash2,
  X,
  FileText,
  User,
  Users,
  Eye,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/shared/page-header"
import { PriorityBadge } from "@/components/shared/priority-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { NoticeDTO, NoticePriority, NoticeCategory } from "@nexora/types"

const CATEGORIES: { label: string; value: string }[] = [
  { label: "All Categories", value: "ALL" },
  { label: "Academic", value: "ACADEMIC" },
  { label: "Examination", value: "EXAMINATION" },
  { label: "Placement & T&P", value: "PLACEMENT" },
  { label: "Administrative", value: "ADMINISTRATIVE" },
  { label: "Sports & Cult", value: "SPORTS" },
  { label: "Urgent Campus", value: "URGENT" },
]

export default function NoticeBoardPage() {
  const { user } = useAuth()
  const isStaff = user?.role === "FACULTY" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"

  const [notices, setNotices] = React.useState<NoticeDTO[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("ALL")
  const [selectedPriority, setSelectedPriority] = React.useState("ALL")

  // Publish Dialog State
  const [showPublishModal, setShowPublishModal] = React.useState(false)
  const [publishing, setPublishing] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState("")
  const [newContent, setNewContent] = React.useState("")
  const [newSummary, setNewSummary] = React.useState("")
  const [newPriority, setNewPriority] = React.useState<NoticePriority>("NORMAL")
  const [newCategory, setNewCategory] = React.useState<NoticeCategory>("ACADEMIC")
  const [publishFeedback, setPublishFeedback] = React.useState<string | null>(null)

  // Notice reading modal
  const [readingNotice, setReadingNotice] = React.useState<NoticeDTO | null>(null)

  const fetchNotices = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.get<{ notices?: NoticeDTO[] } | NoticeDTO[]>("/notices")
      const list = Array.isArray(data) ? data : data.notices || []
      setNotices(list)
    } catch {
      // Handle network error
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchNotices()
  }, [fetchNotices])

  // Accessible Escape key listener to close modals
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showPublishModal) setShowPublishModal(false)
        if (readingNotice) setReadingNotice(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showPublishModal, readingNotice])

  const handleMarkAsRead = async (noticeId: string) => {
    try {
      await apiClient.patch(`/notices/${noticeId}/read`)
      setNotices((prev) =>
        prev.map((n) =>
          n.id === noticeId
            ? { ...n, hasRead: true, readCount: (n.readCount || 0) + 1 }
            : n
        )
      )
    } catch {
      // Ignore network errors
    }
  }

  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm("Are you sure you want to retract this campus notice?")) return
    try {
      await apiClient.delete(`/notices/${noticeId}`)
      setNotices((prev) => prev.filter((n) => n.id !== noticeId))
      if (readingNotice?.id === noticeId) setReadingNotice(null)
    } catch {
      // Ignore network errors
    }
  }

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPublishing(true)
    setPublishFeedback(null)

    try {
      await apiClient.post("/notices", {
        title: newTitle,
        content: newContent,
        summary: newSummary || undefined,
        priority: newPriority,
        category: newCategory,
        targetAudience: {
          roles: ["STUDENT", "FACULTY"],
          departments: [user?.department || "Campus Wide"],
        },
      })

      setShowPublishModal(false)
      setNewTitle("")
      setNewContent("")
      setNewSummary("")
      fetchNotices()
    } catch (err: any) {
      setPublishFeedback(err.message || "Failed to publish notice")
    } finally {
      setPublishing(false)
    }
  }

  // Filter notices
  const filteredNotices = notices.filter((n) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      n.title.toLowerCase().includes(q) ||
      (n.summary && n.summary.toLowerCase().includes(q)) ||
      (n.content && n.content.toLowerCase().includes(q)) ||
      (n.author && n.author.name.toLowerCase().includes(q))

    const matchesCategory = selectedCategory === "ALL" || n.category === selectedCategory
    const matchesPriority = selectedPriority === "ALL" || n.priority === selectedPriority

    return matchesSearch && matchesCategory && matchesPriority
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Notice Board"
        description="Official verified academic, examination, placement, and administrative circulars."
        badge={
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold">
            <Bell className="h-3 w-3 mr-1" />
            Live Bulletin Grid
          </Badge>
        }
      >
        {isStaff && (
          <Button
            size="sm"
            onClick={() => setShowPublishModal(true)}
            className="text-xs font-semibold"
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Publish New Notice
          </Button>
        )}
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars by keyword, topic, or faculty author..."
              className="pl-8 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="IMPORTANT">Important</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notice Cards List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          Loading institutional notices...
        </div>
      ) : filteredNotices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notices match your filters"
          description="Try broadening your search term or selecting 'All Categories'."
        />
      ) : (
        <div className="space-y-3.5">
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className={`rounded-lg border bg-card p-4 space-y-3 transition-all hover:shadow-sm ${
                notice.priority === "CRITICAL"
                  ? "border-rose-500/40 bg-rose-500/5 dark:bg-rose-950/10"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <PriorityBadge priority={notice.priority} />
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {notice.category}
                  </Badge>
                  {notice.hasRead && (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="h-3 w-3" /> Read
                    </span>
                  )}
                </div>

                <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  {new Date(notice.publishedAt || notice.createdAt).toLocaleDateString()} at{" "}
                  {new Date(notice.publishedAt || notice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div>
                <h3
                  onClick={() => setReadingNotice(notice)}
                  className="text-sm font-bold text-foreground hover:text-primary cursor-pointer leading-snug"
                >
                  {notice.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {notice.summary || notice.content}
                </p>
              </div>

              {/* Target Audience Tags */}
              {notice.targetAudience?.departments && notice.targetAudience.departments.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
                  <span className="font-semibold text-foreground/80">Target Depts:</span>
                  {notice.targetAudience.departments.map((dept, i) => (
                    <span key={i} className="px-1.5 py-0.2 rounded bg-muted text-[10px]">
                      {dept}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <div className="text-[11px] text-muted-foreground">
                  By <strong className="text-foreground">{notice.author.name}</strong> • {notice.author.department}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReadingNotice(notice)
                      handleMarkAsRead(notice.id)
                    }}
                    className="h-7 text-xs font-semibold text-primary hover:text-primary"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                  </Button>

                  {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || notice.author.id === user?.id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNotice(notice.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish Notice Modal */}
      {showPublishModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-notice-title"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 id="publish-notice-title" className="text-base font-bold text-foreground flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                Publish Campus Notice
              </h2>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                aria-label="Close publish notice dialog"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {publishFeedback && (
              <div role="alert" className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {publishFeedback}
              </div>
            )}

            <form onSubmit={handlePublishSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label htmlFor="notice-title" className="font-semibold text-foreground">Notice Title *</label>
                <Input
                  id="notice-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Schedule for Mid-Term Examination Verification"
                  className="text-xs h-8.5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label htmlFor="notice-category" className="font-semibold text-foreground">Category</label>
                  <select
                    id="notice-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as NoticeCategory)}
                    className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="ACADEMIC">Academic</option>
                    <option value="EXAMINATION">Examination</option>
                    <option value="PLACEMENT">Placement & T&P</option>
                    <option value="ADMINISTRATIVE">Administrative</option>
                    <option value="SPORTS">Sports & Cult</option>
                    <option value="URGENT">Urgent Campus</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="notice-priority" className="font-semibold text-foreground">Priority</label>
                  <select
                    id="notice-priority"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as NoticePriority)}
                    className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="HIGH">High Priority</option>
                    <option value="CRITICAL">Critical Alert</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="notice-summary" className="font-semibold text-foreground">Executive Summary</label>
                <Input
                  id="notice-summary"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Brief 1-sentence overview for push notifications"
                  className="text-xs h-8.5"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="notice-content" className="font-semibold text-foreground">Full Notice Content *</label>
                <textarea
                  id="notice-content"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Enter full circular details, room allocations, instructions..."
                  className="w-full h-28 rounded-md border border-input bg-background p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPublishModal(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={publishing}
                  className="text-xs h-8 font-semibold"
                >
                  {publishing ? "Publishing Circular..." : "Publish to Grid"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notice Reader Dialog */}
      {readingNotice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reading-notice-title"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <PriorityBadge priority={readingNotice.priority} />
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {readingNotice.category}
                  </Badge>
                </div>
                <h2 id="reading-notice-title" className="text-base font-bold text-foreground leading-snug">
                  {readingNotice.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setReadingNotice(null)}
                aria-label="Close notice details"
                className="text-muted-foreground hover:text-foreground shrink-0 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>Published by: <strong className="text-foreground">{readingNotice.author.name}</strong></span>
                <span>{new Date(readingNotice.publishedAt || readingNotice.createdAt).toLocaleDateString()}</span>
              </div>
              <div>Department: <strong className="text-foreground">{readingNotice.author.department}</strong></div>
            </div>

            <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap py-2">
              {readingNotice.content}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Verified read by {readingNotice.readCount || 1} campus members
              </span>
              <Button
                size="sm"
                onClick={() => {
                  handleMarkAsRead(readingNotice.id)
                  setReadingNotice(null)
                }}
                className="text-xs h-8 font-semibold"
              >
                Close & Acknowledge
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
