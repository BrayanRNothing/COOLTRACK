import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import Button from '../../../shared/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useWorkData } from '../../../app/providers/useWorkData'

export default function CondensersPage() {
  const { clients, condensers } = useWorkData()
  const navigate = useNavigate()

  const rowsWithClientId = condensers.map((condenser) => ({
    ...condenser,
    clientId: clients.find((client) => client.name === condenser.clientName)?.id ?? '',
  }))

  const columns = [
    { key: 'id', header: 'Codigo' },
    { key: 'clientName', header: 'Cliente' },
    { key: 'serial', header: 'Serie' },
    {
      key: 'completedThisYear',
      header: 'Mantenimientos',
      render: (row) => `${row.completedThisYear}/${row.annualMaintenances}`,
    },
    { key: 'nextDate', header: 'Proximo' },
  ]

  return (
    <section>
      <PageHeader
        title="Condensadores"
        subtitle="Cada condensador requiere 3 mantenimientos anuales."
        actions={<Button size="sm">Nuevo condensador</Button>}
      />

      <DataTable
        columns={columns}
        rows={rowsWithClientId}
        emptyMessage="Aun no hay condensadores registrados."
        onRowClick={(row) => {
          if (!row.clientId) {
            return
          }

          navigate(`/admin/clientes/${row.clientId}/condensadores/${row.id}`)
        }}
      />
    </section>
  )
}
