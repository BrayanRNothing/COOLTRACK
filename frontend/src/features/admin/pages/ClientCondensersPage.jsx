import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import Breadcrumbs from '../../../shared/ui/Breadcrumbs'
import Button from '../../../shared/ui/Button'
import { useWorkData } from '../../../app/providers/useWorkData'

const emptyForm = { numeroSerie: '', marca: '', modelo: '', fechaAplicacion: '', geolocalizacion: '' }

export default function ClientCondensersPage() {
  const { clientId } = useParams()
  const { getCliente, getClimasByCliente, createClima, updateClima, deleteClima } = useWorkData()
  const navigate = useNavigate()

  const [client, setClient] = useState(null)
  const [climas, setClimas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [c, cls] = await Promise.all([getCliente(clientId), getClimasByCliente(clientId)])
      setClient(c)
      setClimas(cls)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [clientId, getCliente, getClimasByCliente])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => { setForm(emptyForm); setFormError(''); setModal('create') }
  const openEdit = (c) => { setSelected(c); setForm({ numeroSerie: c.numeroSerie, marca: c.marca, modelo: c.modelo, fechaAplicacion: c.fechaAplicacion?.slice(0, 10) || '', geolocalizacion: c.geolocalizacion || '' }); setFormError(''); setModal('edit') }
  const openDelete = (c) => { setSelected(c); setFormError(''); setModal('delete') }
  const closeModal = () => { setModal(null); setSelected(null) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true); setFormError('')
    try {
      if (modal === 'create') {
        const newClima = await createClima({ ...form, idCliente: clientId })
        setClimas(prev => [newClima, ...prev])
        setClient(prev => prev ? { ...prev, _count: { climas: (prev._count?.climas || 0) + 1 } } : prev)
      } else {
        const updated = await updateClima(selected.id, form)
        setClimas(prev => prev.map(c => c.id === updated.id ? updated : c))
      }
      closeModal()
    } catch (e) { setFormError(e.message) } 
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteClima(selected.id)
      setClimas(prev => prev.filter(c => c.id !== selected.id))
      closeModal()
    } catch (e) { setFormError(e.message) } 
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'numeroSerie', header: 'Serie' },
    { key: 'marca', header: 'Marca' },
    { key: 'modelo', header: 'Modelo' },
    { key: 'fechaAplicacion', header: 'Aplicación', render: row => row.fechaAplicacion?.slice(0, 10) || '-' },
    { key: 'geolocalizacion', header: 'Geolocalización' },
    {
      key: 'mantenimientos',
      header: `Mantis. ${new Date().getFullYear()}`,
      className: 'w-44 whitespace-nowrap',
      render: row => {
        const count = row._count?.mantenimientos || 0
        const isCompleted = count >= 3
        return (
          <div className="flex items-center gap-1.5" title={`${count} de 3 mantenimientos realizados este año`}>
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`h-2.5 w-5 rounded-md transition-all duration-500 ${
                  i <= count 
                    ? (isCompleted ? 'bg-success animate-pulse' : 'bg-primary') 
                    : 'bg-base-300'
                }`}
              />
            ))}
            {isCompleted && <span className="text-[10px] font-bold text-success ml-1">OK</span>}
          </div>
        )
      }
    },
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
      <Breadcrumbs 
        items={[
          { label: 'Lista de clientes', to: '/admin/clientes' },
          { label: `Cliente: ${client?.nombreOEmpresa || '...'}`, to: `/admin/clientes/${clientId}` },
          { label: 'Lista de equipos' }
        ]} 
      />
      <PageHeader
        title={`Condensadores — ${client?.nombreOEmpresa || ''}`}
        subtitle={`${client?.numeroCliente || ''} · ${client?.ciudad || 'Sin ciudad'}`}
        actions={
          <div className="flex gap-2">
            <Button size="sm" onClick={openCreate}>Agregar condensador</Button>
            <Link className="btn btn-sm btn-outline" to="/admin/clientes">Volver</Link>
          </div>
        }
      />

      <DataTable 
        columns={columns} 
        rows={climas} 
        emptyMessage="Este cliente no tiene condensadores registrados." 
        onRowClick={(row) => navigate(`/admin/clientes/${clientId}/condensadores/${row.id}`)}
      />

      {(modal === 'create' || modal === 'edit') && (
        <dialog className="modal modal-open" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">{modal === 'create' ? 'Agregar Condensador' : 'Editar Condensador'}</h3>
            <form onSubmit={handleSave} className="grid gap-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="form-control sm:col-span-2">
                  <span className="label-text mb-1">Número de serie *</span>
                  <input className="input input-bordered" value={form.numeroSerie} onChange={e => setForm(p => ({...p, numeroSerie: e.target.value}))} required placeholder="SER-001-2026" />
                </label>
                <label className="form-control">
                  <span className="label-text mb-1">Marca *</span>
                  <input className="input input-bordered" value={form.marca} onChange={e => setForm(p => ({...p, marca: e.target.value}))} required placeholder="Carrier" />
                </label>
                <label className="form-control">
                  <span className="label-text mb-1">Modelo *</span>
                  <input className="input input-bordered" value={form.modelo} onChange={e => setForm(p => ({...p, modelo: e.target.value}))} required placeholder="ACS-500" />
                </label>
                <label className="form-control">
                  <span className="label-text mb-1">Fecha de aplicación *</span>
                  <input type="date" className="input input-bordered" value={form.fechaAplicacion} onChange={e => setForm(p => ({...p, fechaAplicacion: e.target.value}))} required />
                </label>
                <label className="form-control">
                  <span className="label-text mb-1">Geolocalización</span>
                  <input className="input input-bordered" value={form.geolocalizacion} onChange={e => setForm(p => ({...p, geolocalizacion: e.target.value}))} placeholder="Azotea Bloque B" />
                </label>
              </div>
              {formError && <p className="text-sm text-error">{formError}</p>}
              <div className="modal-action"><Button type="button" onClick={closeModal} variant="outline">Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button></div>
            </form>
          </div>
        </dialog>
      )}

      {modal === 'delete' && (
        <dialog className="modal modal-open" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-error">Eliminar Condensador</h3>
            <p className="mt-2">¿Eliminar el condensador <strong>{selected?.numeroSerie}</strong>?</p>
            {formError && <p className="text-sm text-error mt-2">{formError}</p>}
            <div className="modal-action"><Button onClick={closeModal} variant="outline">Cancelar</Button><button className="btn btn-error" onClick={handleDelete} disabled={saving}>{saving ? 'Eliminando...' : 'Eliminar'}</button></div>
          </div>
        </dialog>
      )}
    </section>
  )
}
