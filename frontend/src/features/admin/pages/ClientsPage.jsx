import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import Button from '../../../shared/ui/Button'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useWorkData } from '../../../app/providers/useWorkData'

const columns = [
  { key: 'id', header: 'Codigo' },
  {
    key: 'name',
    header: 'Cliente',
    render: (row) => (
      <Link className="link link-primary" to={`/admin/clientes/${row.id}/condensadores`}>
        {row.name}
      </Link>
    ),
  },
  { key: 'city', header: 'Ciudad' },
  { key: 'condensers', header: 'Condensadores' },
]

export default function ClientsPage() {
  const { clients, createClient } = useWorkData()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', city: '' })

  const nextClientNumber = useMemo(() => {
    const maxCorrelative = clients.reduce((maxValue, client) => {
      const parsedValue = Number(String(client.id).replace('CL-', ''))
      if (Number.isNaN(parsedValue)) {
        return maxValue
      }

      return Math.max(maxValue, parsedValue)
    }, 0)

    return `CL-${String(maxCorrelative + 1).padStart(3, '0')}`
  }, [clients])

  const handleSubmit = (event) => {
    event.preventDefault()
    const createdClient = createClient(form)
    if (!createdClient) {
      return
    }

    setForm({ name: '', city: '' })
    setShowForm(false)
  }

  return (
    <section>
      <PageHeader
        title="Clientes"
        subtitle="Objeto de negocio del sistema (no usuarios logueables)."
        actions={
          <Button size="sm" onClick={() => setShowForm((value) => !value)}>
            {showForm ? 'Cancelar' : 'Nuevo cliente'}
          </Button>
        }
      />

      {showForm && (
        <form className="mb-4 rounded-xl border border-base-300 bg-base-100" onSubmit={handleSubmit}>
          <div className="border-b border-base-300 px-4 py-3 sm:px-5">
            <h3 className="text-base font-semibold">Alta de cliente</h3>
            <p className="text-sm text-base-content/70">Completa los datos basicos para crear un nuevo cliente.</p>
          </div>

          <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-base-content/80" htmlFor="client-number">
                Numero de cliente
              </label>
              <input id="client-number" className="input input-bordered w-full bg-base-200" value={nextClientNumber} readOnly />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-base-content/80" htmlFor="client-city">
                Ciudad
              </label>
              <input
                id="client-city"
                className="input input-bordered w-full"
                value={form.city}
                onChange={(event) => setForm((previous) => ({ ...previous, city: event.target.value }))}
                placeholder="Ej. Lima"
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-base-content/80" htmlFor="client-name">
                Nombre o empresa
              </label>
              <input
                id="client-name"
                className="input input-bordered w-full"
                value={form.name}
                onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                placeholder="Ej. Clinica Santa Fe"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-base-300 px-4 py-3 sm:px-5">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar cliente</Button>
          </div>
        </form>
      )}

      <DataTable columns={columns} rows={clients} emptyMessage="Aun no hay clientes registrados." />
    </section>
  )
}
