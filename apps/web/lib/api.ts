export function getApiHost(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "");
  }
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:4000";
    }
    return "https://nexora-svl9.onrender.com";
  }
  return "https://nexora-svl9.onrender.com";
}

export function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  return `${getApiHost()}/api`;
}

export const API_BASE = getApiBase();

export const DEMO_CREDENTIALS: Record<string, { email: string; password: string }> = {
  STUDENT: { email: "prathamesh.patange@prpcem.edu", password: "student123" },
  COORDINATOR: { email: "pr.maskare@prpcem.edu", password: "faculty123" },
  HOD: { email: "atul.raut@prpcem.edu", password: "faculty123" },
  ADMIN: { email: "admin@prpcem.edu", password: "admin123" },
  SUPER_ADMIN: { email: "superadmin@nexora.edu", password: "super123" },
}

export async function obtainToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  const existing = localStorage.getItem("nexora_token")
  if (existing) return existing

  try {
    let email = DEMO_CREDENTIALS.STUDENT.email
    let password = DEMO_CREDENTIALS.STUDENT.password

    const storedUser = localStorage.getItem("nexora_user")
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        if (parsed.role === "ADMIN") {
          email = DEMO_CREDENTIALS.ADMIN.email
          password = DEMO_CREDENTIALS.ADMIN.password
        } else if (parsed.role === "SUPER_ADMIN") {
          email = DEMO_CREDENTIALS.SUPER_ADMIN.email
          password = DEMO_CREDENTIALS.SUPER_ADMIN.password
        } else if (parsed.facultyRole === "CLASS_COORDINATOR") {
          email = DEMO_CREDENTIALS.COORDINATOR.email
          password = DEMO_CREDENTIALS.COORDINATOR.password
        } else if (parsed.facultyRole === "HOD") {
          email = DEMO_CREDENTIALS.HOD.email
          password = DEMO_CREDENTIALS.HOD.password
        } else if (parsed.email) {
          email = parsed.email
        }
      } catch {
        // use default student
      }
    }

    const base = getApiBase()
    const res = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.token) {
        localStorage.setItem("nexora_token", data.token)
        document.cookie = `nexora_token=${data.token}; path=/; max-age=604800`
        return data.token
      }
    }
  } catch {
    // API unavailable
  }
  return null
}

async function request<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  let token = typeof window !== "undefined" ? localStorage.getItem("nexora_token") : null

  if (!token && typeof window !== "undefined") {
    token = await obtainToken()
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  const url = `${API_BASE}${cleanEndpoint}`

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Transparently retry once on 401 UNAUTHORIZED
  if (response.status === 401 && !isRetry && typeof window !== "undefined") {
    localStorage.removeItem("nexora_token")
    const freshToken = await obtainToken()
    if (freshToken) {
      return request<T>(endpoint, options, true)
    }
  }

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.statusText}`
    try {
      const errorData = await response.json()
      if (errorData.details && typeof errorData.details === "object") {
        const detailStrings = Object.entries(errorData.details)
          .map(([k, v]: any) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .filter(Boolean)
        const detailsJoined = detailStrings.join("; ")
        errorMsg = errorData.message
          ? `${errorData.message} (${detailsJoined})`
          : detailsJoined || errorData.error || errorMsg
      } else if (errorData.message) {
        errorMsg = errorData.message
      } else if (errorData.error) {
        errorMsg = errorData.error
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
}
