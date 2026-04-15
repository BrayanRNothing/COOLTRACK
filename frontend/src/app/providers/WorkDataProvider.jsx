import { useState } from 'react'
import WorkDataContext from './work-data-context'
import {
  assignments as initialAssignments,
  clients as initialClients,
  condensers as initialCondensers,
  maintenanceRecords as initialMaintenanceRecords,
  technicianTasks as initialTechnicianTasks,
  technicians as initialTechnicians,
} from '../../shared/mocks/workData'

function createId(prefix, currentLength) {
  return `${prefix}-${String(currentLength + 1).padStart(4, '0')}`
}

export function WorkDataProvider({ children }) {
  const [clients, setClients] = useState(initialClients)
  const [technicians] = useState(initialTechnicians)
  const [condensers, setCondensers] = useState(initialCondensers)
  const [assignments, setAssignments] = useState(initialAssignments)
  const [technicianTasks, setTechnicianTasks] = useState(initialTechnicianTasks)
  const [maintenanceRecords, setMaintenanceRecords] = useState(initialMaintenanceRecords)

  const createAssignment = ({ technicianName, clientName, condenserId, scheduledDate, type }) => {
    const nextTaskId = createId('TK', technicianTasks.length)
    const nextAssignmentId = createId('AS', assignments.length)

    const newTask = {
      id: nextTaskId,
      technicianName,
      clientName,
      condenserId,
      type,
      scheduledDate,
      status: 'Asignado',
    }

    const newAssignment = {
      id: nextAssignmentId,
      taskId: nextTaskId,
      technicianName,
      clientName,
      condenserId,
      scheduledDate,
      status: 'Asignado',
    }

    setTechnicianTasks((previous) => [newTask, ...previous])
    setAssignments((previous) => [newAssignment, ...previous])
  }

  const registerMaintenance = ({ taskId, notes, photoNames, performedBy, performedAt, condenserNumber }) => {
    const task = technicianTasks.find((item) => item.id === taskId)
    if (!task) {
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
      condenserNumber: normalizedCondenserNumber,
      clientName: task.clientName,
      performedBy,
      performedAt: nextDate,
      performedAtTime: nextDateTime,
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
          nextDate: nextDate,
        }
      }),
    )

    return true
  }

  const value = {
    clients,
    technicians,
    condensers,
    assignments,
    technicianTasks,
    maintenanceRecords,
    createAssignment,
    registerMaintenance,
  }

  return <WorkDataContext.Provider value={value}>{children}</WorkDataContext.Provider>
}
