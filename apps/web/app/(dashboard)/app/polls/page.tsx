"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth-context"
import {
  PollDTO,
  FeedbackDTO,
  Role,
  SurveyDTO,
  SurveyQuestion,
  SurveyQuestionType,
  SurveyAnalyticsDTO,
  COAttainmentItem,
} from "@nexora/types"
import {
  Vote,
  CheckCircle2,
  Clock,
  Plus,
  BarChart3,
  Users,
  Lock,
  Calendar,
  Sparkles,
  Star,
  MessageSquare,
  AlertCircle,
  Building2,
  GraduationCap,
  X,
  Check,
  Send,
  RefreshCw,
  Flame,
  BookOpen,
  Award,
  Layers,
  ClipboardCheck,
  ArrowRight,
  HelpCircle,
  ChevronRight,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { apiClient, getApiBase } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function PollsPage() {
  const { user } = useAuth()
  const isStaff = ["FACULTY", "ADMIN", "SUPER_ADMIN"].includes(user?.role || "")
  const isFaculty = user?.role === "FACULTY"
  const isHod = isFaculty && user?.facultyRole === "HOD"

  // 1. Core State
  const [polls, setPolls] = React.useState<PollDTO[]>([])
  const [surveys, setSurveys] = React.useState<SurveyDTO[]>([])
  const [feedbacks, setFeedbacks] = React.useState<FeedbackDTO[]>([])
  const [activeTab, setActiveTab] = React.useState<
    "SURVEYS" | "ACTIVE" | "MY_POLLS" | "VOTED" | "CLOSED" | "FEEDBACK"
  >("SURVEYS")
  const [isLoading, setIsLoading] = React.useState(true)

  // 2. Voting state (pollId -> selectedOptionIds)
  const [stagedVotes, setStagedVotes] = React.useState<{ [pollId: string]: string[] }>({})
  const [isSubmittingVote, setIsSubmittingVote] = React.useState<{ [pollId: string]: boolean }>({})

  // 3. Modals & Drawers
  const [showCreatePollModal, setShowCreatePollModal] = React.useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = React.useState(false)
  const [showCreateSurveyModal, setShowCreateSurveyModal] = React.useState(false)
  const [activeSurveyForResponse, setActiveSurveyForResponse] = React.useState<SurveyDTO | null>(null)
  const [activeSurveyForAnalytics, setActiveSurveyForAnalytics] = React.useState<SurveyAnalyticsDTO | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = React.useState(false)

  // 4. Create Poll Form State
  const [pollTitle, setPollTitle] = React.useState("")
  const [pollDesc, setPollDesc] = React.useState("")
  const [pollOptions, setPollOptions] = React.useState<string[]>(["", ""])
  const [pollMultipleChoice, setPollMultipleChoice] = React.useState(false)
  const [pollAnonymous, setPollAnonymous] = React.useState(true)
  const [pollEndDate, setPollEndDate] = React.useState("")
  const [pollTargetScope, setPollTargetScope] = React.useState<"CAMPUS" | "DEPT" | "BATCH">("DEPT")
  const [isCreatingPoll, setIsCreatingPoll] = React.useState(false)
  const [pollError, setPollError] = React.useState<string | null>(null)

  // 5. Create Survey Form State (Course Exit & Academic Survey)
  const [surveyTitle, setSurveyTitle] = React.useState("")
  const [surveyDesc, setSurveyDesc] = React.useState("")
  const [surveyType, setSurveyType] = React.useState<"COURSE_EXIT" | "GENERAL_ACADEMIC">("COURSE_EXIT")
  const [surveyCourseName, setSurveyCourseName] = React.useState("")
  const [surveyCourseCode, setSurveyCourseCode] = React.useState("")
  const [surveyAcademicYear, setSurveyAcademicYear] = React.useState("Third Year")
  const [surveySemester, setSurveySemester] = React.useState("Semester 5")
  const [surveyEndDate, setSurveyEndDate] = React.useState("")
  const [surveyQuestions, setSurveyQuestions] = React.useState<SurveyQuestion[]>([])
  const [isCreatingSurvey, setIsCreatingSurvey] = React.useState(false)
  const [surveyCreateError, setSurveyCreateError] = React.useState<string | null>(null)

  // 6. Student Survey Response Form State
  const [surveyAnswers, setSurveyAnswers] = React.useState<
    Record<string, { ratingValue?: number; textValue?: string; selectedOptions?: string[] }>
  >({})
  const [isSubmittingSurvey, setIsSubmittingSurvey] = React.useState(false)
  const [surveyResponseError, setSurveyResponseError] = React.useState<string | null>(null)
  const [bannerFeedback, setBannerFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null)

  // 7. Course Feedback Form State (Student initiated professor review)
  const [facultyDirectory, setFacultyDirectory] = React.useState<any[]>([])
  const [fbFacultyId, setFbFacultyId] = React.useState("")
  const [fbFacultyName, setFbFacultyName] = React.useState("")
  const [fbCourseName, setFbCourseName] = React.useState("")
  const [fbRating, setFbRating] = React.useState(5)
  const [fbClarity, setFbClarity] = React.useState(5)
  const [fbPace, setFbPace] = React.useState(5)
  const [fbComments, setFbComments] = React.useState("")
  const [fbAnonymous, setFbAnonymous] = React.useState(true)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false)
  const [feedbackError, setFeedbackError] = React.useState<string | null>(null)

  // Detect URL parameter for tab selection
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get("tab")
      if (tab === "SURVEYS") setActiveTab("SURVEYS")
      else if (tab === "POLLS") setActiveTab("ACTIVE")
    }
  }, [])

  // Accessible Escape key listener to close modals
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showCreatePollModal) setShowCreatePollModal(false)
        if (showFeedbackModal) setShowFeedbackModal(false)
        if (showCreateSurveyModal) setShowCreateSurveyModal(false)
        if (activeSurveyForResponse) setActiveSurveyForResponse(null)
        if (activeSurveyForAnalytics) setActiveSurveyForAnalytics(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    showCreatePollModal,
    showFeedbackModal,
    showCreateSurveyModal,
    activeSurveyForResponse,
    activeSurveyForAnalytics,
  ])

  // Fetch Data Calls
  const fetchAllData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [pollsData, surveysData, feedbackData] = await Promise.all([
        apiClient.get<PollDTO[]>("/polls").catch(() => []),
        apiClient.get<SurveyDTO[]>("/surveys").catch(() => []),
        apiClient.get<FeedbackDTO[]>("/feedback").catch(() => []),
      ])

      setPolls(Array.isArray(pollsData) ? pollsData : [])
      setSurveys(Array.isArray(surveysData) ? surveysData : [])
      setFeedbacks(Array.isArray(feedbackData) ? feedbackData : [])
    } catch (err) {
      console.warn("Error loading polls/surveys data:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const fetchFaculty = async () => {
    try {
      const data = await apiClient.get<any[]>("/users/directory?role=FACULTY")
      if (Array.isArray(data)) {
        setFacultyDirectory(data)
        if (data.length > 0) {
          setFbFacultyId(data[0].id)
          setFbFacultyName(data[0].name)
        }
      }
    } catch (err) {
      console.warn("Fetch faculty directory error:", err)
    }
  }

  // 1-Click NBA CO1-CO5 Template Generator
  const handleAutoPopulateCourseOutcomes = () => {
    const course = surveyCourseName.trim() || "the course"
    setSurveyQuestions([
      {
        id: "co1",
        text: `CO1: Understand and analyze fundamental principles, models, and concepts of ${course}.`,
        type: "RATING_5",
        coTag: "CO1",
        required: true,
      },
      {
        id: "co2",
        text: `CO2: Apply algorithms, mathematical formulations, and engineering strategies to solve practical problems.`,
        type: "RATING_5",
        coTag: "CO2",
        required: true,
      },
      {
        id: "co3",
        text: `CO3: Design, implement, and validate laboratory experiments, software solutions, or case studies.`,
        type: "RATING_5",
        coTag: "CO3",
        required: true,
      },
      {
        id: "co4",
        text: `CO4: Evaluate system performance trade-offs, constraints, and optimization techniques.`,
        type: "RATING_5",
        coTag: "CO4",
        required: true,
      },
      {
        id: "co5",
        text: `CO5: Demonstrate effective engineering tool proficiency, technical documentation, and collaborative team communication.`,
        type: "RATING_5",
        coTag: "CO5",
        required: true,
      },
      {
        id: "q_satisfaction",
        text: `Overall satisfaction with instructional delivery, syllabus pacing, and lecture quality for ${course}.`,
        type: "RATING_5",
        required: true,
      },
      {
        id: "q_feedback",
        text: "Constructive suggestions to enhance curriculum delivery, lab exercises, or project guidance.",
        type: "TEXT",
        required: false,
      },
    ])
  }

  // Create Survey Handler
  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault()
    setSurveyCreateError(null)

    if (!surveyTitle.trim() || !surveyEndDate) {
      setSurveyCreateError("Title and deadline date are required.")
      return
    }

    if (surveyQuestions.length === 0) {
      setSurveyCreateError("Please add at least one question or click '1-Click Auto-Fill NBA COs'.")
      return
    }

    setIsCreatingSurvey(true)
    try {
      await apiClient.post("/surveys", {
        title: surveyTitle.trim(),
        description: surveyDesc.trim() || undefined,
        type: surveyType,
        department: user?.department,
        courseName: surveyCourseName.trim() || undefined,
        courseCode: surveyCourseCode.trim() || undefined,
        academicYear: surveyAcademicYear,
        semester: surveySemester,
        endDate: new Date(surveyEndDate).toISOString(),
        questions: surveyQuestions,
        isAnonymous: true,
      })

      setShowCreateSurveyModal(false)
      setSurveyTitle("")
      setSurveyDesc("")
      setSurveyCourseName("")
      setSurveyCourseCode("")
      setSurveyEndDate("")
      setSurveyQuestions([])
      setBannerFeedback({
        type: "success",
        message: "Course Exit Survey created and published to students successfully.",
      })
      await fetchAllData()
    } catch (err: any) {
      setSurveyCreateError(err.message || "Failed to create survey.")
    } finally {
      setIsCreatingSurvey(false)
    }
  }

  // Open Student Response Questionnaire
  const handleOpenStudentSurvey = (survey: SurveyDTO) => {
    setActiveSurveyForResponse(survey)
    setSurveyResponseError(null)

    // Pre-seed answer state with rating defaults or empty
    const initialAnswers: Record<string, any> = {}
    survey.questions.forEach((q) => {
      if (q.type === "RATING_5") {
        initialAnswers[q.id] = { ratingValue: 5 }
      } else {
        initialAnswers[q.id] = {}
      }
    })
    setSurveyAnswers(initialAnswers)
  }

  // Submit Student Survey Response
  const handleSubmitSurveyResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSurveyForResponse) return
    setSurveyResponseError(null)
    setIsSubmittingSurvey(true)

    try {
      const answersPayload = Object.entries(surveyAnswers).map(([qId, val]) => ({
        questionId: qId,
        ratingValue: val.ratingValue,
        textValue: val.textValue,
        selectedOptions: val.selectedOptions,
      }))

      await apiClient.post(`/surveys/${activeSurveyForResponse.id}/respond`, {
        answers: answersPayload,
      })

      setActiveSurveyForResponse(null)
      setBannerFeedback({
        type: "success",
        message: "Thank you! Your survey responses and Course Outcome ratings were submitted.",
      })
      await fetchAllData()
    } catch (err: any) {
      setSurveyResponseError(err.message || "Failed to submit survey response.")
    } finally {
      setIsSubmittingSurvey(false)
    }
  }

  // View CO Attainment Analytics
  const handleViewSurveyAnalytics = async (surveyId: string) => {
    setLoadingAnalytics(true)
    try {
      const data = await apiClient.get<SurveyAnalyticsDTO>(`/surveys/${surveyId}/analytics`)
      setActiveSurveyForAnalytics(data)
    } catch (err: any) {
      alert(err.message || "Failed to retrieve survey analytics.")
    } finally {
      setLoadingAnalytics(false)
    }
  }

  // Option selection for polls
  const handleToggleOption = (pollId: string, optId: string, allowMultiple: boolean) => {
    setStagedVotes((prev) => {
      const current = prev[pollId] || []
      if (allowMultiple) {
        if (current.includes(optId)) {
          return { ...prev, [pollId]: current.filter((id) => id !== optId) }
        } else {
          return { ...prev, [pollId]: [...current, optId] }
        }
      } else {
        return { ...prev, [pollId]: [optId] }
      }
    })
  }

  // Cast vote on poll
  const handleCastVote = async (pollId: string) => {
    const selected = stagedVotes[pollId]
    if (!selected || selected.length === 0) return

    setIsSubmittingVote((prev) => ({ ...prev, [pollId]: true }))
    try {
      await apiClient.post(`/polls/${pollId}/vote`, { selectedOptionIds: selected })
      setBannerFeedback({
        type: "success",
        message: "Your vote has been verified and recorded! Switched to 'Voted' tab to review live results.",
      })
      await fetchAllData()
      setActiveTab("VOTED")
    } catch (err: any) {
      alert(err.message || "Failed to record vote.")
    } finally {
      setIsSubmittingVote((prev) => ({ ...prev, [pollId]: false }))
    }
  }

  // Create Poll submission
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault()
    const validOptions = pollOptions.filter((o) => o.trim().length > 0)
    if (!pollTitle.trim() || validOptions.length < 2 || !pollEndDate) {
      setPollError("Please fill title, at least 2 options, and expiration deadline.")
      return
    }

    setIsCreatingPoll(true)
    setPollError(null)

    try {
      let targetAudience: any = { roles: ["STUDENT"] }
      if (pollTargetScope === "DEPT") {
        targetAudience.departments = [user?.department]
      } else if (pollTargetScope === "BATCH") {
        targetAudience.departments = [user?.department]
        targetAudience.academicYears = user?.academicYear ? [user.academicYear] : []
      }

      await apiClient.post("/polls", {
        title: pollTitle.trim(),
        description: pollDesc.trim() || undefined,
        options: validOptions.map((text, idx) => ({ id: `opt_${idx + 1}`, text })),
        targetAudience,
        isAnonymous: pollAnonymous,
        allowMultipleChoices: pollMultipleChoice,
        endDate: new Date(pollEndDate).toISOString(),
      })

      setShowCreatePollModal(false)
      setPollTitle("")
      setPollDesc("")
      setPollOptions(["", ""])
      setPollEndDate("")
      await fetchAllData()
    } catch (err: any) {
      setPollError(err.message || "Failed to create poll.")
    } finally {
      setIsCreatingPoll(false)
    }
  }

  // Feedback Submission
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fbFacultyId || !fbCourseName.trim()) {
      setFeedbackError("Faculty member and course title are required.")
      return
    }

    setIsSubmittingFeedback(true)
    setFeedbackError(null)

    try {
      await apiClient.post("/feedback", {
        facultyId: fbFacultyId,
        facultyName: fbFacultyName,
        courseName: fbCourseName.trim(),
        rating: fbRating,
        clarity: fbClarity,
        pace: fbPace,
        comments: fbComments.trim() || undefined,
        isAnonymous: fbAnonymous,
      })

      setShowFeedbackModal(false)
      setFbCourseName("")
      setFbComments("")
      await fetchAllData()
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to submit evaluation")
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  // Filtered polls
  const filteredPolls = polls.filter((p) => {
    const isAuthor = Boolean(
      p.author?.id && (p.author.id === user?.id || p.author.id === (user as any)?._id)
    )
    if (activeTab === "ACTIVE") {
      return isStaff ? p.status === "ACTIVE" : p.status === "ACTIVE" && !p.hasVoted
    }
    if (activeTab === "MY_POLLS") {
      return isAuthor
    }
    if (activeTab === "VOTED") return p.hasVoted
    if (activeTab === "CLOSED") return p.status === "CLOSED"
    return true
  })

  // Filtered surveys
  const openSurveys = surveys.filter((s) => s.status === "ACTIVE")
  const userCompletedSurveys = surveys.filter((s) => s.hasResponded)

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Vote className="size-6 text-primary" />
              Surveys, Course Exit & Campus Polls
            </h1>
            <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30">
              NBA / NAAC Aligned
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Course Outcome (CO) Exit evaluations, institutional academic surveys & campus democratic polls.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>

          {isStaff ? (
            <>
              <Button
                size="sm"
                onClick={() => {
                  setSurveyCreateError(null)
                  setShowCreateSurveyModal(true)
                }}
                className="h-9 gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                <GraduationCap className="size-4" />
                + Course Exit Survey
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPollError(null)
                  setShowCreatePollModal(true)
                }}
                className="h-9 gap-1.5 text-xs"
              >
                <Plus className="size-3.5" />
                Create Poll
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchFaculty()
                setShowFeedbackModal(true)
              }}
              className="h-9 gap-1.5 text-xs text-primary border-primary/20 hover:bg-primary/5"
            >
              <Star className="size-3.5 text-amber-500" />
              Evaluate Faculty
            </Button>
          )}
        </div>
      </div>

      {/* Action Banner */}
      {bannerFeedback && (
        <div
          className={cn(
            "p-3.5 rounded-lg border text-xs flex items-center justify-between shadow-xs animate-in fade-in",
            bannerFeedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          )}
        >
          <div className="flex items-center gap-2">
            {bannerFeedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            )}
            <span className="font-medium">{bannerFeedback.message}</span>
          </div>
          <button
            onClick={() => setBannerFeedback(null)}
            className="text-muted-foreground hover:text-foreground p-1 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-1">
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Course Exit Surveys
          </span>
          <div className="text-2xl font-bold text-foreground">
            {surveys.filter((s) => s.type === "COURSE_EXIT" && s.status === "ACTIVE").length}
          </div>
          <div className="text-[11px] text-muted-foreground">NBA CO attainment open</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
            Active Polls
          </span>
          <div className="text-2xl font-bold text-foreground">
            {polls.filter((p) => p.status === "ACTIVE").length}
          </div>
          <div className="text-[11px] text-muted-foreground">Campus decision items</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
          <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">
            My Completed
          </span>
          <div className="text-2xl font-bold text-foreground">
            {userCompletedSurveys.length + polls.filter((p) => p.hasVoted).length}
          </div>
          <div className="text-[11px] text-muted-foreground">Evaluations & ballots cast</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
          <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">
            Total Responses
          </span>
          <div className="text-2xl font-bold text-foreground">
            {surveys.reduce((acc, s) => acc + (s.totalResponses || 0), 0) +
              polls.reduce((acc, p) => acc + (p.totalVotes || 0), 0)}
          </div>
          <div className="text-[11px] text-muted-foreground">Recorded submissions</div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border text-xs font-medium overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("SURVEYS")}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === "SURVEYS"
              ? "border-indigo-600 text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <GraduationCap className="size-4 text-indigo-600" />
          Course Exit Surveys
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold">
            {openSurveys.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("ACTIVE")}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === "ACTIVE"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flame className="size-3.5 text-primary" />
          Active Polls
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-bold">
            {polls.filter((p) => p.status === "ACTIVE" && (isStaff || !p.hasVoted)).length}
          </span>
        </button>

        {isStaff && (
          <button
            onClick={() => setActiveTab("MY_POLLS")}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === "MY_POLLS"
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="size-3.5 text-purple-500" />
            My Created (Polls & Surveys)
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
              {surveys.filter((s) => s.author.id === user?.id).length +
                polls.filter((p) => p.author?.id === user?.id).length}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("VOTED")}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === "VOTED"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          Completed
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-bold">
            {userCompletedSurveys.length + polls.filter((p) => p.hasVoted).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("CLOSED")}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === "CLOSED"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="size-3.5 text-muted-foreground" />
          Concluded Archive
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-bold">
            {surveys.filter((s) => s.status === "CLOSED").length +
              polls.filter((p) => p.status === "CLOSED").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("FEEDBACK")}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === "FEEDBACK"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Star className="size-3.5 text-amber-500" />
          Faculty Reviews
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-bold">
            {feedbacks.length}
          </span>
        </button>
      </div>

      {/* 4. Tab Content */}
      {activeTab === "SURVEYS" ? (
        /* Academic & Course Exit Surveys Grid */
        <div className="space-y-5">
          <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">NBA Course Outcome (CO) Attainment Framework</h3>
                <p className="text-muted-foreground text-[11px]">
                  Course exit surveys measure student proficiency across target Course Outcomes (CO1 to CO5). Response averages feed directly into program accreditation metrics.
                </p>
              </div>
            </div>
            {isStaff && (
              <Button
                size="sm"
                onClick={() => {
                  setSurveyCreateError(null)
                  setShowCreateSurveyModal(true)
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 text-xs h-8"
              >
                + New Exit Survey
              </Button>
            )}
          </div>

          {surveys.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground rounded-xl border border-dashed border-border bg-card p-8 space-y-2">
              <GraduationCap className="size-8 text-indigo-500/40 mx-auto" />
              <p className="font-semibold text-foreground">No Academic Surveys Published Yet</p>
              <p>Faculty members can create Course Exit Surveys and curriculum assessments for enrolled batches.</p>
              {isStaff && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateSurveyModal(true)}
                  className="mt-2"
                >
                  Create Course Exit Survey
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {surveys.map((survey) => {
                const isAuthor = survey.author.id === user?.id
                const canViewAnalytics = isStaff || isAuthor

                return (
                  <div
                    key={survey.id}
                    className="rounded-xl border border-border bg-card p-5 space-y-4 flex flex-col justify-between hover:border-indigo-500/30 transition-colors shadow-xs"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            survey.type === "COURSE_EXIT"
                              ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                              : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                          )}
                        >
                          {survey.type === "COURSE_EXIT" ? "Course Exit Survey (NBA)" : "Academic Survey"}
                        </Badge>

                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          Closes: {new Date(survey.endDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-foreground leading-snug">
                          {survey.title}
                        </h3>
                        {survey.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {survey.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground pt-1 border-t border-border/50">
                        {survey.courseCode && (
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {survey.courseCode}
                          </Badge>
                        )}
                        {survey.courseName && (
                          <span className="font-semibold text-foreground text-[11px]">
                            {survey.courseName}
                          </span>
                        )}
                        <span>•</span>
                        <span>{survey.academicYear} ({survey.semester})</span>
                      </div>

                      <div className="text-[11px] text-muted-foreground flex items-center justify-between bg-muted/30 p-2.5 rounded-lg border border-border/40">
                        <span>Instructor: <strong className="text-foreground">{survey.author.name}</strong></span>
                        <span className="font-mono font-medium">
                          {survey.questions.filter((q) => q.coTag).length} CO Outcomes • {survey.questions.length} Criteria
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {survey.totalResponses} Responses Recorded
                      </span>

                      <div className="flex items-center gap-2">
                        {canViewAnalytics && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSurveyAnalytics(survey.id)}
                            className="h-8 text-xs font-semibold border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                          >
                            <TrendingUp className="h-3.5 w-3.5 mr-1" />
                            CO Attainment
                          </Button>
                        )}

                        {user?.role === "STUDENT" && (
                          survey.hasResponded ? (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleOpenStudentSurvey(survey)}
                              className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              Take Exit Survey
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : activeTab === "FEEDBACK" ? (
        /* Feedback Surveys Grid */
        <div className="space-y-4">
          {feedbacks.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground rounded-xl border border-border bg-card p-8 space-y-2">
              <Star className="size-8 text-amber-500/40 mx-auto" />
              <p className="font-semibold text-foreground">No Course Evaluations Yet</p>
              <p>Faculty evaluations submitted for courses will appear here with teaching metrics.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{fb.courseName}</h3>
                      <div className="text-xs text-muted-foreground">Instructor: <strong className="text-foreground">{fb.facultyName}</strong></div>
                      <div className="text-[10px] text-muted-foreground">{fb.department} • {fb.academicYear}</div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-sm bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                      <Star className="size-3.5 fill-amber-500" />
                      {fb.rating}.0
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/50">
                    <div>
                      <span className="text-muted-foreground">Clarity:</span>{" "}
                      <strong className="text-foreground">{fb.clarity}/5</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pacing:</span>{" "}
                      <strong className="text-foreground">{fb.pace}/5</strong>
                    </div>
                  </div>

                  {fb.comments && (
                    <p className="text-xs text-muted-foreground italic bg-muted/40 p-2.5 rounded-lg border border-border/60">
                      &quot;{fb.comments}&quot;
                    </p>
                  )}

                  <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1">
                    <span>{fb.isAnonymous ? "Anonymous Student" : fb.submittedBy?.name || "Student"}</span>
                    <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Polls Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {isLoading ? (
            <div className="col-span-full py-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <RefreshCw className="size-5 animate-spin text-primary" />
              <span>Loading campus polls...</span>
            </div>
          ) : filteredPolls.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-muted-foreground rounded-xl border border-border bg-card p-8 space-y-2">
              <Vote className="size-8 text-primary/40 mx-auto" />
              <p className="font-semibold text-foreground">No Polls in this Category</p>
              <p>Check back when new targeted campus polls are published by faculty.</p>
            </div>
          ) : (
            filteredPolls.map((poll) => {
              const isAuthor = Boolean(
                poll.author?.id &&
                (poll.author.id === user?.id || poll.author.id === (user as any)?._id)
              )
              const isEligibleToVote =
                !isAuthor &&
                poll.status === "ACTIVE" &&
                !poll.hasVoted &&
                (!poll.targetAudience?.roles?.length ||
                  poll.targetAudience.roles.includes(user?.role as any))

              const showResults =
                poll.hasVoted ||
                poll.status === "CLOSED" ||
                isAuthor ||
                (isStaff && !isEligibleToVote)

              const userStaged = stagedVotes[poll.id] || []
              const isSubmitting = isSubmittingVote[poll.id] || false

              return (
                <div
                  key={poll.id}
                  className="rounded-xl border border-border bg-card p-5 space-y-4 flex flex-col justify-between"
                >
                  {/* Poll Header */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {poll.status === "ACTIVE" ? (
                          <Badge variant="default" className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold">
                            Active Poll
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Concluded
                          </Badge>
                        )}

                        {isAuthor && (
                          <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 font-semibold gap-1">
                            <Sparkles className="size-3" />
                            Created by You
                          </Badge>
                        )}

                        {poll.isAnonymous && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Lock className="size-3" /> Anonymous
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        {poll.status === "ACTIVE"
                          ? `Ends ${new Date(poll.endDate).toLocaleDateString()}`
                          : "Voting Closed"}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-foreground leading-snug">{poll.title}</h3>
                    {poll.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{poll.description}</p>
                    )}
                  </div>

                  {/* Target Audience Badge */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground pt-1">
                    <Users className="size-3 text-primary" />
                    <span>Audience:</span>
                    {poll.targetAudience?.departments?.length ? (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-normal">
                        {poll.targetAudience.departments.join(", ")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-normal">
                        Campus Wide
                      </Badge>
                    )}
                    {poll.targetAudience?.academicYears?.length ? (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-normal">
                        {poll.targetAudience.academicYears.join(", ")}
                      </Badge>
                    ) : null}
                  </div>

                  {/* Poll Body: Voting Options or Live Results */}
                  <div className="space-y-2.5 pt-2">
                    {showResults ? (
                      /* Live Results Breakdown */
                      <div className="space-y-2">
                        {poll.options.map((opt) => {
                          const percentage =
                            poll.totalVotes > 0
                              ? Math.round((opt.voteCount / poll.totalVotes) * 100)
                              : 0
                          const isUserPicked =
                            poll.userSelectedOptionIds?.includes(opt.id) ||
                            stagedVotes[poll.id]?.includes(opt.id)

                          return (
                            <div key={opt.id} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className={`flex items-center gap-1.5 font-medium ${isUserPicked ? "text-primary font-bold" : "text-foreground"}`}>
                                  {isUserPicked && <Check className="size-3 text-primary" />}
                                  {opt.text}
                                </span>
                                <span className="font-mono text-muted-foreground">
                                  {opt.voteCount} ({percentage}%)
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${isUserPicked ? "bg-primary" : "bg-muted-foreground/30"}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      /* Voting Interface */
                      <div className="space-y-2" role={poll.allowMultipleChoices ? "group" : "radiogroup"} aria-label={poll.title}>
                        {poll.options.map((opt) => {
                          const isSelected = userStaged.includes(opt.id)
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              role={poll.allowMultipleChoices ? "checkbox" : "radio"}
                              aria-checked={isSelected}
                              onClick={() => handleToggleOption(poll.id, opt.id, poll.allowMultipleChoices)}
                              className={`w-full p-3 rounded-lg border text-xs text-left transition-all flex items-center justify-between ${
                                isSelected
                                  ? "border-primary bg-primary/10 text-foreground font-semibold shadow-xs"
                                  : "border-border bg-card/40 hover:bg-muted/50 text-foreground"
                              }`}
                            >
                              <span>{opt.text}</span>
                              <div className={`size-4 rounded-${poll.allowMultipleChoices ? "sm" : "full"} border flex items-center justify-center ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}>
                                {isSelected && <Check className="size-3" />}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer & Submit Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                    <span className="text-muted-foreground font-mono">
                      {poll.totalVotes} Verified Votes
                    </span>

                    {isEligibleToVote && (
                      <Button
                        size="sm"
                        disabled={userStaged.length === 0 || isSubmitting}
                        onClick={() => handleCastVote(poll.id)}
                        className="h-8 gap-1.5 text-xs font-semibold"
                      >
                        <Send className="size-3.5" />
                        {isSubmitting ? "Voting..." : "Submit Ballot"}
                      </Button>
                    )}

                    {poll.hasVoted && (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" /> Ballot Recorded
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 1: Create Course Exit Survey Modal (Faculty & Admin)         */}
      {/* ------------------------------------------------------------------ */}
      {showCreateSurveyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-xl p-5 space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Create Course Exit Survey (NBA / NAAC)
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Define Course Outcome (CO1–CO5) attainment ratings and student feedback
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateSurveyModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateSurvey} className="space-y-4">
              {surveyCreateError && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{surveyCreateError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Course / Subject Name *</label>
                  <Input
                    placeholder="e.g. Database Management Systems"
                    value={surveyCourseName}
                    onChange={(e) => setSurveyCourseName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Subject Code</label>
                  <Input
                    placeholder="e.g. CS501"
                    value={surveyCourseCode}
                    onChange={(e) => setSurveyCourseCode(e.target.value)}
                    className="text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Survey Title *</label>
                  <Input
                    placeholder="e.g. Course Exit Survey - DBMS"
                    value={surveyTitle}
                    onChange={(e) => setSurveyTitle(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Academic Year *</label>
                  <select
                    value={surveyAcademicYear}
                    onChange={(e) => setSurveyAcademicYear(e.target.value)}
                    className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1 shadow-xs"
                  >
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                    <option value="Final Year">Final Year</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Semester *</label>
                  <select
                    value={surveySemester}
                    onChange={(e) => setSurveySemester(e.target.value)}
                    className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1 shadow-xs"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={`Semester ${s}`}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Submission Deadline *</label>
                <Input
                  type="date"
                  value={surveyEndDate}
                  onChange={(e) => setSurveyEndDate(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              {/* 1-Click Auto-Populate Button */}
              <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      NBA Accreditation Course Outcome (CO) Preset
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Auto-generate standard CO1–CO5 5-point Likert questions for NBA attainment folders.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAutoPopulateCourseOutcomes}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8"
                  >
                    ✨ 1-Click Auto-Fill CO1–CO5
                  </Button>
                </div>
              </div>

              {/* Questionnaire Items List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Survey Questions ({surveyQuestions.length})
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSurveyQuestions((prev) => [
                        ...prev,
                        {
                          id: `q_${Date.now()}`,
                          text: "",
                          type: "RATING_5",
                          required: true,
                        },
                      ])
                    }
                    className="h-7 text-xs"
                  >
                    + Add Question
                  </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {surveyQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-3 rounded-lg border border-border bg-muted/20 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground font-mono">Q{idx + 1}</span>
                          {q.coTag && (
                            <Badge className="bg-indigo-600 text-white text-[10px] font-mono">
                              {q.coTag}
                            </Badge>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSurveyQuestions((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-destructive text-xs"
                        >
                          ✕ Remove
                        </button>
                      </div>

                      <Input
                        placeholder="Outcome / evaluation statement..."
                        value={q.text}
                        onChange={(e) =>
                          setSurveyQuestions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, text: e.target.value } : item))
                          )
                        }
                        className="text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateSurveyModal(false)}
                  disabled={isCreatingSurvey}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreatingSurvey}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {isCreatingSurvey ? "Publishing..." : "Publish Course Exit Survey"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 2: Student Survey Response Questionnaire                    */}
      {/* ------------------------------------------------------------------ */}
      {activeSurveyForResponse && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-xl p-6 space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <Badge variant="outline" className="text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                  {activeSurveyForResponse.courseCode || "CURRICULUM"} • {activeSurveyForResponse.courseName || "Course Exit Evaluation"}
                </Badge>
                <h2 className="text-base font-bold text-foreground mt-1">
                  {activeSurveyForResponse.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Your evaluation directly measures academic outcome attainment. All submissions are anonymous.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSurveyForResponse(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmitSurveyResponse} className="space-y-5">
              {surveyResponseError && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{surveyResponseError}</span>
                </div>
              )}

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {activeSurveyForResponse.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl border border-border bg-muted/10 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {idx + 1}. {q.text} {q.required && <span className="text-destructive">*</span>}
                      </span>
                      {q.coTag && (
                        <Badge className="bg-indigo-600 text-white font-mono text-[9px] shrink-0">
                          {q.coTag}
                        </Badge>
                      )}
                    </div>

                    {q.type === "RATING_5" && (
                      <div className="grid grid-cols-5 gap-2 pt-1">
                        {[
                          { score: 1, label: "Strongly Disagree" },
                          { score: 2, label: "Disagree" },
                          { score: 3, label: "Neutral" },
                          { score: 4, label: "Agree" },
                          { score: 5, label: "Strongly Agree" },
                        ].map((item) => {
                          const isSelected = surveyAnswers[q.id]?.ratingValue === item.score
                          return (
                            <button
                              key={item.score}
                              type="button"
                              onClick={() =>
                                setSurveyAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: { ...prev[q.id], ratingValue: item.score },
                                }))
                              }
                              className={cn(
                                "p-2 rounded-lg border text-center transition-all text-[11px]",
                                isSelected
                                  ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs"
                                  : "border-border bg-card hover:bg-muted text-foreground"
                              )}
                            >
                              <div className="font-bold text-sm">{item.score}</div>
                              <div className="text-[9px] line-clamp-1 opacity-80">{item.label}</div>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {q.type === "TEXT" && (
                      <textarea
                        rows={2}
                        placeholder="Provide details or constructive recommendations..."
                        value={surveyAnswers[q.id]?.textValue || ""}
                        onChange={(e) =>
                          setSurveyAnswers((prev) => ({
                            ...prev,
                            [q.id]: { ...prev[q.id], textValue: e.target.value },
                          }))
                        }
                        className="w-full text-xs rounded-md border border-border bg-background p-2.5 resize-none"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveSurveyForResponse(null)}
                  disabled={isSubmittingSurvey}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingSurvey}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {isSubmittingSurvey ? "Submitting..." : "Submit Survey Responses"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 3: Faculty & HoD CO Attainment Analytics Drawer              */}
      {/* ------------------------------------------------------------------ */}
      {activeSurveyForAnalytics && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl p-6 space-y-5 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600 text-white font-mono text-xs">
                    NBA ATTAINMENT DOSSIER
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {activeSurveyForAnalytics.survey.courseCode} • {activeSurveyForAnalytics.survey.academicYear}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground mt-1">
                  {activeSurveyForAnalytics.survey.courseName || activeSurveyForAnalytics.survey.title}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSurveyForAnalytics(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Overall Attainment Score Card */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Program Attainment Level
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold text-foreground">
                    {activeSurveyForAnalytics.overallAttainmentPercentage}%
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-bold font-mono",
                      activeSurveyForAnalytics.overallAttainmentPercentage >= 75
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : activeSurveyForAnalytics.overallAttainmentPercentage >= 60
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        : "bg-destructive/10 text-destructive border-destructive/30"
                    )}
                  >
                    {activeSurveyForAnalytics.overallAttainmentPercentage >= 75
                      ? "Level 3 - High Attainment"
                      : activeSurveyForAnalytics.overallAttainmentPercentage >= 60
                      ? "Level 2 - Moderate Attainment"
                      : "Level 1 - Low Attainment"}
                  </Badge>
                </div>
              </div>

              <div className="text-right text-xs text-muted-foreground space-y-0.5">
                <div>Total Responses: <strong className="text-foreground">{activeSurveyForAnalytics.totalResponses}</strong></div>
                <div>Target Department: <strong className="text-foreground">{activeSurveyForAnalytics.survey.department}</strong></div>
              </div>
            </div>

            {/* Detailed CO Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Course Outcome (CO1–CO5) Attainment Breakdown
              </h3>

              <div className="border border-border rounded-xl overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border text-left text-muted-foreground font-semibold">
                      <th className="p-3">CO Tag</th>
                      <th className="p-3">Course Outcome Statement</th>
                      <th className="p-3 text-center">Mean Score</th>
                      <th className="p-3 text-center">Attainment %</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSurveyForAnalytics.coAttainment.map((co) => (
                      <tr key={co.coTag} className="border-b border-border/60 hover:bg-muted/20">
                        <td className="p-3 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                          {co.coTag}
                        </td>
                        <td className="p-3 text-muted-foreground max-w-sm">
                          {co.questionText}
                        </td>
                        <td className="p-3 text-center font-bold text-foreground font-mono">
                          {co.averageRating} / 5.0
                        </td>
                        <td className="p-3 text-center font-bold font-mono">
                          {co.percentage}%
                        </td>
                        <td className="p-3 text-right">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold uppercase",
                              co.level === "HIGH"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : co.level === "MODERATE"
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                : "bg-destructive/10 text-destructive border-destructive/30"
                            )}
                          >
                            {co.level}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Student Constructive Remarks */}
            {activeSurveyForAnalytics.questionStats
              .filter((q) => q.type === "TEXT" && q.textResponses?.length)
              .map((q) => (
                <div key={q.questionId} className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground">{q.text}</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {q.textResponses?.map((rem: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-border/60 bg-muted/20 text-xs text-muted-foreground italic"
                      >
                        &quot;{rem}&quot;
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveSurveyForAnalytics(null)}
              >
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 4: Create Campus Poll Modal                                  */}
      {/* ------------------------------------------------------------------ */}
      {showCreatePollModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-xl p-6 space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Vote className="size-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">Create Campus Poll</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreatePollModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-4">
              {pollError && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{pollError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold">Question / Poll Title *</label>
                <Input
                  placeholder="e.g., Should the campus library extend midnight operating hours?"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Context / Notes (Optional)</label>
                <textarea
                  placeholder="Additional background context for students and faculty..."
                  value={pollDesc}
                  onChange={(e) => setPollDesc(e.target.value)}
                  rows={2}
                  className="w-full text-xs rounded-md border border-border bg-background p-2.5 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold">Options (Minimum 2) *</label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions]
                        newOpts[idx] = e.target.value
                        setPollOptions(newOpts)
                      }}
                      className="text-xs"
                      required
                    />
                    {pollOptions.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                        className="text-xs text-destructive"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPollOptions([...pollOptions, ""])}
                    className="text-xs h-7.5"
                  >
                    + Add Option
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Target Scope</label>
                  <select
                    value={pollTargetScope}
                    onChange={(e: any) => setPollTargetScope(e.target.value)}
                    className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1 shadow-xs"
                  >
                    <option value="DEPT">My Department Only</option>
                    <option value="BATCH">Specific Batch Year</option>
                    <option value="CAMPUS">Whole Campus</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">End Deadline *</label>
                  <Input
                    type="date"
                    value={pollEndDate}
                    onChange={(e) => setPollEndDate(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreatePollModal(false)}
                  disabled={isCreatingPoll}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreatingPoll}
                  className="font-semibold text-xs"
                >
                  {isCreatingPoll ? "Publishing..." : "Launch Poll"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 5: Student Faculty Evaluation Modal                          */}
      {/* ------------------------------------------------------------------ */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6 space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Star className="size-5 text-amber-500 fill-amber-500" />
                <h2 className="text-base font-bold text-foreground">Course & Faculty Review</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFeedbackModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-3.5">
              {feedbackError && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{feedbackError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold">Faculty Member *</label>
                <select
                  value={fbFacultyId}
                  onChange={(e) => {
                    setFbFacultyId(e.target.value)
                    const fac = facultyDirectory.find((f) => f.id === e.target.value)
                    if (fac) setFbFacultyName(fac.name)
                  }}
                  className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1 shadow-xs"
                  required
                >
                  {facultyDirectory.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Course Title *</label>
                <Input
                  placeholder="e.g. Distributed Computing (CS601)"
                  value={fbCourseName}
                  onChange={(e) => setFbCourseName(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Overall Course Delivery</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFbRating(s)}
                        className={`size-6 rounded flex items-center justify-center ${
                          s <= fbRating ? "text-amber-500" : "text-muted-foreground/40"
                        }`}
                      >
                        <Star className="size-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Lecture Clarity</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFbClarity(s)}
                        className={`size-6 rounded flex items-center justify-center ${
                          s <= fbClarity ? "text-amber-500" : "text-muted-foreground/40"
                        }`}
                      >
                        <Star className="size-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Pacing & Timeliness</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFbPace(s)}
                        className={`size-6 rounded flex items-center justify-center ${
                          s <= fbPace ? "text-amber-500" : "text-muted-foreground/40"
                        }`}
                      >
                        <Star className="size-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Remarks (Optional)</label>
                <textarea
                  value={fbComments}
                  onChange={(e) => setFbComments(e.target.value)}
                  placeholder="Share feedback on lab sessions or course materials..."
                  rows={2}
                  className="w-full text-xs rounded-md border border-border bg-background p-2.5 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingFeedback}
                  className="font-semibold text-xs"
                >
                  {isSubmittingFeedback ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
