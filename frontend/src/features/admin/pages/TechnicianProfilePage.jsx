import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import Button from '../../../shared/ui/Button'
import { useWorkData } from '../../../app/providers/useWorkData'

export default function TechnicianProfilePage() {
  const { technicianId } = useParams()
  const navigate = useNavigate()
  const { technicians, clients, condensers, assignments, maintenanceRecords, createAssignment } =
    useWorkData()

  const technician = technicians.find((item) => item.id === technicianId)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(clients[0]?.name ?? '')
  const [selectedCondenser, setSelectedCondenser] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [workType, setWorkType] = useState('Mantenimiento preventivo')
  const [activeTab, setActiveTab] = useState('solicitudes')

  if (!technician) {
    return <Navigate to="/admin/tecnicos" replace />
  }

  const availableCondensers = condensers.filter((item) => item.clientName === selectedClient)
  const technicianMaintenanceHistory = maintenanceRecords.filter((item) => item.performedBy === technician.name)
  const technicianAssignments = assignments.filter((item) => item.technicianName === technician.name)

  const assignmentColumns = [
    { key: 'id', header: 'Asignacion' },
    { key: 'clientName', header: 'Cliente' },
    { key: 'condenserId', header: 'Condensador' },
    { key: 'scheduledDate', header: 'Fecha visita' },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => (
        <span className={`badge badge-sm ${row.status === 'Completado' ? 'badge-success' : 'badge-warning'}`}>
          {row.status}
        </span>
      ),
    },
  ]

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

  const handleClientChange = (value) => {
    setSelectedClient(value)
    const firstCondenser = condensers.find((item) => item.clientName === value)
    setSelectedCondenser(firstCondenser?.id ?? '')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!selectedClient || !selectedCondenser || !scheduledDate) {
      return
    }

    createAssignment({
      technicianName: technician.name,
      clientName: selectedClient,
      condenserId: selectedCondenser,
      scheduledDate,
      type: workType,
    })

    setScheduledDate('')
    setIsAssignModalOpen(false)
  }

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
            <Button size="sm" onClick={() => setIsAssignModalOpen(true)}>
              Asignar trabajo
            </Button>
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
            <DataTable
              columns={assignmentColumns}
              rows={technicianAssignments}
              emptyMessage="Este tecnico aun no tiene solicitudes asignadas."
              onRowClick={(row) => {
                const client = clients.find((item) => item.name === row.clientName)
                if (!client) {
                  return
                }

                navigate(`/admin/clientes/${client.id}/condensadores/${row.condenserId}`)
              }}
            />
          </article>
        ) : (
          <article>
            <PageHeader title="Historial de trabajos" />
            <DataTable
              columns={maintenanceHistoryColumns}
              rows={technicianMaintenanceHistory}
              emptyMessage="Este tecnico aun no tiene mantenimientos registrados."
              onRowClick={(row) => {
                const client = clients.find((item) => item.name === row.clientName)
                if (!client || !row.condenserId) {
                  return
                }

                navigate(`/admin/clientes/${client.id}/condensadores/${row.condenserId}`)
              }}
            />
          </article>
        )}
      </section>

      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-base-100 p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Asignar trabajo</h3>
                <p className="text-sm text-base-content/70">Tecnico: {technician.name}</p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setIsAssignModalOpen(false)}
              >
                Cerrar
              </button>
            </div>

            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
              <label className="form-control">
                <span className="label-text mb-1">Cliente</span>
                <select
                  className="select select-bordered"
                  value={selectedClient}
                  onChange={(event) => handleClientChange(event.target.value)}
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.name}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-control">
                <span className="label-text mb-1">Condensador</span>
                <select
                  className="select select-bordered"
                  value={selectedCondenser}
                  onChange={(event) => setSelectedCondenser(event.target.value)}
                >
                  <option value="">Selecciona condensador</option>
                  {availableCondensers.map((condenser) => (
                    <option key={condenser.id} value={condenser.id}>
                      {condenser.id} - {condenser.serial}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-control">
                <span className="label-text mb-1">Fecha visita</span>
                <input
                  className="input input-bordered"
                  type="date"
                  value={scheduledDate}
                  onChange={(event) => setScheduledDate(event.target.value)}
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-1">Tipo de trabajo</span>
                <select
                  className="select select-bordered"
                  value={workType}
                  onChange={(event) => setWorkType(event.target.value)}
                >
                  <option>Mantenimiento preventivo</option>
                  <option>Inspeccion de rutina</option>
                  <option>Mantenimiento correctivo</option>
                </select>
              </label>

              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar asignacion</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
