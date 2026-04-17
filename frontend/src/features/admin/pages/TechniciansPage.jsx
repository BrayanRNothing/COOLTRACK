import { useState, useEffect, useCallback } from 'react'
import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import Breadcrumbs from '../../../shared/ui/Breadcrumbs'
import Button from '../../../shared/ui/Button'
import { useWorkData } from '../../../app/providers/useWorkData'

export default function TechniciansPage() {
  const { getUsuarios, createUsuario, updateUsuario, deleteUsuario } = useWorkData()

  const [tecnicos, setTecnicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ nombres: '', apellidoPaterno: '', apellidoMaterno: '', email: '', username: '', telefono: '', password: '', rol: 'TECNICO_CONTRATISTA' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchTecnicos = useCallback(async () => {
    try {
      const users = await getUsuarios()
      setTecnicos(users.filter(u => u.rol === 'TECNICO_CONTRATISTA'))
    } catch (e) { setError(e.message) } 
    finally { setLoading(false) }
  }, [getUsuarios])

  useEffect(() => { fetchTecnicos() }, [fetchTecnicos])

  const openCreate = () => { setForm({ nombres: '', apellidoPaterno: '', apellidoMaterno: '', email: '', username: '', telefono: '', password: '', rol: 'TECNICO_CONTRATISTA' }); setFormError(''); setModal('create') }
  const openEdit = (u) => { setSelected(u); setForm({ nombres: u.nombres, apellidoPaterno: u.apellidoPaterno, apellidoMaterno: u.apellidoMaterno, email: u.email, username: u.username || '', telefono: u.telefono || '', password: '', rol: u.rol }); setFormError(''); setModal('edit') }
  const openDelete = (u) => { setSelected(u); setFormError(''); setModal('delete') }
  const closeModal = () => { setModal(null); setSelected(null) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true); setFormError('')
    try {
      if (modal === 'create') {
        const newUser = await createUsuario(form)
        setTecnicos(prev => [newUser, ...prev])
      } else {
        const updated = await updateUsuario(selected.id, form)
        setTecnicos(prev => prev.map(u => u.id === updated.id ? updated : u))
      }
      closeModal()
    } catch (e) { setFormError(e.message) } 
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteUsuario(selected.id)
      setTecnicos(prev => prev.filter(u => u.id !== selected.id))
      closeModal()
    } catch (e) { setFormError(e.message) } 
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'nombres', header: 'Nombre' },
    { key: 'apellidoPaterno', header: 'Apellido' },
    { key: 'email', header: 'Email' },
    { key: 'username', header: 'Usuario' },
    { key: 'telefono', header: 'Teléfono' },
    { 
      key: 'edit', 
      header: '',
      className: 'w-20',
      render: (row) => (
        <button className="btn btn-sm btn-ghost btn-square" onClick={(e) => { e.stopPropagation(); openEdit(row) }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      )
    },
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
      <PageHeader title="Técnicos Contratistas" subtitle="Alta y gestión de técnicos que ejecutan mantenimientos." actions={<Button size="sm" onClick={openCreate}>Nuevo técnico</Button>} />
      <DataTable columns={columns} rows={tecnicos} emptyMessage="No hay técnicos registrados." />

      {(modal === 'create' || modal === 'edit') && (
        <dialog className="modal modal-open" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">{modal === 'create' ? 'Nuevo Técnico' : 'Editar Técnico'}</h3>
            <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-3">
              <label className="form-control"><span className="label-text mb-1">Nombres *</span><input className="input input-bordered" value={form.nombres} onChange={e => setForm(p => ({...p, nombres: e.target.value}))} required /></label>
              <label className="form-control"><span className="label-text mb-1">Apellido Paterno *</span><input className="input input-bordered" value={form.apellidoPaterno} onChange={e => setForm(p => ({...p, apellidoPaterno: e.target.value}))} required /></label>
              <label className="form-control"><span className="label-text mb-1">Apellido Materno *</span><input className="input input-bordered" value={form.apellidoMaterno} onChange={e => setForm(p => ({...p, apellidoMaterno: e.target.value}))} required /></label>
              <label className="form-control"><span className="label-text mb-1">Teléfono</span><input className="input input-bordered" value={form.telefono} onChange={e => setForm(p => ({...p, telefono: e.target.value}))} /></label>
              <label className="form-control sm:col-span-2"><span className="label-text mb-1">Email *</span><input type="email" className="input input-bordered" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required /></label>
              <label className="form-control sm:col-span-2"><span className="label-text mb-1">Usuario *</span><input className="input input-bordered" value={form.username} onChange={e => setForm(p => ({...p, username: e.target.value}))} required /></label>
              <label className="form-control sm:col-span-2"><span className="label-text mb-1">{modal === 'edit' ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</span><input type="password" className="input input-bordered" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required={modal === 'create'} /></label>
              {formError && <p className="text-sm text-error sm:col-span-2">{formError}</p>}
              <div className="modal-action sm:col-span-2"><Button type="button" onClick={closeModal} variant="outline">Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button></div>
            </form>
          </div>
        </dialog>
      )}

      {modal === 'delete' && (
        <dialog className="modal modal-open" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-error">Eliminar Técnico</h3>
            <p className="mt-2">¿Eliminar a <strong>{selected?.nombres} {selected?.apellidoPaterno}</strong>?</p>
            {formError && <p className="text-sm text-error mt-2">{formError}</p>}
            <div className="modal-action"><Button onClick={closeModal} variant="outline">Cancelar</Button><button className="btn btn-error" onClick={handleDelete} disabled={saving}>{saving ? 'Eliminando...' : 'Eliminar'}</button></div>
          </div>
        </dialog>
      )}
    </section>
  )
}
