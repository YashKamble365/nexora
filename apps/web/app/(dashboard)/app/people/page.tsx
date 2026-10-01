"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { Role } from "@nexora/types"
import {
  Users,
  Search,
  Building2,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  RefreshCw,
  Sparkles,
  Eye,
  FileText,
  Vote,
  FolderGit2,
  Bell,
  X,
  IdCard,
  Shield,
  ExternalLink,
  Award,
  Globe,
  BookMarked,
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

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getApiHost } from "@/lib/api"

const API_BASE = getApiHost()

interface PersonDTO {
  id: string
  name: string
  role: Role
  department: string
  academicYear?: string
  semester?: string
  institutionalId: string
  avatarUrl?: string
  isOnline: boolean
  dmPermission: string
  profileVisibility?: "PUBLIC" | "PRIVATE"
}

interface ProfileDetailData {
  isPrivate: boolean
  canViewFull: boolean
  user: {
    id: string
    name: string
    email?: string
    role: Role
    department: string
    institutionalId?: string
    academicYear?: string
    semester?: string
    degreeProgram?: string
    division?: string
    batchSection?: string
    admissionYear?: string
    passingYear?: string
    prnNumber?: string
    bloodGroup?: string
    campusRoles?: string[]
    links?: {
      github?: string
      linkedin?: string
      portfolio?: string
    }
    mentor?: {
      id: string
      name: string
      email?: string
      coordinatorYear?: string
    } | null
    currentSemesterSubjects?: {
      id: string
      name: string
      code?: string
      facultyName?: string
      facultyId?: string
    }[]
    facultyRole?: string
    coordinatorYear?: string
    avatarUrl?: string | null
    bio?: string
    isOnline: boolean
    profileVisibility: "PUBLIC" | "PRIVATE"
    dmPermission: string
    institute?: {
      name: string
      code: string
    } | null
    createdAt?: string
  }
  stats?: {
    complaintsFiled: number
    votesCast: number
    filesShared: number
    noticesPublished: number
  } | null
}

export default function PeoplePage() {
  const { user } = useAuth()
  const router = useRouter()

  const [people, setPeople] = React.useState<PersonDTO[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<"ALL" | "FACULTY" | "STUDENT" | "ADMIN">("ALL")
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("ALL")
  const [searchQuery, setSearchQuery] = React.useState<string>("")

  // Profile Dialog State
  const [selectedPersonId, setSelectedPersonId] = React.useState<string | null>(null)
  const [profileData, setProfileData] = React.useState<ProfileDetailData | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false)

  const fetchPeople = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim().length > 0) params.append("search", searchQuery.trim())
      if (departmentFilter !== "ALL") params.append("department", departmentFilter)
      if (activeTab !== "ALL") params.append("role", activeTab)

      const data = await apiClient.get<PersonDTO[]>(`/users/directory?${params.toString()}`)
      setPeople(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn("Fetch people error:", err)
      setPeople([])
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, departmentFilter, activeTab])

  React.useEffect(() => {
    fetchPeople()
  }, [fetchPeople])

  // Open & Fetch Profile
  const handleOpenProfile = async (personId: string) => {
    setSelectedPersonId(personId)
    setIsLoadingProfile(true)
    setProfileData(null)

    try {
      const res = await apiClient.get<ProfileDetailData>(`/users/profile/${personId}`)
      setProfileData(res)
    } catch (err) {
      console.warn("Failed to fetch person profile:", err)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handleStartMessage = (personId: string) => {
    setSelectedPersonId(null)
    router.push(`/app/messages`)
  }

  // Unique departments for filter dropdown
  const departments = Array.from(new Set(people.map((p) => p.department).filter(Boolean)))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="size-6 text-primary" />
              Campus People Directory
            </h1>
            <Badge variant="outline" className="text-xs">
              {user?.instituteCode || "College"} Verified
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Discover verified faculty coordinators, researchers, and student peers across campus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchPeople()}
            className="text-xs font-semibold"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Search & Filters Bar */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Role Filter Tabs */}
          <div className="flex items-center p-1 rounded-lg bg-muted/60 border border-border w-fit text-xs font-medium">
            {(["ALL", "FACULTY", "STUDENT", "ADMIN"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === tab
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "ALL" ? "All Members" : tab === "FACULTY" ? "Faculty & HoDs" : tab === "STUDENT" ? "Students" : "Administration"}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Department:
            </span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-8.5 rounded-md border border-border bg-background px-2.5 text-xs text-foreground shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative pt-1 border-t border-border/50">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by person name, roll number, or institutional designation..."
            className="h-9 pl-9 text-xs bg-background"
          />
        </div>
      </div>

      {/* 3. People Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
          <RefreshCw className="size-5 animate-spin text-primary" />
          <span>Searching campus directory...</span>
        </div>
      ) : people.length === 0 ? (
        <div className="py-20 text-center text-xs text-muted-foreground rounded-xl border border-border bg-card p-8 space-y-2">
          <Users className="size-8 text-muted-foreground/40 mx-auto" />
          <p className="font-semibold text-foreground">No Verified Members Found</p>
          <p>No students or faculty match your search filter in your college.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => {
            const isFaculty = person.role === "FACULTY"
            const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(person.role)
            const isPrivateStudent = person.role === "STUDENT" && person.profileVisibility === "PRIVATE"

            return (
              <div
                key={person.id}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Top: Avatar, Name, Online Dot, Role Badge */}
                  <div className="flex items-start gap-3">
                    <Avatar className="size-11 rounded-xl border border-border bg-primary/10 text-primary font-bold text-sm shrink-0 relative">
                      <AvatarImage src={person.avatarUrl} alt={person.name} />
                      <AvatarFallback>
                        {person.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                      {person.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                      )}
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenProfile(person.id)}
                          className="text-left text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors hover:underline focus:outline-none"
                        >
                          {person.name}
                        </button>
                        <ShieldCheck className="size-3.5 text-primary shrink-0" />
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge
                          variant={isAdmin ? "default" : isFaculty ? "secondary" : "outline"}
                          className="text-[9px] h-4 px-1.5 py-0 font-bold"
                        >
                          {person.role}
                        </Badge>

                        {isPrivateStudent && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 gap-0.5 text-amber-600 border-amber-300 dark:text-amber-400">
                            <Lock className="size-2.5" /> Private
                          </Badge>
                        )}

                        {person.dmPermission === "FACULTY_ONLY" && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 gap-0.5 text-muted-foreground">
                            <Lock className="size-2.5" /> DMs Protected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metadata: Department, Academic Year, Institutional Roll Number */}
                  <div className="space-y-1.5 text-xs pt-1 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="size-3.5 text-primary shrink-0" />
                      <span className="truncate">{person.department}</span>
                    </div>

                    {person.academicYear && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <GraduationCap className="size-3.5 text-primary shrink-0" />
                        <span>{person.academicYear} {person.semester ? `• ${person.semester}` : ""}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">ID / Roll:</span>
                      <span className="font-mono text-xs font-semibold text-foreground">{person.institutionalId}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions: View Profile & Direct Message */}
                <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenProfile(person.id)}
                    className="h-8 text-xs font-semibold gap-1 hover:bg-muted"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                    Profile
                  </Button>

                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleStartMessage(person.id)}
                    className="h-8 text-xs font-semibold gap-1"
                  >
                    <MessageSquare className="size-3.5" />
                    Message
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 4. Interactive Profile View Modal (Instagram-Style Privacy Aware) */}
      <Dialog open={Boolean(selectedPersonId)} onOpenChange={(open) => !open && setSelectedPersonId(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border bg-card">
          {isLoadingProfile ? (
            <div className="py-24 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <RefreshCw className="size-5 animate-spin text-primary" />
              <span>Retrieving campus profile...</span>
            </div>
          ) : profileData ? (
            <div className="relative">
              {/* Header Gradient Banner */}
              <div className="h-28 w-full bg-gradient-to-r from-primary/80 via-primary to-indigo-600 relative">
                <div className="absolute inset-0 bg-grid-white/10" />
                <div className="absolute top-3 right-3">
                  <Badge className="bg-black/30 backdrop-blur-md text-white border-white/20 font-mono text-[10px]">
                    {profileData.user.role}
                  </Badge>
                </div>
              </div>

              {/* Profile Details Container */}
              <div className="px-5 pb-5 -mt-12 space-y-4">
                {/* Avatar and Basic Header */}
                <div className="flex items-end justify-between gap-3">
                  <Avatar className="h-20 w-20 rounded-2xl border-4 border-card shadow-lg bg-muted ring-1 ring-border">
                    <AvatarImage src={profileData.user.avatarUrl || undefined} alt={profileData.user.name} />
                    <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                      {profileData.user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {profileData.user.isOnline && (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 dark:text-emerald-400 mb-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                      Active Now
                    </Badge>
                  )}
                </div>

                {/* Name & Academic Meta */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">{profileData.user.name}</h3>
                    <ShieldCheck className="size-4 text-primary shrink-0" />
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-primary shrink-0" />
                    {profileData.user.department}
                  </p>

                  {profileData.user.academicYear && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <GraduationCap className="size-3.5 text-primary shrink-0" />
                      {profileData.user.degreeProgram ? `${profileData.user.degreeProgram} • ` : ""}
                      {profileData.user.academicYear} {profileData.user.semester ? `• ${profileData.user.semester}` : ""}
                    </p>
                  )}

                  {profileData.user.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Mail className="size-3.5 text-primary shrink-0" />
                      {profileData.user.email}
                    </p>
                  )}
                </div>

                {/* IF PRIVATE PROFILE: Instagram-Style Lock Screen */}
                {profileData.isPrivate ? (
                  <div className="p-6 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center space-y-2.5">
                    <div className="size-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                      <Lock className="size-6" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">This Scholar Profile is Private</h4>
                    <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      This student has enabled scholar privacy mode. Detailed academic statement, research biography, and campus activity statistics are shielded.
                    </p>
                    <div className="pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleStartMessage(profileData.user.id)}
                        className="w-full text-xs font-semibold gap-1.5"
                      >
                        <MessageSquare className="size-3.5" />
                        Send Direct Message
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* IF PUBLIC PROFILE: Bio and Full Activity Stats */
                  <div className="space-y-4 pt-1">
                    {/* Student Academic Identification Panel */}
                    {profileData.user.role === "STUDENT" && (
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Division & Batch</span>
                            <span className="font-semibold text-foreground">
                              {profileData.user.division || "Div A"} {profileData.user.batchSection ? `• ${profileData.user.batchSection}` : ""}
                            </span>
                          </div>
                          {profileData.user.institutionalId && (
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Roll / ID</span>
                              <span className="font-mono text-foreground font-semibold">{profileData.user.institutionalId}</span>
                            </div>
                          )}
                          {profileData.user.prnNumber && (
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">PRN Number</span>
                              <span className="font-mono text-foreground font-medium">{profileData.user.prnNumber}</span>
                            </div>
                          )}
                          {profileData.user.bloodGroup && (
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Blood Group</span>
                              <span className="font-semibold text-foreground">{profileData.user.bloodGroup}</span>
                            </div>
                          )}
                        </div>

                        {profileData.user.mentor && (
                          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Class Coordinator:</span>
                            <span className="font-semibold text-primary">Prof. {profileData.user.mentor.name}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Campus Roles */}
                    {profileData.user.campusRoles && profileData.user.campusRoles.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
                          <Award className="size-3 text-primary" />
                          Campus Roles & Honors
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {profileData.user.campusRoles.map((role, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-2 font-medium">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Portfolio and Social Profiles */}
                    {profileData.user.links && (profileData.user.links.github || profileData.user.links.linkedin || profileData.user.links.portfolio) && (
                      <div className="flex flex-wrap gap-2">
                        {profileData.user.links.github && (
                          <a
                            href={profileData.user.links.github.startsWith("http") ? profileData.user.links.github : `https://${profileData.user.links.github}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-0.5 bg-muted/30 hover:bg-muted/60 transition-colors"
                          >
                            <GithubIcon className="size-3" />
                            <span>GitHub</span>
                            <ExternalLink className="size-2.5 opacity-60" />
                          </a>
                        )}
                        {profileData.user.links.linkedin && (
                          <a
                            href={profileData.user.links.linkedin.startsWith("http") ? profileData.user.links.linkedin : `https://${profileData.user.links.linkedin}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-0.5 bg-muted/30 hover:bg-muted/60 transition-colors"
                          >
                            <LinkedinIcon className="size-3" />
                            <span>LinkedIn</span>
                            <ExternalLink className="size-2.5 opacity-60" />
                          </a>
                        )}
                        {profileData.user.links.portfolio && (
                          <a
                            href={profileData.user.links.portfolio.startsWith("http") ? profileData.user.links.portfolio : `https://${profileData.user.links.portfolio}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-0.5 bg-muted/30 hover:bg-muted/60 transition-colors"
                          >
                            <Globe className="size-3" />
                            <span>Portfolio</span>
                            <ExternalLink className="size-2.5 opacity-60" />
                          </a>
                        )}
                      </div>
                    )}

                    {profileData.user.bio && (
                      <div className="p-3 rounded-xl bg-muted/50 border border-border/80 text-xs text-muted-foreground leading-relaxed">
                        {profileData.user.bio}
                      </div>
                    )}

                    {/* Stats Grid */}
                    {profileData.stats && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg border border-border bg-card/50 flex items-center gap-2">
                          <FileText className="size-4 text-blue-500" />
                          <div>
                            <p className="font-bold text-foreground">{profileData.stats.complaintsFiled}</p>
                            <p className="text-[10px] text-muted-foreground">Grievances</p>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg border border-border bg-card/50 flex items-center gap-2">
                          <Vote className="size-4 text-purple-500" />
                          <div>
                            <p className="font-bold text-foreground">{profileData.stats.votesCast}</p>
                            <p className="text-[10px] text-muted-foreground">Poll Votes</p>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg border border-border bg-card/50 flex items-center gap-2">
                          <FolderGit2 className="size-4 text-amber-500" />
                          <div>
                            <p className="font-bold text-foreground">{profileData.stats.filesShared}</p>
                            <p className="text-[10px] text-muted-foreground">Files Shared</p>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg border border-border bg-card/50 flex items-center gap-2">
                          <Bell className="size-4 text-emerald-500" />
                          <div>
                            <p className="font-bold text-foreground">{profileData.stats.noticesPublished}</p>
                            <p className="text-[10px] text-muted-foreground">Notices</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      size="sm"
                      onClick={() => handleStartMessage(profileData.user.id)}
                      className="w-full text-xs font-semibold gap-1.5"
                    >
                      <MessageSquare className="size-3.5" />
                      Send Direct Message
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
