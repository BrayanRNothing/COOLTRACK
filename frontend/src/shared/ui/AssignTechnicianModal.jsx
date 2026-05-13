import { useState, useEffect } from 'react'
import { useWorkData } from '../../app/providers/useWorkData'

export default function AssignTechnicianModal({
  clientId,
  clientNombre,
  preselectedIds = [],
  editingAsignacion = null,
  onClose,
  onSuccess
}) {
  const { getClimasByCliente, getTecnicos, createAsignacion, updateAsignacion } = useWorkData()

  const [tecnicos, setTecnicos] = useState([])
  const [climas, setClimas] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const [idTecnico, setIdTecnico] = useState('')
  const [fechaProgramada, setFechaProgramada] = useState('')
  const [instrucciones, setInstrucciones] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())

  const isEditing = !!editingAsignacion

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [t, c] = await Promise.all([getTecnicos(), getClimasByCliente(clientId)])
        if (!active) return

        setTecnicos(t)
        setClimas(c)

        if (editingAsignacion) {
          setIdTecnico(editingAsignacion.idTecnico)
          setFechaProgramada(editingAsignacion.fechaProgramada?.slice(0, 10) || '')
          try {
            const parsed = JSON.parse(editingAsignacion.notas || '{}')
            setInstrucciones(parsed.instrucciones || '')
            setSelectedIds(new Set((parsed.condensadoresSeleccionados || []).map(i => i.id)))
          } catch {
            setInstrucciones(editingAsignacion.notas || '')
            setSelectedIds(new Set())
          }
        } else {
          setIdTecnico(t.length > 0 ? t[0].id : '')
          setFechaProgramada(new Date().toISOString().slice(0, 10))
          setSelectedIds(preselectedIds.length > 0 ? new Set(preselectedIds) : new Set(c.map(cl => cl.id)))
        }
      } catch (e) {
        if (active) setFormError(e.message)
      } finally {
        if (active) setLoadingData(false)
      }
    }
    load()
    return () => { active = false }
  }, [clientId, getTecnicos, getClimasByCliente, editingAsignacion])

  const toggleClima = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelectedIds(selectedIds.size === climas.length ? new Set() : new Set(climas.map(c => c.id)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedIds.size === 0) { setFormError('Selecciona al menos un condensador.'); return }
    setSaving(true)
    setFormError('')
    try {
      const condensadoresSeleccionados = climas
        .filter(c => selectedIds.has(c.id))
        .map(c => ({ id: c.id, numeroSerie: c.numeroSerie, mantenimientosCount: c._count?.mantenimientos ?? 0 }))

      const payload = {
        idCliente: clientId,
        idTecnico,
        fechaProgramada,
        notas: JSON.stringify({ instrucciones: instrucciones.trim() || null, condensadoresSeleccionados }),
      }

      isEditing ? await updateAsignacion(editingAsignacion.id, payload) : await createAsignacion(payload)
      setShowSuccess(true)
      setTimeout(() => { onSuccess?.(); onClose() }, 2200)
    } catch (err) {
      setFormError(err.message)
      setSaving(false)
    }
  }

  const allSelected = climas.length > 0 && selectedIds.size === climas.length

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
            <style>{`
              @keyframes drawCheck { to { stroke-dashoffset: 0; } }
              @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
              .anim-draw { stroke-dasharray: 100; stroke-dashoffset: 100; animation: drawCheck 0.7s ease-out forwards 0.2s; }
              .anim-scale { animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            `}</style>
            <div className="anim-scale">
              <svg className="w-24 h-24 text-emerald-500" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="32" cy="32" r="30" className="opacity-10" />
                <path className="anim-draw" d="M18 32.5L27.5 42L46 22" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900">{isEditing ? '¡Asignación actualizada!' : '¡Asignación creada!'}</h3>
            <p className="text-sm font-bold text-slate-400">El técnico verá los cambios de inmediato.</p>
            <div className="flex gap-1.5 mt-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-50 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-md ${isEditing ? 'bg-amber-50' : 'bg-blue-50'}`}>
            {isEditing ? '📝' : '🔧'}
          </div>
          <div className="flex-grow">
            <h3 className="text-xl font-black text-slate-900">{isEditing ? 'Gestionar Asignación' : 'Nueva Asignación'}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{clientNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 pb-8 pt-6">
          {loadingData ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-blue-600" />
            </div>
          ) : tecnicos.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-100 text-amber-600 text-sm font-bold rounded-2xl">
              No hay técnicos registrados en el sistema.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Técnico + Fecha */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Técnico *</label>
                  <select
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={idTecnico}
                    onChange={e => setIdTecnico(e.target.value)}
                    required
                  >
                    {tecnicos.map(t => (
                      <option key={t.id} value={t.id}>{t.nombres} {t.apellidoPaterno}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Fecha Programada *</label>
                  <input
                    type="date"
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={fechaProgramada}
                    onChange={e => setFechaProgramada(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Equipos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Equipos incluidos</label>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                      {selectedIds.size} / {climas.length}
                    </span>
                    <button type="button" onClick={toggleAll} className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">
                      {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 overflow-hidden divide-y divide-slate-100 max-h-52 overflow-y-auto">
                  {climas.map(c => {
                    const count = c._count?.mantenimientos ?? 0
                    const isSelected = selectedIds.has(c.id)
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-all select-none ${isSelected ? 'bg-blue-50/70' : 'hover:bg-white'}`}
                      >
                        {/* Custom checkbox */}
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                        }`} onClick={() => toggleClima(c.id)}>
                          {isSelected && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>

                        <div className="flex-grow min-w-0" onClick={() => toggleClima(c.id)}>
                          <p className="font-black text-slate-900 text-sm">{c.numeroSerie}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.marca} · {c.modelo}</p>
                        </div>

                        {/* Mantenimiento dots */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1.5 w-4 rounded-full ${i <= count ? (count >= 3 ? 'bg-emerald-400' : 'bg-blue-400') : 'bg-slate-200'}`} />
                          ))}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Instrucciones */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Notas e Instrucciones</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-24"
                  placeholder="Ej: Revisar presión de gas, limpiar filtros..."
                  value={instrucciones}
                  onChange={e => setInstrucciones(e.target.value)}
                />
              </div>

              {/* Error */}
              {formError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold">
                  {formError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || selectedIds.size === 0}
                  className="flex-[2] h-12 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-md shadow-slate-200 disabled:opacity-40 active:scale-[0.98]"
                >
                  {saving ? 'Guardando...' : (isEditing ? 'Actualizar Asignación' : 'Crear Asignación')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
