"use client"

import * as React from "react"
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Edit2,
  GraduationCap,
  Layers,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
  Filter,
  BookOpen,
  Lock,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/shared/page-header"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { INDIAN_HIGHER_ED_DEPARTMENTS, DepartmentCatalogItem } from "@nexora/types"

const POPULAR_CORE_DEPTS = [
  "Computer Science & Engineering",
  "Artificial Intelligence & Data Science",
  "Information Technology",
  "Electronics & Telecommunication Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
]

export default function AcademicStructurePage() {
  const { user } = useAuth()
  const rawInstId =
    typeof user?.instituteId === "object"
      ? (user?.instituteId as any)?.id || (user?.instituteId as any)?._id
      : user?.instituteId
  const instituteId = rawInstId || "current"

  const [departments, setDepartments] = React.useState<string[]>([])
  const [academicYears, setAcademicYears] = React.useState<string[]>([])
  const [semesters, setSemesters] = React.useState<string[]>([])

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null)

  // Catalog picker state
  const [catalogSearch, setCatalogSearch] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL")
  const [showCatalogModal, setShowCatalogModal] = React.useState(false)

  // Search filter for current configured departments
  const [currentDeptFilter, setCurrentDeptFilter] = React.useState("")

  // New item inputs
  const [newCustomDepartment, setNewCustomDepartment] = React.useState("")
  const [newYear, setNewYear] = React.useState("")
  const [newSemester, setNewSemester] = React.useState("")

  // Inline editing state
  const [editingDept, setEditingDept] = React.useState<{ index: number; value: string } | null>(null)
  const [editingYear, setEditingYear] = React.useState<{ index: number; value: string } | null>(null)
  const [editingSem, setEditingSem] = React.useState<{ index: number; value: string } | null>(null)

  // HoD & Department Subjects State
  const isHod = user?.role === "FACULTY" && user?.facultyRole === "HOD"
  const defaultTab = isHod ? "SUBJECTS" : "STRUCTURE"
  const [activeTab, setActiveTab] = React.useState<"SUBJECTS" | "STRUCTURE">(defaultTab)

  const [selectedSubjectDept, setSelectedSubjectDept] = React.useState<string>(
    user?.department || "Computer Science & Engineering"
  )
  const [departmentSubjects, setDepartmentSubjects] = React.useState<
    { id: string; name: string; code?: string; academicYear: string; semester: string; addedBy?: string; createdAt?: string }[]
  >([])
  const [subjectsLoading, setSubjectsLoading] = React.useState(false)

  // Add subject modal state
  const [showAddSubjectModal, setShowAddSubjectModal] = React.useState(false)
  const [newSubName, setNewSubName] = React.useState("")
  const [newSubCode, setNewSubCode] = React.useState("")
  const [newSubYear, setNewSubYear] = React.useState("")
  const [newSubSem, setNewSubSem] = React.useState("")
  const [subModalError, setSubModalError] = React.useState<string | null>(null)
  const [subModalSubmitting, setSubModalSubmitting] = React.useState(false)

  const fetchDepartmentSubjects = React.useCallback(async () => {
    const targetDept = isHod ? user?.department : selectedSubjectDept
    if (!targetDept || !instituteId) return
    setSubjectsLoading(true)
    try {
      const data = await apiClient.get<{ subjects?: any[] }>(
        `/institutes/${instituteId}/subjects?department=${encodeURIComponent(targetDept)}`
      )
      setDepartmentSubjects(data.subjects || [])
    } catch {
      // ignore
    } finally {
      setSubjectsLoading(false)
    }
  }, [instituteId, selectedSubjectDept, isHod, user?.department])

  React.useEffect(() => {
    fetchDepartmentSubjects()
  }, [fetchDepartmentSubjects])

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubModalError(null)
    const targetDept = isHod ? user?.department : selectedSubjectDept
    if (!targetDept) {
      setSubModalError("Please select a department")
      return
    }
    if (!newSubName.trim() || !newSubYear || !newSubSem) {
      setSubModalError("Subject name, academic year, and semester are required")
      return
    }

    setSubModalSubmitting(true)
    try {
      const data = await apiClient.post<{ subject: any; message?: string }>(
        `/institutes/${instituteId}/subjects`,
        {
          department: targetDept,
          name: newSubName.trim(),
          code: newSubCode.trim() || undefined,
          academicYear: newSubYear,
          semester: newSubSem,
        }
      )

      setNewSubName("")
      setNewSubCode("")
      setShowAddSubjectModal(false)
      fetchDepartmentSubjects()
      setFeedback({ type: "success", message: `Subject "${data.subject?.name || newSubName.trim()}" added to department catalog` })
    } catch (err: any) {
      setSubModalError(err.message || "Failed to save subject")
    } finally {
      setSubModalSubmitting(false)
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      await apiClient.delete(`/institutes/${instituteId}/subjects/${subjectId}`)
      setDepartmentSubjects((prev) => prev.filter((s) => s.id !== subjectId))
      setFeedback({ type: "success", message: "Subject removed from department catalog" })
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to remove subject" })
    }
  }

  // Fetch current institute structure
  const fetchStructure = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.get<any>(`/institutes/${instituteId}/structure`)
      if (data && (data.departments || data.academicYears || data.semesters)) {
        setDepartments(data.departments || [])
        setAcademicYears(data.academicYears || [])
        setSemesters(data.semesters || [])
      } else {
        setDepartments(POPULAR_CORE_DEPTS)
        setAcademicYears(["First Year", "Second Year", "Third Year", "Final Year"])
        setSemesters([
          "Semester 1",
          "Semester 2",
          "Semester 3",
          "Semester 4",
          "Semester 5",
          "Semester 6",
          "Semester 7",
          "Semester 8",
        ])
      }
    } catch {
      // Fallback
      setDepartments(POPULAR_CORE_DEPTS)
      setAcademicYears(["First Year", "Second Year", "Third Year", "Final Year"])
      setSemesters([
        "Semester 1",
        "Semester 2",
        "Semester 3",
        "Semester 4",
        "Semester 5",
        "Semester 6",
        "Semester 7",
        "Semester 8",
      ])
    } finally {
      setLoading(false)
    }
  }, [instituteId])

  React.useEffect(() => {
    fetchStructure()
  }, [fetchStructure])

  // Save all changes to MongoDB
  const handleSave = async () => {
    setSaving(true)
    setFeedback(null)

    if (departments.length === 0) {
      setFeedback({ type: "error", message: "You must configure at least one department." })
      setSaving(false)
      return
    }

    if (academicYears.length === 0) {
      setFeedback({ type: "error", message: "You must configure at least one academic year." })
      setSaving(false)
      return
    }

    if (semesters.length === 0) {
      setFeedback({ type: "error", message: "You must configure at least one semester." })
      setSaving(false)
      return
    }

    try {
      await apiClient.put(`/institutes/${instituteId}/structure`, {
        departments,
        academicYears,
        semesters,
      })

      setFeedback({
        type: "success",
        message: "Campus academic structure synchronized! Only these options are now selectable on registration.",
      })
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update academic structure" })
    } finally {
      setSaving(false)
    }
  }

  // --- Department handlers ---
  const toggleCatalogDepartment = (deptName: string) => {
    if (departments.includes(deptName)) {
      setDepartments((prev) => prev.filter((d) => d !== deptName))
    } else {
      setDepartments((prev) => [...prev, deptName])
    }
    setFeedback(null)
  }

  const addCustomDepartment = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newCustomDepartment.trim()
    if (!trimmed) return
    if (departments.includes(trimmed)) {
      setFeedback({ type: "error", message: "Department already exists in your institute" })
      return
    }
    setDepartments((prev) => [...prev, trimmed])
    setNewCustomDepartment("")
    setFeedback(null)
  }

  const addAllPopularCore = () => {
    const toAdd = POPULAR_CORE_DEPTS.filter((d) => !departments.includes(d))
    if (toAdd.length === 0) {
      setFeedback({ type: "success", message: "All popular engineering departments are already added!" })
      return
    }
    setDepartments((prev) => [...prev, ...toAdd])
    setFeedback({ type: "success", message: `Added ${toAdd.length} standard Indian engineering departments!` })
  }

  const deleteDepartment = (idx: number) => {
    setDepartments((prev) => prev.filter((_, i) => i !== idx))
  }

  const saveEditDepartment = (idx: number) => {
    if (!editingDept || !editingDept.value.trim()) return
    setDepartments((prev) => prev.map((d, i) => (i === idx ? editingDept.value.trim() : d)))
    setEditingDept(null)
  }

  // --- Academic Year handlers ---
  const addYear = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newYear.trim()
    if (!trimmed) return
    if (academicYears.includes(trimmed)) {
      setFeedback({ type: "error", message: "Academic Year already exists" })
      return
    }
    setAcademicYears((prev) => [...prev, trimmed])
    setNewYear("")
    setFeedback(null)
  }

  const deleteYear = (idx: number) => {
    setAcademicYears((prev) => prev.filter((_, i) => i !== idx))
  }

  const saveEditYear = (idx: number) => {
    if (!editingYear || !editingYear.value.trim()) return
    setAcademicYears((prev) => prev.map((y, i) => (i === idx ? editingYear.value.trim() : y)))
    setEditingYear(null)
  }

  // --- Semester handlers ---
  const addSemester = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newSemester.trim()
    if (!trimmed) return
    if (semesters.includes(trimmed)) {
      setFeedback({ type: "error", message: "Semester already exists" })
      return
    }
    setSemesters((prev) => [...prev, trimmed])
    setNewSemester("")
    setFeedback(null)
  }

  const deleteSemester = (idx: number) => {
    setSemesters((prev) => prev.filter((_, i) => i !== idx))
  }

  const saveEditSemester = (idx: number) => {
    if (!editingSem || !editingSem.value.trim()) return
    setSemesters((prev) => prev.map((s, i) => (i === idx ? editingSem.value.trim() : s)))
    setEditingSem(null)
  }

  // Categories extracted from INDIAN_HIGHER_ED_DEPARTMENTS
  const categories = ["ALL", "Computer & IT", "Emerging Tech", "Electronics & Electrical", "Mechanical & Production", "Civil & Infrastructure", "Chemical & Bio", "Management & Sciences"]

  const filteredCatalog = INDIAN_HIGHER_ED_DEPARTMENTS.filter((item) => {
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory
    const q = catalogSearch.toLowerCase()
    const matchesQuery = item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)
    return matchesCategory && matchesQuery
  })

  const filteredCurrentDepartments = departments.filter((d) =>
    d.toLowerCase().includes(currentDeptFilter.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={isHod ? "Department Curriculum & Subjects" : "Academic Structure Configuration"}
        description={
          isHod
            ? `Manage official accredited subjects for ${user?.department || "your department"}. Assigned faculty can select these during registration and notes upload.`
            : "Configure Departments, Academic Years, Semesters, and Department Subject Catalogs."
        }
        badge={
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-semibold">
            <Layers className="h-3 w-3 mr-1" />
            {isHod ? "HoD Curriculum Authority" : "Campus Registry Control"}
          </Badge>
        }
      >
        <div className="flex items-center gap-2">
          {!isHod && (
            <>
              <Button variant="outline" size="sm" onClick={fetchStructure} disabled={loading} className="text-xs">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || loading} className="text-xs font-semibold">
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {saving ? "Saving Changes..." : "Save to Campus Grid"}
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <ShieldAlert className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("SUBJECTS")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === "SUBJECTS"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Department Subjects ({departmentSubjects.length})</span>
        </button>

        {!isHod && (
          <button
            type="button"
            onClick={() => setActiveTab("STRUCTURE")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "STRUCTURE"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Departments, Years & Semesters</span>
          </button>
        )}
      </div>

      {/* TAB 1: DEPARTMENT SUBJECT CATALOG */}
      {activeTab === "SUBJECTS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border bg-card">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Target Department</label>
              {isHod ? (
                <div className="flex items-center gap-2 text-xs font-medium text-foreground bg-muted/40 py-1.5 px-3 rounded border border-border">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{user?.department}</span>
                  <Badge variant="secondary" className="text-[10px] ml-1">Your Department</Badge>
                </div>
              ) : (
                <select
                  value={selectedSubjectDept}
                  onChange={(e) => setSelectedSubjectDept(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-3 text-xs"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <Button
              size="sm"
              onClick={() => {
                setNewSubYear(academicYears[0] || "First Year")
                setNewSubSem(semesters[0] || "Semester 1")
                setShowAddSubjectModal(true)
              }}
              className="text-xs font-semibold gap-1.5 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Department Subject</span>
            </Button>
          </div>

          {/* Subjects Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between text-xs font-semibold">
              <span>Accredited Subject Registry</span>
              <span className="text-[10px] text-muted-foreground">{departmentSubjects.length} subjects found</span>
            </div>

            {subjectsLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Loading subjects...</div>
            ) : departmentSubjects.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-xs font-medium text-foreground">No subjects added for this department yet.</p>
                <p className="text-[10px] text-muted-foreground max-w-sm mx-auto">
                  Click &ldquo;Add Department Subject&rdquo; above to register official curriculum subjects.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border text-xs">
                {departmentSubjects.map((sub) => (
                  <div key={sub.id} className="p-3.5 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{sub.name}</span>
                        {sub.code && (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {sub.code}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>{sub.academicYear}</span>
                        <span>•</span>
                        <span>{sub.semester}</span>
                      </div>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteSubject(sub.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Subject Modal */}
          {showAddSubjectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-background rounded-xl border border-border shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-foreground">Add New Curriculum Subject</h3>
                    <p className="text-xs text-muted-foreground">
                      Target Department: <span className="font-medium text-foreground">{isHod ? user?.department : selectedSubjectDept}</span>
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowAddSubjectModal(false)}
                    className="h-7 w-7 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {subModalError && (
                  <div className="p-2.5 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                    {subModalError}
                  </div>
                )}

                <form onSubmit={handleAddSubject} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Subject Name</label>
                    <Input
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      placeholder="e.g. Data Structures & Algorithms"
                      className="text-xs h-8.5"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Subject Code (Optional)</label>
                      <Input
                        value={newSubCode}
                        onChange={(e) => setNewSubCode(e.target.value.toUpperCase())}
                        placeholder="e.g. CS302"
                        className="text-xs h-8.5 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Class / Year</label>
                      <select
                        value={newSubYear}
                        onChange={(e) => setNewSubYear(e.target.value)}
                        className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs"
                        required
                      >
                        {academicYears.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Semester</label>
                    <select
                      value={newSubSem}
                      onChange={(e) => setNewSubSem(e.target.value)}
                      className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs"
                      required
                    >
                      {semesters.map((sem) => (
                        <option key={sem} value={sem}>
                          {sem}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddSubjectModal(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={subModalSubmitting}
                      className="text-xs font-semibold"
                    >
                      {subModalSubmitting ? "Adding..." : "Add to Department Catalog"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEPARTMENTS, YEARS & SEMESTERS (CAMPUS ADMIN ONLY) */}
      {activeTab === "STRUCTURE" && !isHod && (
        <div className="space-y-6">

      {/* Indian Department Catalog Quick-Picker Card */}
      <div className="rounded-lg border border-primary/20 bg-card p-4 space-y-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Standard Indian Higher Education Departments Catalog (AICTE / UGC)
            </h2>
            <p className="text-xs text-muted-foreground">
              Search and 1-click select from 40+ accredited departments in India, or add your custom department below.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAllPopularCore}
              className="text-xs h-8 font-semibold shrink-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add 7 Popular Core
            </Button>
            <Button
              type="button"
              variant={showCatalogModal ? "secondary" : "default"}
              size="sm"
              onClick={() => setShowCatalogModal(!showCatalogModal)}
              className="text-xs h-8 font-semibold shrink-0"
            >
              {showCatalogModal ? "Hide Indian Catalog" : "Explore All 40+ Indian Depts"}
            </Button>
          </div>
        </div>

        {/* Collapsible Searchable Catalog Browser */}
        {showCatalogModal && (
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search Indian department catalog (e.g. robotics, artificial, data, mechatronics)..."
                  className="pl-8 text-xs h-8"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredCatalog.map((item) => {
                const isAdded = departments.includes(item.name)
                return (
                  <div
                    key={item.name}
                    onClick={() => toggleCatalogDepartment(item.name)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isAdded
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                        : "bg-muted/40 border-border hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] uppercase font-bold text-muted-foreground px-1 py-0.2 rounded bg-background border border-border">
                          {item.code}
                        </span>
                        <span className="text-xs font-semibold truncate block leading-tight">{item.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block truncate">{item.category}</span>
                    </div>

                    <div className="shrink-0">
                      {isAdded ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                          <Check className="h-3 w-3" /> Added
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-primary flex items-center gap-0.5 bg-primary/10 px-1.5 py-0.5 rounded hover:bg-primary/20">
                          <Plus className="h-3 w-3" /> Add
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          Loading academic structure configuration...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Departments */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Configured Departments</h2>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {departments.length} Selected
              </Badge>
            </div>

            {/* Custom Department Add Form */}
            <form onSubmit={addCustomDepartment} className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Add Custom Department</label>
              <div className="flex gap-2">
                <Input
                  value={newCustomDepartment}
                  onChange={(e) => setNewCustomDepartment(e.target.value)}
                  placeholder="e.g. Aeronautical Engineering"
                  className="text-xs h-8"
                />
                <Button type="submit" size="sm" className="h-8 px-2.5 text-xs font-semibold shrink-0">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Custom
                </Button>
              </div>
            </form>

            {/* Department Search Filter */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={currentDeptFilter}
                onChange={(e) => setCurrentDeptFilter(e.target.value)}
                placeholder="Filter configured departments..."
                className="pl-8 text-xs h-8 bg-muted/30"
              />
            </div>

            {/* Department List */}
            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[340px] pr-1">
              {filteredCurrentDepartments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {currentDeptFilter ? "No matching configured departments." : "No departments configured yet."}
                </p>
              ) : (
                filteredCurrentDepartments.map((dept, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border text-xs group hover:bg-muted/70 transition-colors"
                  >
                    {editingDept?.index === idx ? (
                      <div className="flex items-center gap-1.5 flex-1 mr-2">
                        <Input
                          value={editingDept.value}
                          onChange={(e) => setEditingDept({ index: idx, value: e.target.value })}
                          className="text-xs h-7"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => saveEditDepartment(idx)}
                          className="h-7 w-7 text-emerald-600"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingDept(null)}
                          className="h-7 w-7 text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium text-foreground truncate mr-2">{dept}</span>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingDept({ index: idx, value: dept })}
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteDepartment(idx)}
                            className="h-6 w-6 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 2: Academic Years */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Academic Years / Batches</h2>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {academicYears.length} Batches
              </Badge>
            </div>

            {/* Add Year Form */}
            <form onSubmit={addYear} className="flex gap-2">
              <Input
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                placeholder="e.g. First Year or Year 1"
                className="text-xs h-8"
              />
              <Button type="submit" size="sm" className="h-8 px-2.5 text-xs font-semibold shrink-0">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </form>

            {/* Year List */}
            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
              {academicYears.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No academic years configured.</p>
              ) : (
                academicYears.map((yr, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border text-xs group hover:bg-muted/70 transition-colors"
                  >
                    {editingYear?.index === idx ? (
                      <div className="flex items-center gap-1.5 flex-1 mr-2">
                        <Input
                          value={editingYear.value}
                          onChange={(e) => setEditingYear({ index: idx, value: e.target.value })}
                          className="text-xs h-7"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => saveEditYear(idx)}
                          className="h-7 w-7 text-emerald-600"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingYear(null)}
                          className="h-7 w-7 text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium text-foreground truncate mr-2">{yr}</span>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingYear({ index: idx, value: yr })}
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteYear(idx)}
                            className="h-6 w-6 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 3: Semesters */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Semesters</h2>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {semesters.length} Semesters
              </Badge>
            </div>

            {/* Add Semester Form */}
            <form onSubmit={addSemester} className="flex gap-2">
              <Input
                value={newSemester}
                onChange={(e) => setNewSemester(e.target.value)}
                placeholder="e.g. Semester 1"
                className="text-xs h-8"
              />
              <Button type="submit" size="sm" className="h-8 px-2.5 text-xs font-semibold shrink-0">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </form>

            {/* Semester List */}
            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
              {semesters.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No semesters configured.</p>
              ) : (
                semesters.map((sem, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border text-xs group hover:bg-muted/70 transition-colors"
                  >
                    {editingSem?.index === idx ? (
                      <div className="flex items-center gap-1.5 flex-1 mr-2">
                        <Input
                          value={editingSem.value}
                          onChange={(e) => setEditingSem({ index: idx, value: e.target.value })}
                          className="text-xs h-7"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => saveEditSemester(idx)}
                          className="h-7 w-7 text-emerald-600"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingSem(null)}
                          className="h-7 w-7 text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium text-foreground truncate mr-2">{sem}</span>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingSem({ index: idx, value: sem })}
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteSemester(idx)}
                            className="h-6 w-6 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  )
}
