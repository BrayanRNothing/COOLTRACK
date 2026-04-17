const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export function getToken() {
  return localStorage.getItem('cooltrack_token')
}

export function setToken(token) {
  localStorage.setItem('cooltrack_token', token)
}

export function removeToken() {
  localStorage.removeItem('cooltrack_token')
}

export async function apiFetch(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de conexión con el servidor.' }))
    throw new Error(error.message || `Error ${response.status}`)
  }

  if (response.status === 204) return null
  return response.json()
}

export async function apiUpload(file) {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error al subir archivo.' }))
    throw new Error(error.message)
  }
  return response.json() // { url, publicId }
}
