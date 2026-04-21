import WorkDataContext from './work-data-context'
import * as clientesService from '../../shared/services/clientesService'
import * as climasService from '../../shared/services/climasService'
import * as asignacionesService from '../../shared/services/asignacionesService'
import * as mantenimientosService from '../../shared/services/mantenimientosService'
import * as usuariosService from '../../shared/services/usuariosService'
import { apiUpload } from '../../shared/services/api'

export function WorkDataProvider({ children }) {
  const value = {
    // Clientes
    getClientes: clientesService.getClientes,
    getCliente: clientesService.getCliente,
    createCliente: clientesService.createCliente,
    updateCliente: clientesService.updateCliente,
    deleteCliente: clientesService.deleteCliente,

    // Climas / Condensadores
    getClimasByCliente: climasService.getClimasByCliente,
    getAllClimas: climasService.getAllClimas,
    getClima: climasService.getClima,
    getMantenimientosByClima: climasService.getMantenimientosByClima,
    createClima: climasService.createClima,
    createClimasBulk: climasService.createClimasBulk,
    updateClima: climasService.updateClima,
    deleteClima: climasService.deleteClima,

    // Asignaciones
    getAsignaciones: asignacionesService.getAsignaciones,
    getAsignacion: asignacionesService.getAsignacion,
    createAsignacion: asignacionesService.createAsignacion,
    updateAsignacion: asignacionesService.updateAsignacion,
    deleteAsignacion: asignacionesService.deleteAsignacion,
    getMantenimientosByAsignacion: asignacionesService.getMantenimientosByAsignacion,

    // Mantenimientos
    getMantenimientos: mantenimientosService.getMantenimientos,
    createMantenimiento: mantenimientosService.createMantenimiento,
    deleteMantenimiento: mantenimientosService.deleteMantenimiento,

    // Usuarios / Técnicos
    getTecnicos: usuariosService.getTecnicos,
    getUsuarios: usuariosService.getUsuarios,
    createUsuario: usuariosService.createUsuario,
    updateUsuario: usuariosService.updateUsuario,
    deleteUsuario: usuariosService.deleteUsuario,

    // Upload
    uploadFoto: apiUpload,
  }

  return <WorkDataContext.Provider value={value}>{children}</WorkDataContext.Provider>
}
