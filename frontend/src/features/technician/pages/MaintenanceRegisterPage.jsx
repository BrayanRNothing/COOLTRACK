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

  const selectedTask = useMemo(
    () => myTasks.find((task) => task.id === selectedTaskId),
    [myTasks, selectedTaskId],
  )

  const availableTasks = useMemo(
    () => myTasks.filter((task) => task.status !== 'Completado'),
    [myTasks],
  )

  const handleTaskChange = (taskId) => {
    setSelectedTaskId(taskId)
    setCondenserNumber(resolveTaskCondenserNumber(taskId))
  }

  const handlePhotosChange = (event) => {
    setPhotoFiles(Array.from(event.target.files ?? []))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!selectedTask || notes.trim().length < 10 || condenserNumber.trim().length < 3) {
      return
    }

    const success = registerMaintenance({
      taskId: selectedTaskId,
      notes: notes.trim(),
      photoNames: photoFiles.map((file) => file.name),
      performedBy: currentUser?.name ?? 'Tecnico',
      condenserNumber,
    })

    if (success) {
      setNotes('')
      setPhotoFiles([])
      const nextTask = availableTasks.find((task) => task.id !== selectedTaskId)
      const nextTaskId = nextTask?.id ?? ''
      setSelectedTaskId(nextTaskId)
      setCondenserNumber(resolveTaskCondenserNumber(nextTaskId))
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <article className="rounded-xl border border-base-300 bg-base-100 p-4 sm:p-6">
        <PageHeader
          title="Ejecutar mision"
          subtitle="Completa solicitud con numero de condensador, evidencia fotografica y notas tecnicas."
        />

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="form-control">
            <span className="label-text mb-1">Trabajo asignado</span>
            <select
              className="select select-bordered"
              value={selectedTaskId}
              onChange={(event) => handleTaskChange(event.target.value)}
            >
              <option value="">Selecciona trabajo</option>
              {availableTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.id} - {task.clientName} - {task.condenserId}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Numero de condensador</span>
            <input
              className="input input-bordered"
              placeholder="Ejemplo: CN-PL-2026-09"
              value={condenserNumber}
              onChange={(event) => setCondenserNumber(event.target.value)}
              required
            />
            <span className="mt-1 text-xs text-base-content/60">
              Si no existe en el cliente, se registrara automaticamente antes del mantenimiento.
            </span>
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Notas del mantenimiento</span>
            <textarea
              className="textarea textarea-bordered min-h-28"
              placeholder="Describe actividades realizadas, hallazgos y recomendaciones..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              required
            />
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Fotos (antes/despues)</span>
            <input className="file-input file-input-bordered" type="file" accept="image/*" multiple onChange={handlePhotosChange} />
            <span className="mt-1 text-xs text-base-content/60">Minimo recomendado: 2 fotos de evidencia.</span>
          </label>

          {photoFiles.length > 0 && (
            <div className="rounded-lg border border-base-300 bg-base-200 p-3">
              <p className="text-sm font-medium">Archivos seleccionados</p>
              <ul className="mt-2 space-y-1 text-sm text-base-content/80">
                {photoFiles.map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}

          <Button type="submit" className="w-full sm:w-auto">
            Guardar registro
          </Button>

          {availableTasks.length === 0 && (
            <p className="text-sm text-success">No hay trabajos pendientes, todo esta al dia.</p>
          )}
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
