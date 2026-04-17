import { useState, useEffect, useCallback } from 'react'
import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import Breadcrumbs from '../../../shared/ui/Breadcrumbs'
import Button from '../../../shared/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useWorkData } from '../../../app/providers/useWorkData'
import AssignTechnicianModal from '../../../shared/ui/AssignTechnicianModal'

const emptyForm = { numeroCliente: '', nombreOEmpresa: '', ciudad: '', telefono: '', email: '' }

export default function ClientsPage() {
  const { getClientes, createCliente, updateCliente, deleteCliente, getTecnicos } = useWorkData()
  const navigate = useNavigate()

  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal state: 'create' | 'edit' | 'delete' | 'assign' | null
  const [modal, setModal] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const c = await getClientes()
      setClientes(c)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [getClientes])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => { setForm(emptyForm); setFormError(''); setModal('create') }
  const openEdit = (client) => { setSelectedClient(client); setForm({ numeroCliente: client.numeroCliente, nombreOEmpresa: client.nombreOEmpresa, ciudad: client.ciudad || '', telefono: client.telefono || '', email: client.email || '' }); setFormError(''); setModal('edit') }
  const openDelete = (client) => { setSelectedClient(client); setModal('delete') }
  const openAssign = (client) => { setSelectedClient(client); setFormError(''); setModal('assign') }
  const closeModal = () => { setModal(null); setSelectedClient(null) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true); setFormError('')
    try {
      if (modal === 'create') {
        const newClient = await createCliente(form)
        setClientes(prev => [newClient, ...prev])
      } else {
        const updated = await updateCliente(selectedClient.id, form)
        setClientes(prev => prev.map(c => c.id === updated.id ? updated : c))
      }
      closeModal()
    } catch (e) { setFormError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteCliente(selectedClient.id)
      setClientes(prev => prev.filter(c => c.id !== selectedClient.id))
      closeModal()
    } catch (e) { setFormError(e.message) }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'numeroCliente', header: 'Codigo' },
    { key: 'nombreOEmpresa', header: 'Empresa' },
    { key: 'ciudad', header: 'Ciudad' },
    { key: 'telefono', header: 'Telefono' },
    { key: '_count', header: 'Condensadores', className: 'w-40', render: (row) => row._count?.climas ?? 0 },
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
      key: 'assign',
      header: '',
      className: 'w-32',
      render: (row) => (
        <button className="btn btn-sm btn-primary gap-2" onClick={(e) => { e.stopPropagation(); openAssign(row) }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          <span className="hidden xl:inline text-xs font-bold whitespace-nowrap">Asignar</span>
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
      <PageHeader title="Lista Clientes" actions={<Button size="sm" onClick={openCreate}>Nuevo cliente</Button>} />
      <DataTable columns={columns} rows={clientes} emptyMessage="Aun no hay clientes registrados." onRowClick={(row) => navigate(`/admin/clientes/${row.id}`)} />

      {/* Create / Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <dialog className="modal modal-open" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">{modal === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}</h3>
            <form onSubmit={handleSave} className="grid gap-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="form-control">
                  <span className="label-text mb-1">Código cliente *</span>
                  <input className="input input-bordered" value={form.numeroCliente} onChange={e => setForm(p => ({ ...p, numeroCliente: e.target.value }))} required placeholder="CL-001" />
                </label>
                <label className="form-control">
                  <span className="label-text mb-1">Empresa / Nombre *</span>
                  <input className="input input-bordered" value={form.nombreOEmpresa} onChange={e => setForm(p => ({ ...p, nombreOEmpresa: e.target.value }))} required placeholder="Empresa S.A." />
                </label>
                <label className="form-control">
                  <span className="label-text mb-1">Ciudad</span>
                  <input className="input input-bordered" value={form.ciudad} onChange={e => setForm(p => ({ ...p, ciudad: e.target.value }))} placeholder="Lima" />
                </label>
                <label className="form-control">
                  <span className="label-text mb-1">Teléfono</span>
                  <input className="input input-bordered" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} placeholder="+51 999 999 999" />
                </label>
                <label className="form-control sm:col-span-2">
                  <span className="label-text mb-1">Email</span>
                  <input type="email" className="input input-bordered" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="contacto@empresa.com" />
                </label>
              </div>
              {formError && <p className="text-sm text-error">{formError}</p>}
              <div className="modal-action"><Button type="button" onClick={closeModal} variant="outline">Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button></div>
            </form>
          </div>
        </dialog>
      )}

      {/* Delete Confirm Modal */}
      {modal === 'delete' && (
        <dialog className="modal modal-open" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-error">Eliminar Cliente</h3>
            <p className="mt-2">¿Estás seguro de eliminar a <strong>{selectedClient?.nombreOEmpresa}</strong>? Esta acción no se puede deshacer.</p>
            {formError && <p className="text-sm text-error mt-2">{formError}</p>}
            <div className="modal-action"><Button onClick={closeModal} variant="outline">Cancelar</Button><button className="btn btn-error" onClick={handleDelete} disabled={saving}>{saving ? 'Eliminando...' : 'Eliminar'}</button></div>
          </div>
        </dialog>
      )}

      {/* Assign Technician Modal */}
      {modal === 'assign' && selectedClient && (
        <AssignTechnicianModal
          clientId={selectedClient.id}
          clientNombre={selectedClient.nombreOEmpresa}
          onClose={closeModal}
        />
      )}
    </section>
  )
}
