export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/proxy"

export const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:4000/api"

export function getAssetUrl(url?: string | null) {
  if (!url) return undefined
  if (url.startsWith("http")) return url
  if (url.startsWith("undefined/")) {
    return `https://pub-055e43670ea7462fb9dfe8e3cb7f222a.r2.dev/${url.replace("undefined/", "")}`
  }
  if (url.startsWith("/uploads/")) {
    const assetBase =
      process.env.NEXT_PUBLIC_ASSET_URL ||
      (process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")
        : "")

    return `${assetBase}${url}`
  }

  return url
}

export async function fetchAPI<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isServer = typeof window === "undefined"
  const base = isServer ? BACKEND_API_URL : API_BASE_URL
  const url = `${base}${endpoint}`
  const isFormData = options.body instanceof FormData

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...((options.headers as Record<string, string>) || {}),
  }

  if (isServer && !headers.Authorization) {
    try {
      const { getSession } = await import("./session")
      const session = await getSession()
      if (session) {
        headers.Authorization = `Bearer ${session}`
      }
    } catch {
      // Server actions without a request context can still call public endpoints.
    }
  }

  let response: Response
  try {
    response = await fetch(url, {
      credentials: "include",
      ...options,
      headers,
      cache: options.cache ?? "no-store",
    })
  } catch {
    throw new Error("Tidak dapat terhubung ke server API")
  }

  const contentType = response.headers.get("content-type") || ""
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.blob().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      try {
        const { clearClientSession } = await import("./session")
        clearClientSession()
        window.location.href = "/auth/login?expired=true"
      } catch (e) {
        console.error("Failed to redirect", e)
      }
    }
    const err: any = new Error((data as any)?.error || "Terjadi kesalahan pada server")
    err.status = response.status
    err.data = data
    throw err
  }

  return data as T
}
