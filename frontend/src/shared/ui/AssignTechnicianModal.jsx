import { useState, useEffect, useCallback } from 'react'
import Button from './Button'
import { useWorkData } from '../../app/providers/useWorkData'

/**
 * AssignTechnicianModal
 *
 * Props:
 *  - clientId       : string — ID del cliente
 *  - clientNombre   : string — nombre del cliente para mostrar
 *  - preselectedIds : string[] — IDs de condensadores preseleccionados (ej: desde CondenserProfilePage)
 *  - onClose        : () => void
 *  - onSuccess      : () => void
 */
export default function AssignTechnicianModal({ clientId, clientNombre, preselectedIds = [], onClose, onSuccess }) {
  const { getClimasByCliente, getTecnicos, createAsignacion } = useWorkData()

  const [tecnicos, setTecnicos] = useState([])
  const [climas, setClimas] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [idTecnico, setIdTecnico] = useState('')
  const [fechaProgramada, setFechaProgramada] = useState(new Date().toISOString().slice(0, 10))
  const [instrucciones, setInstrucciones] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set(preselectedIds))
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [t, c] = await Promise.all([getTecnicos(), getClimasByCliente(clientId)])
        if (!active) return
        
        setTecnicos(t)
        setClimas(c)
        
        // Only set initial technician if not already set
        setIdTecnico(current => current || (t.length > 0 ? t[0].id : ''))

        // If no preselection, default to all (only on first load)
        if (preselectedIds.length === 0) {
          setSelectedIds(prev => prev.size === 0 ? new Set(c.map(cl => cl.id)) : prev)
        }
      } catch (e) {
        if (active) setFormError(e.message)
      } finally {
        if (active) setLoadingData(false)
      }
    }
    load()
    return () => { active = false }
  }, [clientId, getTecnicos, getClimasByCliente]) // Removed preselectedIds from deps

  const toggleClima = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === climas.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(climas.map(c => c.id)))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedIds.size === 0) {
      setFormError('Debes seleccionar al menos un condensador.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      // Build the structured notas payload
      const condensadoresSeleccionados = climas
        .filter(c => selectedIds.has(c.id))
        .map(c => ({
          id: c.id,
          numeroSerie: c.numeroSerie,
          mantenimientosCount: c._count?.mantenimientos ?? 0,
        }))

      // Encode as JSON in notas field: { instrucciones, condensadoresSeleccionados }
      const notasPayload = JSON.stringify({
        instrucciones: instrucciones.trim() || null,
        condensadoresSeleccionados,
      })

      await createAsignacion({
        idCliente: clientId,
        idTecnico,
        fechaProgramada,
        notas: notasPayload,
      })
      
      setShowSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2200)
    } catch (err) {
      setFormError(err.message)
      setSaving(false)
    }
  }

  const allSelected = climas.length > 0 && selectedIds.size === climas.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < climas.length

  return (
    <dialog className="modal modal-open" onClick={onClose}>
      <style>{`
        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-draw {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: drawCheck 0.8s ease-out forwards 0.2s;
        }
        .animate-scale-in {
          animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
      <div
        className="modal-box max-w-lg w-full p-0 overflow-hidden rounded-2xl border border-base-300 shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 z-50 bg-base-100 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="animate-scale-in mb-6">
              <svg 
                className="w-24 h-24 text-success overflow-visible" 
                viewBox="0 0 64 64" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="4.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle 
                  className="opacity-20" 
                  cx="32" cy="32" r="30" 
                  stroke="currentColor"
                />
                <path 
                  className="animate-draw" 
                  d="M18 32.5L27.5 42L46 22" 
                />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-center mb-2">¡Asignación Exitosa!</h3>
            <p className="text-base-content/60 text-center font-medium max-w-xs leading-relaxed">
              El técnico ha sido notificado y la orden se ha creado correctamente.
            </p>
            <div className="mt-8 flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-base-200/50 px-6 py-5 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-content flex items-center justify-center text-xl shadow-lg shadow-primary/20">🔧</div>
            <div>
              <h3 className="font-black text-lg leading-tight">Enviar Técnico</h3>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-40 mt-0.5">{clientNombre}</p>
            </div>
            <button 
              onClick={onClose}
              className="ml-auto btn btn-sm btn-ghost btn-circle opacity-50 hover:opacity-100"
            >✕</button>
          </div>
        </div>

        <div className="p-6">
          {loadingData ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : tecnicos.length === 0 ? (
            <div className="alert alert-warning py-4 rounded-xl">
              <span className="text-sm font-bold">No hay técnicos registrados en el sistema.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Primary Fields Grid */}
              <div className="grid grid-cols-2 gap-4">
                <label className="form-control w-full">
                  <span className="text-[10px] font-bold uppercase opacity-40 mb-2 ml-1">Asignar a Técnico *</span>
                  <select
                    className="select select-bordered w-full bg-base-200 focus:bg-base-100 transition-all font-semibold"
                    value={idTecnico}
                    onChange={e => setIdTecnico(e.target.value)}
                    required
                  >
                    {tecnicos.map(t => (
                      <option key={t.id} value={t.id} className="text-base-content bg-base-100">{t.nombres} {t.apellidoPaterno}</option>
                    ))}
                  </select>
                </label>

                <label className="form-control w-full">
                  <span className="text-[10px] font-bold uppercase opacity-40 mb-2 ml-1">Fecha Programada *</span>
                  <input
                    type="date"
                    className="input input-bordered w-full bg-base-200 focus:bg-base-100 transition-all font-semibold"
                    value={fechaProgramada}
                    onChange={e => setFechaProgramada(e.target.value)}
                    required
                  />
                </label>
              </div>

              {/* Condensadores Selection */}
              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold uppercase opacity-40">Condensadores Seleccionados</span>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-primary badge-sm font-bold">{selectedIds.size} de {climas.length}</span>
                    {climas.length > 1 && (
                      <button
                        type="button"
                        className="text-[10px] font-bold uppercase text-primary hover:underline"
                        onClick={toggleAll}
                      >
                        {allSelected ? 'Ninguno' : 'Todos'}
                      </button>
                    )}
                  </div>
                </div>

                {climas.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-base-300 p-8 text-center bg-base-200/50">
                    <p className="text-sm text-base-content/40 italic font-medium">Este cliente no tiene condensadores registrados.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-base-300 bg-base-100 overflow-hidden divide-y divide-base-200 max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
                    {climas.map(c => {
                      const count = c._count?.mantenimientos ?? 0
                      const isSelected = selectedIds.has(c.id)
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-all hover:bg-primary/5 select-none
                            ${isSelected ? 'bg-primary/5' : ''}`}
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-sm rounded-md"
                            checked={isSelected}
                            onChange={() => toggleClima(c.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm tracking-tight">{c.numeroSerie}</p>
                            <p className="text-[10px] font-semibold opacity-50 truncate uppercase tracking-widest">{c.marca} · {c.modelo}</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5" title={`${count}/3 mantenimientos este año`}>
                            {[1, 2, 3].map(i => (
                              <div
                                key={i}
                                className={`h-1.5 w-4 rounded-full transition-all duration-300 ${
                                  i <= count
                                    ? (count >= 3 ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-primary shadow-[0_0_8px_rgba(147,51,234,0.3)]')
                                    : 'bg-base-300'
                                }`}
                              />
                            ))}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Instructions */}
              <label className="form-control w-full">
                <span className="text-[10px] font-bold uppercase opacity-40 mb-2 ml-1">Notas e Instrucciones Adicionales</span>
                <textarea
                  className="textarea textarea-bordered w-full min-h-24 bg-base-200 focus:bg-base-100 transition-all resize-none shadow-inner p-4 text-sm font-medium leading-relaxed"
                  placeholder="Ej: Revisar presión de gas, limpieza de filtros..."
                  value={instrucciones}
                  onChange={e => setInstrucciones(e.target.value)}
                />
              </label>

              {formError && (
                <div className="p-3 rounded-xl bg-error/10 border border-error/20 flex items-center gap-2 animate-shake">
                  <span className="text-error">⚠️</span>
                  <p className="text-xs font-bold text-error">{formError}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-none bg-base-200 hover:bg-base-300">
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving || selectedIds.size === 0}
                  className="flex-[2] shadow-lg shadow-primary/20"
                >
                  {saving ? (
                    <span className="flex items-center gap-2"><span className="loading loading-spinner loading-xs"></span> Enviando...</span>
                  ) : (
                    `Asignar ${selectedIds.size} Equipo${selectedIds.size !== 1 ? 's' : ''}`
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </dialog>
  )
}
