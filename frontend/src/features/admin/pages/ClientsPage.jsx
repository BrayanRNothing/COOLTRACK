import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import Button from '../../../shared/ui/Button'
import { Link } from 'react-router-dom'
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
  const { clients } = useWorkData()

  return (
    <section>
      <PageHeader
        title="Clientes"
        subtitle="Objeto de negocio del sistema (no usuarios logueables)."
        actions={<Button size="sm">Nuevo cliente</Button>}
      />

      <DataTable columns={columns} rows={clients} emptyMessage="Aun no hay clientes registrados." />
    </section>
  )
}
