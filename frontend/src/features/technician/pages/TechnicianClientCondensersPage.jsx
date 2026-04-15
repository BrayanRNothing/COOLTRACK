import { Link, Navigate, useParams } from 'react-router-dom'
import PageHeader from '../../../shared/ui/PageHeader'
import { useWorkData } from '../../../app/providers/useWorkData'
import { useAuth } from '../../../app/providers/useAuth'

export default function TechnicianClientCondensersPage() {
  const { clientId } = useParams()
  const { clientAssignments, condensers, technicianTasks } = useWorkData()
  const { currentUser } = useAuth()

  const assignment = clientAssignments.find(
    (item) => item.clientId === clientId && item.technicianName === currentUser?.name,
  )

  if (!assignment) {
    return <Navigate to="/tecnico/dashboard" replace />
  }

  const clientCondensers = condensers.filter((item) => item.clientName === assignment.clientName)

  return (
    <section>
      <PageHeader
        title={`Condensadores de ${assignment.clientName}`}
        subtitle={`Cliente ${assignment.clientId} - Selecciona un condensador para ver detalles.`}
        actions={
          <Link className="btn btn-sm btn-outline" to="/tecnico/dashboard">
            Volver a clientes
          </Link>
        }
      />

      {clientCondensers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-base-300 bg-base-100 p-6 text-center text-base-content/70">
          Este cliente no tiene condensadores registrados.
        </div>
      ) : (
        <div className="grid gap-3">
          {clientCondensers.map((item) => {
            const pendingTask = technicianTasks.find(
              (task) =>
                task.technicianName === currentUser?.name &&
                task.clientId === assignment.clientId &&
                task.condenserId === item.id &&
                task.status !== 'Completado',
            )

            return (
              <article key={item.id} className="rounded-xl border border-base-300 bg-base-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {item.id} - {item.serial}
                    </h2>
                    <p className="text-sm text-base-content/70">
                      {item.brand ?? 'Sin marca'} {item.model ?? ''}
                    </p>
                    <p className="text-xs text-base-content/60">
                      Fecha aplicacion: {item.applicationDate ?? 'Sin dato'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`badge ${pendingTask ? 'badge-warning' : 'badge-success'}`}>
                      {pendingTask ? 'Pendiente' : 'Completado'}
                    </span>
                    <Link
                      className="btn btn-sm btn-primary"
                      to={`/tecnico/clientes/${assignment.clientId}/condensadores/${item.id}/captura`}
                    >
                      Ver detalles
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
