import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Button from '../../../shared/ui/Button'
import PageHeader from '../../../shared/ui/PageHeader'
import { useWorkData } from '../../../app/providers/useWorkData'
import { useAuth } from '../../../app/providers/useAuth'

function formatCoordinates(latitude, longitude) {
  const lat = Number(latitude)
  const lng = Number(longitude)

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return ''
  }

  return `${lat.toFixed(6)},${lng.toFixed(6)}`
}

export default function TechnicianCondenserCapturePage() {
  const { clientId, condenserId } = useParams()
  const { clientAssignments, condensers, technicianTasks, registerMaintenance } = useWorkData()
  const { currentUser } = useAuth()

  const assignment = clientAssignments.find(
    (item) => item.clientId === clientId && item.technicianName === currentUser?.name,
  )

  if (!assignment) {
    return <Navigate to="/tecnico/dashboard" replace />
  }

  const condenser = condensers.find(
    (item) => item.id === condenserId && item.clientName === assignment.clientName,
  )

  if (!condenser) {
    return <Navigate to={`/tecnico/clientes/${assignment.clientId}/condensadores`} replace />
  }

  const pendingTask = technicianTasks.find(
    (task) =>
      task.technicianName === currentUser?.name &&
      task.clientId === assignment.clientId &&
      task.condenserId === condenser.id &&
      task.status !== 'Completado',
  )

  const [geolocation, setGeolocation] = useState('')
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [photoFiles, setPhotoFiles] = useState([null, null, null])
  const [formMessage, setFormMessage] = useState('')
  const [geoSource, setGeoSource] = useState('')
  const [isResolvingGeo, setIsResolvingGeo] = useState(false)
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')

  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const filledPhotosCount = photoFiles.filter(Boolean).length
  const canSaveMaintenance = Boolean(pendingTask) && filledPhotosCount === 3

  useEffect(() => {
    return () => {
      const stream = videoRef.current?.srcObject
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Tu navegador no permite captura directa de camara.')
      return
    }

    setCameraError('')
    setIsCameraLoading(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })

      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        setIsCameraLoading(false)
        return
      }

      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setIsCameraReady(true)
      setIsCameraLoading(false)
    } catch {
      setCameraError('No se pudo abrir la camara. Revisa permisos del navegador.')
      setIsCameraReady(false)
      setIsCameraLoading(false)
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraReady(false)
  }

  const capturePhotoForSlot = (slotIndex) => {
    if (!isCameraReady || !videoRef.current || !canvasRef.current) {
      setFormMessage('Abre la camara para capturar fotos.')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const context = canvas.getContext('2d')
    if (!context) {
      setFormMessage('No se pudo procesar la foto capturada.')
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setFormMessage('No se pudo capturar la foto.')
          return
        }

        const capturedFile = new File([blob], `evidencia-${slotIndex + 1}-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        })

        setPhotoFiles((previous) => {
          const next = [...previous]
          next[slotIndex] = capturedFile
          return next
        })

        if (!geolocation.trim()) {
          resolveCurrentLocation()
        }

        setFormMessage('')
      },
      'image/jpeg',
      0.92,
    )
  }

  const resolveCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setFormMessage('Tu dispositivo no soporta geolocalizacion en el navegador.')
      return
    }

    setIsResolvingGeo(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = formatCoordinates(position.coords.latitude, position.coords.longitude)
        if (coords) {
          setGeolocation(coords)
          setGeoSource('GPS del dispositivo')
          setFormMessage('')
        }
        setIsResolvingGeo(false)
      },
      () => {
        setFormMessage('No se pudo obtener la geolocalizacion automaticamente.')
        setIsResolvingGeo(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  const handleRemovePhoto = (slotIndex) => {
    setPhotoFiles((previous) => {
      const next = [...previous]
      next[slotIndex] = null
      return next
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setFormMessage('')

    if (!pendingTask) {
      setFormMessage('Este condensador no tiene trabajo pendiente para registrar.')
      return
    }

    if (!geolocation.trim() || !applicationDate || notes.trim().length < 10 || filledPhotosCount < 3) {
      setFormMessage('Completa todos los campos y captura exactamente 3 fotos.')
      return
    }

    const saved = registerMaintenance({
      taskId: pendingTask.id,
      notes: notes.trim(),
      photoNames: photoFiles.filter(Boolean).map((file) => file.name),
      performedBy: currentUser?.name ?? 'Tecnico',
      condenserNumber: condenser.serial,
      geolocation: geolocation.trim(),
      applicationDate,
    })

    if (!saved) {
      setFormMessage('No se pudo guardar el mantenimiento.')
      return
    }

    setGeolocation('')
    setNotes('')
    setPhotoFiles([null, null, null])
    setFormMessage('Mantenimiento guardado correctamente.')
  }

  return (
    <section>
      <PageHeader
        title={`Detalles de ${condenser.id}`}
        subtitle={`${assignment.clientId} - ${assignment.clientName} | ${condenser.serial}`}
        actions={
          <Link
            className="btn btn-sm btn-outline"
            to={`/tecnico/clientes/${assignment.clientId}/condensadores`}
          >
            Volver a condensadores
          </Link>
        }
      />

      <article className="rounded-xl border border-base-300 bg-base-100 p-4 sm:p-6">
        <div className="rounded-lg border border-base-300 bg-base-200 p-3 text-sm">
          <p className="font-semibold">{condenser.id} - {condenser.serial}</p>
          <p className="text-base-content/70">
            {condenser.brand ?? 'Sin marca'} {condenser.model ?? ''}
          </p>
          <p className="text-base-content/60">Cliente final: {condenser.finalClient ?? 'Sin dato'}</p>
        </div>

        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-base-content/80" htmlFor="capture-geolocation">
              Geolocalizacion
            </label>
            <input
              id="capture-geolocation"
              className="input input-bordered w-full"
              placeholder="Ej. 19.4326,-99.1332"
              value={geolocation}
              onChange={(event) => setGeolocation(event.target.value)}
              required
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="btn btn-xs btn-outline"
                type="button"
                onClick={resolveCurrentLocation}
                disabled={isResolvingGeo}
              >
                {isResolvingGeo ? 'Obteniendo GPS...' : 'Usar GPS actual'}
              </button>
              {geoSource && <span className="text-xs text-base-content/60">Fuente: {geoSource}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-base-content/80" htmlFor="capture-date">
              Fecha de aplicacion
            </label>
            <input
              id="capture-date"
              className="input input-bordered w-full"
              type="date"
              value={applicationDate}
              onChange={(event) => setApplicationDate(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-base-content/80">Fotos de evidencia (3 por mantenimiento, solo camara)</p>
            <p className={`text-xs ${filledPhotosCount >= 3 ? 'text-success' : 'text-error'}`}>
              {filledPhotosCount >= 3
                ? 'Evidencia completa (3/3).'
                : `Faltan ${Math.max(0, 3 - filledPhotosCount)} foto(s) para completar 3/3.`}
            </p>
            <p className="text-xs text-base-content/70">
              Solo se permite captura directa de camara. Puedes repetir o borrar cada foto.
            </p>

            <div className="rounded-lg border border-base-300 bg-base-200 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="btn btn-sm btn-outline"
                  type="button"
                  onClick={startCamera}
                  disabled={isCameraLoading || isCameraReady}
                >
                  {isCameraLoading ? 'Abriendo camara...' : 'Abrir camara'}
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  type="button"
                  onClick={stopCamera}
                  disabled={!isCameraReady}
                >
                  Cerrar camara
                </button>
              </div>

              <div className="mt-3 overflow-hidden rounded-md border border-base-300 bg-neutral/10">
                <video ref={videoRef} className="h-56 w-full object-cover" autoPlay muted playsInline />
              </div>
              <canvas ref={canvasRef} className="hidden" />

              {cameraError && <p className="mt-2 text-xs text-error">{cameraError}</p>}
              {!isCameraReady && !cameraError && (
                <p className="mt-2 text-xs text-base-content/70">
                  La camara debe estar activa para capturar las 3 fotos.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-base-300 bg-base-200 p-3">
              <ul className="space-y-3 text-sm text-base-content/80">
                {photoFiles.map((file, index) => (
                  <li key={`slot-${index}`} className="rounded-md border border-base-300 bg-base-100 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/60">
                      Foto {index + 1}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className="btn btn-sm btn-outline"
                        type="button"
                        onClick={() => capturePhotoForSlot(index)}
                        disabled={!isCameraReady}
                      >
                        {file ? 'Repetir foto' : 'Tomar foto'}
                      </button>
                      {file && (
                        <button
                          className="btn btn-xs btn-ghost"
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                        >
                          Borrar
                        </button>
                      )}
                    </div>
                    <p className="mt-2 truncate text-xs text-base-content/70">
                      {file ? file.name : 'Sin foto capturada'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-base-content/80" htmlFor="capture-notes">
              Notas
            </label>
            <textarea
              id="capture-notes"
              className="textarea textarea-bordered min-h-28 w-full"
              placeholder="Describe actividades realizadas, hallazgos y recomendaciones..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              required
            />
          </div>

          {formMessage && <p className="text-sm font-medium text-base-content/80">{formMessage}</p>}

          <Button type="submit" className="w-full" disabled={!canSaveMaintenance}>
            Guardar mantenimiento
          </Button>

          {!pendingTask ? (
            <p className="text-xs text-base-content/70">
              Este condensador no tiene trabajo pendiente para registrar.
            </p>
          ) : (
            filledPhotosCount < 3 && (
              <p className="text-xs text-base-content/70">
                Completa las 3 fotos para habilitar el guardado.
              </p>
            )
          )}
        </form>
      </article>
    </section>
  )
}
