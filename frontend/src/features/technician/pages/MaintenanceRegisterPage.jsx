import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../../shared/ui/Button'
import PageHeader from '../../../shared/ui/PageHeader'
import { useWorkData } from '../../../app/providers/useWorkData'
import { useAuth } from '../../../app/providers/useAuth'

export default function MaintenanceRegisterPage() {
  const { technicianTasks, maintenanceRecords, registerMaintenance, condensers } = useWorkData()
  const { currentUser } = useAuth()
  const [searchParams] = useSearchParams()
  const initialTaskId = searchParams.get('taskId')

  const myTasks = useMemo(
    () => technicianTasks.filter((task) => task.technicianName === currentUser?.name),
    [technicianTasks, currentUser?.name],
  )

  const resolveTaskCondenserNumber = (taskId) => {
    const task = myTasks.find((item) => item.id === taskId)
    if (!task) {
      return ''
    }

    const linkedCondenser = condensers.find((item) => item.id === task.condenserId)
    return linkedCondenser?.serial ?? task.condenserId
  }

  const firstTaskId = initialTaskId || myTasks[0]?.id || ''
  const [selectedTaskId, setSelectedTaskId] = useState(firstTaskId)
  const [notes, setNotes] = useState('')
  const [photoFiles, setPhotoFiles] = useState([])
  const [condenserNumber, setCondenserNumber] = useState(resolveTaskCondenserNumber(firstTaskId))
  const [geolocation, setGeolocation] = useState('')
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().slice(0, 10))

  const selectedTask = useMemo(
    () => myTasks.find((task) => task.id === selectedTaskId),
    [myTasks, selectedTaskId],
  )

  const availableTasks = useMemo(
    () => myTasks.filter((task) => task.status !== 'Completado'),
    [myTasks],
  )

  const selectedTaskClientCondensers = useMemo(() => {
    if (!selectedTask) {
      return []
    }

    const clientName = selectedTask.clientName
    return condensers.filter((item) => item.clientName === clientName)
  }, [selectedTask, condensers])

  const selectedCondenser = useMemo(
    () =>
      selectedTaskClientCondensers.find(
        (item) =>
          item.serial.toLowerCase() === condenserNumber.toLowerCase() ||
          item.id.toLowerCase() === condenserNumber.toLowerCase(),
      ),
    [selectedTaskClientCondensers, condenserNumber],
  )

  const handleTaskChange = (taskId) => {
    setSelectedTaskId(taskId)
    setCondenserNumber(resolveTaskCondenserNumber(taskId))
    setGeolocation('')
    setApplicationDate(new Date().toISOString().slice(0, 10))
    setPhotoFiles([])
  }

  const handlePhotosChange = (event) => {
    setPhotoFiles(Array.from(event.target.files ?? []))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!selectedTask || notes.trim().length < 10 || condenserNumber.trim().length < 3) {
      return
    }

    if (!geolocation.trim() || !applicationDate || photoFiles.length < 3) {
      return
    }

    const success = registerMaintenance({
      taskId: selectedTaskId,
      notes: notes.trim(),
      photoNames: photoFiles.map((file) => file.name),
      performedBy: currentUser?.name ?? 'Tecnico',
      condenserNumber,
      geolocation: geolocation.trim(),
      applicationDate,
    })

    if (success) {
      setNotes('')
      setPhotoFiles([])
      const nextTask = availableTasks.find((task) => task.id !== selectedTaskId)
      const nextTaskId = nextTask?.id ?? ''
      setSelectedTaskId(nextTaskId)
      setCondenserNumber(resolveTaskCondenserNumber(nextTaskId))
      setGeolocation('')
      setApplicationDate(new Date().toISOString().slice(0, 10))
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <article className="rounded-xl border border-base-300 bg-base-100 p-4 sm:p-6">
        <PageHeader
          title="Ejecutar mision"
          subtitle="Registra recubrimiento con geolocalizacion, fecha de aplicacion y 3 fotos obligatorias."
        />

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <article className="rounded-xl border border-base-300 bg-base-100 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/60">Paso 1</h3>
            <p className="mt-1 text-base font-semibold">Seleccion del trabajo</p>

            <label className="form-control mt-3">
              <span className="label-text mb-1">Trabajo asignado</span>
              <select
                className="select select-bordered"
                value={selectedTaskId}
                onChange={(event) => handleTaskChange(event.target.value)}
              >
                <option value="">Selecciona trabajo</option>
                {availableTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.id} - {task.clientId ?? 'Sin codigo'} - {task.clientName}
                  </option>
                ))}
              </select>
            </label>

            {selectedTask && (
              <article className="mt-3 rounded-lg border border-base-300 bg-base-200 p-3 text-sm">
                <p>
                  <span className="font-semibold">Cliente asignado:</span> {selectedTask.clientName}
                </p>
                <p>
                  <span className="font-semibold">Numero de cliente:</span> {selectedTask.clientId ?? 'Sin codigo'}
                </p>
              </article>
            )}

            <details className="mt-3 rounded-lg border border-base-300 p-3" open>
              <summary className="cursor-pointer text-sm font-medium">Lista de climas del cliente</summary>
              <div className="mt-3 overflow-x-auto rounded-xl border border-base-300 bg-base-100">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Marca</th>
                      <th>Modelo</th>
                      <th>Numero de serie</th>
                      <th>Fecha de aplicacion</th>
                      <th>Geolocalizacion</th>
                      <th>Cliente final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTaskClientCondensers.length === 0 ? (
                      <tr>
                        <td className="text-sm text-base-content/60" colSpan={6}>
                          El cliente asignado aun no tiene climas cargados.
                        </td>
                      </tr>
                    ) : (
                      selectedTaskClientCondensers.map((item) => (
                        <tr key={item.id}>
                          <td>{item.brand ?? 'Sin dato'}</td>
                          <td>{item.model ?? 'Sin dato'}</td>
                          <td>{item.serial}</td>
                          <td>{item.applicationDate ?? 'Sin dato'}</td>
                          <td>{item.geolocation ?? 'Sin dato'}</td>
                          <td>{item.finalClient ?? 'Sin dato'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </details>
          </article>

          <article className="rounded-xl border border-base-300 bg-base-100 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/60">Paso 2</h3>
            <p className="mt-1 text-base font-semibold">Datos de aplicacion</p>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="form-control">
                <span className="label-text mb-1">Numero de condensador</span>
                <input
                  className="input input-bordered"
                  placeholder="Ejemplo: CN-PL-2026-09"
                  value={condenserNumber}
                  onChange={(event) => setCondenserNumber(event.target.value)}
                  required
                />
                {selectedCondenser && (
                  <span className="mt-1 text-xs text-base-content/60">
                    Seleccionado: {selectedCondenser.brand ?? 'Sin marca'} {selectedCondenser.model ?? ''} ({selectedCondenser.serial})
                  </span>
                )}
              </label>

              <label className="form-control">
                <span className="label-text mb-1">Geolocalizacion de la aplicacion</span>
                <input
                  className="input input-bordered"
                  placeholder="Ej. 19.4326,-99.1332"
                  value={geolocation}
                  onChange={(event) => setGeolocation(event.target.value)}
                  required
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-1">Fecha de aplicacion</span>
                <input
                  className="input input-bordered"
                  type="date"
                  value={applicationDate}
                  onChange={(event) => setApplicationDate(event.target.value)}
                  required
                />
              </label>

              <label className="form-control sm:col-span-2">
                <span className="label-text mb-1">Notas del mantenimiento</span>
                <textarea
                  className="textarea textarea-bordered min-h-28"
                  placeholder="Describe actividades realizadas, hallazgos y recomendaciones..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  required
                />
              </label>
            </div>
          </article>

          <article className="rounded-xl border border-base-300 bg-base-100 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/60">Paso 3</h3>
            <p className="mt-1 text-base font-semibold">Evidencia fotografica</p>

            <label className="form-control mt-3">
              <span className="label-text mb-1">Fotos de evidencia (minimo 3)</span>
              <input className="file-input file-input-bordered" type="file" accept="image/*" multiple onChange={handlePhotosChange} />
              <span className="mt-1 text-xs text-base-content/60">Debes subir al menos 3 fotos para guardar el mantenimiento.</span>
            </label>

            {photoFiles.length > 0 && (
              <div className="mt-3 rounded-lg border border-base-300 bg-base-200 p-3">
                <p className="text-sm font-medium">Archivos seleccionados</p>
                <ul className="mt-2 space-y-1 text-sm text-base-content/80">
                  {photoFiles.map((file) => (
                    <li key={file.name}>{file.name}</li>
                  ))}
                </ul>
                <p className={`mt-2 text-xs ${photoFiles.length >= 3 ? 'text-success' : 'text-error'}`}>
                  {photoFiles.length >= 3
                    ? 'Evidencia completa.'
                    : `Faltan ${3 - photoFiles.length} foto(s) para cumplir el minimo requerido.`}
                </p>
              </div>
            )}
          </article>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
            {availableTasks.length === 0 ? (
              <p className="text-sm text-success">No hay trabajos pendientes, todo esta al dia.</p>
            ) : (
              <p className="text-sm text-base-content/70">Completa los 3 pasos para guardar el registro.</p>
            )}
            <Button type="submit" className="w-full sm:w-auto">
              Guardar registro
            </Button>
          </div>
        </form>
      </article>

      <aside className="rounded-xl border border-base-300 bg-base-100 p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Historial reciente</h2>
        <p className="mt-1 text-sm text-base-content/70">Ultimos mantenimientos registrados con evidencia.</p>

        <div className="mt-4 space-y-3">
          {maintenanceRecords.slice(0, 5).map((record) => (
            <article key={record.id} className="rounded-lg border border-base-300 p-3">
              <p className="text-sm font-medium">{record.clientName} - {record.condenserNumber ?? record.condenserId}</p>
              <p className="text-xs text-base-content/70">{record.performedAt} por {record.performedBy}</p>
              <p className="mt-2 text-sm text-base-content/80">{record.notes}</p>
              <p className="mt-2 text-xs">Fotos: {record.photos.length}</p>
            </article>
          ))}
        </div>
      </aside>
    </section>
  )
}
