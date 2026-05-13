import { useState, useEffect, useCallback } from 'react'
import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import { useWorkData } from '../../../app/providers/useWorkData'
import { useNavigate } from 'react-router-dom'

const estadoBadge = { 
  PENDIENTE: 'bg-amber-50 text-amber-600 border border-amber-100', 
  EN_PROGRESO: 'bg-blue-50 text-blue-600 border border-blue-100', 
  COMPLETADA: 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
}

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
        <div className="font-black text-slate-900 text-sm">{row.cliente?.nombreOEmpresa}</div>
        {row.cliente?.ciudad && <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{row.cliente.ciudad}</div>}
      </div>
    )},
    { key: 'notas', header: 'Instrucciones', render: row => {
      let texto = row.notas
      try {
        const parsed = JSON.parse(row.notas)
        if (parsed?.instrucciones) texto = parsed.instrucciones
        else if (parsed) texto = null
      } catch (e) {}
      
      return (
        <div className="max-w-xs truncate text-sm font-medium text-slate-700" title={texto || 'Generales'}>
          {texto || <span className="italic text-slate-400 text-xs">Sin instrucciones específicas</span>}
        </div>
      )
    }},
    { key: 'fechaProgramada', header: 'Fecha', render: row => {
      return (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm">{new Date(row.fechaProgramada).toLocaleDateString()}</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Programado</span>
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
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
            {countText}
          </span>
        </div>
      )
    }},
    { key: 'estado', header: 'Estado', render: row => {
      const colorClass = estadoBadge[row.estado] || 'bg-slate-50 text-slate-500 border border-slate-200'
      return (
        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${colorClass}`}>
          {row.estado.replace('_', ' ')}
        </span>
      )
    }},
  ]

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg text-blue-600" /></div>
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-sm">{error}</div>

  return (
    <section className="pb-10 animate-in fade-in duration-500">
      <PageHeader title="Mis Trabajos Pendientes" subtitle="Asignaciones activas que requieren atención en campo." />
      
      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden mt-6">
        {pending.map((row) => {
          const colorClass = estadoBadge[row.estado] || 'bg-slate-50 text-slate-500 border border-slate-200'
          let instrucciones = row.notas
          try {
            const parsed = JSON.parse(row.notas)
            if (parsed?.instrucciones) instrucciones = parsed.instrucciones
            else if (parsed) instrucciones = null
          } catch (e) {}

          let countText = 'Todos'
          try {
            const parsed = JSON.parse(row.notas)
            if (parsed?.condensadoresSeleccionados) {
              countText = `${parsed.condensadoresSeleccionados.length} equipos`
            }
          } catch (e) {}

          return (
            <div 
              key={row.id} 
              className="bg-white rounded-3xl border border-slate-100 shadow-sm active:scale-[0.98] transition-transform overflow-hidden"
              onClick={() => navigate(`/tecnico/dashboard/mision/${row.id}`)}
            >
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 text-lg leading-tight truncate">{row.cliente?.nombreOEmpresa}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{row.cliente?.ciudad}</p>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap ${colorClass}`}>
                    {row.estado.replace('_', ' ')}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Instrucciones</p>
                  <p className="text-sm font-medium text-slate-700 line-clamp-2">
                    {instrucciones || <span className="italic text-slate-400">Sin instrucciones específicas</span>}
                  </p>
                </div>

                <div className="flex justify-between items-end pt-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Fecha Programada</span>
                    <span className="font-bold text-slate-900 text-sm tracking-tight">{new Date(row.fechaProgramada).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Equipos</span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 text-blue-600">
                      {countText}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {pending.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-slate-100 py-16 text-center bg-white">
            <span className="text-4xl mb-4 block">📋</span>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No tienes trabajos pendientes</p>
          </div>
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block mt-6">
        <DataTable
          columns={columns}
          rows={pending}
          emptyMessage="No tienes trabajos pendientes."
          onRowClick={(row) => navigate(`/tecnico/dashboard/mision/${row.id}`)}
        />
      </div>
    </section>
  )
}
