import { apiFetch } from './api'

export const getClientes = () => apiFetch('/api/clientes')
export const getCliente = (id) => apiFetch(`/api/clientes/${id}`)
export const createCliente = (data) => apiFetch('/api/clientes', { method: 'POST', body: JSON.stringify(data) })
export const updateCliente = (id, data) => apiFetch(`/api/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteCliente = (id) => apiFetch(`/api/clientes/${id}`, { method: 'DELETE' })
