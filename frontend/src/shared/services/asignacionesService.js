import { apiFetch } from './api'

export const getAsignaciones = () => apiFetch('/api/asignaciones')
export const getAsignacion = (id) => apiFetch(`/api/asignaciones/${id}`)
export const createAsignacion = (data) => apiFetch('/api/asignaciones', { method: 'POST', body: JSON.stringify(data) })
export const updateAsignacion = (id, data) => apiFetch(`/api/asignaciones/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteAsignacion = (id) => apiFetch(`/api/asignaciones/${id}`, { method: 'DELETE' })
export const getMantenimientosByAsignacion = (id) => apiFetch(`/api/asignaciones/${id}/mantenimientos`)
