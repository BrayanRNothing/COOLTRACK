import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import Breadcrumbs from '../../../shared/ui/Breadcrumbs'
import { useWorkData } from '../../../app/providers/useWorkData'

function getLocalDateTimeInputValue() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

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
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-safe pt-5 pb-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Cámara · Foto {slotIndex + 1}</span>
        </div>
        <button onClick={handleClose} className="text-white/70 hover:text-white text-xl leading-none transition-colors">✕</button>
      </div>

      {/* Viewfinder */}
      <div className="relative flex-1 overflow-hidden bg-black">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center bg-slate-900">
            <span className="text-5xl">📷</span>
            <p className="text-white/70 text-sm font-medium leading-relaxed">{error}</p>
            <p className="text-white/40 text-xs">Verifica que hayas dado permisos de cámara al navegador.</p>
            <button onClick={handleClose} className="mt-2 px-6 py-3 rounded-xl bg-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-colors">
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
              <div className="w-64 h-48 border-2 border-white/20 rounded-2xl relative">
                <span className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-2xl" />
                <span className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-2xl" />
                <span className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-2xl" />
                <span className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-white rounded-br-2xl" />
              </div>
            </div>
            <div className="absolute bottom-6 left-4 right-4 flex items-center justify-center gap-2">
              <span className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white/70 text-[9px] font-black uppercase tracking-widest text-center shadow-lg">
                📍 Se registrará la ubicación GPS
              </span>
            </div>
          </>
        )}
      </div>

      {/* Capture Button */}
      {!error && (
        <div className="flex items-center justify-center py-10 bg-slate-950/90 border-t border-white/10">
          <button
            onClick={handleCapture}
            disabled={capturing}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {capturing ? (
              <span className="w-8 h-8 rounded-full border-4 border-slate-300 border-t-slate-900 animate-spin" />
            ) : (
              <span className="w-14 h-14 rounded-full bg-white border-4 border-slate-200 block" />
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

  const [fechaMantenimiento, setFechaMantenimiento] = useState(getLocalDateTimeInputValue())
  const [observaciones, setObservaciones] = useState('')
  const [fotos, setFotos] = useState([null, null, null])
  const [previews, setPreviews] = useState([null, null, null])
  const [geoData, setGeoData] = useState([null, null, null])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)
  const [cameraSlot, setCameraSlot] = useState(null)

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

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg text-blue-600" /></div>
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-sm">{error}</div>

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-emerald-50 border-2 border-emerald-100 text-emerald-500 rounded-[2rem] flex items-center justify-center text-5xl shadow-xl shadow-emerald-500/10">✓</div>
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-1">¡Registro Exitoso!</h2>
        <p className="text-slate-500 text-sm font-bold tracking-wide">El mantenimiento ha sido guardado correctamente.</p>
      </div>
    </div>
  )

  return (
    <>
      {cameraSlot !== null && (
        <CameraModal
          slotIndex={cameraSlot}
          onCapture={handleCapture}
          onClose={() => setCameraSlot(null)}
        />
      )}

      <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Navigation Header */}
        <div className="sticky top-0 z-30 pt-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <Breadcrumbs items={[
                { label: 'Inicio', to: '/tecnico/dashboard' },
                { label: 'Servicio' }
              ]} />
            </div>
            <Link 
              className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1.5" 
              to={asignacionId ? `/tecnico/dashboard/mision/${asignacionId}` : '/tecnico/dashboard'}
            >
              ✕ Cancelar
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* INFO SIDEBAR */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-[88px]">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500">Equipo a Registrar</h3>
              </div>
              <div className="p-5 space-y-5">
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Empresa / Cliente</p>
                    <p className="text-base font-black text-slate-900 leading-tight">
                      {asignacion?.cliente?.nombreOEmpresa || clima?.cliente?.nombreOEmpresa || 'Cliente seleccionado'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Serial</p>
                      <p className="font-black text-blue-600 text-sm tracking-widest">{clima?.numeroSerie}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Modelo</p>
                      <p className="font-bold text-slate-900 text-sm truncate">{clima?.marca} · {clima?.modelo}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mantenimientos</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">Año {selectedYear}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`text-2xl font-black leading-none tracking-tighter ${limitReached ? 'text-red-500' : 'text-blue-600'}`}>
                      {limitReached ? '3' : mantsInSelectedYear + 1}
                      <span className="text-xs opacity-40 ml-0.5">/3</span>
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      {[1, 2, 3].map(i => (
                        <div 
                          key={i} 
                          className={`h-1.5 w-4 rounded-full transition-all ${
                            i <= mantsInSelectedYear || (i === mantsInSelectedYear + 1 && !limitReached)
                            ? (i <= mantsInSelectedYear ? 'bg-emerald-400' : 'bg-blue-500 animate-pulse')
                            : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN FORM */}
          <main className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-white px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100 text-sm">📋</span>
                <h2 className="font-black text-lg text-slate-900 tracking-tight">Hoja de Servicio Digital</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <label className="flex flex-col gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Fecha y Hora del Servicio *</span>
                    <input
                      type="datetime-local"
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={fechaMantenimiento}
                      onChange={e => setFechaMantenimiento(e.target.value)}
                      required
                      disabled={saving || limitReached}
                    />
                  </label>
                </div>
                
                <label className="flex flex-col gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Observaciones y Hallazgos Técnicos</span>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                    placeholder="Describe el estado del equipo..."
                    value={observaciones}
                    onChange={e => setObservaciones(e.target.value)}
                    disabled={saving || limitReached}
                  />
                </label>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1">Evidencia Fotográfica *</span>
                    <span className="text-[9px] font-black px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-md">{fotos.filter(Boolean).length} / 3</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="relative group aspect-video sm:aspect-[4/3]">
                        {previews[index] ? (
                          <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-emerald-100 shadow-sm bg-slate-100">
                            <img src={previews[index]} alt={`Evidencia ${index + 1}`} className="w-full h-full object-cover" />
                            {geoData[index] && (
                              <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-1 shadow-md">
                                <span className="text-[8px]">📍</span>
                                <span className="text-[8px] text-white/90 font-bold font-mono truncate tracking-wider">{geoData[index]}</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                              <button 
                                type="button" 
                                className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 hover:scale-105 active:scale-95 transition-all shadow-md text-xs" 
                                onClick={() => removeFoto(index)}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={limitReached || saving}
                            onClick={() => setCameraSlot(index)}
                            className="w-full h-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center hover:border-blue-300 hover:bg-blue-50/50 transition-all disabled:opacity-50 group"
                          >
                            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300 opacity-40 group-hover:opacity-100">📷</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-500 transition-colors">Foto {index + 1}</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <p className="text-[10px] font-black tracking-widest text-red-600 uppercase">{formError}</p>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving || limitReached}
                    className="w-full h-14 rounded-xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:shadow-none active:scale-[0.98] flex items-center justify-center"
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <span className="loading loading-spinner loading-sm" />
                        Subiendo...
                      </span>
                    ) : saving ? (
                      <span className="flex items-center gap-2">
                        <span className="loading loading-spinner loading-sm" />
                        Guardando...
                      </span>
                    ) : (
                      'Guardar Reporte'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </main>
        </div>
      </section>
    </>
  )
}
