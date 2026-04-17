import { apiFetch, setToken, removeToken } from './api'

export async function login(username, password) {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
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
