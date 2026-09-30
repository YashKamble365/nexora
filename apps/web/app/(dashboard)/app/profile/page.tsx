"use client"

import * as React from "react"
import {
  User,
  Mail,
  Building2,
  GraduationCap,
  Shield,
  Camera,
  CheckCircle2,
  AlertCircle,
  FileText,
  Vote,
  FolderGit2,
  Bell,
  Sparkles,
  Loader2,
  UploadCloud,
  IdCard,
  BookOpen,
  Plus,
  Trash2,
  Star,
  QrCode,
  Globe,
  Award,
  BookMarked,
  Users2,
  Hash,
  X,
} from "lucide-react"

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Local Form State
  const [name, setName] = React.useState(user?.name || "")
  const [bio, setBio] = React.useState(user?.bio || "")
  const [academicYear, setAcademicYear] = React.useState(user?.academicYear || "Final Year")
  const [semester, setSemester] = React.useState(user?.semester || "Semester 8")
  const [degreeProgram, setDegreeProgram] = React.useState((user as any)?.degreeProgram || "B.Tech")
  const [division, setDivision] = React.useState((user as any)?.division || "Division A")
  const [batchSection, setBatchSection] = React.useState((user as any)?.batchSection || "Batch B1")
  const [admissionYear, setAdmissionYear] = React.useState((user as any)?.admissionYear || "2022")
  const [passingYear, setPassingYear] = React.useState((user as any)?.passingYear || "2026")
  const [prnNumber, setPrnNumber] = React.useState((user as any)?.prnNumber || "")
  const [bloodGroup, setBloodGroup] = React.useState((user as any)?.bloodGroup || "O+")
  const [campusRoles, setCampusRoles] = React.useState<string[]>([])
  const [newRoleInput, setNewRoleInput] = React.useState("")
  const [githubUrl, setGithubUrl] = React.useState("")
  const [linkedinUrl, setLinkedinUrl] = React.useState("")
  const [portfolioUrl, setPortfolioUrl] = React.useState("")
  const [mentor, setMentor] = React.useState<{ id: string; name: string; email?: string; facultyRole?: string; coordinatorYear?: string } | null>(null)
  const [currentSemesterSubjects, setCurrentSemesterSubjects] = React.useState<
    { id: string; name: string; code?: string; facultyName?: string; facultyId?: string }[]
  >([])
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatarUrl || "")

  // UI States
  const [loading, setLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Activity Stats State
  const [stats, setStats] = React.useState({
    complaintsFiled: 0,
    votesCast: 0,
    filesShared: 0,
    noticesPublished: 0,
  })

  // Faculty Teaching Assignments & Ratings State
  const [teachingAssignments, setTeachingAssignments] = React.useState<
    { academicYear: string; semester: string; subjectName: string; subjectCode?: string; division?: string }[]
  >([])
  const [facultyRating, setFacultyRating] = React.useState<{
    averageRating: number;
    clarityAverage: number;
    paceAverage: number;
    totalReviews: number;
  } | null>(null)
  const [isSavingAssignments, setIsSavingAssignments] = React.useState(false)

  // Fetch full profile data
  const fetchProfile = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient.get<any>("/users/profile/me")
      if (res?.user) {
        setName(res.user.name || "")
        setBio(res.user.bio || "")
        setAcademicYear(res.user.academicYear || "Final Year")
        setSemester(res.user.semester || "Semester 8")
        if (res.user.degreeProgram) setDegreeProgram(res.user.degreeProgram)
        if (res.user.division) setDivision(res.user.division)
        if (res.user.batchSection) setBatchSection(res.user.batchSection)
        if (res.user.admissionYear) setAdmissionYear(res.user.admissionYear)
        if (res.user.passingYear) setPassingYear(res.user.passingYear)
        if (res.user.prnNumber) setPrnNumber(res.user.prnNumber)
        if (res.user.bloodGroup) setBloodGroup(res.user.bloodGroup)
        if (Array.isArray(res.user.campusRoles)) setCampusRoles(res.user.campusRoles)
        if (res.user.links) {
          setGithubUrl(res.user.links.github || "")
          setLinkedinUrl(res.user.links.linkedin || "")
          setPortfolioUrl(res.user.links.portfolio || "")
        }
        if (res.user.mentor) setMentor(res.user.mentor)
        if (Array.isArray(res.user.currentSemesterSubjects)) setCurrentSemesterSubjects(res.user.currentSemesterSubjects)
        if (res.user.avatarUrl) {
          setAvatarUrl(res.user.avatarUrl)
        }
        if (Array.isArray(res.user.teachingAssignments)) {
          setTeachingAssignments(res.user.teachingAssignments)
        }
        if (res.user.facultyRating) {
          setFacultyRating(res.user.facultyRating)
        }
      }
      if (res?.stats) {
        setStats(res.stats)
      }
    } catch (err) {
      console.warn("Failed to load profile data:", err)
      // Fallback to active auth session user
      if (user) {
        setName(user.name || "")
        setBio(user.bio || "")
        setAcademicYear(user.academicYear || "Final Year")
        setAvatarUrl(user.avatarUrl || "")
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Profile Picture Upload via Cloudinary
  const handlePfpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate image type & size
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, WebP)")
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage("Image file exceeds maximum 8MB limit")
      return
    }

    setIsUploadingPhoto(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const token = typeof window !== "undefined" ? localStorage.getItem("nexora_token") : null
      const res = await fetch("http://localhost:4000/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to upload image to CDN")
      }

      const uploadResult = await res.json()
      const newAvatarUrl = uploadResult.url

      // Immediately persist to backend
      const patchRes = await apiClient.patch<any>("/users/profile/me", {
        avatarUrl: newAvatarUrl,
      })

      setAvatarUrl(newAvatarUrl)
      updateUser({ avatarUrl: newAvatarUrl })
      setSuccessMessage("Profile photo updated and saved to CDN successfully!")
    } catch (err: any) {
      console.warn("PFP upload error:", err)
      setErrorMessage(err.message || "Failed to upload profile picture")
    } finally {
      setIsUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Save General Profile Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const payload: any = {
        name: name.trim(),
        bio: bio.trim(),
        academicYear,
        semester,
        degreeProgram: degreeProgram.trim(),
        division: division.trim(),
        batchSection: batchSection.trim(),
        admissionYear: admissionYear.trim(),
        passingYear: passingYear.trim(),
        prnNumber: prnNumber.trim(),
        bloodGroup: bloodGroup.trim(),
        campusRoles,
        links: {
          github: githubUrl.trim(),
          linkedin: linkedinUrl.trim(),
          portfolio: portfolioUrl.trim(),
        },
      }

      const res = await apiClient.patch<any>("/users/profile/me", payload)
      if (res?.user) {
        updateUser({
          name: res.user.name,
          bio: res.user.bio,
          academicYear: res.user.academicYear,
          semester: res.user.semester,
        })
      }

      setSuccessMessage("Campus profile and academic credentials updated successfully!")
    } catch (err: any) {
      console.warn("Save profile error:", err)
      setErrorMessage(err.message || "Failed to save profile changes")
    } finally {
      setIsSaving(false)
    }
  }

  // Campus Roles Tag Management
  const addCampusRole = () => {
    if (!newRoleInput.trim()) return
    if (!campusRoles.includes(newRoleInput.trim())) {
      setCampusRoles((prev) => [...prev, newRoleInput.trim()])
    }
    setNewRoleInput("")
  }

  const removeCampusRole = (idx: number) => {
    setCampusRoles((prev) => prev.filter((_, i) => i !== idx))
  }

  // Save Faculty Teaching Assignments
  const handleSaveAssignments = async () => {
    setIsSavingAssignments(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const payload = {
        teachingAssignments: teachingAssignments
          .filter((t) => t.subjectName && t.subjectName.trim().length > 0)
          .map((t) => ({
            ...t,
            department: user?.department || "General",
          })),
      }

      await apiClient.patch<any>("/users/profile/me", payload)
      setSuccessMessage("Teaching assignments updated and synced across academic notes and broadcasts!")
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save teaching assignments")
    } finally {
      setIsSavingAssignments(false)
    }
  }

  const addAssignmentRow = () => {
    setTeachingAssignments((prev) => [
      ...prev,
      {
        academicYear: "Second Year",
        semester: "Semester 3",
        subjectName: "",
        subjectCode: "",
        division: "A",
      },
    ])
  }

  const removeAssignmentRow = (idx: number) => {
    setTeachingAssignments((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateAssignmentRow = (idx: number, field: string, value: string) => {
    setTeachingAssignments((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  const roleColor =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
      ? "bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-300 dark:border-purple-800"
      : user?.role === "FACULTY"
      ? "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-800"
      : "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-300 dark:border-emerald-800"

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Student & Scholar Profile"
        description="Manage your institutional identity, verified credentials, and digital campus presence."
        badge={
          <Badge variant="outline" className={roleColor}>
            <Shield className="h-3 w-3 mr-1" />
            {user?.role || "STUDENT"}
          </Badge>
        }
      />

      {/* Alerts */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm animate-in fade-in-50 duration-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in-50 duration-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Top Banner & Profile Picture Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Decorative Institutional Header Banner */}
        <div className="h-36 sm:h-44 w-full bg-gradient-to-r from-primary/80 via-primary to-indigo-600 relative">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Badge className="bg-black/30 backdrop-blur-md text-white border-white/20 font-mono text-xs">
              <IdCard className="h-3 w-3 mr-1.5" />
              {user?.institutionalId || "ID-VERIFIED"}
            </Badge>
          </div>
        </div>

        {/* Profile Content Details */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
            {/* Avatar with Camera Trigger */}
            <div className="relative group">
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border-4 border-card shadow-xl bg-muted ring-1 ring-border">
                <AvatarImage src={avatarUrl || user?.avatarUrl} alt={name} className="object-cover" />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {name
                    ? name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                    : "NX"}
                </AvatarFallback>
              </Avatar>

              {/* Upload Trigger Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                aria-label="Upload Profile Photo"
                className="absolute bottom-1 right-1 p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-card focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePfpChange}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="text-xs font-semibold"
              >
                <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
                {isUploadingPhoto ? "Uploading to Cloudinary..." : "Change Photo"}
              </Button>
            </div>
          </div>

          {/* User Bio and Title Summary */}
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{name || "Campus Scholar"}</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit mx-auto sm:mx-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Verified Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
              <Mail className="h-3.5 w-3.5" />
              {user?.email}
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1 max-w-2xl">
              {bio || "No personal bio added yet. Add a short bio to introduce yourself to your department peers."}
            </p>
          </div>
        </div>
      </div>

      {/* Activity Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{stats.complaintsFiled}</p>
              <p className="text-xs text-muted-foreground font-medium">Grievances Raised</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Vote className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{stats.votesCast}</p>
              <p className="text-xs text-muted-foreground font-medium">Polls Participated</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{stats.filesShared}</p>
              <p className="text-xs text-muted-foreground font-medium">Files & Notes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{stats.noticesPublished}</p>
              <p className="text-xs text-muted-foreground font-medium">Notices Authored</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout: Profile Form + Academic ID Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editable Information Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your preferred display name and public academic bio.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">
                      Full Legal Name
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Prathamesh Patange"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">
                      Institutional Email (Immutable)
                    </label>
                    <Input
                      value={user?.email || ""}
                      disabled
                      className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Headline & Academic Bio
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short bio, research interests, committee positions, or project focus..."
                    rows={4}
                    maxLength={300}
                  />
                  <p className="text-[11px] text-muted-foreground text-right">
                    {bio.length}/300 characters
                  </p>
                </div>

                {user?.role === "STUDENT" && (
                  <div className="space-y-4 pt-2 border-t border-border/80">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-primary" />
                      Academic & Enrollment Details
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Degree Program</label>
                        <Input
                          value={degreeProgram}
                          onChange={(e) => setDegreeProgram(e.target.value)}
                          placeholder="e.g. B.Tech / B.E."
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Academic Year</label>
                        <select
                          value={academicYear}
                          onChange={(e) => setAcademicYear(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="First Year">First Year</option>
                          <option value="Second Year">Second Year</option>
                          <option value="Third Year">Third Year</option>
                          <option value="Final Year">Final Year</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Semester</label>
                        <select
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="Semester 1">Semester 1</option>
                          <option value="Semester 2">Semester 2</option>
                          <option value="Semester 3">Semester 3</option>
                          <option value="Semester 4">Semester 4</option>
                          <option value="Semester 5">Semester 5</option>
                          <option value="Semester 6">Semester 6</option>
                          <option value="Semester 7">Semester 7</option>
                          <option value="Semester 8">Semester 8</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Class Division</label>
                        <Input
                          value={division}
                          onChange={(e) => setDivision(e.target.value)}
                          placeholder="e.g. Division A"
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Lab Batch Section</label>
                        <Input
                          value={batchSection}
                          onChange={(e) => setBatchSection(e.target.value)}
                          placeholder="e.g. Batch B2"
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">University PRN No.</label>
                        <Input
                          value={prnNumber}
                          onChange={(e) => setPrnNumber(e.target.value)}
                          placeholder="e.g. 202201234567"
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Blood Group</label>
                        <select
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                        >
                          {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bg) => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Admission Year</label>
                        <Input
                          value={admissionYear}
                          onChange={(e) => setAdmissionYear(e.target.value)}
                          placeholder="e.g. 2022"
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Expected Passing Year</label>
                        <Input
                          value={passingYear}
                          onChange={(e) => setPassingYear(e.target.value)}
                          placeholder="e.g. 2026"
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Campus Roles & Club Memberships */}
                    <div className="space-y-2 pt-2 border-t border-border/60">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        Campus Leadership & Club Memberships
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={newRoleInput}
                          onChange={(e) => setNewRoleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addCampusRole()
                            }
                          }}
                          placeholder="e.g. Class Representative (CR), Coding Club Core, GDSC Lead..."
                          className="h-8.5 text-xs flex-1"
                        />
                        <Button type="button" size="sm" onClick={addCampusRole} className="h-8.5 text-xs font-semibold">
                          <Plus className="h-3 w-3 mr-1" /> Add Role
                        </Button>
                      </div>
                      {campusRoles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {campusRoles.map((role, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs gap-1.5 py-0.5 px-2 font-medium">
                              <span>{role}</span>
                              <button
                                type="button"
                                onClick={() => removeCampusRole(idx)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Portfolio & Social Links */}
                    <div className="space-y-2 pt-2 border-t border-border/60">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-primary" />
                        Portfolio & Social Profiles
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="relative">
                          <GithubIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            value={githubUrl}
                            onChange={(e) => setGithubUrl(e.target.value)}
                            placeholder="github.com/username"
                            className="h-8.5 text-xs pl-8"
                          />
                        </div>
                        <div className="relative">
                          <LinkedinIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            value={linkedinUrl}
                            onChange={(e) => setLinkedinUrl(e.target.value)}
                            placeholder="linkedin.com/in/username"
                            className="h-8.5 text-xs pl-8"
                          />
                        </div>
                        <div className="relative">
                          <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            value={portfolioUrl}
                            onChange={(e) => setPortfolioUrl(e.target.value)}
                            placeholder="myportfolio.dev"
                            className="h-8.5 text-xs pl-8"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-end gap-3 border-t border-border pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="font-semibold text-xs px-6"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                      Saving Updates...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Student Curriculum & Faculty Mentors Card */}
          {user?.role === "STUDENT" && (
            <Card className="border-border shadow-xs bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookMarked className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base font-semibold">
                      Current Semester Curriculum & Mentorship
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {currentSemesterSubjects.length} Registered Courses
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Auto-mapped to your enrolled department ({user?.department}), {academicYear}, and {semester}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Designated Class Coordinator / Mentor */}
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {mentor ? mentor.name.slice(0, 2).toUpperCase() : "CC"}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-primary block">
                        Assigned Class Coordinator / Mentor
                      </span>
                      <p className="text-xs font-bold text-foreground">
                        {mentor ? mentor.name : `Prof. Assigned Coordinator (${academicYear})`}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {mentor?.email || "Class Academic Counselor & Student Guidance Office"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-semibold w-fit">
                    {mentor?.coordinatorYear ? `${mentor.coordinatorYear} In-Charge` : "Department Faculty"}
                  </Badge>
                </div>

                {/* Enrolled Subjects List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Enrolled Course Subjects ({semester})</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Faculty teaching assignments auto-linked
                    </span>
                  </h4>

                  {currentSemesterSubjects.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                      No curriculum subjects currently mapped for {user?.department} in {semester}. HoD will populate this semester&apos;s syllabus soon.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentSemesterSubjects.map((sub, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border border-border/80 bg-muted/30 hover:bg-muted/60 transition-colors space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-foreground truncate">
                              {sub.name}
                            </span>
                            {sub.code && (
                              <span className="font-mono text-[9px] uppercase font-bold text-muted-foreground px-1 py-0.5 rounded bg-background border border-border shrink-0">
                                {sub.code}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Professor:</span>
                            <span className="font-medium text-foreground">
                              {sub.facultyName ? `Prof. ${sub.facultyName}` : "Faculty Assigned"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Faculty Multi-Subject & Class Assignments Manager */}
          {user?.role === "FACULTY" && (
            <Card className="border-border shadow-xs bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base font-semibold">
                      Teaching Assignments & Classes
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {teachingAssignments.length} Active Courses
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Manage multiple subjects and classes you teach. Notes uploads and class broadcasts automatically bind to these classes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {teachingAssignments.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                    No teaching assignments added yet. Click below to add classes you teach.
                  </div>
                ) : (
                  teachingAssignments.map((assignment, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-border bg-muted/20 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Course #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeAssignmentRow(idx)}
                          className="text-muted-foreground hover:text-destructive text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Class / Year</label>
                          <select
                            value={assignment.academicYear}
                            onChange={(e) => updateAssignmentRow(idx, "academicYear", e.target.value)}
                            className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                          >
                            <option value="First Year">First Year</option>
                            <option value="Second Year">Second Year</option>
                            <option value="Third Year">Third Year</option>
                            <option value="Final Year">Final Year</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Semester</label>
                          <select
                            value={assignment.semester}
                            onChange={(e) => updateAssignmentRow(idx, "semester", e.target.value)}
                            className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                              <option key={s} value={`Semester ${s}`}>
                                Semester {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Subject Name</label>
                          <Input
                            value={assignment.subjectName}
                            onChange={(e) => updateAssignmentRow(idx, "subjectName", e.target.value)}
                            placeholder="e.g. Data Structures"
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Division (Opt)</label>
                          <Input
                            value={assignment.division || ""}
                            onChange={(e) => updateAssignmentRow(idx, "division", e.target.value)}
                            placeholder="e.g. A"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAssignmentRow}
                  className="w-full h-8 text-xs border-dashed gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Another Teaching Assignment</span>
                </Button>
              </CardContent>
              <CardFooter className="flex justify-end border-t border-border pt-3">
                <Button
                  size="sm"
                  onClick={handleSaveAssignments}
                  disabled={isSavingAssignments}
                  className="text-xs font-semibold"
                >
                  {isSavingAssignments ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Saving Assignments...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Save Teaching Assignments
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Right Column: Verified Campus Identity & Credentials */}
        <div className="space-y-6">
          {user?.role === "STUDENT" ? (
            /* Official Digital Student ID Card */
            <Card className="border-primary/20 shadow-md bg-linear-to-b from-card via-card to-primary/5 overflow-hidden relative">
              {/* Card Top Decorative Header / Lanyard slot */}
              <div className="bg-primary/10 border-b border-primary/20 p-4 text-center relative">
                <div className="w-12 h-1.5 rounded-full bg-border/80 mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-left">
                    <Building2 className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold tracking-tight text-foreground leading-none">
                        {user?.instituteName || (typeof user?.instituteId === 'object' ? (user?.instituteId as any)?.name : null) || "P. R. Pote Patil College of Engineering and Management"}
                      </p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">
                        Verified Digital Student ID
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold px-1.5 py-0 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Active
                  </Badge>
                </div>
              </div>

              <CardContent className="p-5 space-y-4 text-xs">
                {/* Photo & Primary Bio */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16 rounded-xl border-2 border-primary/40 shadow-sm">
                      <AvatarImage src={avatarUrl || user?.avatarUrl || undefined} alt={name || user?.name} />
                      <AvatarFallback className="font-bold text-sm bg-primary/10 text-primary">
                        {(name || user?.name || "ST").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow">
                      <Shield className="h-3.5 w-3.5 text-primary fill-primary/20" />
                    </div>
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    <h3 className="font-bold text-base text-foreground leading-snug truncate">
                      {name || user?.name}
                    </h3>
                    <p className="text-xs font-semibold text-primary truncate">
                      {degreeProgram} • {user?.department || "CSE"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {academicYear} • {semester}
                    </p>
                  </div>
                </div>

                {/* ID & Academic Parameters Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/70">
                  <div className="p-2 rounded-lg bg-muted/50 border border-border/80 space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground block">
                      Roll Number
                    </span>
                    <span className="font-mono font-bold text-xs text-foreground">
                      {user?.institutionalId || "N/A"}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-muted/50 border border-border/80 space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground block">
                      University PRN
                    </span>
                    <span className="font-mono font-bold text-xs text-foreground truncate block">
                      {prnNumber || "Pending"}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-muted/50 border border-border/80 space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground block">
                      Division & Batch
                    </span>
                    <span className="font-semibold text-xs text-foreground">
                      {division} / {batchSection}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-muted/50 border border-border/80 space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground block">
                      Blood Group
                    </span>
                    <span className="font-bold text-xs text-foreground">
                      {bloodGroup || "O+"}
                    </span>
                  </div>
                </div>

                {/* Validity Cohort */}
                <div className="p-2 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Academic Cohort</span>
                  <span className="font-semibold text-foreground font-mono">
                    Valid {admissionYear} – {passingYear}
                  </span>
                </div>

                {/* Campus Leadership Badges if present */}
                {campusRoles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
                      <Award className="h-3 w-3 text-primary" />
                      Campus Credentials
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {campusRoles.map((r, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] py-0 px-2 font-medium">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Digital Barcode / Secure Verification */}
                <div className="pt-2 border-t border-border/80 space-y-2">
                  <div className="p-2.5 rounded-xl bg-background border border-border flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground block">
                        DIGITAL VERIFICATION
                      </span>
                      <p className="font-mono text-[10px] font-bold text-foreground">
                        NXR-{user?.institutionalId || "STU"}-{prnNumber ? prnNumber.slice(-4) : "2026"}
                      </p>
                    </div>
                    <div className="p-1.5 rounded-md bg-muted/80 border border-border text-foreground">
                      <QrCode className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground text-center flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Cryptographically stamped by Campus Registrar
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border shadow-xs bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Verified Campus Identity
                </CardTitle>
                <CardDescription className="text-xs">
                  Credentials verified by institutional registrar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-muted/60 border border-border/80 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">
                    {user?.role === "FACULTY"
                      ? "Appointed Institute"
                      : user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
                      ? "Administered Institute"
                      : "Enrolled Institute"}
                  </span>
                  <p className="font-semibold text-foreground leading-snug flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    {user?.instituteName || (typeof user?.instituteId === 'object' ? (user?.instituteId as any)?.name : null) || "P. R. Pote Patil College of Engineering and Management"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-muted/60 border border-border/80 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">
                      Roll / ID Number
                    </span>
                    <p className="font-mono font-bold text-foreground">
                      {user?.institutionalId || "26-CSE-014"}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/60 border border-border/80 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">
                      Campus Role
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold uppercase">
                      {user?.role || "STUDENT"}
                    </Badge>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/60 border border-border/80 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">
                    Department
                  </span>
                  <p className="font-medium text-foreground">
                    {user?.department || "Computer Science & Engineering"}
                  </p>
                </div>

                {user?.role === "FACULTY" && user.facultyRole && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1 text-blue-700 dark:text-blue-300">
                    <span className="text-[10px] uppercase tracking-wider font-semibold block">
                      Faculty Designation
                    </span>
                    <p className="font-bold">
                      {user.facultyRole} {user.coordinatorYear ? `(${user.coordinatorYear})` : ""}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-border flex items-center justify-between text-muted-foreground">
                  <span>Account Status</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active Scholar
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Faculty Performance & Ratings Card */}
          {user?.role === "FACULTY" && (
            <Card className="border-border shadow-xs bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    Student Teaching Ratings
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">
                    Fair-Play Verified
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Aggregated from monthly anonymous student evaluations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    ★ {facultyRating?.averageRating ? facultyRating.averageRating.toFixed(1) : "5.0"}
                    <span className="text-xs font-normal text-muted-foreground"> / 5.0</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Based on {facultyRating?.totalReviews || 0} student course evaluation(s)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block font-medium">Teaching Clarity</span>
                    <span className="font-bold text-foreground">
                      {facultyRating?.clarityAverage ? facultyRating.clarityAverage.toFixed(1) : "5.0"} / 5
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block font-medium">Syllabus Pacing</span>
                    <span className="font-bold text-foreground">
                      {facultyRating?.paceAverage ? facultyRating.paceAverage.toFixed(1) : "5.0"} / 5
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  Students are prompted once every 30 days to evaluate semester teaching.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
