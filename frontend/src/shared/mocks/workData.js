export const clients = [
  { id: 'CL-001', name: 'Plaza Norte', city: 'Lima', condensers: 2 },
  { id: 'CL-002', name: 'Clinica Central', city: 'Arequipa', condensers: 3 },
  { id: 'CL-003', name: 'Hotel Pacifik', city: 'Trujillo', condensers: 1 },
]

export const technicians = [
  {
    id: 'TEC-001',
    name: 'Carlos Rojas',
    phone: '+51 999 101 101',
    specialty: 'Mantenimiento preventivo',
    zone: 'Lima Norte',
    status: 'Disponible',
  },
  {
    id: 'TEC-002',
    name: 'Ana Huaman',
    phone: '+51 999 202 202',
    specialty: 'Mantenimiento correctivo',
    zone: 'Lima Sur',
    status: 'En ruta',
  },
  {
    id: 'TEC-003',
    name: 'Luis Poma',
    phone: '+51 999 303 303',
    specialty: 'Inspeccion tecnica',
    zone: 'Arequipa',
    status: 'Disponible',
  },
]

export const condensers = [
  {
    id: 'CD-101',
    clientName: 'Plaza Norte',
    serial: 'CN-PL-2026-01',
    brand: 'Carrier',
    model: 'XPower 55',
    applicationDate: '2026-02-01',
    geolocation: '-11.9981,-77.0572',
    finalClient: 'Plaza Norte Patio Comidas',
    annualMaintenances: 3,
    completedThisYear: 1,
    nextDate: '2026-06-18',
  },
  {
    id: 'CD-102',
    clientName: 'Plaza Norte',
    serial: 'CN-PL-2026-02',
    brand: 'Trane',
    model: 'Condenser T-20',
    applicationDate: '2026-01-20',
    geolocation: '-12.0013,-77.0605',
    finalClient: 'Plaza Norte Cine',
    annualMaintenances: 3,
    completedThisYear: 2,
    nextDate: '2026-05-07',
  },
  {
    id: 'CD-201',
    clientName: 'Clinica Central',
    serial: 'CN-CC-2026-01',
    brand: 'York',
    model: 'YVAA-10',
    applicationDate: '2026-03-05',
    geolocation: '-16.4026,-71.5350',
    finalClient: 'Clinica Central Torre B',
    annualMaintenances: 3,
    completedThisYear: 0,
    nextDate: '2026-04-28',
  },
]

export const technicianTasks = [
  {
    id: 'TK-9001',
    technicianName: 'Carlos Rojas',
    clientId: 'CL-002',
    clientName: 'Clinica Central',
    condenserId: 'CD-201',
    type: 'Mantenimiento preventivo',
    scheduledDate: '2026-04-28',
    status: 'Pendiente',
  },
  {
    id: 'TK-9002',
    technicianName: 'Carlos Rojas',
    clientId: 'CL-001',
    clientName: 'Plaza Norte',
    condenserId: 'CD-101',
    type: 'Inspeccion de rutina',
    scheduledDate: '2026-05-03',
    status: 'Asignado',
  },
]

export const assignments = [
  {
    id: 'AS-1001',
    taskId: 'TK-9001',
    technicianName: 'Carlos Rojas',
    clientId: 'CL-002',
    clientName: 'Clinica Central',
    condenserId: 'CD-201',
    scheduledDate: '2026-04-28',
    status: 'Pendiente',
  },
  {
    id: 'AS-1002',
    taskId: 'TK-9002',
    technicianName: 'Carlos Rojas',
    clientId: 'CL-001',
    clientName: 'Plaza Norte',
    condenserId: 'CD-101',
    scheduledDate: '2026-05-03',
    status: 'Asignado',
  },
]

export const clientAssignments = [
  {
    id: 'AC-001',
    clientId: 'CL-001',
    clientName: 'Plaza Norte',
    technicianId: 'TEC-001',
    technicianName: 'Carlos Rojas',
    assignedAt: '2026-04-10',
  },
]

export const maintenanceRecords = [
  {
    id: 'MR-7001',
    taskId: 'TK-9000',
    clientId: 'CL-001',
    condenserId: 'CD-102',
    clientName: 'Plaza Norte',
    performedBy: 'Carlos Rojas',
    performedAt: '2026-03-12',
    performedAtTime: '2026-03-12T10:30:00-05:00',
    geolocation: '-12.0031,-77.0582',
    applicationDate: '2026-03-12',
    notes: 'Se limpio serpentines y se verifico presion. Sin fugas.',
    photos: ['antes-frontal.jpg', 'durante-recubrimiento.jpg', 'despues-frontal.jpg'],
  },
]
