import { apiFetch } from './api'

export const getClimasByCliente = (clienteId) => apiFetch(`/api/clientes/${clienteId}/climas`)
export const getAllClimas = () => apiFetch('/api/climas')
export const getClima = (id) => apiFetch(`/api/climas/${id}`)
export const getMantenimientosByClima = (id) => apiFetch(`/api/climas/${id}/mantenimientos`)
export const createClima = (data) => apiFetch('/api/climas', { method: 'POST', body: JSON.stringify(data) })
export const updateClima = (id, data) => apiFetch(`/api/climas/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteClima = (id) => apiFetch(`/api/climas/${id}`, { method: 'DELETE' })
