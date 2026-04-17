import { apiFetch, apiUpload } from './api'

export const getMantenimientos = () => apiFetch('/api/mantenimientos')
export const getMantenimiento = (id) => apiFetch(`/api/mantenimientos/${id}`)
export const createMantenimiento = (data) => apiFetch('/api/mantenimientos', { method: 'POST', body: JSON.stringify(data) })
export const deleteMantenimiento = (id) => apiFetch(`/api/mantenimientos/${id}`, { method: 'DELETE' })
export const uploadFoto = (file) => apiUpload(file)
