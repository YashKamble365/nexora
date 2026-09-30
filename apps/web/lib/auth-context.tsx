"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Role, UserDTO, FacultyRole } from "@nexora/types"
import { getApiBase } from "@/lib/api"
import { updateSocketAuthToken } from "@/lib/use-socket"

export interface ExtendedUserDTO extends UserDTO {
  instituteId?: string;
  instituteName?: string;
  instituteCode?: string;
  facultyRole?: FacultyRole;
  coordinatorYear?: string;
}

export const DEMO_ACCOUNTS: Record<string, ExtendedUserDTO> = {
  STUDENT: {
    id: "usr_student_1",
    name: "Prathamesh Patange",
    email: "prathamesh.patange@prpcem.edu",
    role: "STUDENT",
    status: "ACTIVE",
    institutionalId: "26-CSE-014",
    department: "Computer Science & Engineering",
    academicYear: "Final Year",
    instituteId: "6abb8acb449cedc939683481",
    instituteName: "P. R. Pote Patil College of Engineering and Management",
    instituteCode: "PRPCEM",
    bio: "Lead coordinator for Community Engagement Project.",
    isOnline: true,
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-29T00:00:00Z",
  },
  COORDINATOR: {
    id: "usr_coord_1",
    name: "Prof. P. R. Maskare",
    email: "pr.maskare@prpcem.edu",
    role: "FACULTY",
    facultyRole: "CLASS_COORDINATOR",
    coordinatorYear: "Final Year",
    status: "ACTIVE",
    institutionalId: "EMP-CSE-012",
    department: "Computer Science & Engineering",
    instituteId: "6abb8acb449cedc939683481",
    instituteName: "P. R. Pote Patil College of Engineering and Management",
    instituteCode: "PRPCEM",
    bio: "Final Year Class Coordinator & Lab In-charge.",
    isOnline: true,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-09-29T00:00:00Z",
  },
  HOD: {
    id: "usr_hod_1",
    name: "Dr. Atul D. Raut",
    email: "atul.raut@prpcem.edu",
    role: "FACULTY",
    facultyRole: "HOD",
    status: "ACTIVE",
    institutionalId: "EMP-CSE-001",
    department: "Computer Science & Engineering",
    instituteId: "6abb8acb449cedc939683481",
    instituteName: "P. R. Pote Patil College of Engineering and Management",
    instituteCode: "PRPCEM",
    bio: "Head of Department & Project Guide.",
    isOnline: true,
    createdAt: "2025-06-01T00:00:00Z",
    updatedAt: "2026-09-29T00:00:00Z",
  },
  ADMIN: {
    id: "usr_admin_1",
    name: "Dean Administration",
    email: "admin@prpcem.edu",
    role: "ADMIN",
    status: "ACTIVE",
    institutionalId: "ADM-PRPCEM-01",
    department: "Institutional Administration",
    instituteId: "6abb8acb449cedc939683481",
    instituteName: "P. R. Pote Patil College of Engineering and Management",
    instituteCode: "PRPCEM",
    bio: "Campus administrative controller and security oversight.",
    isOnline: true,
    createdAt: "2025-06-01T00:00:00Z",
    updatedAt: "2026-09-29T00:00:00Z",
  },
  SUPER_ADMIN: {
    id: "usr_super_1",
    name: "Nexora Platform Controller",
    email: "superadmin@nexora.edu",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    institutionalId: "SYS-ROOT-00",
    department: "Platform Governance",
    bio: "Global multi-college governance and infrastructure root.",
    isOnline: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-09-29T00:00:00Z",
  },
  COEP_STUDENT: {
    id: "usr_coep_1",
    name: "Aditya Deshmukh",
    email: "aditya.deshmukh@coep.ac.in",
    role: "STUDENT",
    status: "ACTIVE",
    institutionalId: "24-CE-089",
    department: "Computer Engineering",
    academicYear: "Third Year",
    instituteId: "6abb8acb449cedc939683482",
    instituteName: "COEP Technological University",
    instituteCode: "COEP",
    bio: "Robotics and Embedded Systems club lead.",
    isOnline: true,
    createdAt: "2026-02-10T00:00:00Z",
    updatedAt: "2026-09-29T00:00:00Z",
  },
}

export const DEMO_PASSWORDS: Record<string, string> = {
  STUDENT: "student123",
  COORDINATOR: "faculty123",
  HOD: "faculty123",
  ADMIN: "admin123",
  SUPER_ADMIN: "super123",
  COEP_STUDENT: "student123",
}

interface AuthContextType {
  user: ExtendedUserDTO | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  switchDemoRole: (key: string) => Promise<void> | void;
  updateUser: (updatedFields: Partial<ExtendedUserDTO>) => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // Identical initial state on both SSR and client initial render to avoid hydration mismatch
  const [user, setUser] = React.useState<ExtendedUserDTO | null>(DEMO_ACCOUNTS.STUDENT)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("nexora_user")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (!parsed.instituteName) {
          if (typeof parsed.instituteId === "object" && parsed.instituteId?.name) {
            parsed.instituteName = parsed.instituteId.name
          } else if (parsed.email?.includes("prpcem.edu")) {
            parsed.instituteName = "P. R. Pote Patil College of Engineering and Management"
            parsed.instituteCode = "PRPCEM"
          } else if (parsed.email?.includes("coep.ac.in")) {
            parsed.instituteName = "COEP Technological University"
            parsed.instituteCode = "COEP"
          }
        }
        setUser(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  React.useEffect(() => {
    if (user) {
      document.cookie = `nexora_role=${user.role}; path=/; max-age=604800`
      document.cookie = `nexora_authenticated=true; path=/; max-age=604800`
    }
  }, [user])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("nexora_token")
      if (!token && user?.email) {
        const entry = Object.entries(DEMO_ACCOUNTS).find(
          ([_, acc]) => acc.email.toLowerCase() === user.email.toLowerCase()
        )
        const roleKey = entry ? entry[0] : "STUDENT"
        const pwd = DEMO_PASSWORDS[roleKey] || "student123"
        login(user.email, pwd).catch(() => {})
      }
    }
  }, [])

  const setAuthenticatedUser = (newUser: ExtendedUserDTO | null) => {
    if (newUser) {
      if (!newUser.instituteName) {
        if (typeof newUser.instituteId === "object" && (newUser.instituteId as any)?.name) {
          newUser.instituteName = (newUser.instituteId as any).name
        } else if (newUser.email?.includes("prpcem.edu")) {
          newUser.instituteName = "P. R. Pote Patil College of Engineering and Management"
          newUser.instituteCode = "PRPCEM"
        } else if (newUser.email?.includes("coep.ac.in")) {
          newUser.instituteName = "COEP Technological University"
          newUser.instituteCode = "COEP"
        }
      }
      if (!newUser.instituteCode && typeof newUser.instituteId === "object" && (newUser.instituteId as any)?.code) {
        newUser.instituteCode = (newUser.instituteId as any).code
      }
    }
    setUser(newUser)
    if (newUser) {
      localStorage.setItem("nexora_user", JSON.stringify(newUser))
      document.cookie = `nexora_role=${newUser.role}; path=/; max-age=604800`
      document.cookie = `nexora_authenticated=true; path=/; max-age=604800`
    } else {
      localStorage.removeItem("nexora_user")
      localStorage.removeItem("nexora_token")
      document.cookie = `nexora_role=; path=/; max-age=0`
      document.cookie = `nexora_authenticated=; path=/; max-age=0`
      document.cookie = `nexora_token=; path=/; max-age=0`
      updateSocketAuthToken(null)
    }
  }

  const login = async (email: string, password = "password123"): Promise<boolean> => {
    setIsLoading(true)

    try {
      const base = getApiBase()
      const res = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === "ACCOUNT_PENDING") {
          throw new Error(data.message || "Your account is currently pending approval by your Class Coordinator / HoD.")
        }
        if (data.error === "ACCOUNT_REJECTED") {
          throw new Error(data.message || "Your registration request was rejected by your institute.")
        }
        throw new Error(data.message || "Invalid email or password")
      }

      if (data.token) {
        localStorage.setItem("nexora_token", data.token)
        document.cookie = `nexora_token=${data.token}; path=/; max-age=604800`
        updateSocketAuthToken(data.token)
      }
      setAuthenticatedUser(data.user)
      return true
    } catch (err: unknown) {
      // If server unreachable, fallback to demo accounts for smooth DX
      const matchedDemo = Object.values(DEMO_ACCOUNTS).find((d) => d.email.toLowerCase() === email.toLowerCase())
      if (matchedDemo) {
        setAuthenticatedUser(matchedDemo)
        return true
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      const base = getApiBase()
      await fetch(`${base}/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch {
      // Ignore network errors on logout
    }
    updateSocketAuthToken(null)
    setAuthenticatedUser(null)
    router.push("/auth/login")
  }

  const switchDemoRole = async (key: string) => {
    const account = DEMO_ACCOUNTS[key] || DEMO_ACCOUNTS.STUDENT
    const password = DEMO_PASSWORDS[key] || "student123"
    try {
      await login(account.email, password)
    } catch {
      setAuthenticatedUser(account)
    }
    if (account.role === "ADMIN" || account.role === "SUPER_ADMIN") {
      router.push("/admin/dashboard")
    } else {
      router.push("/app")
    }
  }

  const updateUser = (updatedFields: Partial<ExtendedUserDTO>) => {
    setUser((prev) => {
      if (!prev) return null
      const merged = { ...prev, ...updatedFields }
      localStorage.setItem("nexora_user", JSON.stringify(merged))
      return merged
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        switchDemoRole,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
