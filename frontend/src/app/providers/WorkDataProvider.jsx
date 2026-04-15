import { useState } from 'react'
import WorkDataContext from './work-data-context'
import {
  assignments as initialAssignments,
  clientAssignments as initialClientAssignments,
  clients as initialClients,
  condensers as initialCondensers,
  maintenanceRecords as initialMaintenanceRecords,
  technicianTasks as initialTechnicianTasks,
  technicians as initialTechnicians,
} from '../../shared/mocks/workData'

function createId(prefix, currentLength) {
  return `${prefix}-${String(currentLength + 1).padStart(4, '0')}`
}

function createClientNumber(currentClients) {
  const maxCorrelative = currentClients.reduce((maxValue, client) => {
    const parsedValue = Number(String(client.id).replace('CL-', ''))
    if (Number.isNaN(parsedValue)) {
      return maxValue
    }

    return Math.max(maxValue, parsedValue)
  }, 0)

  return `CL-${String(maxCorrelative + 1).padStart(3, '0')}`
}

function createTechnicianNumber(currentTechnicians) {
  const maxCorrelative = currentTechnicians.reduce((maxValue, technician) => {
    const parsedValue = Number(String(technician.id).replace('TEC-', ''))
    if (Number.isNaN(parsedValue)) {
      return maxValue
    }

    return Math.max(maxValue, parsedValue)
  }, 0)

  return `TEC-${String(maxCorrelative + 1).padStart(3, '0')}`
}

function parseDateInput(value) {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString().slice(0, 10)
}

export function WorkDataProvider({ children }) {
  const [clients, setClients] = useState(initialClients)
  const [technicians, setTechnicians] = useState(initialTechnicians)
  const [condensers, setCondensers] = useState(initialCondensers)
  const [assignments, setAssignments] = useState(initialAssignments)
  const [clientAssignments, setClientAssignments] = useState(initialClientAssignments)
  const [technicianTasks, setTechnicianTasks] = useState(initialTechnicianTasks)
  const [maintenanceRecords, setMaintenanceRecords] = useState(initialMaintenanceRecords)

  const assignClientToTechnician = ({ clientId, technicianId }) => {
    const linkedClient = clients.find((item) => item.id === clientId)
    const linkedTechnician = technicians.find((item) => item.id === technicianId)

    if (!linkedClient || !linkedTechnician) {
      return { created: false, message: 'Cliente o tecnico invalido.' }
    }

    const exists = clientAssignments.some(
      (item) => item.clientId === linkedClient.id && item.technicianId === linkedTechnician.id,
    )

    if (exists) {
      return { created: false, message: 'Este cliente ya esta asignado a ese tecnico.' }
    }

    const newClientAssignment = {
      id: `AC-${String(clientAssignments.length + 1).padStart(3, '0')}`,
      clientId: linkedClient.id,
      clientName: linkedClient.name,
      technicianId: linkedTechnician.id,
      technicianName: linkedTechnician.name,
      assignedAt: new Date().toISOString().slice(0, 10),
    }

    const linkedClientCondensers = condensers
      .filter((item) => item.clientName === linkedClient.name)
      .map((item) => item.id)

    const autoAssignments = createAssignments({
      technicianName: linkedTechnician.name,
      clientId: linkedClient.id,
      condenserIds: linkedClientCondensers,
      scheduledDate: new Date().toISOString().slice(0, 10),
      type: 'Recubrimiento programado',
    })

    setClientAssignments((previous) => [newClientAssignment, ...previous])
    return {
      created: true,
      message: `Cliente asignado correctamente. ${autoAssignments.createdCount} trabajo(s) generado(s).`,
    }
  }

  const createAssignments = ({ technicianName, clientId, condenserIds, scheduledDate, type }) => {
    const linkedClient = clients.find((client) => client.id === clientId)
    if (!linkedClient || !technicianName || !scheduledDate || !Array.isArray(condenserIds)) {
      return { createdCount: 0 }
    }

    const uniqueCondenserIds = [...new Set(condenserIds.filter(Boolean))]
    if (uniqueCondenserIds.length === 0) {
      return { createdCount: 0 }
    }

    const availableCondenserIds = uniqueCondenserIds.filter((condenserId) => {
      const alreadyAssigned = technicianTasks.some(
        (task) =>
          task.technicianName === technicianName &&
          task.clientId === linkedClient.id &&
          task.condenserId === condenserId &&
          task.status !== 'Completado',
      )

      return !alreadyAssigned
    })

    if (availableCondenserIds.length === 0) {
      return { createdCount: 0 }
    }

    const baseTaskLength = technicianTasks.length
    const baseAssignmentLength = assignments.length

    const newTasks = availableCondenserIds.map((condenserId, index) => ({
      id: createId('TK', baseTaskLength + index),
      technicianName,
      clientId: linkedClient.id,
      clientName: linkedClient.name,
      condenserId,
      type,
      scheduledDate,
      status: 'Asignado',
    }))

    const newAssignments = newTasks.map((task, index) => ({
      id: createId('AS', baseAssignmentLength + index),
      taskId: task.id,
      technicianName,
      clientId: linkedClient.id,
      clientName: linkedClient.name,
      condenserId: task.condenserId,
      scheduledDate,
      status: 'Asignado',
    }))

    setTechnicianTasks((previous) => [...newTasks, ...previous])
    setAssignments((previous) => [...newAssignments, ...previous])

    return { createdCount: newAssignments.length }
  }

  const createAssignment = ({ technicianName, clientId, condenserId, scheduledDate, type }) => {
    const result = createAssignments({
      technicianName,
      clientId,
      condenserIds: [condenserId],
      scheduledDate,
      type,
    })

    return result.createdCount > 0
  }

  const createTechnician = ({ name, phone, specialty, zone, status }) => {
    const trimmedName = String(name ?? '').trim()
    const trimmedPhone = String(phone ?? '').trim()
    const trimmedSpecialty = String(specialty ?? '').trim()
    const trimmedZone = String(zone ?? '').trim()
    const trimmedStatus = String(status ?? '').trim() || 'Disponible'

    if (!trimmedName || !trimmedPhone || !trimmedSpecialty || !trimmedZone) {
      return null
    }

    const nextTechnician = {
      id: createTechnicianNumber(technicians),
      name: trimmedName,
      phone: trimmedPhone,
      specialty: trimmedSpecialty,
      zone: trimmedZone,
      status: trimmedStatus,
    }

    setTechnicians((previous) => [nextTechnician, ...previous])
    return nextTechnician
  }

  const deleteTechnician = (technicianId) => {
    const targetTechnician = technicians.find((item) => item.id === technicianId)
    if (!targetTechnician) {
      return false
    }

    setTechnicians((previous) => previous.filter((item) => item.id !== technicianId))
    setClientAssignments((previous) =>
      previous.filter((item) => item.technicianId !== technicianId),
    )
    setAssignments((previous) =>
      previous.filter((item) => item.technicianName !== targetTechnician.name),
    )
    setTechnicianTasks((previous) =>
      previous.filter((item) => item.technicianName !== targetTechnician.name),
    )

    return true
  }

  const registerMaintenance = ({
    taskId,
    notes,
    photoNames,
    performedBy,
    performedAt,
    condenserNumber,
    geolocation,
    applicationDate,
  }) => {
    const task = technicianTasks.find((item) => item.id === taskId)
    if (!task) {
      return false
    }

    const normalizedGeolocation = String(geolocation ?? '').trim()
    const normalizedApplicationDate = parseDateInput(applicationDate)
    if (!normalizedGeolocation || !normalizedApplicationDate || photoNames.length < 3) {
      return false
    }

    const nextRecordId = createId('MR', maintenanceRecords.length)
    const nextDate = performedAt || new Date().toISOString().slice(0, 10)
    const nextDateTime = new Date().toISOString()
    const normalizedCondenserNumber = condenserNumber.trim()

    const existingCondenser = condensers.find(
      (item) =>
        item.clientName === task.clientName &&
        (item.id.toLowerCase() === normalizedCondenserNumber.toLowerCase() ||
          item.serial.toLowerCase() === normalizedCondenserNumber.toLowerCase()),
    )

    const targetCondenserId = existingCondenser?.id ?? createId('CD', condensers.length)

    if (!existingCondenser) {
      setCondensers((previous) => [
        {
          id: targetCondenserId,
          clientName: task.clientName,
          serial: normalizedCondenserNumber,
          geolocation: normalizedGeolocation,
          applicationDate: normalizedApplicationDate,
          brand: 'Pendiente',
          model: 'Pendiente',
          finalClient: task.clientName,
          annualMaintenances: 3,
          completedThisYear: 0,
          nextDate,
        },
        ...previous,
      ])

      setClients((previous) =>
        previous.map((item) =>
          item.name === task.clientName ? { ...item, condensers: item.condensers + 1 } : item,
        ),
      )
    }

    const newRecord = {
      id: nextRecordId,
      taskId,
      condenserId: targetCondenserId,
      clientId: task.clientId,
      condenserNumber: normalizedCondenserNumber,
      clientName: task.clientName,
      performedBy,
      performedAt: nextDate,
      performedAtTime: nextDateTime,
      geolocation: normalizedGeolocation,
      applicationDate: normalizedApplicationDate,
      notes,
      photos: photoNames,
    }

    setMaintenanceRecords((previous) => [newRecord, ...previous])
    setTechnicianTasks((previous) =>
      previous.map((item) =>
        item.id === taskId
          ? { ...item, status: 'Completado', condenserId: targetCondenserId }
          : item,
      ),
    )
    setAssignments((previous) =>
      previous.map((item) =>
        item.taskId === taskId
          ? { ...item, status: 'Completado', condenserId: targetCondenserId }
          : item,
      ),
    )
    setCondensers((previous) =>
      previous.map((item) => {
        if (item.id !== targetCondenserId) {
          return item
        }

        const nextCompleted = Math.min(item.annualMaintenances, item.completedThisYear + 1)
        return {
          ...item,
          completedThisYear: nextCompleted,
          geolocation: normalizedGeolocation,
          applicationDate: normalizedApplicationDate,
          nextDate: nextDate,
        }
      }),
    )

    return true
  }

  const createClient = ({ name, city }) => {
    const trimmedName = String(name ?? '').trim()
    const trimmedCity = String(city ?? '').trim()

    if (!trimmedName || !trimmedCity) {
      return null
    }

    const nextClient = {
      id: createClientNumber(clients),
      name: trimmedName,
      city: trimmedCity,
      condensers: 0,
    }

    setClients((previous) => [nextClient, ...previous])
    return nextClient
  }

  const bulkCreateCondensers = ({ clientId, rows }) => {
    const client = clients.find((item) => item.id === clientId)
    if (!client || !Array.isArray(rows) || rows.length === 0) {
      return {
        createdCount: 0,
        skippedCount: rows?.length ?? 0,
        errors: ['No hay datos validos para importar.'],
      }
    }

    const existingSerials = new Set(condensers.map((item) => item.serial.trim().toLowerCase()))
    const errors = []
    const newCondensers = []

    rows.forEach((row, index) => {
      const serial = String(row.serial ?? '').trim()
      const brand = String(row.brand ?? '').trim()
      const model = String(row.model ?? '').trim()
      const geolocation = String(row.geolocation ?? '').trim()
      const finalClient = String(row.finalClient ?? '').trim()
      const applicationDate = parseDateInput(row.applicationDate)

      if (!serial || !brand || !model || !geolocation || !finalClient || !applicationDate) {
        errors.push(`Fila ${index + 2}: faltan datos requeridos o la fecha es invalida.`)
        return
      }

      const serialKey = serial.toLowerCase()
      if (existingSerials.has(serialKey)) {
        errors.push(`Fila ${index + 2}: numero de serie duplicado (${serial}).`)
        return
      }

      existingSerials.add(serialKey)
      newCondensers.push({
        id: createId('CD', condensers.length + newCondensers.length),
        clientName: client.name,
        serial,
        brand,
        model,
        applicationDate,
        geolocation,
        finalClient,
        annualMaintenances: 3,
        completedThisYear: 0,
        nextDate: applicationDate,
      })
    })

    if (newCondensers.length === 0) {
      return {
        createdCount: 0,
        skippedCount: rows.length,
        errors,
      }
    }

    setCondensers((previous) => [...newCondensers, ...previous])
    setClients((previous) =>
      previous.map((item) =>
        item.id === clientId ? { ...item, condensers: item.condensers + newCondensers.length } : item,
      ),
    )

    return {
      createdCount: newCondensers.length,
      skippedCount: rows.length - newCondensers.length,
      errors,
    }
  }

  const value = {
    clients,
    technicians,
    condensers,
    assignments,
    clientAssignments,
    technicianTasks,
    maintenanceRecords,
    createClient,
    createTechnician,
    deleteTechnician,
    assignClientToTechnician,
    createAssignments,
    createAssignment,
    registerMaintenance,
    bulkCreateCondensers,
  }

  return <WorkDataContext.Provider value={value}>{children}</WorkDataContext.Provider>
}
