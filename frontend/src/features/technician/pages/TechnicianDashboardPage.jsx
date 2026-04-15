import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import { useWorkData } from '../../../app/providers/useWorkData'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'

const columns = [
  { key: 'id', header: 'Trabajo' },
  { key: 'clientName', header: 'Cliente' },
  { key: 'condenserId', header: 'Condensador' },
  { key: 'type', header: 'Tipo' },
  { key: 'scheduledDate', header: 'Fecha' },
  {
    key: 'status',
    header: 'Estado',
    render: (row) => (
      <span className={`badge badge-sm ${row.status === 'Completado' ? 'badge-success' : 'badge-warning'}`}>
        {row.status}
      </span>
    ),
  },
  {
    key: 'actions',
    header: 'Accion',
    render: (row) => (
      <Link className="link link-primary text-sm" to={`/tecnico/mantenimientos/nuevo?taskId=${row.id}`}>
        Iniciar mision
      </Link>
    ),
  },
]

export default function TechnicianDashboardPage() {
  const { technicianTasks } = useWorkData()
  const { currentUser } = useAuth()
  const myTasks = technicianTasks.filter((task) => task.technicianName === currentUser?.name)

  return (
    <section>
      <PageHeader
        title="Mis misiones"
        subtitle="Solicitudes asignadas para ejecutar mantenimiento en campo."
      />

      <DataTable columns={columns} rows={myTasks} emptyMessage="No tienes misiones asignadas." />
    </section>
  )
}
