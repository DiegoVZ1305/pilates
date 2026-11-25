import { DIAS_CORTOS, DIAS_LARGOS, MESES, STUDIO } from './config'

export const aISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const hoyISO = () => aISO(new Date())

/** id único de una clase: "2026-11-24|19:00" */
export const slotId = (fecha, hora) => `${fecha}|${hora}`

const medianoche = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** Días desde `desde` hasta `hasta` (offsets relativos a hoy). */
export function rangoDias(desde, hasta) {
  const base = medianoche()
  const out = []
  for (let i = desde; i <= hasta; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    out.push({
      iso: aISO(d),
      diaSemana: d.getDay(),
      nombreCorto: DIAS_CORTOS[d.getDay()],
      nombreLargo: DIAS_LARGOS[d.getDay()],
      numero: d.getDate(),
      mes: MESES[d.getMonth()],
      offset: i,
      esHoy: i === 0,
      esManana: i === 1,
      pasado: i < 0,
    })
  }
  return out
}

/** Los días reservables, desde hoy. */
export const proximosDias = () => rangoDias(0, STUDIO.diasVisibles - 1)

/** Todo el rango que maneja la demo, incluido el historial. */
export const todosLosDias = () => rangoDias(-STUDIO.diasHistorial, STUDIO.diasVisibles - 1)

/**
 * Agrupa los días reservables en semanas de lunes a domingo, completando los
 * huecos de la primera y la última para que cada fila sea una semana entera.
 * Los días que quedan fuera del rango vienen con `reservable: false`.
 */
export function semanasDe(dias) {
  if (!dias.length) return []
  const primero = dias[0]
  const ultimo = dias[dias.length - 1]
  const atras = (primero.diaSemana + 6) % 7      // lunes -> 0 días atrás
  const adelante = (7 - ultimo.diaSemana) % 7    // domingo -> 0 días adelante
  const reservables = new Set(dias.map((d) => d.iso))

  const todos = rangoDias(primero.offset - atras, ultimo.offset + adelante)
  const out = []
  for (let i = 0; i < todos.length; i += 7) {
    out.push(todos.slice(i, i + 7).map((d) => ({ ...d, reservable: reservables.has(d.iso) })))
  }
  return out
}

/** "Esta semana", "Próxima semana" o, más adelante, el rango de días. */
export function etiquetaSemana(semana) {
  if (!semana?.length) return ''
  if (semana.some((d) => d.esHoy)) return 'Esta semana'
  if (semana[0].offset <= 7) return 'Próxima semana'
  return 'En dos semanas'
}

/** "24 – 30 de nov" (o con los dos meses si la semana los cruza). */
export function rangoSemana(semana) {
  if (!semana?.length) return ''
  const [a] = semana
  const b = semana[semana.length - 1]
  return a.mes === b.mes
    ? `${a.numero} – ${b.numero} de ${a.mes}`
    : `${a.numero} de ${a.mes} – ${b.numero} de ${b.mes}`
}

/** El 1º del mes que viene: cuando se renuevan los abonos. */
export function proximaRenovacion(desde = new Date()) {
  return aISO(new Date(desde.getFullYear(), desde.getMonth() + 1, 1))
}

/** "1 de dic" — fecha corta, sin el día de la semana. */
export function etiquetaCorta(iso) {
  if (!iso) return ''
  const [, m, d] = iso.split('-').map(Number)
  return `${d} de ${MESES[m - 1]}`
}

export function etiquetaDia(dia) {
  if (!dia) return ''
  if (dia.esHoy) return 'Hoy'
  if (dia.esManana) return 'Mañana'
  return `${dia.nombreLargo} ${dia.numero} de ${dia.mes}`
}

export function etiquetaLarga(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  const f = new Date(a, m - 1, d)
  return `${DIAS_CORTOS[f.getDay()]} ${d} de ${MESES[m - 1]}`
}

export const diaSemanaDe = (iso) => {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d).getDay()
}

export const comoFecha = (fecha, hora) => {
  const [a, m, d] = fecha.split('-').map(Number)
  const [hh, mm] = hora.split(':').map(Number)
  return new Date(a, m - 1, d, hh, mm)
}

/** ¿Ya pasó la hora de esa clase? */
export const yaPaso = (fecha, hora) => comoFecha(fecha, hora) <= new Date()

/** Horas que faltan para la clase (negativo si ya pasó). */
export const horasPara = (fecha, hora) =>
  (comoFecha(fecha, hora) - new Date()) / 3600000

/** "en 3 h", "en 2 días", "hace 4 días" */
export function cuandoEs(fecha, hora) {
  const h = horasPara(fecha, hora)
  if (h < 0) {
    const d = Math.round(-h / 24)
    if (d === 0) return 'hoy, más temprano'
    return d === 1 ? 'ayer' : `hace ${d} días`
  }
  if (h < 1) return 'en menos de 1 h'
  if (h < 24) return `en ${Math.round(h)} h`
  const d = Math.round(h / 24)
  return d === 1 ? 'mañana' : `en ${d} días`
}
