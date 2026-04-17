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
        <div className="grid gap-3">
          {records.map(record => {
            const fotos = [record.foto1Url, record.foto2Url, record.foto3Url].filter(Boolean)
            return (
              <article key={record.id} className="rounded-xl border border-base-300 bg-base-100 p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{record.clima?.cliente?.nombreOEmpresa}</span>
                    <span className="badge badge-sm badge-ghost">{record.clima?.numeroSerie}</span>
                  </div>
                  <p className="text-sm text-base-content/60 mt-1">
                    {record.clima?.marca} {record.clima?.modelo} · {record.fechaMantenimiento?.slice(0, 10)}
                  </p>
                  {record.observaciones && <p className="text-sm mt-2 text-base-content/80">{record.observaciones}</p>}
                </div>
                {fotos.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setModalFotos(fotos)}>
                    Ver fotos ({fotos.length})
                  </Button>
                )}
              </article>
            )
          })}
        </div>
      )}

      {modalFotos && (
        <dialog className="modal modal-open" onClick={() => setModalFotos(null)}>
          <div className="modal-box max-w-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Fotos del Mantenimiento</h3>
            <div className="grid gap-3">
              {modalFotos.map((url, i) => (
                <img key={i} src={url} alt={`Foto ${i + 1}`} className="w-full rounded-xl object-cover max-h-80" />
              ))}
            </div>
            <div className="modal-action mt-4">
              <Button onClick={() => setModalFotos(null)}>Cerrar</Button>
            </div>
          </div>
        </dialog>
      )}
    </section>
  )
}
