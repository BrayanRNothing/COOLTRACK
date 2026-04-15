import { Link } from 'react-router-dom'
import { useState } from 'react'
import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import Button from '../../../shared/ui/Button'
import { useWorkData } from '../../../app/providers/useWorkData'

export default function TechniciansPage() {
  const { technicians, createTechnician, deleteTechnician } = useWorkData()
  const [showForm, setShowForm] = useState(false)
  const [technicianToDelete, setTechnicianToDelete] = useState(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    specialty: '',
    zone: '',
    status: 'Disponible',
  })

  const handleCreateTechnician = (event) => {
    event.preventDefault()
    const created = createTechnician(form)
    if (!created) {
      return
    }

    setForm({
      name: '',
      phone: '',
      specialty: '',
      zone: '',
      status: 'Disponible',
    })
    setShowForm(false)
  }

  const handleDeleteTechnician = () => {
    if (!technicianToDelete) {
      return
    }

    deleteTechnician(technicianToDelete.id)
    setTechnicianToDelete(null)
  }

  const columns = [
    { key: 'id', header: 'Codigo' },
    {
      key: 'name',
      header: 'Tecnico',
      render: (row) => (
        <Link className="link link-primary" to={`/admin/tecnicos/${row.id}`}>
          {row.name}
        </Link>
      ),
    },
    { key: 'phone', header: 'Telefono' },
    { key: 'specialty', header: 'Especialidad' },
    { key: 'zone', header: 'Zona' },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => (
        <span className={`badge badge-sm ${row.status === 'Disponible' ? 'badge-success' : 'badge-warning'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Accion',
      render: (row) => (
        <div className="flex gap-2">
          <Link className="btn btn-xs btn-outline" to={`/admin/tecnicos/${row.id}`}>
            Ver perfil
          </Link>
          <button
            className="btn btn-xs btn-error btn-outline"
            type="button"
            onClick={() => setTechnicianToDelete(row)}
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ]

  return (
    <section>
      <PageHeader
        title="Tecnicos contratistas"
        subtitle="Vista limpia de listado. Haz click en un tecnico para entrar a su perfil."
        actions={
          <Button size="sm" onClick={() => setShowForm((value) => !value)}>
            {showForm ? 'Cerrar formulario' : 'Nuevo tecnico'}
          </Button>
        }
      />

      <article className="mb-4 rounded-xl border border-base-300 bg-base-100 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-base-content/60">Tecnicos activos</p>
            <p className="text-2xl font-semibold">{technicians.length}</p>
          </div>
          <p className="text-sm text-base-content/70">
            Usa "Nuevo tecnico" para abrir el formulario y "Eliminar" para quitar un registro.
          </p>
        </div>
      </article>

      {showForm && (
        <form className="mb-4 rounded-xl border border-base-300 bg-base-100" onSubmit={handleCreateTechnician}>
          <div className="border-b border-base-300 px-4 py-3 sm:px-5">
            <h3 className="text-base font-semibold">Alta de tecnico</h3>
            <p className="text-sm text-base-content/70">Registra datos de contacto y especialidad operativa.</p>
          </div>

          <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-base-content/80" htmlFor="technician-name">
                Nombre
              </label>
              <input
                id="technician-name"
                className="input input-bordered w-full"
                value={form.name}
                onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-base-content/80" htmlFor="technician-phone">
                Telefono
              </label>
              <input
                id="technician-phone"
                className="input input-bordered w-full"
                value={form.phone}
                onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-base-content/80" htmlFor="technician-specialty">
                Especialidad
              </label>
              <input
                id="technician-specialty"
                className="input input-bordered w-full"
                value={form.specialty}
                onChange={(event) => setForm((previous) => ({ ...previous, specialty: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-base-content/80" htmlFor="technician-zone">
                Zona
              </label>
              <input
                id="technician-zone"
                className="input input-bordered w-full"
                value={form.zone}
                onChange={(event) => setForm((previous) => ({ ...previous, zone: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-base-content/80" htmlFor="technician-status">
                Estado
              </label>
              <select
                id="technician-status"
                className="select select-bordered w-full"
                value={form.status}
                onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value }))}
              >
                <option>Disponible</option>
                <option>En ruta</option>
                <option>No disponible</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-base-300 px-4 py-3 sm:px-5">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar tecnico</Button>
          </div>
        </form>
      )}

      <DataTable columns={columns} rows={technicians} emptyMessage="No hay tecnicos registrados." />

      {technicianToDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <article className="w-full max-w-md rounded-xl border border-base-300 bg-base-100 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold">Confirmar eliminacion</h3>
            <p className="mt-2 text-sm text-base-content/80">
              Se eliminara el tecnico {technicianToDelete.name} y sus asignaciones activas.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setTechnicianToDelete(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleDeleteTechnician}>
                Eliminar tecnico
              </Button>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}
