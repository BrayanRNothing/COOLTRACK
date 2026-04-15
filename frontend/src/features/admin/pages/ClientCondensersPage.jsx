import { Link, Navigate, useParams } from 'react-router-dom'
import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import { useWorkData } from '../../../app/providers/useWorkData'

const columns = [
  { key: 'id', header: 'Codigo' },
  { key: 'serial', header: 'Serie' },
  {
    key: 'completedThisYear',
    header: 'Mantenimientos',
    render: (row) => `${row.completedThisYear}/${row.annualMaintenances}`,
  },
  { key: 'nextDate', header: 'Proximo' },
  {
    key: 'profile',
    header: 'Perfil',
    render: (row) => row.profile,
  },
]

export default function ClientCondensersPage() {
  const { clientId } = useParams()
  const { clients, condensers } = useWorkData()

  const client = clients.find((item) => item.id === clientId)
  if (!client) {
    return <Navigate to="/admin/clientes" replace />
  }

  const clientCondensers = condensers.filter((item) => item.clientName === client.name)
  const condensersWithProfileLink = clientCondensers.map((condenser) => ({
    ...condenser,
    profile: (
      <Link
        className="link link-primary font-medium"
        to={`/admin/clientes/${client.id}/condensadores/${condenser.id}`}
      >
        Ver perfil
      </Link>
    ),
  }))

  return (
    <section>
      <PageHeader
        title={`Condensadores de ${client.name}`}
        subtitle={`Cliente ${client.id} - ${client.city}`}
        actions={
          <Link className="btn btn-sm btn-outline" to="/admin/clientes">
            Volver a clientes
          </Link>
        }
      />

      <DataTable
        columns={columns}
        rows={condensersWithProfileLink}
        emptyMessage="Este cliente aun no tiene condensadores registrados."
      />
    </section>
  )
}
