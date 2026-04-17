import { apiFetch } from './api'

export const getUsuarios = () => apiFetch('/api/usuarios')
export const getTecnicos = () => apiFetch('/api/usuarios/tecnicos')
export const getUsuario = (id) => apiFetch(`/api/usuarios/${id}`)
export const createUsuario = (data) => apiFetch('/api/usuarios', { method: 'POST', body: JSON.stringify(data) })
export const updateUsuario = (id, data) => apiFetch(`/api/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteUsuario = (id) => apiFetch(`/api/usuarios/${id}`, { method: 'DELETE' })
