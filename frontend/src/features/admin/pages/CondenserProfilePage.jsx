import { Link, Navigate, useParams } from 'react-router-dom'
import PageHeader from '../../../shared/ui/PageHeader'
import { useWorkData } from '../../../app/providers/useWorkData'

function formatDateTime(value) {
  if (!value) {
    return 'Sin fecha'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}

export default function CondenserProfilePage() {
  const { clientId, condenserId } = useParams()
  const { clients, condensers, maintenanceRecords, technicianTasks } = useWorkData()

  const client = clients.find((item) => item.id === clientId)
  const condenser = condensers.find((item) => item.id === condenserId)

  if (!client || !condenser || condenser.clientName !== client.name) {
    return <Navigate to={`/admin/clientes/${clientId}/condensadores`} replace />
  }

  const condenserRecords = maintenanceRecords
    .filter((record) => record.condenserId === condenser.id)
    .sort((left, right) => {
      const leftTime = new Date(left.performedAtTime ?? left.performedAt ?? 0).getTime()
      const rightTime = new Date(right.performedAtTime ?? right.performedAt ?? 0).getTime()
      return rightTime - leftTime
    })

  const firstRecord = condenserRecords[0]
  const linkedTask = firstRecord
    ? technicianTasks.find((task) => task.id === firstRecord.taskId)
    : null

  return (
    <section className="grid gap-4">
      <PageHeader
        title={`Perfil del condensador ${condenser.serial}`}
        subtitle={`${client.name} - ${client.city}`}
        actions={
          <Link className="btn btn-sm btn-outline" to={`/admin/clientes/${client.id}/condensadores`}>
            Volver a lista
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <article className="rounded-xl border border-base-300 bg-base-100 p-4">
            <p className="text-sm text-base-content/60">Codigo interno</p>
            <p className="text-xl font-semibold">{condenser.id}</p>
            <p className="mt-3 text-sm text-base-content/60">Serie</p>
            <p className="font-medium">{condenser.serial}</p>
          </article>

          <div className="grid grid-cols-2 gap-3">
            <article className="rounded-xl border border-base-300 bg-base-100 p-4">
              <p className="text-xs text-base-content/60">Mantenimientos</p>
              <p className="text-2xl font-bold">
                {condenser.completedThisYear}/{condenser.annualMaintenances}
              </p>
            </article>
            <article className="rounded-xl border border-base-300 bg-base-100 p-4">
              <p className="text-xs text-base-content/60">Proximo mantenimiento</p>
              <p className="text-lg font-semibold">{condenser.nextDate}</p>
            </article>
          </div>

          <article className="rounded-xl border border-base-300 bg-base-100 p-4">
            <p className="text-sm font-semibold">Resumen tecnico</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-base-content/60">Marca</dt>
                <dd className="font-medium">{condenser.brand ?? 'Sin dato'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-base-content/60">Modelo</dt>
                <dd className="font-medium">{condenser.model ?? 'Sin dato'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-base-content/60">Fecha de aplicacion</dt>
                <dd className="font-medium">{condenser.applicationDate ?? 'Sin dato'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-base-content/60">Geolocalizacion</dt>
                <dd className="font-medium">{condenser.geolocation ?? 'Sin dato'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-base-content/60">Cliente final</dt>
                <dd className="font-medium">{condenser.finalClient ?? 'Sin dato'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-base-content/60">Cliente</dt>
                <dd className="font-medium">{client.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-base-content/60">Ciudad</dt>
                <dd className="font-medium">{client.city}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-base-content/60">Ultima visita</dt>
                <dd className="font-medium">{formatDateTime(firstRecord?.performedAtTime ?? firstRecord?.performedAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-base-content/60">Tecnico</dt>
                <dd className="font-medium">{firstRecord?.performedBy ?? 'Sin registro'}</dd>
              </div>
            </dl>
          </article>

          {linkedTask && (
            <article className="rounded-xl border border-base-300 bg-base-100 p-4">
              <p className="text-sm font-semibold">Ultima orden vinculada</p>
              <p className="mt-2 text-sm text-base-content/70">{linkedTask.type}</p>
              <p className="text-sm text-base-content/70">Estado: {linkedTask.status}</p>
              <p className="text-sm text-base-content/70">Programada: {linkedTask.scheduledDate}</p>
            </article>
          )}
        </aside>

        <div className="space-y-4">
          <article className="rounded-xl border border-base-300 bg-base-100 p-4 sm:p-6">
            <PageHeader
              title="Historial de mantenimientos"
              subtitle="Cada registro muestra tecnico, fecha y hora, observaciones y evidencia fotografica."
            />

            <div className="space-y-4">
              {condenserRecords.length === 0 ? (
                <div className="rounded-xl border border-dashed border-base-300 bg-base-200 p-6 text-center text-base-content/70">
                  Este condensador aun no tiene mantenimientos registrados.
                </div>
              ) : (
                condenserRecords.map((record) => (
                  <article key={record.id} className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm text-base-content/60">Registro {record.id}</p>
                        <h3 className="text-lg font-semibold">
                          {formatDateTime(record.performedAtTime ?? record.performedAt)}
                        </h3>
                        <p className="text-sm text-base-content/70">Tecnico: {record.performedBy}</p>
                      </div>
                      {record.taskId && <span className="badge badge-outline">{record.taskId}</span>}
                    </div>

                    <p className="mt-3 whitespace-pre-line text-sm text-base-content/80">{record.notes}</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-base-200 p-3">
                        <p className="text-xs uppercase tracking-wide text-base-content/50">Fotos</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {record.photos?.length > 0 ? (
                            record.photos.map((photo) => (
                              <span key={photo} className="badge badge-neutral badge-outline">
                                {photo}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-base-content/60">Sin fotos adjuntas</span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg bg-base-200 p-3">
                        <p className="text-xs uppercase tracking-wide text-base-content/50">Datos del registro</p>
                        <dl className="mt-2 space-y-1 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-base-content/60">Fecha y hora</dt>
                            <dd className="font-medium">{formatDateTime(record.performedAtTime ?? record.performedAt)}</dd>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-base-content/60">Serie</dt>
                            <dd className="font-medium">{record.condenserNumber ?? condenser.serial}</dd>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-base-content/60">Cliente</dt>
                            <dd className="font-medium">{record.clientName}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}