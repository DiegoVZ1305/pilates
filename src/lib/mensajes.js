// Textos compartidos de las acciones que avisan al alumno, para que digan lo
// mismo se cancele desde el plano de la sala o desde la lista de "mis clases".
import { STUDIO } from './config'

/** Lo que se pierde (o no) al cancelar, para escribirlo antes de confirmar. */
export const avisoCancelar = (clase) =>
  clase.enEspera ? 'Salís de la lista de espera.'
    : clase.horasPara >= STUDIO.horasCancelacion
      ? 'La clase vuelve a tu plan.'
      : `Faltan menos de ${STUDIO.horasCancelacion} h: la clase no vuelve a tu plan.`

/** El aviso flotante con el resultado de `studio.cancelar`. */
export function resultadoCancelar(r) {
  if (r.deEspera) return { tipo: 'ok', texto: 'Saliste de la lista de espera.' }
  if (r.aTiempo) return { tipo: 'ok', texto: 'Reserva cancelada. La clase vuelve a tu plan.' }
  return {
    tipo: 'alerta',
    texto: `Cancelada con menos de ${STUDIO.horasCancelacion} h: esta vez la clase no vuelve al plan.`,
  }
}
