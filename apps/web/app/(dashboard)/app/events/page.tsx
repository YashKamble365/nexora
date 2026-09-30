"use client"

import * as React from "react"
import {
  Calendar,
  Clock,
  MapPin,
  PlusCircle,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  Ticket,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { EventDTO } from "@nexora/types"

const EVENT_CATEGORIES = [
  "ALL",
  "Technical Symposium",
  "Workshop",
  "Hackathon",
  "Guest Lecture",
  "Cultural & Sports",
]

export default function CampusEventsPage() {
  const { user } = useAuth()
  const isStaff = user?.role === "FACULTY" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"

  const [events, setEvents] = React.useState<EventDTO[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("ALL")
  const [eventTab, setEventTab] = React.useState<"ALL" | "MY_RSVPS">("ALL")
  const [actionInProgressId, setActionInProgressId] = React.useState<string | null>(null)
  const [feedback, setFeedback] = React.useState<string | null>(null)

  // Create Event Modal State
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [category, setCategory] = React.useState("Workshop")
  const [venue, setVenue] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [registrationDeadline, setRegistrationDeadline] = React.useState("")
  const [capacity, setCapacity] = React.useState(60)

  // Attendee Roster State
  const [showAttendeesModal, setShowAttendeesModal] = React.useState(false)
  const [attendeeData, setAttendeeData] = React.useState<{ eventId: string; eventTitle: string; capacity: number; registeredCount: number; attendees: any[] } | null>(null)
  const [loadingAttendees, setLoadingAttendees] = React.useState(false)

  const fetchEvents = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.get<{ events?: EventDTO[] }>("/events")
      setEvents(data.events || [])
    } catch {
      // Handle network error
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Accessible Escape key listener to close modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showCreateModal) setShowCreateModal(false)
        if (showAttendeesModal) setShowAttendeesModal(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showCreateModal, showAttendeesModal])

  const handleRegister = async (eventId: string) => {
    setActionInProgressId(eventId)
    setFeedback(null)
    try {
      const data = await apiClient.post<any>(`/events/${eventId}/register`)
      setFeedback(data.message)
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, isRegistered: true, registeredCount: (e.registeredCount || 0) + 1 }
            : e
        )
      )
    } catch (err: any) {
      setFeedback(err.message || "Network error registering for event")
    } finally {
      setActionInProgressId(null)
    }
  }

  const handleUnregister = async (eventId: string) => {
    setActionInProgressId(eventId)
    setFeedback(null)
    try {
      const data = await apiClient.post<any>(`/events/${eventId}/unregister`)
      setFeedback(data.message)
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, isRegistered: false, registeredCount: Math.max(0, (e.registeredCount || 1) - 1) }
            : e
        )
      )
    } catch (err: any) {
      setFeedback(err.message || "Failed to cancel event registration")
    } finally {
      setActionInProgressId(null)
    }
  }

  const handleViewAttendees = async (eventId: string) => {
    setLoadingAttendees(true)
    setShowAttendeesModal(true)
    setAttendeeData(null)
    try {
      const data = await apiClient.get<any>(`/events/${eventId}/attendees`)
      setAttendeeData(data)
    } catch (err: any) {
      setFeedback(err.message || "Failed to load attendees roster")
      setShowAttendeesModal(false)
    } finally {
      setLoadingAttendees(false)
    }
  }

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to retract and cancel "${eventTitle}"?`)) return
    try {
      const data = await apiClient.delete<any>(`/events/${eventId}`)
      setFeedback(data.message || `Event "${eventTitle}" retracted.`)
      setEvents((prev) => prev.filter((e) => e.id !== eventId))
    } catch (err: any) {
      setFeedback(err.message || "Failed to cancel event")
    }
  }

  const exportAttendeesCSV = () => {
    if (!attendeeData || !attendeeData.attendees.length) return
    const headers = ["Student Name,Institutional Roll,Department,Academic Year,Email"]
    const rows = attendeeData.attendees.map((a: any) =>
      `"${a.name || ""}","${a.institutionalId || a.rollNumber || ""}","${a.department || ""}","${a.academicYear || ""}","${a.email || ""}"`
    )
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${(attendeeData.eventTitle || "event").replace(/[^a-zA-Z0-9]/g, "_")}_roster.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)

    if (!title.trim() || title.trim().length < 3) {
      setCreateError("Event title must be at least 3 characters.")
      return
    }
    if (!description.trim() || description.trim().length < 5) {
      setCreateError("Event description must be at least 5 characters.")
      return
    }
    if (!venue.trim()) {
      setCreateError("Venue / location is required.")
      return
    }
    if (Number(capacity) < 1) {
      setCreateError("Capacity must be at least 1 attendee.")
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const deadline = new Date(registrationDeadline)

    if (!startDate || isNaN(start.getTime())) {
      setCreateError("Please select a valid event start date and time.")
      return
    }
    if (!endDate || isNaN(end.getTime())) {
      setCreateError("Please select a valid event end date and time.")
      return
    }
    if (end < start) {
      setCreateError("Event end time cannot be before event start time.")
      return
    }
    if (!registrationDeadline || isNaN(deadline.getTime())) {
      setCreateError("Please select a valid registration deadline.")
      return
    }

    setCreating(true)
    setFeedback(null)

    try {
      const data = await apiClient.post<any>("/events", {
        title: title.trim(),
        description: description.trim(),
        category,
        venue: venue.trim(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        registrationDeadline: deadline.toISOString(),
        capacity: Number(capacity),
      })

      setShowCreateModal(false)
      setTitle("")
      setDescription("")
      setVenue("")
      setStartDate("")
      setEndDate("")
      setRegistrationDeadline("")
      setCreateError(null)
      setFeedback(data.message || "Event announced on campus grid!")
      if (data.event) {
        setEvents((prev) => [data.event, ...prev])
      }
    } catch (err: any) {
      setCreateError(err.message || "Failed to host event")
    } finally {
      setCreating(false)
    }
  }

  const filteredEvents = events.filter((ev) => {
    if (eventTab === "MY_RSVPS" && !ev.isRegistered) {
      return false
    }

    const q = searchQuery.toLowerCase()
    const matchesSearch =
      ev.title.toLowerCase().includes(q) ||
      ev.description.toLowerCase().includes(q) ||
      ev.venue.toLowerCase().includes(q)

    const matchesCategory = selectedCategory === "ALL" || ev.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Technical Events & Workshops"
        description="Explore innovation symposiums, hands-on masterclasses, and project hackathons."
        badge={
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold">
            <Calendar className="h-3 w-3 mr-1" />
            Events Grid
          </Badge>
        }
      >
        {isStaff && (
          <Button
            size="sm"
            onClick={() => {
              setCreateError(null)
              setShowCreateModal(true)
            }}
            className="text-xs font-semibold"
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Host New Event
          </Button>
        )}
      </PageHeader>

      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search and Category Filters */}
      <div className="space-y-3">
        {/* Student View Scope Switcher */}
        {user?.role === "STUDENT" && (
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg text-xs self-start w-fit">
            <button
              type="button"
              onClick={() => setEventTab("ALL")}
              className={`px-3 py-1 rounded-md transition-colors ${
                eventTab === "ALL"
                  ? "bg-background text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Events ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setEventTab("MY_RSVPS")}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                eventTab === "MY_RSVPS"
                  ? "bg-background text-foreground font-semibold shadow-xs text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Ticket className="size-3" />
              My RSVPs / Passes ({events.filter((e) => e.isRegistered).length})
            </button>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title, venue, or technology..."
            className="pl-8 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {EVENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {cat === "ALL" ? "All Formats" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Event Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          Loading upcoming campus events...
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={eventTab === "MY_RSVPS" ? "No RSVP passes secured" : "No events scheduled"}
          description={
            eventTab === "MY_RSVPS"
              ? "You have not registered for any upcoming events yet. Browse 'All Events' to claim your pass."
              : "Check back later for new workshops and technical symposiums."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((ev) => {
            const registered = ev.registeredCount || 0
            const percentFilled = Math.min(100, Math.round((registered / ev.capacity) * 100))
            const isFull = registered >= ev.capacity
            const isDeadlinePassed = new Date() > new Date(ev.registrationDeadline)
            const isPastEvent = new Date(ev.endDate) < new Date() || ev.status === "COMPLETED"

            return (
              <div
                key={ev.id}
                className="rounded-lg border border-border bg-card p-4 space-y-3 flex flex-col justify-between shadow-sm hover:border-primary/40 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {ev.category}
                      </Badge>
                      {isPastEvent && (
                        <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">
                          Concluded
                        </Badge>
                      )}
                      {ev.isRegistered && (
                        <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                          Pass Secured
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                      <Clock className="h-3 w-3" />
                      {new Date(ev.startDate).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-foreground leading-snug">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="space-y-1 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>
                        {new Date(ev.startDate).toLocaleDateString()} at{" "}
                        {new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      <span>{ev.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Capacity Progress Bar and Register Action */}
                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">
                      {registered} / {ev.capacity} Attendees Registered
                    </span>
                    <span
                      className={`font-bold ${
                        isFull ? "text-rose-600" : percentFilled > 80 ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {isFull ? "Full Capacity" : `${ev.capacity - registered} Seats Left`}
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        isFull
                          ? "bg-rose-500"
                          : percentFilled > 80
                          ? "bg-amber-500"
                          : "bg-primary"
                      }`}
                      style={{ width: `${percentFilled}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      Organized by <strong className="text-foreground">{ev.organizer?.name}</strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isStaff && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAttendees(ev.id)}
                            className="h-8 text-xs font-semibold px-2.5 flex items-center gap-1"
                          >
                            <Users className="h-3.5 w-3.5 text-primary" />
                            <span>Roster ({registered})</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEvent(ev.id, ev.title)}
                            className="h-8 text-xs text-muted-foreground hover:text-destructive px-2"
                            title="Retract event"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      {user?.role === "STUDENT" && (
                        ev.isRegistered ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded">
                              <CheckCircle2 className="h-3.5 w-3.5" /> RSVP Confirmed
                            </span>
                            {!isPastEvent && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnregister(ev.id)}
                                disabled={actionInProgressId === ev.id}
                                className="h-7 text-[11px] text-muted-foreground hover:text-destructive"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        ) : isPastEvent ? (
                          <Badge variant="outline" className="text-xs bg-muted text-muted-foreground px-2 py-1">
                            Event Concluded
                          </Badge>
                        ) : isDeadlinePassed ? (
                          <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-2 py-1">
                            Registration Closed
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isFull || actionInProgressId === ev.id}
                            onClick={() => handleRegister(ev.id)}
                            className="h-8 text-xs font-semibold px-3"
                          >
                            {actionInProgressId === ev.id
                              ? "Securing Pass..."
                              : isFull
                              ? "Sold Out"
                              : "Register Pass"}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Host New Event Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-event-title"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 id="create-event-title" className="text-base font-bold text-foreground flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                Host Campus Event / Workshop
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close create event dialog"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              {createError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{createError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="event-title" className="font-semibold text-foreground">Event Title *</label>
                <Input
                  id="event-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Next-Gen Cloud Architecture Masterclass"
                  className="text-xs h-8.5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label htmlFor="event-category" className="font-semibold text-foreground">Event Category</label>
                  <select
                    id="event-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Technical Symposium">Technical Symposium</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Guest Lecture">Guest Lecture</option>
                    <option value="Cultural & Sports">Cultural & Sports</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="event-capacity" className="font-semibold text-foreground">Capacity (Seats) *</label>
                  <Input
                    id="event-capacity"
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    min={1}
                    className="text-xs h-8.5"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="event-venue" className="font-semibold text-foreground">Venue / Location *</label>
                <Input
                  id="event-venue"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Central Computing Facility Lab 4 or Auditorium"
                  className="text-xs h-8.5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label htmlFor="event-start-date" className="font-semibold text-foreground">Start Date & Time *</label>
                  <Input
                    id="event-start-date"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs h-8.5"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="event-end-date" className="font-semibold text-foreground">End Date & Time *</label>
                  <Input
                    id="event-end-date"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs h-8.5"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="event-rsvp-deadline" className="font-semibold text-foreground">RSVP Registration Deadline *</label>
                <Input
                  id="event-rsvp-deadline"
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className="text-xs h-8.5"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="event-description" className="font-semibold text-foreground">Event Description & Requirements *</label>
                <textarea
                  id="event-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed schedule, prerequisites, student eligibility..."
                  className="w-full h-24 rounded-md border border-input bg-background p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={creating}
                  className="text-xs h-8 font-semibold"
                >
                  {creating ? "Announcing Event..." : "Publish Event"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Event Attendees Roster Modal */}
      {showAttendeesModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" />
                  Registered Applicants Roster
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {attendeeData?.eventTitle} • {attendeeData?.attendees?.length || 0} registered
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportAttendeesCSV}
                  className="text-xs h-8"
                  disabled={!attendeeData?.attendees?.length}
                >
                  Export CSV
                </Button>
                <button
                  type="button"
                  onClick={() => setShowAttendeesModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingAttendees ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Synchronizing applicant roster...
                </div>
              ) : !attendeeData?.attendees?.length ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No registrations recorded for this event yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Roll / ID</th>
                        <th className="py-2.5 px-3">Department & Year</th>
                        <th className="py-2.5 px-3">Contact Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {attendeeData.attendees.map((att: any) => (
                        <tr key={att._id || att.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-semibold text-foreground">
                            {att.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium">
                            {att.institutionalId || att.rollNumber || "—"}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {att.department || "Campus"} {att.academicYear ? `(${att.academicYear})` : ""}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground font-mono">
                            {att.email}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
