import { Link, Navigate, useParams } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useMemo, useState } from 'react'
import DataTable from '../../../shared/ui/DataTable'
import PageHeader from '../../../shared/ui/PageHeader'
import { useWorkData } from '../../../app/providers/useWorkData'

const columns = [
  { key: 'id', header: 'Codigo' },
  { key: 'brand', header: 'Marca' },
  { key: 'model', header: 'Modelo' },
  { key: 'serial', header: 'Serie' },
  { key: 'applicationDate', header: 'Fecha aplicacion' },
  { key: 'geolocation', header: 'Geolocalizacion' },
  { key: 'finalClient', header: 'Cliente final' },
  {
    key: 'completedThisYear',
    header: 'Mantenimientos',
    render: (row) => `${row.completedThisYear}/${row.annualMaintenances}`,
  },
  { key: 'nextDate', header: 'Proximo' },
  {
    key: 'profile',
    header: 'Perfil',
    render: (row) => row.profile,
  },
]

const REQUIRED_COLUMNS = [
  'MARCA',
  'MODELO',
  'NUMERO DE SERIE',
  'FECHA DE APLICACION',
  'GEOLOCALIZACION',
  'CLIENTE FINAL',
]

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function toIsoDate(value) {
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (!parsed) {
      return ''
    }

    const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d))
    return date.toISOString().slice(0, 10)
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  const text = String(value ?? '').trim()
  if (!text) {
    return ''
  }

  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toISOString().slice(0, 10)
}

export default function ClientCondensersPage() {
  const { clientId } = useParams()
  const {
    clients,
    condensers,
    technicians,
    clientAssignments,
    bulkCreateCondensers,
    assignClientToTechnician,
  } = useWorkData()
  const [activePanel, setActivePanel] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importSummary, setImportSummary] = useState('')
  const [importErrors, setImportErrors] = useState([])
  const [manualSummary, setManualSummary] = useState('')
  const [manualErrors, setManualErrors] = useState([])
  const [assignmentSummary, setAssignmentSummary] = useState('')
  const [assignmentError, setAssignmentError] = useState('')
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(technicians[0]?.id ?? '')
  const [manualForm, setManualForm] = useState({
    brand: '',
    model: '',
    serial: '',
    applicationDate: new Date().toISOString().slice(0, 10),
    geolocation: '',
    finalClient: '',
  })

  const client = clients.find((item) => item.id === clientId)
  if (!client) {
    return <Navigate to="/admin/clientes" replace />
  }

  const clientCondensers = useMemo(
    () => condensers.filter((item) => item.clientName === client.name),
    [condensers, client.name],
  )

  const clientAssignedTechnicians = useMemo(
    () =>
      clientAssignments
        .filter((item) => item.clientId === client.id)
        .map((item) => ({
          id: item.id,
          technicianId: item.technicianId,
          technicianName: item.technicianName,
          assignedAt: item.assignedAt,
        })),
    [clientAssignments, client.id],
  )

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || isImporting) {
      return
    }

    setIsImporting(true)
    setImportSummary('')
    setImportErrors([])

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
      const sheetName = workbook.SheetNames[0]

      if (!sheetName) {
        setImportErrors(['El archivo no contiene hojas.'])
        return
      }

      const worksheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

      if (rows.length === 0) {
        setImportErrors(['El archivo no contiene registros para importar.'])
        return
      }

      const firstRow = rows[0]
      const availableHeaders = new Set(Object.keys(firstRow).map(normalizeHeader))
      const missingColumns = REQUIRED_COLUMNS.filter((column) => !availableHeaders.has(column))

      if (missingColumns.length > 0) {
        setImportErrors([
          `Faltan columnas obligatorias: ${missingColumns.join(', ')}.`,
          `Columnas esperadas: ${REQUIRED_COLUMNS.join(', ')}.`,
        ])
        return
      }

      const mappedRows = rows.map((row) => {
        const normalizedRow = Object.entries(row).reduce((accumulator, [key, value]) => {
          accumulator[normalizeHeader(key)] = value
          return accumulator
        }, {})

        return {
          brand: String(normalizedRow['MARCA'] ?? '').trim(),
          model: String(normalizedRow['MODELO'] ?? '').trim(),
          serial: String(normalizedRow['NUMERO DE SERIE'] ?? '').trim(),
          applicationDate: toIsoDate(normalizedRow['FECHA DE APLICACION']),
          geolocation: String(normalizedRow['GEOLOCALIZACION'] ?? '').trim(),
          finalClient: String(normalizedRow['CLIENTE FINAL'] ?? '').trim(),
        }
      })

      const result = bulkCreateCondensers({
        clientId: client.id,
        rows: mappedRows,
      })

      setImportSummary(
        `Importacion completada: ${result.createdCount} creados, ${result.skippedCount} omitidos.`,
      )
      setImportErrors(result.errors.slice(0, 10))
    } catch (_error) {
      setImportErrors(['No se pudo procesar el archivo. Verifica que sea un Excel valido (.xlsx/.xls).'])
    } finally {
      setIsImporting(false)
    }
  }

  const handleManualChange = (key, value) => {
    setManualForm((previous) => ({ ...previous, [key]: value }))
  }

  const handleManualSubmit = (event) => {
    event.preventDefault()
    setManualSummary('')
    setManualErrors([])

    const payload = {
      brand: manualForm.brand.trim(),
      model: manualForm.model.trim(),
      serial: manualForm.serial.trim(),
      applicationDate: manualForm.applicationDate,
      geolocation: manualForm.geolocation.trim(),
      finalClient: manualForm.finalClient.trim(),
    }

    if (
      !payload.brand ||
      !payload.model ||
      !payload.serial ||
      !payload.applicationDate ||
      !payload.geolocation ||
      !payload.finalClient
    ) {
      setManualErrors(['Completa todos los campos obligatorios para registrar el condensador.'])
      return
    }

    const result = bulkCreateCondensers({
      clientId: client.id,
      rows: [payload],
    })

    if (result.createdCount > 0) {
      setManualSummary('Condensador agregado correctamente.')
      setManualForm({
        brand: '',
        model: '',
        serial: '',
        applicationDate: new Date().toISOString().slice(0, 10),
        geolocation: '',
        finalClient: '',
      })
      return
    }

    setManualErrors(result.errors.length > 0 ? result.errors : ['No se pudo registrar el condensador.'])
  }

  const handleAssignClient = (event) => {
    event.preventDefault()
    setAssignmentSummary('')
    setAssignmentError('')

    if (!selectedTechnicianId) {
      setAssignmentError('Selecciona un tecnico para realizar la asignacion.')
      return
    }

    const result = assignClientToTechnician({
      clientId: client.id,
      technicianId: selectedTechnicianId,
    })

    if (!result.created) {
      setAssignmentError(result.message)
      return
    }

    setAssignmentSummary(result.message)
  }

  const condensersWithProfileLink = clientCondensers.map((condenser) => ({
    ...condenser,
    brand: condenser.brand ?? 'Sin dato',
    model: condenser.model ?? 'Sin dato',
    applicationDate: condenser.applicationDate ?? 'Sin dato',
    geolocation: condenser.geolocation ?? 'Sin dato',
    finalClient: condenser.finalClient ?? 'Sin dato',
    profile: (
      <Link
        className="link link-primary font-medium"
        to={`/admin/clientes/${client.id}/condensadores/${condenser.id}`}
      >
        Ver perfil
      </Link>
    ),
  }))

  return (
    <section>
      <PageHeader
        title={`Condensadores de ${client.name}`}
        subtitle={`Cliente ${client.id} - ${client.city}`}
        actions={
          <Link className="btn btn-sm btn-outline" to="/admin/clientes">
            Volver a clientes
          </Link>
        }
      />

      <article className="mb-4 rounded-xl border border-base-300 bg-base-100 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-base-content/60">Equipos registrados</p>
            <p className="text-2xl font-semibold">{clientCondensers.length}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={`btn btn-sm ${activePanel === 'assign-client' ? 'btn-primary' : 'btn-outline'}`}
              type="button"
              onClick={() =>
                setActivePanel((current) => (current === 'assign-client' ? '' : 'assign-client'))
              }
            >
              Asignar tecnico
            </button>
            <button
              className={`btn btn-sm ${activePanel === 'manual' ? 'btn-primary' : 'btn-outline'}`}
              type="button"
              onClick={() => setActivePanel((current) => (current === 'manual' ? '' : 'manual'))}
            >
              Alta manual
            </button>
            <button
              className={`btn btn-sm ${activePanel === 'excel' ? 'btn-primary' : 'btn-outline'}`}
              type="button"
              onClick={() => setActivePanel((current) => (current === 'excel' ? '' : 'excel'))}
            >
              Importar Excel
            </button>
          </div>
        </div>
      </article>

      <DataTable
        columns={columns}
        rows={condensersWithProfileLink}
        emptyMessage="Este cliente aun no tiene condensadores registrados."
      />

      {activePanel === 'assign-client' && (
        <article className="mt-4 rounded-xl border border-base-300 bg-base-100 p-4">
          <h3 className="text-base font-semibold">Asignar tecnico a cliente</h3>
          <p className="mt-1 text-sm text-base-content/70">
            Al asignar este cliente, el tecnico podra ver al cliente y su lista de condensadores en su dashboard.
          </p>

          <form className="mt-3 rounded-xl border border-base-300" onSubmit={handleAssignClient}>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-base-content/80" htmlFor="assign-client-number">
                  Cliente
                </label>
                <input
                  id="assign-client-number"
                  className="input input-bordered w-full bg-base-200"
                  value={`${client.id} - ${client.name}`}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-base-content/80" htmlFor="assign-tech-id">
                  Tecnico
                </label>
                <select
                  id="assign-tech-id"
                  className="select select-bordered w-full"
                  value={selectedTechnicianId}
                  onChange={(event) => setSelectedTechnicianId(event.target.value)}
                >
                  {technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.id} - {technician.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-base-300 px-4 py-3">
              <button className="btn btn-outline" type="button" onClick={() => setActivePanel('')}>
                Cerrar
              </button>
              <button className="btn btn-primary" type="submit">
                Asignar tecnico
              </button>
            </div>
          </form>

          {assignmentSummary && <p className="mt-3 text-sm font-medium text-success">{assignmentSummary}</p>}
          {assignmentError && <p className="mt-3 text-sm font-medium text-error">{assignmentError}</p>}

          <div className="mt-4 rounded-xl border border-base-300 bg-base-200/50 p-3">
            <p className="text-sm font-semibold">Tecnicos ya asignados a este cliente</p>
            {clientAssignedTechnicians.length === 0 ? (
              <p className="mt-1 text-sm text-base-content/70">Aun no hay tecnicos asignados.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {clientAssignedTechnicians.map((item) => (
                  <li key={item.id}>
                    {item.technicianName} ({item.technicianId}) - Asignado: {item.assignedAt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      )}

      {activePanel === 'manual' && (
        <article className="mt-4 rounded-xl border border-base-300 bg-base-100 p-4">
          <h3 className="text-base font-semibold">Alta manual de condensador</h3>
          <p className="mt-1 text-sm text-base-content/70">
            Tambien puedes registrar equipos de forma individual sin usar Excel.
          </p>

          <form className="mt-3 rounded-xl border border-base-300" onSubmit={handleManualSubmit}>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <label className="form-control">
                <span className="label-text mb-1">Marca</span>
                <input
                  className="input input-bordered"
                  value={manualForm.brand}
                  onChange={(event) => handleManualChange('brand', event.target.value)}
                  required
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-1">Modelo</span>
                <input
                  className="input input-bordered"
                  value={manualForm.model}
                  onChange={(event) => handleManualChange('model', event.target.value)}
                  required
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-1">Numero de serie</span>
                <input
                  className="input input-bordered"
                  value={manualForm.serial}
                  onChange={(event) => handleManualChange('serial', event.target.value)}
                  required
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-1">Fecha de aplicacion</span>
                <input
                  className="input input-bordered"
                  type="date"
                  value={manualForm.applicationDate}
                  onChange={(event) => handleManualChange('applicationDate', event.target.value)}
                  required
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-1">Geolocalizacion</span>
                <input
                  className="input input-bordered"
                  placeholder="Ej. 19.4326,-99.1332"
                  value={manualForm.geolocation}
                  onChange={(event) => handleManualChange('geolocation', event.target.value)}
                  required
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-1">Cliente final</span>
                <input
                  className="input input-bordered"
                  value={manualForm.finalClient}
                  onChange={(event) => handleManualChange('finalClient', event.target.value)}
                  required
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-base-300 px-4 py-3">
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => setActivePanel('')}
              >
                Cerrar
              </button>
              <button className="btn btn-primary" type="submit">
                Agregar condensador
              </button>
            </div>
          </form>

          {manualSummary && <p className="mt-3 text-sm font-medium text-success">{manualSummary}</p>}

          {manualErrors.length > 0 && (
            <div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning-content">
              <p className="font-medium">Errores detectados</p>
              <ul className="mt-1 list-disc pl-5">
                {manualErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </article>
      )}

      {activePanel === 'excel' && (
        <article className="mt-4 rounded-xl border border-base-300 bg-base-100 p-4">
          <h3 className="text-base font-semibold">Carga masiva por Excel</h3>
          <p className="mt-1 text-sm text-base-content/70">
            Para este cliente puedes subir lotes grandes (100+ equipos) con columnas: MARCA, MODELO,
            NUMERO DE SERIE, FECHA DE APLICACION, GEOLOCALIZACION, CLIENTE FINAL.
          </p>

          <div className="mt-3 rounded-xl border border-base-300 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className="file-input file-input-bordered w-full sm:max-w-md"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
                disabled={isImporting}
              />
              {isImporting && <span className="text-sm text-base-content/70">Procesando archivo...</span>}
            </div>

            <div className="mt-3 flex justify-end">
              <button className="btn btn-outline" type="button" onClick={() => setActivePanel('')}>
                Cerrar
              </button>
            </div>
          </div>

          {importSummary && <p className="mt-3 text-sm font-medium text-success">{importSummary}</p>}

          {importErrors.length > 0 && (
            <div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning-content">
              <p className="font-medium">Errores detectados</p>
              <ul className="mt-1 list-disc pl-5">
                {importErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </article>
      )}
    </section>
  )
}
