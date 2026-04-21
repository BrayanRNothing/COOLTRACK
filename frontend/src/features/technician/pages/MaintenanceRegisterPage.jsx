import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import Button from '../../../shared/ui/Button'
import Breadcrumbs from '../../../shared/ui/Breadcrumbs'
import { useWorkData } from '../../../app/providers/useWorkData'

// ─── Camera Modal ─────────────────────────────────────────────────────────────

function CameraModal({ slotIndex, onCapture, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setCameraError] = useState('')
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    let active = true
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch((err) => {
        if (!active) return
        setCameraError('No se pudo acceder a la cámara: ' + (err.message || err.name))
      })
    return () => {
      active = false
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const handleCapture = () => {
    if (!videoRef.current || capturing) return
    setCapturing(true)

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 1280
    canvas.height = videoRef.current.videoHeight || 720
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(async (blob) => {
      const file = new File([blob], `foto_${slotIndex + 1}_${Date.now()}.jpg`, { type: 'image/jpeg' })
      const preview = URL.createObjectURL(blob)

      // Get geolocation simultaneously
      let geo = null
      try {
        geo = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`),
            () => resolve(null),
            { timeout: 8000, enableHighAccuracy: true }
          )
        })
      } catch { geo = null }

      streamRef.current?.getTracks().forEach(t => t.stop())
      onCapture(slotIndex, file, preview, geo)
    }, 'image/jpeg', 0.92)
  }

  const handleClose = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Cámara · Foto {slotIndex + 1}</span>
        </div>
        <button onClick={handleClose} className="text-white/70 hover:text-white text-2xl leading-none transition-colors">✕</button>
      </div>

      {/* Viewfinder */}
      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="text-5xl">📷</span>
            <p className="text-white/70 text-sm font-medium leading-relaxed">{error}</p>
            <p className="text-white/40 text-xs">Verifica que hayas dado permisos de cámara al navegador.</p>
            <button onClick={handleClose} className="mt-2 px-6 py-2 rounded-full bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors">
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Crosshair guide */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-48 border-2 border-white/30 rounded-xl relative">
                <span className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-xl" />
                <span className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-xl" />
                <span className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-xl" />
                <span className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-white rounded-br-xl" />
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest text-center">
                📍 Se registrará la ubicación GPS al capturar
              </span>
            </div>
          </>
        )}
      </div>

      {/* Capture Button */}
      {!error && (
        <div className="flex items-center justify-center py-8 bg-black/80">
          <button
            onClick={handleCapture}
            disabled={capturing}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl shadow-white/30 active:scale-90 transition-transform disabled:opacity-50 disabled:scale-100"
          >
            {capturing ? (
              <span className="w-8 h-8 rounded-full border-4 border-black/30 border-t-black animate-spin" />
            ) : (
              <span className="w-14 h-14 rounded-full bg-white border-4 border-black/10 block" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MaintenanceRegisterPage() {
  const { getAsignacion, getClima, getMantenimientosByClima, createMantenimiento, uploadFoto } = useWorkData()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const asignacionId = searchParams.get('asignacionId')
  const climaId = searchParams.get('climaId')

  const [asignacion, setAsignacion] = useState(null)
  const [clima, setClima] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [fechaMantenimiento, setFechaMantenimiento] = useState(new Date().toISOString().slice(0, 16))
  const [observaciones, setObservaciones] = useState('')
  const [fotos, setFotos] = useState([null, null, null])
  const [previews, setPreviews] = useState([null, null, null])
  const [geoData, setGeoData] = useState([null, null, null])   // GPS string per photo
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)
  const [cameraSlot, setCameraSlot] = useState(null) // which slot is being captured

  const fetchData = useCallback(async () => {
    try {
      const [a, c, h] = await Promise.all([
        asignacionId ? getAsignacion(asignacionId) : Promise.resolve(null),
        climaId ? getClima(climaId) : Promise.resolve(null),
        climaId ? getMantenimientosByClima(climaId) : Promise.resolve([])
      ])
      setAsignacion(a)
      setClima(c)
      setHistory(h)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [asignacionId, climaId, getAsignacion, getClima, getMantenimientosByClima])

  useEffect(() => { fetchData() }, [fetchData])

  const selectedYear = new Date(fechaMantenimiento).getFullYear()
  const mantsInSelectedYear = history.filter(m => new Date(m.fechaMantenimiento).getFullYear() === selectedYear).length
  const limitReached = mantsInSelectedYear >= 3

  // Called by CameraModal when a photo is successfully captured
  const handleCapture = (index, file, preview, geo) => {
    const newFotos = [...fotos]
    const newPreviews = [...previews]
    const newGeo = [...geoData]
    newFotos[index] = file
    newPreviews[index] = preview
    newGeo[index] = geo
    setFotos(newFotos)
    setPreviews(newPreviews)
    setGeoData(newGeo)
    setCameraSlot(null)
  }

  const removeFoto = (index) => {
    const newFotos = [...fotos]
    const newPreviews = [...previews]
    const newGeo = [...geoData]
    newFotos[index] = null
    newPreviews[index] = null
    newGeo[index] = null
    setFotos(newFotos)
    setPreviews(newPreviews)
    setGeoData(newGeo)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (limitReached) {
      setFormError(`Límite alcanzado: Este equipo ya tiene 3 mantenimientos registrados en el año ${selectedYear}.`)
      return
    }

    const selectedFotos = fotos.filter(Boolean)
    if (selectedFotos.length !== 3) {
      setFormError('Debes capturar las 3 fotos de evidencia para registrar el mantenimiento.')
      return
    }

    setSaving(true); setFormError(''); setUploading(true)
    try {
      const uploadResults = await Promise.all(selectedFotos.map(file => uploadFoto(file)))
      setUploading(false)

      const urls = uploadResults.map(r => r.url)
      // Map urls back to slots (fotos[i] !== null means slot i is filled)
      const filledSlots = fotos.map((f, i) => f ? i : null).filter(i => i !== null)

      const slotUrls = [null, null, null]
      const slotGeos = [null, null, null]
      filledSlots.forEach((slotIdx, uploadIdx) => {
        slotUrls[slotIdx] = urls[uploadIdx] || null
        slotGeos[slotIdx] = geoData[slotIdx] || null
      })

      const geolocalizacion = slotGeos.find(Boolean) || null

      await createMantenimiento({
        idClima: climaId,
        idAsignacion: asignacionId || undefined,
        fechaMantenimiento: new Date(fechaMantenimiento).toISOString(),
        foto1Url: slotUrls[0],
        foto2Url: slotUrls[1],
        foto3Url: slotUrls[2],
        foto1Geo: slotGeos[0],
        foto2Geo: slotGeos[1],
        foto3Geo: slotGeos[2],
        geolocalizacion,
        observaciones,
      })

      setSuccess(true)
      setTimeout(() => {
        if (asignacionId) navigate(`/tecnico/dashboard/mision/${asignacionId}`)
        else navigate('/tecnico/dashboard')
      }, 2000)
    } catch (e) {
      setUploading(false)
      setFormError(e.message)
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg text-primary" /></div>
  if (error) return <div className="alert alert-error mt-4 font-bold">{error}</div>

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-success/20 text-success rounded-full flex items-center justify-center text-5xl animate-bounce">✓</div>
      <div className="text-center">
        <h2 className="text-3xl font-black mb-2">¡Todo Listo!</h2>
        <p className="text-base-content/60 font-medium italic">El mantenimiento ha sido registrado con éxito.</p>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )

  return (
    <>
      {/* Camera Modal (renders on top of everything) */}
      {cameraSlot !== null && (
        <CameraModal
          slotIndex={cameraSlot}
          onCapture={handleCapture}
          onClose={() => setCameraSlot(null)}
        />
      )}

      <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Navigation Header (Sticky) */}
        <div className="sticky top-0 z-30 bg-base-100/80 backdrop-blur-md pt-4 pb-4 border-b border-base-200 -mx-4 px-4 sm:-mx-6 sm:px-6">
          <div className="flex items-center justify-between">
            <Breadcrumbs items={[
              { label: 'Panel', to: '/tecnico/dashboard' },
              { label: 'Detalle del Trabajo', to: asignacionId ? `/tecnico/dashboard/mision/${asignacionId}` : null },
              { label: 'Registro de Servicio' }
            ]} />
            <Link
              className="btn btn-sm btn-ghost opacity-50 hover:opacity-100 font-bold uppercase tracking-widest text-[10px]"
              to={asignacionId ? `/tecnico/dashboard/mision/${asignacionId}` : '/tecnico/dashboard'}
            >
              ✕ Cancelar
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* INFO SIDEBAR (Sticky on Desktop) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-[88px]">
            <div className="card bg-base-100 border border-base-300 shadow-xl overflow-hidden">
              <div className="bg-primary/5 px-6 py-4 border-b border-base-200">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Equipo a Registrar</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-40 mb-1">Empresa / Cliente</p>
                    <p className="text-lg font-black leading-tight tracking-tight">
                      {asignacion?.cliente?.nombreOEmpresa || clima?.cliente?.nombreOEmpresa || 'Cliente seleccionado'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-base-200">
                    <div>
                      <p className="text-[10px] font-bold uppercase opacity-40 mb-1">Serial</p>
                      <p className="font-black text-primary text-sm tracking-widest">{clima?.numeroSerie}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase opacity-40 mb-1">Modelo</p>
                      <p className="font-bold text-sm truncate">{clima?.marca} · {clima?.modelo}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="bg-base-200/50 rounded-2xl p-5 border border-base-300 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-40">Mantenimientos</p>
                    <p className="text-[11px] font-bold opacity-60 mt-0.5">Año {selectedYear}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`text-2xl font-black leading-none ${limitReached ? 'text-error' : 'text-primary'}`}>
                      {limitReached ? '3' : mantsInSelectedYear + 1}
                      <span className="text-xs opacity-30 ml-0.5">/3</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className={`h-1.5 w-4 rounded-full transition-all ${
                            i <= mantsInSelectedYear || (i === mantsInSelectedYear + 1 && !limitReached)
                            ? (i <= mantsInSelectedYear ? 'bg-success/40' : 'bg-primary animate-pulse shadow-[0_0_8px_rgba(147,51,234,0.4)]')
                            : 'bg-base-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {limitReached && (
                  <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex items-start gap-3">
                    <span className="text-error text-lg">⚠️</span>
                    <p className="text-[10px] font-bold text-error leading-relaxed uppercase">
                      Límite anual alcanzado. No se pueden registrar más mantenimientos para este equipo en {selectedYear}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* MAIN FORM */}
          <main className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="card bg-base-100 border border-base-300 shadow-xl overflow-hidden">
              <div className="bg-base-200/50 px-8 py-5 border-b border-base-300 flex items-center justify-between">
                <h2 className="font-black text-xl tracking-tight">Hoja de Servicio Digital</h2>
                <span className="badge badge-outline badge-sm opacity-50 font-bold">REPORTE TÉCNICO</span>
              </div>

              <div className="p-8 space-y-8">
                {/* Form Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <label className="form-control w-full">
                    <span className="text-[10px] font-black uppercase opacity-40 mb-2 ml-1">Fecha y Hora del Servicio *</span>
                    <input
                      type="datetime-local"
                      className="input input-bordered w-full bg-base-200 focus:bg-base-100 transition-all font-semibold"
                      value={fechaMantenimiento}
                      onChange={e => setFechaMantenimiento(e.target.value)}
                      required
                      disabled={saving || limitReached}
                    />
                  </label>
                </div>

                <label className="form-control w-full">
                  <span className="text-[10px] font-black uppercase opacity-40 mb-2 ml-1">Observaciones y Hallazgos Técnicos</span>
                  <textarea
                    className="textarea textarea-bordered w-full min-h-40 bg-base-200 focus:bg-base-100 transition-all resize-none shadow-inner p-4 text-sm font-medium leading-relaxed"
                    placeholder="Describe detalladamente el estado del equipo, presiones, consumos eléctricos y actividades realizadas..."
                    value={observaciones}
                    onChange={e => setObservaciones(e.target.value)}
                    disabled={saving || limitReached}
                  />
                </label>

                {/* Photo Evidence Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase opacity-40 ml-1">Evidencia Fotográfica *</span>
                    <span className="badge badge-primary badge-sm font-bold">{fotos.filter(Boolean).length} / 3</span>
                  </div>

                  {/* Camera-only notice */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20">
                    <span className="text-base">📷</span>
                    <p className="text-[10px] font-bold text-primary/80 uppercase tracking-wide">
                      Solo cámara · La ubicación GPS se registra automáticamente al capturar
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="relative group aspect-video sm:aspect-square">
                        {previews[index] ? (
                          <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-primary shadow-xl">
                            <img src={previews[index]} alt={`Evidencia ${index + 1}`} className="w-full h-full object-cover" />
                            {/* GPS badge */}
                            {geoData[index] && (
                              <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                                <span className="text-[9px]">📍</span>
                                <span className="text-[9px] text-white/80 font-bold font-mono truncate">{geoData[index]}</span>
                              </div>
                            )}
                            {!geoData[index] && (
                              <div className="absolute bottom-2 left-2 right-2 bg-warning/80 backdrop-blur-sm rounded-lg px-2 py-1">
                                <span className="text-[9px] text-black font-bold">⚠ Sin GPS</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                className="btn btn-circle btn-sm btn-error"
                                onClick={() => removeFoto(index)}
                                title="Eliminar"
                              >✕</button>
                              {!saving && !limitReached && (
                                <button
                                  type="button"
                                  className="btn btn-circle btn-sm btn-primary"
                                  onClick={() => setCameraSlot(index)}
                                  title="Retomar"
                                >📷</button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={limitReached || saving}
                            onClick={() => setCameraSlot(index)}
                            className={`w-full h-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all
                              ${limitReached || saving
                                ? 'opacity-50 cursor-not-allowed border-base-200'
                                : 'border-base-300 cursor-pointer hover:border-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-95'}`}
                          >
                            <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center text-xl mb-2 transition-colors group-hover:bg-primary/20 group-hover:text-primary">
                              📷
                            </div>
                            <span className="text-[10px] font-black uppercase opacity-40 tracking-widest text-center px-4">
                              Tomar Foto {index + 1}
                            </span>
                            <span className="text-[9px] opacity-30 mt-1 font-medium">Cámara + GPS</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {formError && (
                  <div className="p-4 rounded-2xl bg-error/10 border border-error/20 flex items-center gap-3 animate-shake">
                    <span className="text-xl">⚠️</span>
                    <p className="text-xs font-bold text-error leading-relaxed uppercase">{formError}</p>
                  </div>
                )}

                {/* Submit Section */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={saving || limitReached}
                    className={`w-full h-16 text-lg font-black shadow-2xl transition-all duration-300 ${limitReached ? 'btn-disabled grayscale' : 'shadow-primary/20 scale-100 hover:scale-[1.01]'}`}
                  >
                    {uploading ? (
                      <div className="flex items-center gap-3">
                        <span className="loading loading-spinner loading-md" />
                        SUBIENDO EVIDENCIA...
                      </div>
                    ) : saving ? (
                      'GUARDANDO REGISTRO...'
                    ) : (
                      '✓ FINALIZAR Y GUARDAR REPORTE'
                    )}
                  </Button>
                  {!limitReached && !saving && (
                    <p className="text-[9px] text-center mt-3 font-bold opacity-30 uppercase tracking-[0.2em]">
                      Se generará una entrada permanente en el historial del equipo
                    </p>
                  )}
                </div>
              </div>
            </form>
          </main>
        </div>
      </section>
    </>
  )
}
