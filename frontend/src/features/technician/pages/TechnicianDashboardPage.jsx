import { Link } from 'react-router-dom'
import PageHeader from '../../../shared/ui/PageHeader'
import { useWorkData } from '../../../app/providers/useWorkData'
import { useAuth } from '../../../app/providers/useAuth'

export default function TechnicianDashboardPage() {
  const { clientAssignments, condensers, technicianTasks } = useWorkData()
  const { currentUser } = useAuth()

  const myClientAssignments = clientAssignments.filter(
    (item) => item.technicianName === currentUser?.name,
  )

  return (
    <section>
      <PageHeader
        title="Mis clientes asignados"
        subtitle="Selecciona un cliente para ver sus condensadores y registrar mantenimiento."
      />

      {myClientAssignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-base-300 bg-base-100 p-6 text-center text-base-content/70">
          Aun no tienes clientes asignados.
        </div>
      ) : (
        <div className="grid gap-3">
          {myClientAssignments.map((assignment) => {
            const clientCondensers = condensers.filter(
              (item) => item.clientName === assignment.clientName,
            )
            const pendingTasks = technicianTasks.filter(
              (task) =>
                task.technicianName === currentUser?.name &&
                task.clientId === assignment.clientId &&
                task.status !== 'Completado',
            )

            return (
              <article key={assignment.id} className="rounded-xl border border-base-300 bg-base-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-base-content/60">Cliente</p>
                    <h2 className="text-lg font-semibold">
                      {assignment.clientId} - {assignment.clientName}
                    </h2>
                    <p className="text-xs text-base-content/60">Asignado el {assignment.assignedAt}</p>
                  </div>

                  <Link
                    className="btn btn-sm btn-primary"
                    to={`/tecnico/clientes/${assignment.clientId}/condensadores`}
                  >
                    Ver condensadores
                  </Link>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="badge badge-outline">{clientCondensers.length} condensador(es)</span>
                  <span className="badge badge-outline">{pendingTasks.length} pendiente(s)</span>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
