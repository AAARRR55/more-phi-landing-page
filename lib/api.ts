export type Customer = {
  id: string
  name: string
  email: string
  company?: string | null
  country?: string | null
  created_at: string
}

export type License = {
  id: string
  license_key: string
  product_id: string
  status: string
  activation_limit: number
  created_at: string
  activations?: Array<{ id: string; machine_id: string; daw?: string; activated_at: string; status: string }>
}

export type Order = {
  id: string
  product_id: string
  amount: number
  currency: string
  status: string
  created_at: string
  checkout_session_id?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL

export function getToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('more_phi_token')
}

export function setSession(token: string, customer: Customer) {
  window.localStorage.setItem('more_phi_token', token)
  window.localStorage.setItem('more_phi_customer', JSON.stringify(customer))
}

export function clearSession() {
  window.localStorage.removeItem('more_phi_token')
  window.localStorage.removeItem('more_phi_customer')
}

export function getStoredCustomer(): Customer | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem('more_phi_customer')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is not configured')
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) {
    throw new Error(data?.detail || 'Request failed')
  }
  return data as T
}

export const api = {
  product: () => request<Record<string, unknown>>('/api/product'),
  register: (body: { name: string; email: string; password: string; company?: string; country?: string }) =>
    request<{ access_token: string; customer: Customer }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ access_token: string; customer: Customer }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<Customer>('/api/auth/me'),
  createCheckout: () =>
    request<{ url: string; session_id: string }>('/api/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ origin_url: window.location.origin }),
    }),
  checkoutStatus: (sessionId: string) =>
    request<{ status: string; payment_status: string; order?: Order; license?: License; amount_total?: number; currency?: string }>(
      `/api/payments/checkout/status/${sessionId}`,
    ),
  orders: () => request<Order[]>('/api/orders'),
  licenses: () => request<License[]>('/api/licenses'),
  docsText: () => request<string>('/api/docs-text'),
}