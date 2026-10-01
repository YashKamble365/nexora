"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Building2,
  CheckCircle2,
  GraduationCap,
  IdCard,
  Lock,
  Mail,
  ShieldAlert,
  User,
  UserCheck,
  School,
  ArrowRight,
  Search,
  BookOpen,
  Plus,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Role, FacultyRole, InstituteDTO } from "@nexora/types"
import { getApiBase } from "@/lib/api"

const FALLBACK_INSTITUTES: Partial<InstituteDTO>[] = [
  {
    id: "6abb8acb449cedc939683481",
    name: "P. R. Pote Patil College of Engineering and Management",
    code: "PRPCEM",
    departments: [
      "Computer Science & Engineering",
      "Artificial Intelligence & Data Science",
      "Information Technology",
      "Electronics & Telecommunication",
      "Mechanical Engineering",
      "Civil Engineering",
    ],
    academicYears: ["First Year", "Second Year", "Third Year", "Final Year"],
    semesters: [
      "Semester 1",
      "Semester 2",
      "Semester 3",
      "Semester 4",
      "Semester 5",
      "Semester 6",
      "Semester 7",
      "Semester 8",
    ],
  },
  {
    id: "6abb8acb449cedc939683482",
    name: "COEP Technological University",
    code: "COEP",
    departments: [
      "Computer Engineering",
      "Information Technology",
      "Electronics & Telecommunication",
      "Mechanical Engineering",
      "Electrical Engineering",
    ],
    academicYears: ["First Year", "Second Year", "Third Year", "Final Year"],
    semesters: [
      "Semester 1",
      "Semester 2",
      "Semester 3",
      "Semester 4",
      "Semester 5",
      "Semester 6",
      "Semester 7",
      "Semester 8",
    ],
  },
  {
    id: "inst_med_01",
    name: "Apex Institute of Medical Sciences & Research",
    code: "AIMSR",
    departments: [
      "General Medicine",
      "Surgery & Anaesthesiology",
      "Pathology & Microbiology",
      "Community Medicine",
      "Pediatrics",
    ],
    academicYears: ["Phase I (Year 1)", "Phase II (Year 2)", "Phase III Part 1", "Phase III Part 2"],
    semesters: ["Term 1", "Term 2", "Term 3", "Term 4", "Term 5", "Term 6", "Term 7", "Term 8", "Term 9"],
  },
  {
    id: "inst_law_01",
    name: "National Academy of Legal Studies & Research",
    code: "NALSAR",
    departments: [
      "Constitutional Law",
      "Corporate & Intellectual Property",
      "Criminal Jurisprudence",
      "International Trade Law",
    ],
    academicYears: ["First Year", "Second Year", "Third Year", "Fourth Year", "Fifth Year"],
    semesters: [
      "Semester 1",
      "Semester 2",
      "Semester 3",
      "Semester 4",
      "Semester 5",
      "Semester 6",
      "Semester 7",
      "Semester 8",
      "Semester 9",
      "Semester 10",
    ],
  },
]

function RegisterForm() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") === "institute" ? "institute" : "user"

  const [activeTab, setActiveTab] = React.useState<"user" | "institute">(initialTab)
  const [institutes, setInstitutes] = React.useState<Partial<InstituteDTO>[]>(FALLBACK_INSTITUTES)

  // User form state
  const [name, setName] = React.useState("")
  const [institutionalId, setInstitutionalId] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [selectedInstituteId, setSelectedInstituteId] = React.useState(FALLBACK_INSTITUTES[0].id || "")
  const [department, setDepartment] = React.useState("Computer Science & Engineering")
  const [role, setRole] = React.useState<Role>("STUDENT")
  const [academicYear, setAcademicYear] = React.useState("Final Year")
  const [semester, setSemester] = React.useState("Semester 7")
  const [facultyRole, setFacultyRole] = React.useState<FacultyRole>("CLASS_COORDINATOR")
  const [coordinatorYear, setCoordinatorYear] = React.useState("Final Year")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  // Faculty Teaching Assignments State
  const [catalogSubjects, setCatalogSubjects] = React.useState<
    { name: string; code?: string; semester: string; academicYear: string }[]
  >([])
  const [teachingAssignments, setTeachingAssignments] = React.useState<
    { academicYear: string; semester: string; subjectName: string; subjectCode: string; division: string }[]
  >([
    {
      academicYear: "Second Year",
      semester: "Semester 3",
      subjectName: "",
      subjectCode: "",
      division: "A",
    },
  ])

  const addTeachingAssignment = () => {
    setTeachingAssignments((prev) => [
      ...prev,
      {
        academicYear: academicYears[0] || "Second Year",
        semester: semesters[0] || "Semester 3",
        subjectName: "",
        subjectCode: "",
        division: "A",
      },
    ])
  }

  const removeTeachingAssignment = (index: number) => {
    setTeachingAssignments((prev) => prev.filter((_, i) => i !== index))
  }

  const updateTeachingAssignment = (index: number, field: string, value: string) => {
    setTeachingAssignments((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  // Fetch department subjects catalog when institute or department changes
  React.useEffect(() => {
    if (!selectedInstituteId || !department) return
    fetch(`${getApiBase()}/institutes/${selectedInstituteId}/subjects?department=${encodeURIComponent(department)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.subjects) {
          setCatalogSubjects(data.subjects)
        }
      })
      .catch(() => {})
  }, [selectedInstituteId, department])

  // Institute registration form state
  const [collegeName, setCollegeName] = React.useState("")
  const [collegeCode, setCollegeCode] = React.useState("")
  const [collegeAddress, setCollegeAddress] = React.useState("")
  const [collegeDomain, setCollegeDomain] = React.useState("")
  const [adminName, setAdminName] = React.useState("")
  const [adminEmail, setAdminEmail] = React.useState("")
  const [adminPassword, setAdminPassword] = React.useState("")
  const [adminInstitutionalId, setAdminInstitutionalId] = React.useState("")

  // State management
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [submittedMessage, setSubmittedMessage] = React.useState<{
    title: string;
    description: string;
    authority: string;
  } | null>(null)

  // Fetch registered & approved institutes
  React.useEffect(() => {
    fetch(`${getApiBase()}/institutes`)
      .then((res) => res.json())
      .then((data) => {
        if (data.institutes && data.institutes.length > 0) {
          const mapped = data.institutes.map((i: Record<string, unknown>) => ({
            id: i._id || i.id,
            name: i.name,
            code: i.code,
            departments: (i.departments as string[]) || [],
            academicYears: (i.academicYears as string[]) || ["First Year", "Second Year", "Third Year", "Final Year"],
            semesters: (i.semesters as string[]) || [
              "Semester 1",
              "Semester 2",
              "Semester 3",
              "Semester 4",
              "Semester 5",
              "Semester 6",
              "Semester 7",
              "Semester 8",
            ],
          }))
          setInstitutes(mapped)
          setSelectedInstituteId((prev) => {
            const exists = mapped.some((m: { id: string }) => m.id === prev)
            return exists ? prev : (mapped[0].id || "")
          })
        }
      })
      .catch(() => {
        // Fallback to static seed
      })
  }, [])

  // Search filters
  const [instituteSearch, setInstituteSearch] = React.useState("")
  const [deptSearch, setDeptSearch] = React.useState("")

  // Current selected institute structure (ONLY admin-configured items)
  const activeInstitute = institutes.find((i) => i.id === selectedInstituteId) || institutes[0]
  const departments = activeInstitute?.departments || []
  const academicYears = activeInstitute?.academicYears || ["First Year", "Second Year", "Third Year", "Final Year"]
  const semesters = activeInstitute?.semesters || [
    "Semester 1",
    "Semester 2",
    "Semester 3",
    "Semester 4",
    "Semester 5",
    "Semester 6",
    "Semester 7",
    "Semester 8",
  ]

  // Filtered lists for quick search
  const filteredInstitutes = institutes.filter((inst) => {
    const q = instituteSearch.toLowerCase()
    return (
      (inst.name && inst.name.toLowerCase().includes(q)) ||
      (inst.code && inst.code.toLowerCase().includes(q))
    )
  })

  const filteredDepartments = departments.filter((d) =>
    d.toLowerCase().includes(deptSearch.toLowerCase())
  )

  // Automatically sync defaults when active institute changes
  React.useEffect(() => {
    if (departments.length > 0 && !departments.includes(department)) {
      setDepartment(departments[0])
    }
    if (academicYears.length > 0 && !academicYears.includes(academicYear)) {
      setAcademicYear(academicYears[0])
    }
    if (academicYears.length > 0 && !academicYears.includes(coordinatorYear)) {
      setCoordinatorYear(academicYears[0])
    }
    if (semesters.length > 0 && !semesters.includes(semester)) {
      setSemester(semesters[0])
    }
  }, [selectedInstituteId, departments, academicYears, semesters])

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${getApiBase()}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          institutionalId,
          instituteId: selectedInstituteId,
          department,
          role,
          academicYear: role === "STUDENT" ? academicYear : undefined,
          semester: role === "STUDENT" ? semester : undefined,
          facultyRole: role === "FACULTY" ? facultyRole : undefined,
          coordinatorYear: role === "FACULTY" && facultyRole === "CLASS_COORDINATOR" ? coordinatorYear : undefined,
          teachingAssignments:
            role === "FACULTY"
              ? teachingAssignments
                  .filter((t) => t.subjectName.trim().length > 0)
                  .map((t) => ({ ...t, department }))
              : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const detailsMsg = data.details
          ? Object.entries(data.details)
              .map(([field, errs]) => `${field}: ${(errs as string[]).join(", ")}`)
              .join("; ")
          : null
        throw new Error(data.message || detailsMsg || "Registration failed")
      }

      setSubmittedMessage({
        title: "Registration Application Submitted",
        description: data.message,
        authority:
          role === "STUDENT"
            ? `Your Class Coordinator (${coordinatorYear || academicYear} ${department}) or Department HoD`
            : "Your Institute Administrator / Principal",
      })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Registration failed. Please check institutional details.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInstituteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (adminPassword.length < 6) {
      setError("Admin password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${getApiBase()}/institutes/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: collegeName,
          code: collegeCode.toUpperCase(),
          address: collegeAddress,
          domain: collegeDomain || undefined,
          departments: [
            "Computer Science & Engineering",
            "Information Technology",
            "Artificial Intelligence & Data Science",
            "Electronics & Telecommunication",
            "Mechanical Engineering",
            "Civil Engineering",
          ],
          adminName,
          adminEmail,
          adminPassword,
          institutionalId: adminInstitutionalId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Institute registration failed")
      }

      setSubmittedMessage({
        title: "Institute Application Submitted",
        description: data.message,
        authority: "Nexora Platform Super Administrator",
      })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Institute registration failed")
      }
    } finally {
      setLoading(false)
    }
  }

  // Submitted confirmation screen
  if (submittedMessage) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {submittedMessage.title}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {submittedMessage.description}
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-card/60 text-left space-y-1.5 max-w-sm mx-auto text-xs">
          <span className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            Verification Authority
          </span>
          <p className="text-foreground font-medium">{submittedMessage.authority}</p>
          <p className="text-[11px] text-muted-foreground">
            Once approved, you will be able to sign in immediately using your registered credentials.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/auth/login">
            <Button className="w-full text-xs h-9">
              Return to Sign In <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center sm:text-left">
        <h2 className="text-2xl font-bold tracking-tight">Institutional Registration Gateway</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Apply for verified campus member access or onboard your college onto the Nexora grid.
        </p>
      </div>

      {/* Two-Track Mode Switcher */}
      <div className="grid grid-cols-2 p-1.5 rounded-xl bg-muted/60 border border-border text-xs font-semibold gap-1 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setActiveTab("user")
            setError(null)
          }}
          className={`py-2 px-3 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
            activeTab === "user"
              ? "bg-background text-foreground shadow-sm ring-1 ring-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <GraduationCap className="h-4 w-4 text-primary shrink-0" />
          <div className="text-center sm:text-left">
            <span className="block font-bold leading-none">Campus Member</span>
            <span className="text-[10px] text-muted-foreground font-normal hidden sm:inline">Student & Faculty</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("institute")
            setError(null)
          }}
          className={`py-2 px-3 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
            activeTab === "institute"
              ? "bg-background text-foreground shadow-sm ring-1 ring-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <School className="h-4 w-4 text-primary shrink-0" />
          <div className="text-center sm:text-left">
            <span className="block font-bold leading-none">Onboard College</span>
            <span className="text-[10px] text-muted-foreground font-normal hidden sm:inline">Executive Leadership</span>
          </div>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Student & Faculty Registration */}
      {activeTab === "user" && (
        <form onSubmit={handleUserSubmit} className="space-y-3.5">
          {/* Institute Selection with Search */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Select Educational Institute</label>
              <span className="text-[10px] text-muted-foreground">{filteredInstitutes.length} colleges</span>
            </div>
            <div className="space-y-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={instituteSearch}
                  onChange={(e) => setInstituteSearch(e.target.value)}
                  placeholder="Filter colleges (e.g. Engineering, Medical, Law, Code)..."
                  className="pl-8 text-xs h-7.5 bg-muted/30"
                />
              </div>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  value={selectedInstituteId}
                  onChange={(e) => setSelectedInstituteId(e.target.value)}
                  className="w-full h-9 pl-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                >
                  {filteredInstitutes.length === 0 ? (
                    <option value="" disabled>No college matches &ldquo;{instituteSearch}&rdquo;</option>
                  ) : (
                    filteredInstitutes.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.code})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty Member</option>
              </select>
            </div>

            {role === "STUDENT" ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Academic Year</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {academicYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {/* If Faculty: Prominent Designation Cards */}
          {role === "FACULTY" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Faculty Academic Role & Authority Level
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. HOD */}
                <div
                  onClick={() => setFacultyRole("HOD")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left ${
                    facultyRole === "HOD"
                      ? "border-purple-600 bg-purple-500/10 ring-1 ring-purple-600 shadow-xs"
                      : "border-border bg-card/60 hover:bg-muted/50"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                        <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>HoD</span>
                      </div>
                      <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400">
                        Dept Lead
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Head of Department. Approves faculty & students, manages subjects.
                    </p>
                  </div>
                  <div className="pt-2.5 flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    <span>{facultyRole === "HOD" ? "✓ Selected" : "Select Role"}</span>
                  </div>
                </div>

                {/* 2. Class Coordinator */}
                <div
                  onClick={() => setFacultyRole("CLASS_COORDINATOR")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left ${
                    facultyRole === "CLASS_COORDINATOR"
                      ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs"
                      : "border-border bg-card/60 hover:bg-muted/50"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                        <UserCheck className="h-4 w-4 text-primary shrink-0" />
                        <span>Coordinator</span>
                      </div>
                      <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        Batch Verifier
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Oversees assigned year batch. Verifies incoming student applications.
                    </p>
                  </div>
                  <div className="pt-2.5 flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <span>{facultyRole === "CLASS_COORDINATOR" ? "✓ Selected" : "Select Role"}</span>
                  </div>
                </div>

                {/* 3. Professor */}
                <div
                  onClick={() => setFacultyRole("PROFESSOR")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left ${
                    facultyRole === "PROFESSOR"
                      ? "border-blue-600 bg-blue-500/10 ring-1 ring-blue-600 shadow-xs"
                      : "border-border bg-card/60 hover:bg-muted/50"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                        <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Professor</span>
                      </div>
                      <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                        Academic
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Course instruction, notes upload, syllabus delivery & student engagement.
                    </p>
                  </div>
                  <div className="pt-2.5 flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    <span>{facultyRole === "PROFESSOR" ? "✓ Selected" : "Select Role"}</span>
                  </div>
                </div>
              </div>

              {/* HoD Specific Authority Callout */}
              {facultyRole === "HOD" && (
                <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 text-xs space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-semibold text-purple-600 dark:text-purple-400">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span>Head of Department Executive Scope: {department}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Registering as HoD turns your dashboard into the <strong>Department Command Center</strong> for <strong>{department}</strong> (approval queue for faculty and students, subject creation, and grievance triage). Verification is conducted directly by the <strong>Campus Administrator</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* If Student, select Semester */}
          {role === "STUDENT" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Current Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If Class Coordinator, select Year of coordination */}
          {role === "FACULTY" && facultyRole === "CLASS_COORDINATOR" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Assigned Coordination Year (You verify this batch)
              </label>
              <select
                value={coordinatorYear}
                onChange={(e) => setCoordinatorYear(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {academicYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If Faculty: Multi-class & Multi-subject Teaching Assignment Builder */}
          {role === "FACULTY" && (
            <div className="space-y-2.5 p-3.5 sm:p-4 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <label className="text-xs font-semibold text-foreground">Teaching Assignments & Classes</label>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">{teachingAssignments.length} class(es)</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Add classes and subjects you teach (e.g. Sem 2 & Sem 5). You can add or modify assignments anytime in your profile.
              </p>

              <div className="space-y-2.5 pt-1">
                {teachingAssignments.map((assignment, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border/80 bg-background space-y-2.5 text-xs shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground">Class #{idx + 1}</span>
                      {teachingAssignments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTeachingAssignment(idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors text-[11px] flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
                      <div className="lg:col-span-3">
                        <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Year / Class</label>
                        <select
                          value={assignment.academicYear}
                          onChange={(e) => updateTeachingAssignment(idx, "academicYear", e.target.value)}
                          className="w-full h-8.5 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-ring"
                        >
                          {academicYears.map((yr) => (
                            <option key={yr} value={yr}>
                              {yr}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="lg:col-span-3">
                        <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Semester</label>
                        <select
                          value={assignment.semester}
                          onChange={(e) => updateTeachingAssignment(idx, "semester", e.target.value)}
                          className="w-full h-8.5 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-ring"
                        >
                          {semesters.map((sem) => (
                            <option key={sem} value={sem}>
                              {sem}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="lg:col-span-4">
                        <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Subject Name</label>
                        <Input
                          value={assignment.subjectName}
                          onChange={(e) => updateTeachingAssignment(idx, "subjectName", e.target.value)}
                          placeholder="e.g. Data Structures"
                          className="h-8.5 text-xs"
                          list={`catalog-subjects-${idx}`}
                          required
                        />
                        <datalist id={`catalog-subjects-${idx}`}>
                          {catalogSubjects.map((s, sIdx) => (
                            <option key={sIdx} value={s.name}>
                              {s.code ? `${s.code} - ${s.name}` : s.name}
                            </option>
                          ))}
                        </datalist>
                      </div>
                      <div className="lg:col-span-2">
                        <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Division (Opt)</label>
                        <Input
                          value={assignment.division}
                          onChange={(e) => updateTeachingAssignment(idx, "division", e.target.value)}
                          placeholder="e.g. A"
                          className="h-8.5 text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTeachingAssignment}
                  className="w-full h-8 text-xs border-dashed gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Another Class / Subject</span>
                </Button>
              </div>
            </div>
          )}

          {/* Department Selection with Search */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Department</label>
              <span className="text-[10px] text-muted-foreground">{filteredDepartments.length} available</span>
            </div>
            <div className="space-y-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder="Filter departments (e.g. computer, ai, mech, electrical)..."
                  className="pl-8 text-xs h-7.5 bg-muted/30"
                />
              </div>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                required
              >
                {filteredDepartments.length === 0 ? (
                  <option value="" disabled>
                    {deptSearch ? `No department matches "${deptSearch}"` : "No departments configured by institute admin yet"}
                  </option>
                ) : (
                  filteredDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Yash Kamble"
                  className="pl-9 text-xs h-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                {role === "STUDENT" ? "Roll / PRN No." : "Faculty Employee ID"}
              </label>
              <div className="relative">
                <IdCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={institutionalId}
                  onChange={(e) => setInstitutionalId(e.target.value)}
                  placeholder={role === "STUDENT" ? "26-CSE-015" : "EMP-CSE-001"}
                  className="pl-9 text-xs h-9"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@college.edu or personal email"
                className="pl-9 text-xs h-9"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 text-xs h-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Confirm</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 text-xs h-9"
                  required
                />
              </div>
            </div>
          </div>

          {/* Verification Hierarchy Helper Note */}
          <div className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-muted-foreground space-y-0.5">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-primary" />
              Approval Routing
            </span>
            <p className="text-[11px] leading-relaxed">
              {role === "STUDENT"
                ? `Your student registration will be routed to the ${academicYear} Coordinator of ${department} for verification.`
                : "Your faculty registration will be routed to your Institute Administrator for credential verification."}
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-9 text-xs font-semibold mt-1">
            {loading ? "Submitting Application..." : "Submit Registration Application"}
          </Button>
        </form>
      )}

      {/* Tab 2: College / Institute Registration */}
      {activeTab === "institute" && (
        <form onSubmit={handleInstituteSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">College / University Name</label>
            <div className="relative">
              <School className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. Government College of Engineering"
                className="pl-9 text-xs h-9"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">College Code (Unique)</label>
              <Input
                value={collegeCode}
                onChange={(e) => setCollegeCode(e.target.value)}
                placeholder="e.g. GCOEA or IITB"
                className="text-xs h-9 uppercase font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Official Email Domain</label>
              <Input
                value={collegeDomain}
                onChange={(e) => setCollegeDomain(e.target.value)}
                placeholder="e.g. gcoea.ac.in"
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Campus City & Address</label>
            <Input
              value={collegeAddress}
              onChange={(e) => setCollegeAddress(e.target.value)}
              placeholder="e.g. Gadge Nagar, Amravati, Maharashtra"
              className="text-xs h-9"
              required
            />
          </div>

          <div className="pt-2 border-t border-border">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Designated Campus Administrator Credentials
            </span>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Admin Full Name</label>
                <Input
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Principal Dr. Deshmukh"
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Admin Employee ID</label>
                <Input
                  value={adminInstitutionalId}
                  onChange={(e) => setAdminInstitutionalId(e.target.value)}
                  placeholder="e.g. ADM-001"
                  className="text-xs h-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 mb-3">
              <label className="text-xs font-semibold text-foreground">Official Admin Email</label>
              <Input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="principal@college.ac.in"
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Admin Password</label>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="text-xs h-9"
                required
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-muted-foreground space-y-0.5">
            <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5" />
              Super Admin Verification
            </span>
            <p className="text-[11px] leading-relaxed">
              Institutional registrations are audited and verified by Nexora Super Administrators before students and faculty can register under this campus.
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-9 text-xs font-semibold mt-1">
            {loading ? "Registering College..." : "Register Educational Institute"}
          </Button>
        </form>
      )}

      <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border">
        Already registered?{" "}
        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
          Sign in to existing account
        </Link>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading registration grid...</div>}>
      <RegisterForm />
    </React.Suspense>
  )
}
