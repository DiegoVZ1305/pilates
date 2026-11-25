import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DOCENTES, GRILLA_BASE, PLANES, STUDIO, docenteDe, tipoDe,
} from './config'
import {
  diaSemanaDe, etiquetaLarga, horasPara, hoyISO, proximaRenovacion, proximosDias,
  slotId, todosLosDias, yaPaso,
} from './fechas'

const CLAVE = 'pilates-studio-v4'
const TODAS = Array.from({ length: STUDIO.camillas }, (_, i) => i + 1)

// Ids propios: crypto.randomUUID() sólo existe en contexto seguro y la app
// también se abre por http desde el celular (vite --host).
let secuencia = 0
const nuevoId = (pre = 'r') => pre
  + Date.now().toString(36)
  + (secuencia++).toString(36)
  + Math.random().toString(36).slice(2, 6)

// ---- generador pseudo-aleatorio estable ---------------------------------
// Misma semilla -> mismos datos, así la demo no cambia en cada recarga.
function rng(semilla) {
  let s = 0
  for (const ch of String(semilla)) s = (s * 31 + ch.charCodeAt(0)) >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

// ---- alumnos de ejemplo --------------------------------------------------
const ALUMNOS_DEMO = [
  ['Ana Gómez', 'ana'], ['Belén Ruiz', 'belen'], ['Camila Soto', 'camila'],
  ['Diego Paz', 'diego'], ['Elena Vidal', 'elena'], ['Flor Medina', 'flor'],
  ['Gonzalo Díaz', 'gonzalo'], ['Irene Lara', 'irene'], ['Julia Ponce', 'julia'],
  ['Karen Ortiz', 'karen'], ['Lucas Vega', 'lucas'], ['Marta Ríos', 'marta'],
  ['Nadia Cruz', 'nadia'], ['Paula Bravo', 'paula'], ['Rocío Nieto', 'rocio'],
  ['Sol Herrera', 'sol'], ['Tomás Reyes', 'tomas'], ['Valeria Luna', 'valeria'],
]

const PLANES_DEMO = ['ocho', 'ocho', 'cuatro', 'libre', 'ocho', 'suelta']

function nuevoUsuario({ id, nombre, email, telefono, pin, plan = 'ocho', rol = 'alumno', creado }) {
  return {
    id,
    nombre,
    email,
    telefono,
    pin,
    rol,
    // Sin paquete hasta que el studio confirme el pago de uno.
    plan: plan
      ? { id: plan, clasesRestantes: PLANES[plan].clases, renuevaEl: proximaRenovacion() }
      : { id: null, clasesRestantes: 0, renuevaEl: null },
    solicitud: null,   // paquete pedido y todavía no activado
    preferencias: { camillaFavorita: null, recordatorios: true, docenteFavorito: null },
    notas: '',
    creado: creado ?? Date.now(),
  }
}

function semilla() {
  const usuarios = [
    nuevoUsuario({
      id: 'studio', nombre: 'Equipo del studio', email: 'studio@pilates.com',
      telefono: '11 4000 0000', pin: '1111', rol: 'admin', plan: 'libre',
    }),
    nuevoUsuario({
      id: 'demo', nombre: 'Pablo Costa', email: 'demo@pilates.com',
      telefono: '11 5555 0100', pin: '1234', plan: 'ocho',
    }),
    ...ALUMNOS_DEMO.map(([nombre, id], i) => nuevoUsuario({
      id,
      nombre,
      email: `${id}@mail.com`,
      telefono: '11 5' + String(1000000 + i * 137711).slice(0, 7),
      pin: '0000',
      plan: PLANES_DEMO[i % PLANES_DEMO.length],
    })),
  ]

  const reservas = {}
  const alumnos = usuarios.filter((u) => u.rol === 'alumno')

  for (const dia of todosLosDias()) {
    for (const clase of GRILLA_BASE[dia.diaSemana] ?? []) {
      const id = slotId(dia.iso, clase.hora)
      const dado = rng(id)

      // Las clases de la tarde y las de 08 son las más pedidas.
      const pico = ['08:00', '18:00', '19:00'].includes(clase.hora)
      const cuantos = Math.min(
        STUDIO.camillas,
        Math.round((pico ? 7 : 3) + dado() * 3),
      )

      const libresCamillas = [...TODAS]
      const candidatos = [...alumnos]
      const lista = []

      for (let i = 0; i < cuantos && candidatos.length && libresCamillas.length; i++) {
        const u = candidatos.splice(Math.floor(dado() * candidatos.length), 1)[0]
        const camilla = libresCamillas.splice(Math.floor(dado() * libresCamillas.length), 1)[0]
        lista.push({
          id: `${id}-${u.id}`,
          usuarioId: u.id,
          camilla,
          creado: Date.now() - Math.round(dado() * 72) * 3600000,
          asistencia: dia.pasado ? (dado() > 0.12 ? 'asistio' : 'ausente') : 'pendiente',
        })
      }

      if (lista.length) reservas[id] = lista
    }
  }

  // Le damos historial y próximas clases a la cuenta demo.
  const dias = todosLosDias()
  const paraDemo = [
    ...dias.filter((d) => d.pasado).slice(-6, -1),
    ...dias.filter((d) => !d.pasado).slice(1, 4),
  ]
  for (const dia of paraDemo) {
    const clases = GRILLA_BASE[dia.diaSemana] ?? []
    const clase = clases[Math.floor(rng(dia.iso + 'demo')() * clases.length)]
    if (!clase) continue
    const id = slotId(dia.iso, clase.hora)
    const lista = reservas[id] ?? []
    if (lista.some((r) => r.usuarioId === 'demo')) continue
    const camilla = TODAS.find((c) => !lista.some((r) => r.camilla === c))
    if (!camilla) continue
    lista.push({
      id: `${id}-demo`,
      usuarioId: 'demo',
      camilla,
      creado: Date.now() - 86400000,
      asistencia: dia.pasado ? 'asistio' : 'pendiente',
    })
    reservas[id] = lista
  }

  // Las reservas futuras ya cargadas descuentan del plan de cada alumno,
  // para que el contador del perfil sea coherente con la agenda.
  const usadas = {}
  for (const [id, lista] of Object.entries(reservas)) {
    const [fecha, hora] = id.split('|')
    if (yaPaso(fecha, hora)) continue
    for (const r of lista) usadas[r.usuarioId] = (usadas[r.usuarioId] ?? 0) + 1
  }
  for (const u of usuarios) {
    if (u.rol !== 'alumno') continue
    u.plan.clasesRestantes = Math.max(0, u.plan.clasesRestantes - (usadas[u.id] ?? 0))
  }

  return {
    usuarios,
    sesion: null,
    grilla: JSON.parse(JSON.stringify(GRILLA_BASE)),
    reservas,
    espera: {},
    guardadas: { demo: ['1|19:00', '3|08:00'] },
    fueraDeServicio: [],
    cerrados: [],   // feriados y cierres puntuales, por fecha
    avisos: {},     // bandeja por alumno: lo que pasó con sus reservas
  }
}

/**
 * Suelta las reservas futuras que cumplen `coincide(fecha, hora)`: las borra,
 * anota cuántas devolverle a cada alumna y le deja el aviso. Lo usan tanto
 * cerrar un día como dar de baja un horario de la grilla, para que las dos
 * cosas se comporten igual.
 */
function soltarReservas(prev, coincide, texto) {
  const reservas = { ...prev.reservas }
  const espera = { ...prev.espera }
  let avisos = prev.avisos ?? {}
  const devolver = {}

  for (const id of Object.keys(prev.reservas)) {
    const [fecha, hora] = id.split('|')
    if (!coincide(fecha, hora) || yaPaso(fecha, hora)) continue
    for (const r of prev.reservas[id]) {
      devolver[r.usuarioId] = (devolver[r.usuarioId] ?? 0) + 1
      avisos = sumarAviso(avisos, r.usuarioId, texto(fecha, hora))
    }
    delete reservas[id]
  }
  for (const id of Object.keys(prev.espera)) {
    const [fecha, hora] = id.split('|')
    if (coincide(fecha, hora) && !yaPaso(fecha, hora)) delete espera[id]
  }

  const devueltas = Object.values(devolver).reduce((t, n) => t + n, 0)
  return {
    devueltas,
    parche: {
      reservas,
      espera,
      avisos,
      usuarios: prev.usuarios.map((u) => (devolver[u.id]
        ? { ...u, plan: { ...u.plan, clasesRestantes: u.plan.clasesRestantes + devolver[u.id] } }
        : u)),
    },
  }
}

/** Suma un aviso a la bandeja de un alumno, sin pisar los que ya tiene. */
function sumarAviso(avisos, usuarioId, texto) {
  const previos = avisos?.[usuarioId] ?? []
  return {
    ...avisos,
    [usuarioId]: [...previos, { id: nuevoId('a'), texto, creado: Date.now() }],
  }
}

function leerGuardado() {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (!raw) return null
    const db = JSON.parse(raw)
    return db?.usuarios?.length ? db : null
  } catch {
    return null
  }
}

// =========================================================================
export function useStudio() {
  const [db, setDb] = useState(() => leerGuardado() ?? semilla())

  useEffect(() => {
    try { localStorage.setItem(CLAVE, JSON.stringify(db)) } catch { /* modo privado */ }
  }, [db])

  // Los abonos se renuevan el 1º de cada mes: al abrir la app se ponen al día
  // los que ya vencieron. En producción esto lo haría una tarea del servidor.
  useEffect(() => {
    const hoy = hoyISO()
    const vencido = (u) => u.plan.renuevaEl && u.plan.renuevaEl <= hoy
    setDb((p) => (p.usuarios.some(vencido)
      ? {
        ...p,
        usuarios: p.usuarios.map((u) => (vencido(u)
          ? {
            ...u,
            plan: {
              ...u.plan,
              clasesRestantes: PLANES[u.plan.id].clases,
              renuevaEl: proximaRenovacion(),
            },
          }
          : u)),
      }
      : p))
  }, [])

  const usuario = useMemo(
    () => db.usuarios.find((u) => u.id === db.sesion) ?? null,
    [db.usuarios, db.sesion],
  )
  const esAdmin = usuario?.rol === 'admin'
  const alumnos = useMemo(() => db.usuarios.filter((u) => u.rol === 'alumno'), [db.usuarios])
  const usuarioPorId = useCallback(
    (id) => db.usuarios.find((u) => u.id === id) ?? null,
    [db.usuarios],
  )

  // ---- sesión ------------------------------------------------------------
  const entrar = useCallback((email, pin) => {
    const u = db.usuarios.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
    if (!u) return { ok: false, motivo: 'No encontramos esa cuenta.' }
    if (u.pin !== pin.trim()) return { ok: false, motivo: 'El PIN no coincide.' }
    setDb((p) => ({ ...p, sesion: u.id }))
    return { ok: true, usuario: u }
  }, [db.usuarios])

  const registrar = useCallback((datos) => {
    const email = datos.email.trim().toLowerCase()
    if (db.usuarios.some((u) => u.email.toLowerCase() === email)) {
      return { ok: false, motivo: 'Ya existe una cuenta con ese email.' }
    }
    const nuevo = nuevoUsuario({
      id: 'u' + Date.now().toString(36),
      nombre: datos.nombre.trim(),
      email,
      telefono: datos.telefono.trim(),
      pin: datos.pin.trim(),
      plan: null,
    })
    setDb((p) => ({ ...p, usuarios: [...p.usuarios, nuevo], sesion: nuevo.id }))
    return { ok: true, usuario: nuevo }
  }, [db.usuarios])

  const salir = useCallback(() => setDb((p) => ({ ...p, sesion: null })), [])

  const actualizarPerfil = useCallback((parche) => {
    setDb((p) => ({
      ...p,
      usuarios: p.usuarios.map((u) => (u.id === p.sesion ? { ...u, ...parche } : u)),
    }))
  }, [])

  // ---- paquetes -----------------------------------------------------------
  // El alumno pide; sólo el studio activa, cuando recibió el pago.
  const solicitarPlan = useCallback((planId) => {
    if (planId !== null && !PLANES[planId]) return
    setDb((p) => ({
      ...p,
      usuarios: p.usuarios.map((u) => (u.id === p.sesion && u.rol === 'alumno'
        ? { ...u, solicitud: planId }
        : u)),
    }))
  }, [])

  const resolverSolicitud = useCallback((usuarioId, activar) => {
    setDb((p) => {
      if (p.usuarios.find((u) => u.id === p.sesion)?.rol !== 'admin') return p
      const quien = p.usuarios.find((u) => u.id === usuarioId)
      const pedido = quien?.solicitud
      if (!pedido) return p
      const { clases, nombre } = PLANES[pedido]
      // La clase suelta se suma a lo que haya y no se renueva; un abono
      // reemplaza al anterior.
      const plan = !activar ? quien.plan
        : pedido === 'suelta'
          ? {
            id: quien.plan.id ?? pedido,
            clasesRestantes: quien.plan.clasesRestantes + clases,
            renuevaEl: quien.plan.renuevaEl,
          }
          : { id: pedido, clasesRestantes: clases, renuevaEl: proximaRenovacion() }
      return {
        ...p,
        usuarios: p.usuarios.map((u) => (u.id === usuarioId ? { ...u, plan, solicitud: null } : u)),
        avisos: sumarAviso(p.avisos, usuarioId, activar
          ? `Tu paquete "${nombre}" ya está activo.`
          : `El studio no activó tu pedido de "${nombre}". Escribinos si tenés dudas.`),
      }
    })
  }, [])

  // ---- catálogo de clases -------------------------------------------------
  const horariosDe = useCallback((diaSemana) => db.grilla[diaSemana] ?? [], [db.grilla])

  const armarClase = useCallback((fecha, hora, def) => {
    const id = slotId(fecha, hora)
    const lista = db.reservas[id] ?? []
    const cola = db.espera[id] ?? []
    const mapa = new Map(lista.map((r) => [r.camilla, r]))

    const plano = TODAS.map((numero) => {
      const reserva = mapa.get(numero) ?? null
      const fuera = db.fueraDeServicio.includes(numero)
      return {
        numero,
        reserva,
        usuario: reserva ? usuarioPorId(reserva.usuarioId) : null,
        fuera,
        mia: reserva?.usuarioId === usuario?.id,
        libre: !reserva && !fuera,
      }
    })

    const mio = lista.find((r) => r.usuarioId === usuario?.id) ?? null
    const posEspera = cola.findIndex((r) => r.usuarioId === usuario?.id)

    return {
      id,
      fecha,
      hora,
      tipoId: def.tipo,
      tipo: tipoDe(def.tipo),
      docente: docenteDe(def.docente),
      plano,
      reservas: lista,
      espera: cola,
      ocupados: lista.length,
      total: plano.filter((c) => !c.fuera).length,
      libres: plano.filter((c) => c.libre).length,
      miCamilla: mio?.camilla ?? null,
      miAsistencia: mio?.asistencia ?? null,
      enEspera: posEspera >= 0,
      posicionEspera: posEspera + 1,
      pasado: yaPaso(fecha, hora),
      horasPara: horasPara(fecha, hora),
    }
  }, [db.reservas, db.espera, db.fueraDeServicio, usuario?.id, usuarioPorId])

  /** Los cierres puntuales (feriados) ganan sobre la grilla semanal. */
  const estaCerrado = useCallback((iso) => (db.cerrados ?? []).includes(iso), [db.cerrados])

  const horariosDeFecha = useCallback(
    (iso) => (estaCerrado(iso) ? [] : (db.grilla[diaSemanaDe(iso)] ?? [])),
    [db.grilla, estaCerrado],
  )

  const clasesDeDia = useCallback(
    (iso) => horariosDeFecha(iso).map((def) => armarClase(iso, def.hora, def)),
    [horariosDeFecha, armarClase],
  )

  const clase = useCallback((fecha, hora) => {
    const def = horariosDeFecha(fecha).find((c) => c.hora === hora)
    return def ? armarClase(fecha, hora, def) : null
  }, [horariosDeFecha, armarClase])

  // ---- reservas -----------------------------------------------------------
  /** `comoId` deja al studio reservar por una alumna que llamó por teléfono. */
  const reservar = useCallback((fecha, hora, camilla, comoId = null) => {
    if (!usuario) return { ok: false, motivo: 'Entrá a tu cuenta para reservar.' }
    const id = slotId(fecha, hora)
    let out = { ok: true }

    setDb((prev) => {
      const lista = prev.reservas[id] ?? []
      const cola = prev.espera[id] ?? []
      const yo = prev.usuarios.find((u) => u.id === (comoId ?? prev.sesion))
      if (!yo) {
        out = { ok: false, motivo: 'No encontramos a esa alumna.' }
        return prev
      }
      if ((prev.cerrados ?? []).includes(fecha)) {
        out = { ok: false, motivo: 'El studio está cerrado ese día.' }
        return prev
      }

      if (lista.some((r) => r.usuarioId === yo.id) || cola.some((r) => r.usuarioId === yo.id)) {
        out = { ok: false, motivo: 'Ya tenés un lugar en esta clase.' }
        return prev
      }

      // Cuentan las reservas y también los lugares en lista de espera: cuando
      // se libera un cupo se vuelven reserva solos, así que ocupan el tope.
      const activasEn = (fuente) => Object.entries(fuente).filter(([k, l]) => {
        const [f, h] = k.split('|')
        return !yaPaso(f, h) && l.some((r) => r.usuarioId === yo.id)
      }).length
      const activas = activasEn(prev.reservas) + activasEn(prev.espera)

      if (activas >= STUDIO.maxActivas) {
        out = { ok: false, motivo: `Llegaste al máximo de ${STUDIO.maxActivas} reservas activas.` }
        return prev
      }
      if (yo.plan.clasesRestantes <= 0) {
        out = { ok: false, motivo: 'No te quedan clases en el plan. Elegí un paquete.' }
        return prev
      }

      const base = { id: nuevoId(), usuarioId: yo.id, creado: Date.now() }

      if (camilla == null) {
        out = { ok: true, enEspera: true, posicion: cola.length + 1 }
        return { ...prev, espera: { ...prev.espera, [id]: [...cola, base] } }
      }
      if (prev.fueraDeServicio.includes(camilla)) {
        out = { ok: false, motivo: `La camilla ${camilla} está fuera de servicio.` }
        return prev
      }
      if (lista.some((r) => r.camilla === camilla)) {
        out = { ok: false, motivo: `Alguien tomó la camilla ${camilla} recién. Elegí otra.` }
        return prev
      }

      out = { ok: true, camilla }
      return {
        ...prev,
        reservas: {
          ...prev.reservas,
          [id]: [...lista, { ...base, camilla, asistencia: 'pendiente' }],
        },
        usuarios: prev.usuarios.map((u) => (u.id === yo.id
          ? { ...u, plan: { ...u.plan, clasesRestantes: u.plan.clasesRestantes - 1 } }
          : u)),
      }
    })

    return out
  }, [usuario])

  const moverCamilla = useCallback((fecha, hora, camilla) => {
    const id = slotId(fecha, hora)
    let out = { ok: true, camilla }
    setDb((prev) => {
      const lista = prev.reservas[id] ?? []
      if (prev.fueraDeServicio.includes(camilla) || lista.some((r) => r.camilla === camilla)) {
        out = { ok: false, motivo: `La camilla ${camilla} ya no está disponible.` }
        return prev
      }
      return {
        ...prev,
        reservas: {
          ...prev.reservas,
          [id]: lista.map((r) => (r.usuarioId === prev.sesion ? { ...r, camilla } : r)),
        },
      }
    })
    return out
  }, [])

  const cancelar = useCallback((fecha, hora, comoId = null) => {
    const id = slotId(fecha, hora)
    const aTiempo = horasPara(fecha, hora) >= STUDIO.horasCancelacion
    let out = { ok: true, aTiempo }

    setDb((prev) => {
      const quien = comoId ?? prev.sesion
      const cola = prev.espera[id] ?? []
      if (cola.some((r) => r.usuarioId === quien)) {
        out = { ok: true, deEspera: true }
        return {
          ...prev,
          espera: { ...prev.espera, [id]: cola.filter((r) => r.usuarioId !== quien) },
        }
      }

      const lista = (prev.reservas[id] ?? []).filter((r) => r.usuarioId !== quien)
      const libre = TODAS.find(
        (c) => !prev.fueraDeServicio.includes(c) && !lista.some((r) => r.camilla === c),
      )

      // Entra el primero de la cola que todavía tenga clases en el plan: la
      // promoción le descuenta una, igual que si hubiera reservado él mismo.
      const planDe = (uid) => prev.usuarios.find((u) => u.id === uid)?.plan.clasesRestantes ?? 0
      const iProm = libre ? cola.findIndex((r) => planDe(r.usuarioId) > 0) : -1
      const promovido = iProm >= 0 ? { ...cola[iProm], camilla: libre, asistencia: 'pendiente' } : null
      out = { ...out, promovido: promovido ? promovido.usuarioId : null }

      return {
        ...prev,
        reservas: { ...prev.reservas, [id]: promovido ? [...lista, promovido] : lista },
        espera: { ...prev.espera, [id]: promovido ? cola.filter((_, i) => i !== iProm) : cola },
        // Al que entra desde la espera hay que avisarle: si no, se entera el día
        // de la clase. Lo ve al abrir la app, en "mis clases".
        avisos: promovido
          ? sumarAviso(prev.avisos, promovido.usuarioId,
            `Entraste desde la lista de espera: ${etiquetaLarga(fecha)} a las ${hora}, camilla ${libre}.`)
          : prev.avisos,
        usuarios: prev.usuarios.map((u) => {
          // La clase vuelve al plan sólo si cancelaste con tiempo.
          if (u.id === quien && aTiempo) {
            return { ...u, plan: { ...u.plan, clasesRestantes: u.plan.clasesRestantes + 1 } }
          }
          // Y al promovido se le cobra la clase que acaba de conseguir.
          if (promovido && u.id === promovido.usuarioId) {
            return { ...u, plan: { ...u.plan, clasesRestantes: u.plan.clasesRestantes - 1 } }
          }
          return u
        }),
      }
    })

    return out
  }, [])

  // ---- mis clases ---------------------------------------------------------
  const misClases = useMemo(() => {
    if (!usuario) return { proximas: [], historial: [], espera: [] }
    const proximas = []
    const historial = []
    const espera = []

    for (const [id, lista] of Object.entries(db.reservas)) {
      const [fecha, hora] = id.split('|')
      const mia = lista.find((r) => r.usuarioId === usuario.id)
      if (!mia) continue
      const def = (db.grilla[diaSemanaDe(fecha)] ?? []).find((c) => c.hora === hora)
      if (!def) continue
      const item = {
        fecha, hora, camilla: mia.camilla, asistencia: mia.asistencia,
        tipo: tipoDe(def.tipo), docente: docenteDe(def.docente),
      }
      ;(yaPaso(fecha, hora) ? historial : proximas).push(item)
    }

    for (const [id, cola] of Object.entries(db.espera)) {
      const [fecha, hora] = id.split('|')
      const pos = cola.findIndex((r) => r.usuarioId === usuario.id)
      if (pos < 0 || yaPaso(fecha, hora)) continue
      const def = (db.grilla[diaSemanaDe(fecha)] ?? []).find((c) => c.hora === hora)
      if (!def) continue
      espera.push({
        fecha, hora, posicion: pos + 1,
        tipo: tipoDe(def.tipo), docente: docenteDe(def.docente),
      })
    }

    const orden = (a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora)
    return {
      proximas: proximas.sort(orden),
      espera: espera.sort(orden),
      historial: historial.sort(orden).reverse(),
    }
  }, [db.reservas, db.espera, db.grilla, usuario])

  const estadisticas = useMemo(() => {
    const h = misClases.historial
    const asistidas = h.filter((c) => c.asistencia === 'asistio').length
    const ausencias = h.filter((c) => c.asistencia === 'ausente').length
    const porTipo = {}
    const porDocente = {}
    for (const c of h) {
      if (c.asistencia !== 'asistio') continue
      porTipo[c.tipo.nombre] = (porTipo[c.tipo.nombre] ?? 0) + 1
      porDocente[c.docente.nombre] = (porDocente[c.docente.nombre] ?? 0) + 1
    }
    const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    return {
      asistidas,
      ausencias,
      total: h.length,
      favorita: top(porTipo),
      docenteTop: top(porDocente),
      racha: (() => {
        let n = 0
        for (const c of h) { if (c.asistencia === 'asistio') n++; else break }
        return n
      })(),
    }
  }, [misClases.historial])

  // ---- clases guardadas (favoritas, por día de la semana) ------------------
  const guardadas = useMemo(
    () => (usuario ? db.guardadas[usuario.id] ?? [] : []),
    [db.guardadas, usuario],
  )

  const alternarGuardada = useCallback((diaSemana, hora) => {
    const llave = `${diaSemana}|${hora}`
    setDb((prev) => {
      const actuales = prev.guardadas[prev.sesion] ?? []
      return {
        ...prev,
        guardadas: {
          ...prev.guardadas,
          [prev.sesion]: actuales.includes(llave)
            ? actuales.filter((x) => x !== llave)
            : [...actuales, llave],
        },
      }
    })
  }, [])

  const estaGuardada = useCallback(
    (diaSemana, hora) => guardadas.includes(`${diaSemana}|${hora}`),
    [guardadas],
  )

  // ---- administración -----------------------------------------------------
  const alternarCamilla = useCallback((camilla) => {
    setDb((p) => ({
      ...p,
      fueraDeServicio: p.fueraDeServicio.includes(camilla)
        ? p.fueraDeServicio.filter((c) => c !== camilla)
        : [...p.fueraDeServicio, camilla],
    }))
  }, [])

  const agregarClase = useCallback((diaSemana, def) => {
    let out = { ok: true }
    setDb((p) => {
      const dia = p.grilla[diaSemana] ?? []
      if (dia.some((c) => c.hora === def.hora)) {
        out = { ok: false, motivo: 'Ya hay una clase a esa hora.' }
        return p
      }
      const nueva = [...dia, def].sort((a, b) => a.hora.localeCompare(b.hora))
      return { ...p, grilla: { ...p.grilla, [diaSemana]: nueva } }
    })
    return out
  }, [])

  /** Reservas futuras que tiene ese horario fijo de la semana. */
  const anotadasDeHorario = useCallback((diaSemana, hora) => {
    let n = 0
    for (const [id, lista] of Object.entries(db.reservas)) {
      const [fecha, h] = id.split('|')
      if (h !== hora || yaPaso(fecha, h) || diaSemanaDe(fecha) !== Number(diaSemana)) continue
      n += lista.length
    }
    return n
  }, [db.reservas])

  /**
   * Dar de baja un horario de la grilla cancela sus reservas futuras y les
   * devuelve la clase, igual que cerrar un día: dejarlas colgadas haría que
   * la alumna perdiera la clase sin enterarse.
   */
  const quitarClase = useCallback((diaSemana, hora) => {
    let out = { devueltas: 0 }
    setDb((p) => {
      const { devueltas, parche } = soltarReservas(
        p,
        (fecha, h) => h === hora && diaSemanaDe(fecha) === Number(diaSemana),
        (fecha) => `El studio dio de baja la clase de las ${hora}: se canceló tu reserva del ${etiquetaLarga(fecha)} y la clase vuelve a tu plan.`,
      )
      out = { devueltas }
      return {
        ...p,
        ...parche,
        grilla: { ...p.grilla, [diaSemana]: (p.grilla[diaSemana] ?? []).filter((c) => c.hora !== hora) },
      }
    })
    return out
  }, [])

  const marcarAsistencia = useCallback((fecha, hora, reservaId, estado) => {
    const id = slotId(fecha, hora)
    setDb((p) => ({
      ...p,
      reservas: {
        ...p.reservas,
        [id]: (p.reservas[id] ?? []).map((r) => (r.id === reservaId ? { ...r, asistencia: estado } : r)),
      },
    }))
  }, [])

  /**
   * Reserva de una vez las próximas semanas de un horario fijo. Va una fecha
   * por vez contra el mismo estado, así el plan y el tope de reservas se
   * respetan igual que reservando a mano, y devuelve qué no pudo.
   */
  const reservarSerie = useCallback((diaSemana, hora, semanas = 4) => {
    const resultado = { hechas: [], saltadas: [] }

    setDb((prev) => {
      const yo = prev.usuarios.find((u) => u.id === prev.sesion)
      if (!yo) return prev

      const futuras = (fuente) => Object.entries(fuente).filter(([k, l]) => {
        const [f, h] = k.split('|')
        return !yaPaso(f, h) && l.some((r) => r.usuarioId === yo.id)
      }).length

      let reservas = prev.reservas
      let quedan = yo.plan.clasesRestantes
      let activas = futuras(prev.reservas) + futuras(prev.espera)
      const favorita = yo.preferencias?.camillaFavorita ?? null

      for (const dia of proximosDias()) {
        if (resultado.hechas.length >= semanas) break
        if (dia.diaSemana !== Number(diaSemana)) continue
        if (yaPaso(dia.iso, hora)) continue

        const corta = (motivo) => resultado.saltadas.push({ fecha: dia.iso, motivo })

        if ((prev.cerrados ?? []).includes(dia.iso)) { corta('el studio cierra'); continue }
        if (!(prev.grilla[diaSemana] ?? []).some((c) => c.hora === hora)) { corta('no está en la grilla'); continue }

        const id = slotId(dia.iso, hora)
        const lista = reservas[id] ?? []
        if (lista.some((r) => r.usuarioId === yo.id)) { corta('ya tenías lugar'); continue }
        if (quedan <= 0) { corta('sin clases en el plan'); continue }
        if (activas >= STUDIO.maxActivas) { corta(`tope de ${STUDIO.maxActivas} reservas`); continue }

        const tomada = (c) => prev.fueraDeServicio.includes(c) || lista.some((r) => r.camilla === c)
        const camilla = favorita && !tomada(favorita) ? favorita : TODAS.find((c) => !tomada(c))
        if (!camilla) { corta('clase completa'); continue }

        reservas = {
          ...reservas,
          [id]: [...lista, {
            id: nuevoId(), usuarioId: yo.id, camilla, creado: Date.now(), asistencia: 'pendiente',
          }],
        }
        quedan--
        activas++
        resultado.hechas.push({ fecha: dia.iso, camilla })
      }

      if (!resultado.hechas.length) return prev
      return {
        ...prev,
        reservas,
        usuarios: prev.usuarios.map((u) => (u.id === yo.id
          ? { ...u, plan: { ...u.plan, clasesRestantes: quedan } }
          : u)),
      }
    })

    return resultado
  }, [])

  // ---- cierres puntuales (feriados) ---------------------------------------
  /**
   * Cerrar un día cancela las reservas que tenía y le devuelve la clase a
   * cada alumna, con un aviso: dejarlas colgadas sería peor que avisar.
   */
  const alternarCerrado = useCallback((iso) => {
    let out = { cerrado: true, devueltas: 0 }

    setDb((prev) => {
      const cerrados = prev.cerrados ?? []
      if (cerrados.includes(iso)) {
        out = { cerrado: false, devueltas: 0 }
        return { ...prev, cerrados: cerrados.filter((d) => d !== iso) }
      }

      const { devueltas, parche } = soltarReservas(
        prev,
        (fecha) => fecha === iso,
        (fecha, hora) => `El studio cierra el ${etiquetaLarga(fecha)}: se canceló tu clase de las ${hora} y la clase vuelve a tu plan.`,
      )
      out = { cerrado: true, devueltas }
      return { ...prev, ...parche, cerrados: [...cerrados, iso] }
    })

    return out
  }, [])

  // ---- bandeja de avisos del alumno ---------------------------------------
  const misAvisos = useMemo(
    () => (usuario ? (db.avisos?.[usuario.id] ?? []) : []),
    [db.avisos, usuario],
  )

  const descartarAviso = useCallback((avisoId) => {
    setDb((p) => ({
      ...p,
      avisos: {
        ...p.avisos,
        [p.sesion]: (p.avisos?.[p.sesion] ?? []).filter((a) => a.id !== avisoId),
      },
    }))
  }, [])

  const metricas = useCallback((iso) => {
    const clases = clasesDeDia(iso)
    const anotados = clases.reduce((t, c) => t + c.ocupados, 0)
    const capacidad = clases.reduce((t, c) => t + c.total, 0)
    const llenas = clases.filter((c) => c.libres === 0).length
    const enEspera = clases.reduce((t, c) => t + c.espera.length, 0)
    return {
      clases: clases.length,
      anotados,
      capacidad,
      ocupacion: capacidad ? Math.round((anotados / capacidad) * 100) : 0,
      llenas,
      enEspera,
    }
  }, [clasesDeDia])

  /** Ranking de docentes por alumnos anotados en los próximos días. */
  const rankingDocentes = useCallback(() => {
    const conteo = Object.fromEntries(DOCENTES.map((d) => [d.id, 0]))
    for (const [id, lista] of Object.entries(db.reservas)) {
      const [fecha, hora] = id.split('|')
      const def = (db.grilla[diaSemanaDe(fecha)] ?? []).find((c) => c.hora === hora)
      if (def && conteo[def.docente] != null) conteo[def.docente] += lista.length
    }
    return DOCENTES.map((d) => ({ ...d, alumnos: conteo[d.id] }))
      .sort((a, b) => b.alumnos - a.alumnos)
  }, [db.reservas, db.grilla])

  /** Próximas clases de un docente (para su ficha). */
  const clasesDeDocente = useCallback((docenteId, cuantas = 4) => {
    const out = []
    for (const dia of todosLosDias()) {
      if (dia.pasado) continue
      for (const def of db.grilla[dia.diaSemana] ?? []) {
        if (def.docente !== docenteId) continue
        if (yaPaso(dia.iso, def.hora)) continue
        out.push(armarClase(dia.iso, def.hora, def))
        if (out.length >= cuantas) return out
      }
    }
    return out
  }, [db.grilla, armarClase])

  const reiniciar = useCallback(() => setDb(semilla()), [])

  return {
    db, usuario, esAdmin, alumnos, usuarioPorId,
    entrar, registrar, salir, actualizarPerfil, solicitarPlan, resolverSolicitud,
    docentes: DOCENTES, grilla: db.grilla, horariosDe, horariosDeFecha, clasesDeDia, clase,
    reservar, reservarSerie, moverCamilla, cancelar, misClases, estadisticas,
    cerrados: db.cerrados ?? [], estaCerrado, alternarCerrado,
    misAvisos, descartarAviso,
    guardadas, alternarGuardada, estaGuardada,
    fueraDeServicio: db.fueraDeServicio, alternarCamilla,
    agregarClase, quitarClase, anotadasDeHorario, marcarAsistencia, metricas,
    rankingDocentes, clasesDeDocente, reiniciar,
  }
}
