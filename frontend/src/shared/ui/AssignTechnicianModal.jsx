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
/**
 * AssignTechnicianModal
 *
 * Props:
 *  - clientId       : string — ID del cliente
 *  - clientNombre   : string — nombre del cliente para mostrar
 *  - preselectedIds : string[] — IDs de condensadores preseleccionados (ej: desde CondenserProfilePage)
 *  - editingAsignacion : object — Objeto de asignación existente si estamos editando
 *  - onClose        : () => void
 *  - onSuccess      : () => void
 */
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
  
  // Initialize form state
  const [idTecnico, setIdTecnico] = useState('')
  const [fechaProgramada, setFechaProgramada] = useState('')
  const [instrucciones, setInstrucciones] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  
  const [showSuccess, setShowSuccess] = useState(false)

  // Initialization logic
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [t, c] = await Promise.all([getTecnicos(), getClimasByCliente(clientId)])
        if (!active) return
        
        setTecnicos(t)
        setClimas(c)
        
        if (editingAsignacion) {
          // EDIT MODE: Load existing data
          setIdTecnico(editingAsignacion.idTecnico)
          setFechaProgramada(editingAsignacion.fechaProgramada?.slice(0, 10) || '')
          
          try {
            const parsed = JSON.parse(editingAsignacion.notas || '{}')
            setInstrucciones(parsed.instrucciones || '')
            const ids = (parsed.condensadoresSeleccionados || []).map(item => item.id)
            setSelectedIds(new Set(ids))
          } catch (e) {
            console.error('Error parsing notas:', e)
            setInstrucciones(editingAsignacion.notas || '')
            setSelectedIds(new Set())
          }
        } else {
          // NEW MODE: Default values
          setIdTecnico(t.length > 0 ? t[0].id : '')
          setFechaProgramada(new Date().toISOString().slice(0, 10))
          
          if (preselectedIds.length > 0) {
            setSelectedIds(new Set(preselectedIds))
          } else {
            setSelectedIds(new Set(c.map(cl => cl.id)))
          }
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
      const condensadoresSeleccionados = climas
        .filter(c => selectedIds.has(c.id))
        .map(c => ({
          id: c.id,
          numeroSerie: c.numeroSerie,
          mantenimientosCount: c._count?.mantenimientos ?? 0,
        }))

      const notasPayload = JSON.stringify({
        instrucciones: instrucciones.trim() || null,
        condensadoresSeleccionados,
      })

      const payload = {
        idCliente: clientId,
        idTecnico,
        fechaProgramada,
        notas: notasPayload,
      }

      if (editingAsignacion) {
        await updateAsignacion(editingAsignacion.id, payload)
      } else {
        await createAsignacion(payload)
      }
      
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

  const isEditing = !!editingAsignacion

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
                <circle className="opacity-20" cx="32" cy="32" r="30" stroke="currentColor" />
                <path className="animate-draw" d="M18 32.5L27.5 42L46 22" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-center mb-2">{isEditing ? '¡Actualización Exitosa!' : '¡Asignación Exitosa!'}</h3>
            <p className="text-base-content/60 text-center font-medium max-w-xs leading-relaxed">
              El técnico verá los cambios en su aplicación de inmediato.
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
            <div className={`h-10 w-10 rounded-xl ${isEditing ? 'bg-secondary' : 'bg-primary'} text-white flex items-center justify-center text-xl shadow-lg`}>
              {isEditing ? '📝' : '🔧'}
            </div>
            <div>
              <h3 className="font-black text-lg leading-tight">{isEditing ? 'Gestionar Asignación Activa' : 'Nueva Asignación'}</h3>
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
              <div className="grid grid-cols-2 gap-4">
                <label className="form-control w-full">
                  <span className="text-[10px] font-bold uppercase opacity-40 mb-2 ml-1">Técnico Responsable *</span>
                  <select
                    className="select select-bordered w-full bg-base-200 focus:bg-base-100 transition-all font-semibold"
                    value={idTecnico}
                    onChange={e => setIdTecnico(e.target.value)}
                    required
                  >
                    {tecnicos.map(t => (
                      <option key={t.id} value={t.id}>{t.nombres} {t.apellidoPaterno}</option>
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

              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold uppercase opacity-40">Equipos a Mantenimiento</span>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-primary badge-sm font-bold">{selectedIds.size} de {climas.length}</span>
                    <button type="button" className="text-[10px] font-bold uppercase text-primary hover:underline" onClick={toggleAll}>
                      {allSelected ? 'Ninguno' : 'Todos'}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-base-300 bg-base-100 overflow-hidden divide-y divide-base-200 max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
                  {climas.map(c => {
                    const count = c._count?.mantenimientos ?? 0
                    const isSelected = selectedIds.has(c.id)
                    return (
                      <label key={c.id} className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-all hover:bg-primary/5 select-none ${isSelected ? 'bg-primary/5' : ''}`}>
                        <input type="checkbox" className="checkbox checkbox-primary checkbox-sm rounded-md" checked={isSelected} onChange={() => toggleClima(c.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm tracking-tight">{c.numeroSerie}</p>
                          <p className="text-[10px] font-semibold opacity-50 truncate uppercase tracking-widest">{c.marca} · {c.modelo}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1.5 w-4 rounded-full ${i <= count ? (count >= 3 ? 'bg-success' : 'bg-primary') : 'bg-base-300'}`} />
                          ))}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </section>

              <label className="form-control w-full">
                <span className="text-[10px] font-bold uppercase opacity-40 mb-2 ml-1">Notas e Instrucciones</span>
                <textarea
                  className="textarea textarea-bordered w-full min-h-24 bg-base-200 focus:bg-base-100 transition-all resize-none shadow-inner p-4 text-sm font-medium"
                  placeholder="Ej: Revisar presión de gas..."
                  value={instrucciones}
                  onChange={e => setInstrucciones(e.target.value)}
                />
              </label>

              {formError && (
                <div className="p-3 rounded-xl bg-error/10 border border-error/20 flex items-center gap-2">
                  <span className="text-error text-xs">⚠️ {formError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button type="button" onClick={onClose} variant="outline" className="flex-1">Cancelar</Button>
                <Button type="submit" disabled={saving || selectedIds.size === 0} className="flex-[2] shadow-lg">
                  {saving ? 'Guardando...' : (isEditing ? 'Actualizar Asignación' : 'Crear Asignación')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </dialog>
  )
}
