import { useState, useEffect, useCallback } from 'react'
import PageHeader from '../../../shared/ui/PageHeader'
import Button from '../../../shared/ui/Button'
import { useWorkData } from '../../../app/providers/useWorkData'

export default function TechnicianHistoryPage() {
  const { getMantenimientos } = useWorkData()

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalFotos, setModalFotos] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const data = await getMantenimientos()
      setRecords(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [getMantenimientos])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg" /></div>
  if (error) return <div className="alert alert-error mt-4">{error}</div>

  return (
    <section>
      <PageHeader title="Historial de Mantenimientos" subtitle="Todos los registros de mantenimiento que has ejecutado." />

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-base-300 p-8 text-center text-base-content/60">
          Aún no has registrado ningun mantenimiento.
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map(record => {
            const fotos = [record.foto1Url, record.foto2Url, record.foto3Url].filter(Boolean)
            return (
              <article key={record.id} className="group card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-black text-base leading-tight truncate">{record.clima?.cliente?.nombreOEmpresa}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge badge-primary badge-xs font-bold tracking-tighter">{record.clima?.numeroSerie}</span>
                        <span className="text-[10px] font-bold opacity-40 uppercase">{record.clima?.marca} · {record.clima?.modelo}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-[10px] font-black opacity-40 uppercase">Realizado</span>
                      <span className="text-xs font-bold">{record.fechaMantenimiento?.slice(0, 10)}</span>
                    </div>
                  </div>

                  {record.observaciones && (
                    <div className="bg-base-200/50 rounded-xl p-3 mb-4">
                      <p className="text-sm text-base-content/70 italic leading-relaxed">
                        "{record.observaciones}"
                      </p>
                    </div>
                  )}

                  {fotos.length > 0 && (
                    <div className="flex items-center justify-between pt-3 border-t border-base-200">
                      <div className="flex -space-x-2">
                        {fotos.map((url, i) => (
                          <div key={i} className="w-8 h-8 rounded-lg border-2 border-base-100 overflow-hidden bg-base-200">
                            <img src={url} className="w-full h-full object-cover" alt="miniatura" />
                          </div>
                        ))}
                      </div>
                      <Button size="sm" variant="ghost" className="text-primary font-bold text-xs" onClick={() => setModalFotos(fotos)}>
                        VER EVIDENCIA ({fotos.length})
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {modalFotos && (
        <dialog className="modal modal-open bg-black/80 backdrop-blur-sm" onClick={() => setModalFotos(null)}>
          <div className="modal-box p-0 bg-transparent shadow-none max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col gap-4">
              {modalFotos.map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt={`Evidencia ${i + 1}`} className="w-full rounded-2xl shadow-2xl border border-white/10" />
                  <span className="absolute top-4 left-4 badge badge-primary font-black text-[10px]">FOTO {i + 1}</span>
                </div>
              ))}
              <div className="flex justify-center pt-4">
                <Button className="btn-circle btn-lg" onClick={() => setModalFotos(null)}>✕</Button>
              </div>
            </div>
          </div>
        </dialog>
      )}
    </section>
  )
}
