import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import { useWorkData } from '../../../app/providers/useWorkData'

export default function TechnicianProfilePage() {
  const { technicianId } = useParams()
  const { technicians, assignments, maintenanceRecords } = useWorkData()

  const technician = technicians.find((item) => item.id === technicianId)
  const [activeTab, setActiveTab] = useState('solicitudes')

  if (!technician) {
    return <Navigate to="/admin/tecnicos" replace />
  }

  const technicianMaintenanceHistory = maintenanceRecords.filter((item) => item.performedBy === technician.name)
  const technicianAssignments = assignments.filter((item) => item.technicianName === technician.name)

  const assignmentsByClient = useMemo(() => {
    const grouped = technicianAssignments.reduce((accumulator, assignment) => {
      const key = `${assignment.clientId}-${assignment.clientName}`
      if (!accumulator[key]) {
        accumulator[key] = {
          clientId: assignment.clientId,
          clientName: assignment.clientName,
          condensers: new Set(),
          assignmentItems: [],
        }
      }

      accumulator[key].condensers.add(assignment.condenserId)
      accumulator[key].assignmentItems.push(assignment)
      return accumulator
    }, {})

    return Object.values(grouped)
      .map((item) => ({
        ...item,
        condenserList: [...item.condensers],
      }))
      .sort((left, right) => left.clientId.localeCompare(right.clientId))
  }, [technicianAssignments])

  const maintenanceHistoryColumns = [
    { key: 'id', header: 'Registro' },
    { key: 'clientName', header: 'Cliente' },
    {
      key: 'condenserNumber',
      header: 'Numero condensador',
      render: (row) => row.condenserNumber ?? row.condenserId,
    },
    { key: 'performedAt', header: 'Fecha' },
    {
      key: 'photos',
      header: 'Fotos',
      render: (row) => row.photos.length,
    },
  ]

  return (
    <section>
      <PageHeader
        title={`Perfil tecnico: ${technician.name}`}
        subtitle={`${technician.specialty} - ${technician.zone} - ${technician.phone}`}
        actions={
          <div className="flex gap-2">
            <Link className="btn btn-sm btn-outline" to="/admin/tecnicos">
              Volver a lista
            </Link>
          </div>
        }
      />

      <section className="grid gap-4">
        <div className="rounded-xl border border-base-300 bg-base-100 p-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'solicitudes' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('solicitudes')}
            >
              Solicitudes asignadas
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'historial' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('historial')}
            >
              Historial
            </button>
          </div>
        </div>

        {activeTab === 'solicitudes' ? (
          <article>
            <PageHeader title="Solicitudes asignadas" />

            {assignmentsByClient.length === 0 ? (
              <div className="rounded-xl border border-dashed border-base-300 bg-base-100 p-6 text-center text-base-content/70">
                Este tecnico aun no tiene solicitudes asignadas.
              </div>
            ) : (
              <div className="space-y-3">
                {assignmentsByClient.map((item) => (
                  <article key={`${item.clientId}-${item.clientName}`} className="rounded-xl border border-base-300 bg-base-100 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-base-content/60">Cliente asignado</p>
                        <h3 className="text-lg font-semibold">
                          {item.clientId} - {item.clientName}
                        </h3>
                      </div>
                      <span className="badge badge-outline">{item.condenserList.length} condensador(es)</span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium">Lista de condensadores asignados</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.condenserList.map((condenserId) => (
                          <span key={condenserId} className="badge badge-neutral badge-outline">
                            {condenserId}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 overflow-x-auto rounded-lg border border-base-300">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Asignacion</th>
                            <th>Condensador</th>
                            <th>Fecha visita</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.assignmentItems.map((assignmentItem) => (
                            <tr key={assignmentItem.id}>
                              <td>{assignmentItem.id}</td>
                              <td>{assignmentItem.condenserId}</td>
                              <td>{assignmentItem.scheduledDate}</td>
                              <td>
                                <span
                                  className={`badge badge-sm ${
                                    assignmentItem.status === 'Completado'
                                      ? 'badge-success'
                                      : 'badge-warning'
                                  }`}
                                >
                                  {assignmentItem.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        ) : (
          <article>
            <PageHeader title="Historial de trabajos" />
            <DataTable
              columns={maintenanceHistoryColumns}
              rows={technicianMaintenanceHistory}
              emptyMessage="Este tecnico aun no tiene mantenimientos registrados."
            />
          </article>
        )}
      </section>

    </section>
  )
}
