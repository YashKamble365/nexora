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
  SUPER_ADMIN: { email: "superadmin@nexora.edu", password: "super123" },
}

export function parseJwtPayload(token: string): any {
  try {
    const parts = token.split(".")
    if (parts.length < 2) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function getValidToken(): string | null {
  if (typeof window === "undefined") return null
  const existing = localStorage.getItem("nexora_token")
  if (!existing) return null

  const payload = parseJwtPayload(existing)
  if (!payload) {
    localStorage.removeItem("nexora_token")
    document.cookie = "nexora_token=; path=/; max-age=0"
    return null
  }

  if (payload.exp && payload.exp < Date.now() / 1000) {
    localStorage.removeItem("nexora_token")
    document.cookie = "nexora_token=; path=/; max-age=0"
    return null
  }

  const storedUserStr = localStorage.getItem("nexora_user")
  if (storedUserStr) {
    try {
      const storedUser = JSON.parse(storedUserStr)
      if (
        (storedUser.email && payload.email && storedUser.email.toLowerCase() !== payload.email.toLowerCase()) ||
        (storedUser.role && payload.role && storedUser.role !== payload.role)
      ) {
        localStorage.removeItem("nexora_token")
        document.cookie = "nexora_token=; path=/; max-age=0"
        return null
      }
    } catch {}
  }

  return existing
}

let obtainTokenPromise: Promise<string | null> | null = null

export async function obtainToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  const valid = getValidToken()
  if (valid) return valid

  if (obtainTokenPromise) return obtainTokenPromise

  obtainTokenPromise = (async () => {
    try {
      const storedUserStr = localStorage.getItem("nexora_user")
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr)
        if (storedUser.role === "SUPER_ADMIN" || storedUser.email === DEMO_CREDENTIALS.SUPER_ADMIN.email) {
          const base = getApiBase()
          const res = await fetch(`${base}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(DEMO_CREDENTIALS.SUPER_ADMIN),
          })

          if (res.ok) {
            const data = await res.json()
            if (data.token) {
              localStorage.setItem("nexora_token", data.token)
              document.cookie = `nexora_token=${data.token}; path=/; max-age=604800`
              return data.token
            }
          }
        }
      }
    } catch {
      // API unavailable
    } finally {
      obtainTokenPromise = null
    }
    return null
  })()

  return obtainTokenPromise
}

async function request<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  let token = getValidToken()

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

  // Transparently retry once on 401 UNAUTHORIZED or 403 FORBIDDEN (stale/mismatched session)
  if ((response.status === 401 || response.status === 403) && !isRetry && typeof window !== "undefined") {
    localStorage.removeItem("nexora_token")
    document.cookie = "nexora_token=; path=/; max-age=0"
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
