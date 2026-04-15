import { useMemo, useState } from 'react'
import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import Button from '../../../shared/ui/Button'
import { useWorkData } from '../../../app/providers/useWorkData'

const columns = [
  { key: 'id', header: 'Asignacion' },
  { key: 'technicianName', header: 'Tecnico' },
  { key: 'clientName', header: 'Cliente' },
  { key: 'condenserId', header: 'Condensador' },
  { key: 'scheduledDate', header: 'Fecha visita' },
  {
    key: 'status',
    header: 'Estado',
    render: (row) => (
      <span className={`badge badge-sm ${row.status === 'Pendiente' ? 'badge-warning' : 'badge-info'}`}>
        {row.status}
      </span>
    ),
  },
]

export default function AssignmentsPage() {
  const { assignments, clients, condensers, technicians, createAssignment } = useWorkData()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    technicianName: technicians[0]?.name ?? '',
    clientName: clients[0]?.name ?? '',
    condenserId: '',
    scheduledDate: '',
    type: 'Mantenimiento preventivo',
  })

  const availableCondensers = useMemo(
    () => condensers.filter((item) => item.clientName === form.clientName),
    [condensers, form.clientName],
  )

  const handleToggleForm = () => {
    setShowForm((value) => !value)
  }

  const handleChange = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  const handleClientChange = (value) => {
    const firstCondenser = condensers.find((item) => item.clientName === value)
    setForm((previous) => ({
      ...previous,
      clientName: value,
      condenserId: firstCondenser?.id ?? '',
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.clientName || !form.condenserId || !form.scheduledDate) {
      return
    }

    createAssignment(form)
    setShowForm(false)
    setForm((previous) => ({
      ...previous,
      condenserId: condensers.find((item) => item.clientName === previous.clientName)?.id ?? '',
      scheduledDate: '',
    }))
  }

  return (
    <section>
      <PageHeader
        title="Asignaciones a Tecnicos"
        subtitle="El admin asigna cliente + condensador + fecha al tecnico contratista."
        actions={
          <Button size="sm" onClick={handleToggleForm}>
            {showForm ? 'Ocultar formulario' : 'Nueva asignacion'}
          </Button>
        }
      />

      {showForm && (
        <form className="mb-4 grid gap-3 rounded-xl border border-base-300 bg-base-100 p-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="form-control">
            <span className="label-text mb-1">Tecnico</span>
            <select
              className="select select-bordered"
              value={form.technicianName}
              onChange={(event) => handleChange('technicianName', event.target.value)}
            >
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.name}>
                  {technician.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Cliente</span>
            <select
              className="select select-bordered"
              value={form.clientName}
              onChange={(event) => handleClientChange(event.target.value)}
            >
              {clients.map((client) => (
                <option key={client.id} value={client.name}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Condensador</span>
            <select
              className="select select-bordered"
              value={form.condenserId}
              onChange={(event) => handleChange('condenserId', event.target.value)}
            >
              <option value="">Selecciona condensador</option>
              {availableCondensers.map((condenser) => (
                <option key={condenser.id} value={condenser.id}>
                  {condenser.id} - {condenser.serial}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Fecha de visita</span>
            <input
              className="input input-bordered"
              type="date"
              value={form.scheduledDate}
              onChange={(event) => handleChange('scheduledDate', event.target.value)}
            />
          </label>

          <label className="form-control sm:col-span-2">
            <span className="label-text mb-1">Tipo de trabajo</span>
            <select
              className="select select-bordered"
              value={form.type}
              onChange={(event) => handleChange('type', event.target.value)}
            >
              <option>Mantenimiento preventivo</option>
              <option>Inspeccion de rutina</option>
              <option>Mantenimiento correctivo</option>
            </select>
          </label>

          <div className="sm:col-span-2">
            <Button type="submit">Guardar asignacion</Button>
          </div>
        </form>
      )}

      <DataTable columns={columns} rows={assignments} emptyMessage="No hay asignaciones creadas." />
    </section>
  )
}
