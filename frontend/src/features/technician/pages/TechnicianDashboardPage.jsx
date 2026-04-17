import { useState, useEffect, useCallback } from 'react'
import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import { useWorkData } from '../../../app/providers/useWorkData'
import { useNavigate } from 'react-router-dom'

const estadoBadge = { PENDIENTE: 'badge-warning', EN_PROGRESO: 'badge-info', COMPLETADA: 'badge-success' }

export default function TechnicianDashboardPage() {
  const { getAsignaciones } = useWorkData()
  const navigate = useNavigate()

  const [asignaciones, setAsignaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const data = await getAsignaciones()
      setAsignaciones(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [getAsignaciones])

  useEffect(() => { fetchData() }, [fetchData])

  const pending = asignaciones.filter(a => a.estado !== 'COMPLETADA')
  const columns = [
    { key: 'cliente', header: 'Cliente', render: row => (
      <div>
        <div className="font-medium">{row.cliente?.nombreOEmpresa}</div>
        {row.cliente?.ciudad && <div className="text-xs text-base-content/60">{row.cliente.ciudad}</div>}
      </div>
    )},
    { key: 'notas', header: 'Instrucciones', render: row => {
      let texto = row.notas
      try {
        const parsed = JSON.parse(row.notas)
        if (parsed?.instrucciones) texto = parsed.instrucciones
        else if (parsed) texto = null // If it's the new format but no instructions, show placeholder
      } catch (e) {}
      
      return (
        <div className="max-w-xs truncate text-sm" title={texto || 'Generales'}>
          {texto || <span className="italic text-base-content/40 text-xs">Sin instrucciones específicas</span>}
        </div>
      )
    }},
    { key: 'fechaProgramada', header: 'Fecha', render: row => {
      const date = new Date(row.fechaProgramada)
      return (
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight">{row.fechaProgramada?.slice(0, 10)}</span>
          <span className="text-[10px] font-bold uppercase opacity-40">Programado</span>
        </div>
      )
    }},
    { key: 'mantenimientos', header: 'Equipos', render: row => {
      let countText = 'Todos'
      try {
        const parsed = JSON.parse(row.notas)
        if (parsed?.condensadoresSeleccionados) {
          countText = `${parsed.condensadoresSeleccionados.length} equipos`
        }
      } catch (e) {}

      return (
        <div className="flex flex-col items-center">
          <span className="badge badge-sm badge-outline font-bold">{countText}</span>
        </div>
      )
    }},
    { key: 'estado', header: 'Estado', render: row => {
      const colorClass = estadoBadge[row.estado] || 'badge-ghost'
      return (
        <span className={`badge ${colorClass} badge-sm font-bold px-3`}>
          {row.estado}
        </span>
      )
    }},
  ]

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg" /></div>
  if (error) return <div className="alert alert-error mt-4">{error}</div>

  return (
    <section>
      <PageHeader title="Mis Trabajos Pendientes" subtitle="Asignaciones activas que requieren atención." />
      <DataTable
        columns={columns}
        rows={pending}
        emptyMessage="No tienes trabajos pendientes."
        onRowClick={(row) => navigate(`/tecnico/dashboard/mision/${row.id}`)}
      />
    </section>
  )
}
