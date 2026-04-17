import { apiFetch, setToken, removeToken } from './api'

export async function login(email, password) {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(data.token)
  return data // { token, user }
}

export async function getMe() {
  return apiFetch('/api/auth/me')
}

export function logout() {
  removeToken()
}
