"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth-context"
import { AcademicFileDTO, AcademicFileCategory } from "@nexora/types"
import {
  FileText,
  Download,
  Search,
  Upload,
  Building2,
  Calendar,
  GraduationCap,
  BookOpen,
  Filter,
  RefreshCw,
  Plus,
  Paperclip,
  CheckCircle2,
  X,
  AlertCircle,
  FileCode,
  FileArchive,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getApiHost } from "@/lib/api"

const API_BASE = getApiHost()

export default function FilesPage() {
  const { user } = useAuth()

  // State
  const [files, setFiles] = React.useState<AcademicFileDTO[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null)
  const [activeCategory, setActiveCategory] = React.useState<string>("ALL")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [selectedDept, setSelectedDept] = React.useState<string>("ALL")

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = React.useState(false)
  const [uploadTitle, setUploadTitle] = React.useState("")
  const [uploadDesc, setUploadDesc] = React.useState("")
  const [uploadCategory, setUploadCategory] = React.useState<AcademicFileCategory>("SYLLABUS")
  const [uploadSubjectCode, setUploadSubjectCode] = React.useState("")
  const [uploadSubjectName, setUploadSubjectName] = React.useState("")
  const [uploadYear, setUploadYear] = React.useState(user?.academicYear || "Final Year")
  const [uploadSemester, setUploadSemester] = React.useState(user?.semester || "Semester 7")
  const [uploadedFileData, setUploadedFileData] = React.useState<{
    url: string
    name: string
    size: number
    mimeType: string
    publicId?: string
  } | null>(null)
  const [isUploadingToCloud, setIsUploadingToCloud] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)

  // Student auto-scoping & Faculty teaching assignments state
  const isStudent = user?.role === "STUDENT"
  const isFaculty = user?.role === "FACULTY"
  const [filterMyClassOnly, setFilterMyClassOnly] = React.useState<boolean>(isStudent && Boolean(user?.academicYear))
  const [userAssignments, setUserAssignments] = React.useState<
    { academicYear: string; semester: string; subjectName: string; subjectCode?: string; division?: string }[]
  >([])

  React.useEffect(() => {
    if (isFaculty) {
      const token = localStorage.getItem("nexora_token")
      fetch(`${API_BASE}/api/users/profile/me`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user?.teachingAssignments) {
            setUserAssignments(data.user.teachingAssignments)
          }
        })
        .catch(() => {})
    }
  }, [isFaculty])

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Accessible Escape key listener to close modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showUploadModal) {
        setShowUploadModal(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showUploadModal])

  // 1. Fetch Files
  const fetchFiles = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("nexora_token")
      const params = new URLSearchParams()
      if (activeCategory !== "ALL") params.append("category", activeCategory)
      if (selectedDept !== "ALL") params.append("department", selectedDept)
      if (searchQuery.trim().length > 0) params.append("search", searchQuery.trim())

      if (isStudent && filterMyClassOnly && user?.academicYear) {
        params.append("academicYear", user.academicYear)
        if (user.semester) params.append("semester", user.semester)
      }

      const res = await fetch(`${API_BASE}/api/files?${params.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        setFiles(data)
      }
    } catch (err) {
      console.warn("Fetch files error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [activeCategory, selectedDept, searchQuery, isStudent, filterMyClassOnly, user?.academicYear, user?.semester])

  React.useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // Track and execute file download
  const handleDownload = async (file: AcademicFileDTO) => {
    setDownloadingId(file.id)
    try {
      const token = localStorage.getItem("nexora_token") || ""

      // Update local download count optimistically
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, downloadsCount: f.downloadsCount + 1 } : f))
      )

      const downloadEndpoint = `${API_BASE}/api/files/${file.id}/download?stream=true&token=${encodeURIComponent(token)}`

      // 1. First attempt: In-memory blob fetch for clean background download
      try {
        const res = await fetch(downloadEndpoint, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
          credentials: "include",
        })

        if (res.ok) {
          const blob = await res.blob()
          const blobUrl = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.style.display = "none"
          a.href = blobUrl
          a.download = file.fileName || `${file.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`
          document.body.appendChild(a)
          a.click()
          setTimeout(() => {
            if (document.body.contains(a)) document.body.removeChild(a)
            window.URL.revokeObjectURL(blobUrl)
          }, 1500)
          return
        }
      } catch (blobErr) {
        console.warn("Direct blob fetch failed, falling back to direct anchor:", blobErr)
      }

      // 2. Direct anchor navigation fallback
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = downloadEndpoint
      a.download = file.fileName || `${file.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a)
      }, 1500)
    } catch (err) {
      console.warn("Download error:", err)
    } finally {
      setDownloadingId(null)
    }
  }

  // Cloudinary Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingToCloud(true)
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
        setUploadedFileData(data)
      } else {
        const err = await res.json()
        alert(err.error || "Upload to Cloudinary failed")
      }
    } catch (err) {
      console.warn("Cloudinary upload error:", err)
      alert("Failed to upload document")
    } finally {
      setIsUploadingToCloud(false)
    }
  }

  // Submit file registration
  const handleRegisterFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadTitle.trim() || !uploadedFileData) {
      setUploadError("Please provide document title and upload file.")
      return
    }

    setIsSubmitting(true)
    setUploadError(null)

    try {
      const token = localStorage.getItem("nexora_token")
      const res = await fetch(`${API_BASE}/api/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify({
          title: uploadTitle.trim(),
          description: uploadDesc.trim() || undefined,
          category: uploadCategory,
          department: user?.department,
          academicYear: uploadYear,
          semester: uploadSemester,
          subjectCode: uploadSubjectCode.trim() || undefined,
          subjectName: uploadSubjectName.trim() || undefined,
          fileUrl: uploadedFileData.url,
          fileName: uploadedFileData.name,
          fileSize: uploadedFileData.size,
          mimeType: uploadedFileData.mimeType,
          publicId: uploadedFileData.publicId,
        }),
      })

      if (res.ok) {
        setShowUploadModal(false)
        setUploadTitle("")
        setUploadDesc("")
        setUploadSubjectCode("")
        setUploadSubjectName("")
        setUploadedFileData(null)
        await fetchFiles()
      } else {
        const err = await res.json()
        setUploadError(err.message || "Failed to publish document")
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to publish document")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStaff = ["FACULTY", "ADMIN", "SUPER_ADMIN"].includes(user?.role || "")

  const getCategoryBadge = (cat: AcademicFileCategory) => {
    switch (cat) {
      case "SYLLABUS":
        return <Badge variant="default" className="text-[10px] bg-primary/10 text-primary border-primary/20">Syllabus</Badge>
      case "LAB_MANUAL":
        return <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Lab Manual</Badge>
      case "PYQ_PAPERS":
        return <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">Previous Year Paper</Badge>
      case "PROJECT_GUIDELINES":
        return <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-500 border-purple-500/20">Project Guidelines</Badge>
      case "LECTURE_NOTES":
        return <Badge variant="secondary" className="text-[10px] bg-sky-500/10 text-sky-500 border-sky-500/20">Lecture Notes</Badge>
      default:
        return <Badge variant="outline" className="text-[10px]">Document</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="size-6 text-primary" />
              Academic File Center
            </h1>
            <Badge variant="outline" className="text-xs">
              Cloudinary CDN
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Official curriculum copies, lecture notes, laboratory manuals, and previous year university exam question papers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFiles}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>

          {isStaff && (
            <Button
              size="sm"
              onClick={() => {
                setUploadError(null)
                setShowUploadModal(true)
              }}
              className="h-9 gap-1.5 text-xs font-semibold shadow-xs"
            >
              <Plus className="size-3.5" />
              Upload Course File
            </Button>
          )}
        </div>
      </div>

      {/* 2. Filters & Categories */}
      <div className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { key: "ALL", label: "All Documents" },
            { key: "SYLLABUS", label: "Curriculum & Syllabi" },
            { key: "LAB_MANUAL", label: "Lab Manuals" },
            { key: "PYQ_PAPERS", label: "Previous Year Papers" },
            { key: "PROJECT_GUIDELINES", label: "Project Guidelines" },
            { key: "LECTURE_NOTES", label: "Lecture Notes" },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat.key
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Dept Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border/50">
          <div className="relative sm:col-span-2">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, subject code (e.g. CS-702), or filename..."
              className="h-9 pl-9 text-xs bg-background"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-xs text-foreground"
            >
              <option value="ALL">All Departments</option>
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
              <option value="Electronics & Telecommunication Engineering">Electronics & Telecommunication</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Class Scoping Notice */}
      {isStudent && user?.academicYear && (
        <div className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium text-foreground">
              {filterMyClassOnly
                ? `Auto-scoped to your batch: ${user.department} • ${user.academicYear} ${user.semester ? "• " + user.semester : ""}`
                : `Showing all department resources (${user.department})`}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterMyClassOnly(!filterMyClassOnly)}
            className="text-xs h-7 shrink-0 font-medium"
          >
            {filterMyClassOnly ? "Show All Department Notes" : "Scope to My Class Only"}
          </Button>
        </div>
      )}

      {/* 3. Files Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
          <RefreshCw className="size-5 animate-spin text-primary" />
          <span>Fetching academic repository...</span>
        </div>
      ) : files.length === 0 ? (
        <div className="py-20 text-center text-xs text-muted-foreground rounded-xl border border-border bg-card p-8 space-y-2">
          <BookOpen className="size-8 text-muted-foreground/40 mx-auto" />
          <p className="font-semibold text-foreground">No Academic Files Found</p>
          <p>No documents uploaded yet matching your department or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-5 rounded-xl border border-border bg-card hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                {/* Category & Subject Code */}
                <div className="flex items-center gap-2 flex-wrap justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(file.category)}
                    {file.subjectCode && (
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                        {file.subjectCode}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-muted-foreground">
                    {(file.fileSize / 1024).toFixed(0)} KB
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                  {file.title}
                </h3>

                {file.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {file.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="space-y-1 text-xs text-muted-foreground pt-1 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-3 text-primary shrink-0" />
                    <span className="truncate">{file.department}</span>
                  </div>

                  {file.academicYear && (
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="size-3 text-primary shrink-0" />
                      <span>{file.academicYear} {file.semester ? `• ${file.semester}` : ""}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground/80">
                    <span>Uploaded by {file.uploadedBy.name}</span>
                    <span className="font-mono text-primary font-semibold">
                      {file.downloadsCount} downloads
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button: Download */}
              <div className="pt-2 border-t border-border/50">
                <Button
                  size="sm"
                  disabled={downloadingId === file.id}
                  onClick={() => handleDownload(file)}
                  className="w-full h-8.5 text-xs font-semibold gap-1.5 shadow-xs"
                >
                  {downloadingId === file.id ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="size-3.5" />
                      Download Document
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL: UPLOAD ACADEMIC FILE ================= */}
      {showUploadModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-file-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Upload className="size-5 text-primary" aria-hidden="true" />
                <h3 id="upload-file-title" className="text-sm font-semibold">Publish Academic Document</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadModal(false)}
                aria-label="Close upload dialog"
                className="h-7 w-7 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>

            {uploadError && (
              <div role="alert" className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterFile} className="space-y-3.5">
              {/* Teaching Assignments Auto-fill Dropdown */}
              {userAssignments.length > 0 && (
                <div className="space-y-1 p-2.5 rounded-lg border border-primary/20 bg-primary/5">
                  <label className="text-[11px] font-semibold text-primary block">
                    Auto-fill from your Teaching Assignments
                  </label>
                  <select
                    onChange={(e) => {
                      const idx = Number(e.target.value)
                      if (idx >= 0 && userAssignments[idx]) {
                        const assign = userAssignments[idx]
                        setUploadYear(assign.academicYear)
                        setUploadSemester(assign.semester)
                        setUploadSubjectName(assign.subjectName)
                        setUploadSubjectCode(assign.subjectCode || "")
                        if (!uploadTitle) {
                          setUploadTitle(`${assign.subjectName} - Notes`)
                        }
                      }
                    }}
                    defaultValue=""
                    className="w-full h-8 text-xs rounded border border-border bg-background px-2"
                  >
                    <option value="" disabled>-- Select Assigned Class & Subject --</option>
                    {userAssignments.map((assign, i) => (
                      <option key={i} value={i}>
                        {assign.subjectName} ({assign.academicYear} • {assign.semester})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="upload-doc-title" className="text-xs font-semibold">Document Title *</label>
                <Input
                  id="upload-doc-title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems Lab Manual & Code Examples"
                  className="h-8.5 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="upload-category-select" className="text-xs font-semibold">Category *</label>
                  <select
                    id="upload-category-select"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as AcademicFileCategory)}
                    className="w-full h-8.5 text-xs rounded-md border border-border bg-background px-2.5"
                  >
                    <option value="SYLLABUS">Syllabus & Curriculum</option>
                    <option value="LAB_MANUAL">Laboratory Manual</option>
                    <option value="PYQ_PAPERS">Previous Year Paper</option>
                    <option value="PROJECT_GUIDELINES">Project Guidelines</option>
                    <option value="LECTURE_NOTES">Lecture Notes</option>
                    <option value="OTHER">Other Academic File</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="upload-subject-code" className="text-xs font-semibold">Subject Code</label>
                  <Input
                    id="upload-subject-code"
                    value={uploadSubjectCode}
                    onChange={(e) => setUploadSubjectCode(e.target.value)}
                    placeholder="e.g. CS-702 or CS-701L"
                    className="h-8.5 text-xs uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="upload-year-input" className="text-xs font-semibold">Academic Year</label>
                  <Input
                    id="upload-year-input"
                    value={uploadYear}
                    onChange={(e) => setUploadYear(e.target.value)}
                    placeholder="e.g. Final Year"
                    className="h-8.5 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="upload-semester-input" className="text-xs font-semibold">Semester</label>
                  <Input
                    id="upload-semester-input"
                    value={uploadSemester}
                    onChange={(e) => setUploadSemester(e.target.value)}
                    placeholder="e.g. Semester 7"
                    className="h-8.5 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="upload-desc-input" className="text-xs font-semibold">Description (Optional)</label>
                <textarea
                  id="upload-desc-input"
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Provide details on chapters covered, university scheme, or experiments..."
                  rows={2}
                  className="w-full text-xs rounded-md border border-border bg-background p-2.5 resize-none"
                />
              </div>

              {/* Cloudinary File Dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold">Upload PDF / Document File (Cloudinary CDN) *</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.zip,.txt"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingToCloud}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-10 text-xs gap-2 border-dashed"
                >
                  <Paperclip className={`size-4 ${isUploadingToCloud ? "animate-spin text-primary" : ""}`} />
                  {isUploadingToCloud ? "Uploading to Cloudinary CDN..." : "Select File (PDF, DOCX, ZIP)"}
                </Button>

                {uploadedFileData && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-500">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span className="font-semibold truncate">{uploadedFileData.name}</span>
                      <span className="text-[10px] text-muted-foreground">({(uploadedFileData.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFileData(null)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadModal(false)}
                  className="h-8.5 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!uploadedFileData || isSubmitting}
                  className="h-8.5 text-xs font-semibold"
                >
                  {isSubmitting ? "Publishing..." : "Publish to Repository"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
