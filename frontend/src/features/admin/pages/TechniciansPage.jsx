import { Link } from 'react-router-dom'
import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import { useWorkData } from '../../../app/providers/useWorkData'

export default function TechniciansPage() {
  const { technicians } = useWorkData()

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
        <Link className="btn btn-xs btn-outline" to={`/admin/tecnicos/${row.id}`}>
          Ver perfil
        </Link>
      ),
    },
  ]

  return (
    <section>
      <PageHeader
        title="Tecnicos contratistas"
        subtitle="Vista limpia de listado. Haz click en un tecnico para entrar a su perfil."
      />

      <DataTable columns={columns} rows={technicians} emptyMessage="No hay tecnicos registrados." />
    </section>
  )
}
