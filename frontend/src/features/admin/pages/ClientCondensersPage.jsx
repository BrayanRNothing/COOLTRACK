import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as XLSX from 'xlsx'
import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import Breadcrumbs from '../../../shared/ui/Breadcrumbs'
import Button from '../../../shared/ui/Button'
import { useWorkData } from '../../../app/providers/useWorkData'

const emptyForm = { numeroSerie: '', marca: '', modelo: '', fechaAplicacion: '', geolocalizacion: '' }

const normalizeHeader = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '')

const headerAliases = {
  numeroSerie: ['numeroserie', 'serie', 'noserie', 'numerodeserie'],
  marca: ['marca'],
  modelo: ['modelo'],
  fechaAplicacion: ['fechaaplicacion', 'fecha', 'fechaaplicacionservicio'],
  geolocalizacion: ['geolocalizacion', 'ubicacion', 'gps', 'latlng'],
}

const pickByAliases = (normalizedRow, aliases) => {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(normalizedRow, alias)) return normalizedRow[alias]
  }
  return ''
}

async function parseCondensersExcel(file) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) throw new Error('El archivo Excel no contiene hojas para importar.')

  const sheet = workbook.Sheets[firstSheetName]
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  const mappedRows = rawRows
    .map((rawRow) => {
      const normalizedRow = {}
      for (const [key, value] of Object.entries(rawRow)) {
        normalizedRow[normalizeHeader(key)] = value
      }

      const row = {
        numeroSerie: String(pickByAliases(normalizedRow, headerAliases.numeroSerie) || '').trim(),
        marca: String(pickByAliases(normalizedRow, headerAliases.marca) || '').trim(),
        modelo: String(pickByAliases(normalizedRow, headerAliases.modelo) || '').trim(),
        fechaAplicacion: pickByAliases(normalizedRow, headerAliases.fechaAplicacion),
        geolocalizacion: String(pickByAliases(normalizedRow, headerAliases.geolocalizacion) || '').trim(),
      }

      const isEmpty = !row.numeroSerie && !row.marca && !row.modelo && !row.fechaAplicacion && !row.geolocalizacion
      return isEmpty ? null : row
    })
    .filter(Boolean)

  if (mappedRows.length === 0) {
    throw new Error('No se encontraron filas válidas. Usa columnas: numeroSerie, marca, modelo, fechaAplicacion y geolocalizacion (opcional).')
  }

  return mappedRows
}

export default function ClientCondensersPage() {
  const { clientId } = useParams()
  const { getCliente, getClimasByCliente, getAsignaciones, createClima, createClimasBulk, updateClima, deleteClima } = useWorkData()
  const navigate = useNavigate()

  const [client, setClient] = useState(null)
  const [climas, setClimas] = useState([])
  const [activeAssignments, setActiveAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  
  // Persistence for last used Marca and Modelo
  const [lastMarca, setLastMarca] = useState('')
  const [lastModelo, setLastModelo] = useState('')
  
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)

  // Import related state
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [c, cls, as] = await Promise.all([
        getCliente(clientId), 
        getClimasByCliente(clientId),
        getAsignaciones()
      ])
      setClient(c)
      setClimas(cls)
      // Filter for active ones related to the client
      setActiveAssignments(as.filter(a => a.idCliente === clientId && (a.estado === 'PENDIENTE' || a.estado === 'EN_PROGRESO')))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [clientId, getCliente, getClimasByCliente, getAsignaciones])

  useEffect(() => { fetchData() }, [fetchData])

  const getGeoLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported')
      return
    }
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setForm(p => ({ ...p, geolocalizacion: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }))
        setGettingLocation(false)
      },
      (err) => {
        console.error('Error getting location:', err)
        setGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  }, [])

  const openCreate = () => { 
    const today = new Date().toISOString().split('T')[0]
    setForm({ 
      ...emptyForm, 
      marca: lastMarca, 
      modelo: lastModelo,
      fechaAplicacion: today
    })
    setFormError('')
    setModal('create')
    getGeoLocation()
  }

  const openImport = () => { 
    setImportFile(null)
    setImportSummary(null)
    setFormError('')
    setModal('import') 
  }
  
  const openEdit = (c) => { 
    setSelected(c)
    setForm({ 
      numeroSerie: c.numeroSerie, 
      marca: c.marca, 
      modelo: c.modelo, 
      fechaAplicacion: c.fechaAplicacion?.slice(0, 10) || '', 
      geolocalizacion: c.geolocalizacion || '' 
    })
    setFormError('')
    setModal('edit')
  }

  const openDelete = (c) => { setSelected(c); setFormError(''); setModal('delete') }
  const closeModal = () => { setModal(null); setSelected(null); setFormError('') }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.geolocalizacion) {
      setFormError('Captura la geolocalización antes de guardar.')
      return
    }
    setSaving(true); setFormError('')
    try {
      if (modal === 'create') {
        const newClima = await createClima({ ...form, idCliente: clientId })
        setClimas(prev => [newClima, ...prev])
        setClient(prev => prev ? { ...prev, _count: { climas: (prev._count?.climas || 0) + 1 } } : prev)
        
        setLastMarca(form.marca)
        setLastModelo(form.modelo)
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

  const handleImport = async (e) => {
    e.preventDefault()
    if (!importFile) {
      setFormError('Selecciona un archivo Excel antes de importar.')
      return
    }
    setImporting(true)
    setFormError('')
    setImportSummary(null)
    try {
      const rows = await parseCondensersExcel(importFile)
      const summary = await createClimasBulk(clientId, rows)
      setImportSummary(summary)
      await fetchData()
    } catch (e) {
      setFormError(e.message)
    } finally {
      setImporting(false)
    }
  }

  const columns = [
    { key: 'numeroSerie', header: 'Serie', render: row => (
      <div className="flex items-center gap-2">
        <span>{row.numeroSerie}</span>
        {activeAssignments.some(a => {
          try {
            const parsed = JSON.parse(a.notas || '{}')
            return (parsed.condensadoresSeleccionados || []).some(item => item.id === row.id)
          } catch(e) { return false }
        }) && (
          <span className="badge badge-warning badge-xs font-bold animate-pulse text-[8px]">MANT.</span>
        )}
      </div>
    )},
    { key: 'marca', header: 'Marca' },
    { key: 'modelo', header: 'Modelo' },
    { key: 'fechaAplicacion', header: 'Aplicación', render: row => row.fechaAplicacion?.slice(0, 10) || '-' },
    { key: 'geolocalizacion', header: 'Geolocalización' },
    {
      key: 'mantenimientos',
      header: `Mantenimientos ${new Date().getFullYear()}`,
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
            <Button size="sm" variant="outline" onClick={openImport}>Importar Excel</Button>
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
                  <span className="label-text mb-1 flex justify-between items-center">
                    Geolocalización
                    <button 
                      type="button" 
                      onClick={getGeoLocation} 
                      className="btn btn-xs btn-ghost text-primary gap-1 lowercase"
                      disabled={gettingLocation}
                    >
                      {gettingLocation ? <span className="loading loading-spinner loading-xs" /> : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      )}
                      {gettingLocation ? 'obteniendo...' : 'actualizar'}
                    </button>
                  </span>
                  <input 
                    className={`input input-bordered ${gettingLocation ? 'opacity-50' : ''}`} 
                    value={form.geolocalizacion} 
                    onChange={e => setForm(p => ({...p, geolocalizacion: e.target.value}))} 
                    placeholder="Lat, Lng o descripción" 
                  />
                </label>
              </div>
              {formError && <p className="text-sm text-error">{formError}</p>}
              <div className="modal-action"><Button type="button" onClick={closeModal} variant="outline">Cancelar</Button><Button type="submit" disabled={saving || gettingLocation}>{saving ? 'Guardando...' : 'Guardar'}</Button></div>
            </form>
          </div>
        </dialog>
      )}

      {modal === 'import' && (
        <dialog className="modal modal-open" onClick={closeModal}>
          <div className="modal-box max-w-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Importar condensadores desde Excel</h3>
            <p className="text-sm text-base-content/70 mb-4">
              Sube un archivo .xlsx o .xls con columnas: <strong>numeroSerie</strong>, <strong>marca</strong>, <strong>modelo</strong>, <strong>fechaAplicacion</strong> y opcional <strong>geolocalizacion</strong>.
            </p>
            <form onSubmit={handleImport} className="grid gap-4">
              <label className="form-control">
                <span className="label-text mb-1">Archivo Excel</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="file-input file-input-bordered w-full"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
              </label>
              {formError && <p className="text-sm text-error">{formError}</p>}
              {importSummary && (
                <div className="rounded-xl border border-base-300 bg-base-200/40 p-3 text-sm">
                  <p><strong>Total filas:</strong> {importSummary.totalRows}</p>
                  <p><strong>Filas válidas:</strong> {importSummary.validRows}</p>
                  <p><strong>Creadas:</strong> {importSummary.created}</p>
                  <p><strong>Duplicadas/conflicto:</strong> {importSummary.duplicatesOrConflicts}</p>
                  {Array.isArray(importSummary.rejected) && importSummary.rejected.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold">Filas rechazadas:</p>
                      <ul className="mt-1 list-disc pl-5">
                        {importSummary.rejected.slice(0, 10).map((item, idx) => (
                          <li key={`${item.row}-${idx}`}>Fila {item.row}: {item.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div className="modal-action">
                <Button type="button" onClick={closeModal} variant="outline">Cerrar</Button>
                <Button type="submit" disabled={importing}>{importing ? 'Importando...' : 'Importar'}</Button>
              </div>
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
