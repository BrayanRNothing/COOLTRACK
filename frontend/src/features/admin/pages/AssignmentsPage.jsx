import { useState, useEffect, useCallback } from 'react'
import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import Breadcrumbs from '../../../shared/ui/Breadcrumbs'
import Button from '../../../shared/ui/Button'
import { useWorkData } from '../../../app/providers/useWorkData'

const estadoBadge = { PENDIENTE: 'badge-warning', EN_PROGRESO: 'badge-info', COMPLETADA: 'badge-success' }

export default function AssignmentsPage() {
  const { getAsignaciones, getClientes, getTecnicos, createAsignacion, updateAsignacion, deleteAsignacion } = useWorkData()

  const [asignaciones, setAsignaciones] = useState([])
  const [clientes, setClientes] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ idCliente: '', idTecnico: '', fechaProgramada: new Date().toISOString().slice(0, 10), notas: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchAll = useCallback(async () => {
    try {
      const [a, c, t] = await Promise.all([getAsignaciones(), getClientes(), getTecnicos()])
      setAsignaciones(a); setClientes(c); setTecnicos(t)
      if (c.length > 0 && t.length > 0) setForm(p => ({...p, idCliente: c[0].id, idTecnico: t[0].id}))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [getAsignaciones, getClientes, getTecnicos])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openCreate = () => { setForm({ idCliente: clientes[0]?.id || '', idTecnico: tecnicos[0]?.id || '', fechaProgramada: new Date().toISOString().slice(0, 10), notas: '' }); setFormError(''); setModal('create') }
  const openDelete = (a) => { setSelected(a); setFormError(''); setModal('delete') }
  const closeModal = () => { setModal(null); setSelected(null) }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true); setFormError('')
    try {
      const newA = await createAsignacion(form)
      setAsignaciones(prev => [newA, ...prev])
      closeModal()
    } catch (e) { setFormError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteAsignacion(selected.id)
      setAsignaciones(prev => prev.filter(a => a.id !== selected.id))
      closeModal()
    } catch (e) { setFormError(e.message) }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'id', header: 'ID', render: (row) => row.id.slice(0, 8) + '…' },
    { key: 'cliente', header: 'Cliente', render: (row) => row.cliente?.nombreOEmpresa || '-' },
    { key: 'tecnico', header: 'Técnico', render: (row) => row.tecnico ? `${row.tecnico.nombres} ${row.tecnico.apellidoPaterno}` : '-' },
    { key: 'fechaProgramada', header: 'Fecha', render: (row) => row.fechaProgramada?.slice(0, 10) || '-' },
    {
      key: 'notas',
      header: 'Notas',
      render: (row) => {
        let text = row.notas
        try {
          const parsed = JSON.parse(row.notas)
          if (parsed?.instrucciones) text = parsed.instrucciones
          else if (parsed?.condensadoresSeleccionados) text = null
        } catch (e) {}

        return (
          <div className="max-w-xs truncate text-sm" title={text || ''}>
            {text || <span className="text-base-content/40 italic">Sin notas específicas</span>}
          </div>
        )
      },
    },
    { key: 'estado', header: 'Estado', render: (row) => <span className={`badge badge-sm ${estadoBadge[row.estado] || 'badge-ghost'}`}>{row.estado}</span> },
    { key: 'mantenimientos', header: 'Mantenimientos', className: 'w-24', render: (row) => row._count?.mantenimientos ?? 0 },
    {
      key: 'delete',
      header: '',
      className: 'w-20',
      render: (row) => (
        <button className="btn btn-sm btn-ghost text-error btn-square" onClick={(e) => { e.stopPropagation(); openDelete(row) }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      )
    }
  ]

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg" /></div>
  if (error) return <div className="alert alert-error mt-4">{error}</div>

  return (
    <section>
      <PageHeader title="Asignaciones" subtitle="Trabajos asignados a técnicos para ejecución en campo." actions={<Button size="sm" onClick={openCreate} disabled={!clientes.length || !tecnicos.length}>Nueva asignación</Button>} />
      <DataTable columns={columns} rows={asignaciones} emptyMessage="No hay asignaciones registradas." />

      {modal === 'create' && (
        <dialog className="modal modal-open" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Nueva Asignación</h3>
            <form onSubmit={handleCreate} className="grid gap-3">
              <label className="form-control"><span className="label-text mb-1">Cliente *</span>
                <select className="select select-bordered" value={form.idCliente} onChange={e => setForm(p => ({...p, idCliente: e.target.value}))} required>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombreOEmpresa} ({c.numeroCliente})</option>)}
                </select></label>
              <label className="form-control"><span className="label-text mb-1">Técnico *</span>
                <select className="select select-bordered" value={form.idTecnico} onChange={e => setForm(p => ({...p, idTecnico: e.target.value}))} required>
                  {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombres} {t.apellidoPaterno}</option>)}
                </select></label>
              <label className="form-control"><span className="label-text mb-1">Fecha programada *</span><input type="date" className="input input-bordered" value={form.fechaProgramada} onChange={e => setForm(p => ({...p, fechaProgramada: e.target.value}))} required /></label>
              <label className="form-control"><span className="label-text mb-1">Notas / Instrucciones</span><textarea className="textarea textarea-bordered min-h-24" placeholder="Ej: Todos los equipos requieren mantenimiento preventivo..." value={form.notas} onChange={e => setForm(p => ({...p, notas: e.target.value}))} /></label>
              {formError && <p className="text-sm text-error">{formError}</p>}
              <div className="modal-action"><Button type="button" onClick={closeModal} variant="outline">Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Creando...' : 'Crear asignación'}</Button></div>
            </form>
          </div>
        </dialog>
      )}

      {modal === 'delete' && (
        <dialog className="modal modal-open" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-error">Eliminar Asignación</h3>
            <p className="mt-2">¿Eliminar la asignación a <strong>{selected?.cliente?.nombreOEmpresa}</strong>? Esto eliminará también los mantenimientos vinculados.</p>
            {formError && <p className="text-sm text-error mt-2">{formError}</p>}
            <div className="modal-action"><Button onClick={closeModal} variant="outline">Cancelar</Button><button className="btn btn-error" onClick={handleDelete} disabled={saving}>{saving ? 'Eliminando...' : 'Eliminar'}</button></div>
          </div>
        </dialog>
      )}
    </section>
  )
}
