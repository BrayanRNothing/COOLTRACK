import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import Button from '../../../shared/ui/Button'
import { useWorkData } from '../../../app/providers/useWorkData'

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

export default function CondensersPage() {
  const { condensers } = useWorkData()

  return (
    <section>
      <PageHeader
        title="Condensadores"
        subtitle="Cada condensador requiere 3 mantenimientos anuales."
        actions={<Button size="sm">Nuevo condensador</Button>}
      />

      <DataTable
        columns={columns}
        rows={condensers}
        emptyMessage="Aun no hay condensadores registrados."
      />
    </section>
  )
}
