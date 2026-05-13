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

  const openCreate = () => { 
    // Generate default client code based on existing clients
    const lastCode = clientes.length > 0 
      ? Math.max(...clientes.map(c => {
          const num = parseInt(c.numeroCliente.replace(/\D/g, ''));
          return isNaN(num) ? 0 : num;
        }), 0)
      : 0;
    
    const nextCode = `CLI-${String(lastCode + 1).padStart(3, '0')}`;
    
    setForm({ ...emptyForm, numeroCliente: nextCode }); 
    setFormError(''); 
    setModal('create'); 
  }
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
      key: 'actions',
      header: '',
      className: 'w-48',
      render: (row) => (
        <div className="flex items-center justify-end gap-4">
          {/* Assign */}
          <button 
            className="text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-1.5"
            onClick={(e) => { e.stopPropagation(); openAssign(row) }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Asignar
          </button>

          {/* Edit */}
          <button 
            className="text-slate-300 hover:text-slate-900 transition-colors"
            onClick={(e) => { e.stopPropagation(); openEdit(row) }}
            title="Editar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          
          {/* Delete */}
          <button 
            className="text-slate-300 hover:text-red-500 transition-colors"
            onClick={(e) => { e.stopPropagation(); openDelete(row) }}
            title="Eliminar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeModal} />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
            <div className="p-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl">
                  {modal === 'create' ? '✨' : '📝'}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {modal === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {modal === 'create' ? 'Registro de nueva entidad' : 'Actualización de datos'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Código cliente *</label>
                    <input 
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                      value={form.numeroCliente} 
                      onChange={e => setForm(p => ({ ...p, numeroCliente: e.target.value }))} 
                      required 
                      placeholder="CLI-000" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Empresa / Nombre *</label>
                    <input 
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                      value={form.nombreOEmpresa} 
                      onChange={e => setForm(p => ({ ...p, nombreOEmpresa: e.target.value }))} 
                      required 
                      placeholder="Nombre de la empresa" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Ciudad</label>
                    <input 
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                      value={form.ciudad} 
                      onChange={e => setForm(p => ({ ...p, ciudad: e.target.value }))} 
                      placeholder="Monterrey" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Teléfono</label>
                    <input 
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                      value={form.telefono} 
                      onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} 
                      placeholder="81 1234 5678" 
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email corporativo</label>
                    <input 
                      type="email" 
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                      value={form.email} 
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))} 
                      placeholder="contacto@empresa.com" 
                    />
                  </div>
                </div>

                {formError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold animate-shake">
                    {formError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={closeModal} 
                    className="h-12 px-6 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="h-12 px-8 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
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
