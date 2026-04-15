import { useMemo, useState } from 'react'
import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import Button from '../../../shared/ui/Button'
import { useWorkData } from '../../../app/providers/useWorkData'

const columns = [
  { key: 'id', header: 'Asignacion' },
  { key: 'technicianName', header: 'Tecnico' },
  { key: 'clientId', header: 'No. cliente' },
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
  const { assignments, clients, condensers, technicians, createAssignments } = useWorkData()
  const [showForm, setShowForm] = useState(false)
  const [createSummary, setCreateSummary] = useState('')
  const defaultClientId = clients[0]?.id ?? ''
  const [form, setForm] = useState({
    technicianName: technicians[0]?.name ?? '',
    clientId: defaultClientId,
    condenserIds: [],
    scheduledDate: '',
    type: 'Mantenimiento preventivo',
  })

  const availableCondensers = useMemo(
    () => {
      const selectedClient = clients.find((item) => item.id === form.clientId)
      return condensers.filter((item) => item.clientName === selectedClient?.name)
    },
    [clients, condensers, form.clientId],
  )

  const handleToggleForm = () => {
    setShowForm((value) => !value)
  }

  const handleChange = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  const handleClientChange = (value) => {
    const selectedClient = clients.find((item) => item.id === value)
    const firstCondenser = condensers.find((item) => item.clientName === selectedClient?.name)
    setForm((previous) => ({
      ...previous,
      clientId: value,
      condenserIds: firstCondenser?.id ? [firstCondenser.id] : [],
    }))
  }

  const handleCondenserToggle = (condenserId, isChecked) => {
    setForm((previous) => {
      if (isChecked) {
        return {
          ...previous,
          condenserIds: [...new Set([...previous.condenserIds, condenserId])],
        }
      }

      return {
        ...previous,
        condenserIds: previous.condenserIds.filter((id) => id !== condenserId),
      }
    })
  }

  const handleSelectAllCondensers = () => {
    setForm((previous) => ({
      ...previous,
      condenserIds: availableCondensers.map((item) => item.id),
    }))
  }

  const handleClearCondensers = () => {
    setForm((previous) => ({ ...previous, condenserIds: [] }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setCreateSummary('')

    if (!form.clientId || form.condenserIds.length === 0 || !form.scheduledDate) {
      return
    }

    const result = createAssignments(form)
    if (result.createdCount === 0) {
      return
    }

    setCreateSummary(`Se crearon ${result.createdCount} asignaciones correctamente.`)

    setShowForm(false)
    setForm((previous) => ({
      ...previous,
      condenserIds: [],
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

      <article className="mb-4 rounded-xl border border-base-300 bg-base-100 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-base-content/60">Total de asignaciones</p>
            <p className="text-2xl font-semibold">{assignments.length}</p>
          </div>
          <p className="text-sm text-base-content/70">
            Puedes crear varias asignaciones en una sola operación seleccionando varios condensadores.
          </p>
        </div>
      </article>

      {createSummary && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
          {createSummary}
        </div>
      )}

      {showForm && (
        <form className="mb-4 rounded-xl border border-base-300 bg-base-100" onSubmit={handleSubmit}>
          <div className="border-b border-base-300 px-4 py-3 sm:px-5">
            <h3 className="text-base font-semibold">Nueva asignacion masiva</h3>
            <p className="text-sm text-base-content/70">Selecciona tecnico, cliente y uno o varios equipos.</p>
          </div>

          <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-base-content/80" htmlFor="assignment-tech">
                Tecnico
              </label>
              <select
                id="assignment-tech"
                className="select select-bordered w-full"
                value={form.technicianName}
                onChange={(event) => handleChange('technicianName', event.target.value)}
              >
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.name}>
                    {technician.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-base-content/80" htmlFor="assignment-client">
                Numero de cliente
              </label>
              <select
                id="assignment-client"
                className="select select-bordered w-full"
                value={form.clientId}
                onChange={(event) => handleClientChange(event.target.value)}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.id} - {client.name}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="form-control sm:col-span-2">
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="label-text">Condensadores (puedes seleccionar varios)</span>
                <div className="flex gap-2">
                  <button className="btn btn-xs btn-ghost" type="button" onClick={handleSelectAllCondensers}>
                    Seleccionar todos
                  </button>
                  <button className="btn btn-xs btn-ghost" type="button" onClick={handleClearCondensers}>
                    Limpiar
                  </button>
                </div>
              </div>
              <div className="max-h-48 space-y-2 overflow-auto rounded-lg border border-base-300 bg-base-100 p-3">
                {availableCondensers.length === 0 ? (
                  <p className="text-sm text-base-content/60">No hay condensadores disponibles para este cliente.</p>
                ) : (
                  availableCondensers.map((condenser) => (
                    <label key={condenser.id} className="label cursor-pointer justify-start gap-3">
                      <input
                        className="checkbox checkbox-sm"
                        type="checkbox"
                        checked={form.condenserIds.includes(condenser.id)}
                        onChange={(event) => handleCondenserToggle(condenser.id, event.target.checked)}
                      />
                      <span className="label-text">
                        {condenser.id} - {condenser.serial} ({condenser.brand ?? 'Sin marca'} {condenser.model ?? ''})
                      </span>
                    </label>
                  ))
                )}
              </div>
              <span className="mt-1 text-xs text-base-content/60">
                Seleccionados: {form.condenserIds.length}
              </span>
            </fieldset>

            <div className="space-y-2">
              <label className="text-sm font-medium text-base-content/80" htmlFor="assignment-date">
                Fecha de visita
              </label>
              <input
                id="assignment-date"
                className="input input-bordered w-full"
                type="date"
                value={form.scheduledDate}
                onChange={(event) => handleChange('scheduledDate', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-base-content/80" htmlFor="assignment-type">
                Tipo de trabajo
              </label>
              <select
                id="assignment-type"
                className="select select-bordered w-full"
                value={form.type}
                onChange={(event) => handleChange('type', event.target.value)}
              >
                <option>Mantenimiento preventivo</option>
                <option>Inspeccion de rutina</option>
                <option>Mantenimiento correctivo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-base-300 px-4 py-3 sm:px-5">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar asignaciones</Button>
          </div>
        </form>
      )}

      <DataTable columns={columns} rows={assignments} emptyMessage="No hay asignaciones creadas." />
    </section>
  )
}
