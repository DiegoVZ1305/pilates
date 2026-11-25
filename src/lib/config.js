// ---- Configuración del studio -------------------------------------------
// Todo lo que el studio podría querer cambiar vive acá.

export const STUDIO = {
  nombre: 'Core 40',
  sigla: 'C40',             // marca corta, la del logo
  camillas: 10,            // reformers de alumnos en la sala
  maxActivas: 4,           // reservas futuras simultáneas por alumno
  diasVisibles: 14,        // días a futuro que se pueden reservar
  diasHistorial: 10,       // días hacia atrás que guarda el historial
  horasCancelacion: 2,     // mínimo para cancelar sin penalidad
}

// Cómo están distribuidas las camillas en la sala, tal cual el plano del studio:
// una fila contra cada pared y la del instructor cruzada al medio.
export const DISPOSICION = {
  arriba: [1, 2, 3, 4, 5],
  abajo: [6, 7, 8, 9, 10],
}

export const INSTRUCTOR = { etiqueta: 'Instructor' }

// ---- Tipos de clase ------------------------------------------------------
export const TIPOS = {
  reformer:  { nombre: 'Reformer',       nivel: 'Todos los niveles', duracion: 50,
               desc: 'Trabajo completo sobre el reformer: fuerza, control y movilidad.' },
  mat:       { nombre: 'Mat Pilates',    nivel: 'Inicial',           duracion: 45,
               desc: 'Pilates en colchoneta con elementos. Ideal para empezar.' },
  prenatal:  { nombre: 'Pre/Post parto', nivel: 'Especial',          duracion: 50,
               desc: 'Adaptada al embarazo y al posparto, con seguimiento cercano.' },
  funcional: { nombre: 'Funcional',      nivel: 'Intermedio',        duracion: 55,
               desc: 'Reformer + peso corporal, más dinámica y de mayor intensidad.' },
  stretch:   { nombre: 'Stretching',     nivel: 'Todos los niveles', duracion: 40,
               desc: 'Elongación profunda y respiración para cerrar el día.' },
}

// ---- Docentes ------------------------------------------------------------
export const DOCENTES = [
  { id: 'carla',   nombre: 'Carla Medina',    especialidad: 'Reformer · Stretching',
    desde: 2018, bio: 'Profe de educación física, certificada en Reformer por Polestar. Le gusta corregir de a poco y sin apuro.' },
  { id: 'luciana', nombre: 'Luciana Ríos',    especialidad: 'Pre/Post parto',
    desde: 2020, bio: 'Kinesióloga especializada en suelo pélvico. Lleva las clases de embarazo y posparto del studio.' },
  { id: 'sofia',   nombre: 'Sofía Trejo',     especialidad: 'Mat · Reformer',
    desde: 2021, bio: 'Viene de la danza contemporánea. Sus clases tienen mucho trabajo de fluidez y control.' },
  { id: 'martin',  nombre: 'Martín Duarte',   especialidad: 'Funcional',
    desde: 2019, bio: 'Entrenador funcional. Arma las clases más intensas de la grilla, siempre con progresiones.' },
]

// ---- Grilla semanal base (0 = domingo ... 6 = sábado) --------------------
// El admin puede agregar y quitar clases desde el panel; esto es el punto de partida.
const manana = [
  { hora: '07:00', tipo: 'reformer',  docente: 'carla' },
  { hora: '08:00', tipo: 'mat',       docente: 'carla' },
  { hora: '09:00', tipo: 'reformer',  docente: 'luciana' },
  { hora: '10:00', tipo: 'prenatal',  docente: 'luciana' },
]
const tarde = [
  { hora: '17:00', tipo: 'reformer',  docente: 'sofia' },
  { hora: '18:00', tipo: 'funcional', docente: 'martin' },
  { hora: '19:00', tipo: 'reformer',  docente: 'martin' },
  { hora: '20:00', tipo: 'stretch',   docente: 'carla' },
]

export const GRILLA_BASE = {
  0: [],
  1: [...manana, ...tarde],
  2: [...manana, ...tarde],
  3: [...manana, ...tarde],
  4: [...manana, ...tarde],
  5: [...manana, ...tarde.slice(0, 3)],
  6: [
    { hora: '09:00', tipo: 'reformer', docente: 'sofia' },
    { hora: '10:00', tipo: 'mat',      docente: 'sofia' },
    { hora: '11:00', tipo: 'stretch',  docente: 'carla' },
  ],
}

// Horarios que el admin puede agregar a la grilla.
export const HORAS_POSIBLES = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
]

// ---- Planes / abonos -----------------------------------------------------
export const PLANES = {
  libre:  { nombre: 'Libre',          clases: 99, detalle: 'Ilimitado',     precio: 'Bs xxx',
            incluye: ['Clases sin límite', 'Reservá hasta 4 turnos a la vez', 'Elegís tu camilla'] },
  ocho:   { nombre: '8 clases / mes', clases: 8,  detalle: '2 por semana',  precio: 'Bs xxx',
            incluye: ['2 clases por semana', 'Reprogramás hasta 2 h antes', 'Elegís tu camilla'] },
  cuatro: { nombre: '4 clases / mes', clases: 4,  detalle: '1 por semana',  precio: 'Bs xxx',
            incluye: ['1 clase por semana', 'Reprogramás hasta 2 h antes', 'Elegís tu camilla'] },
  suelta: { nombre: 'Clase suelta',   clases: 1,  detalle: 'Sin abono',     precio: 'Bs xxx',
            incluye: ['Una clase', 'Sin compromiso', 'Ideal para probar'] },
}

// ---- Sitio público -------------------------------------------------------
// Fotos del sitio. Salen de Assets/ con `npm run marca` (ver scripts/marca.py).
export const FOTOS = {
  hero: '/fotos/sala.jpg',
  flexibilidad: '/fotos/flexibilidad.jpg',
  fuerza: '/fotos/fuerza.jpg',
  resistencia: '/fotos/resistencia.jpg',
  momento: '/fotos/plancha.jpg',
}

export const LOGOS = {
  completo: '/marca/logo.png',               // negro, con "Modern Pilates"
  completoBlanco: '/marca/logo-blanco.png',
  palabra: '/marca/palabra.png',             // sólo CORE40, para tamaños chicos
  palabraBlanca: '/marca/palabra-blanca.png',
}

// Reseñas reales de Google, elegidas por el studio y copiadas tal cual.
// Formato: { nombre: '...', estrellas: 5, texto: '...' }
// Mientras la lista esté vacía, la sección muestra sólo el enlace a Google Maps.
export const RESENAS = []

export const SITIO = {
  lema: 'Tu dosis diaria de movimiento',
  frase: 'Pilates ahora, café después',
  direccion: 'Daniel Sánchez B., Cochabamba, Bolivia',
  mapa: 'https://maps.app.goo.gl/oz2RiFGqVzGYkueG9',
  horarioAtencion: 'Lun a vie de 7 a 21 h · Sáb de 9 a 13 h',
  telefono: '+591 73347110',
  instagram: 'core40.bo',
  pilares: [
    { titulo: 'Flexibilidad', texto: 'Movilidad real, ganada de a poco y sin forzar.', foto: 'flexibilidad' },
    { titulo: 'Fuerza',       texto: 'Centro fuerte, piernas y espalda que sostienen.', foto: 'fuerza' },
    { titulo: 'Resistencia',  texto: 'Series que te acompañan durante toda la semana.', foto: 'resistencia' },
  ],
  razones: [
    ['Grupos de 10', 'Nunca más de diez personas por clase. La profe te mira, te corrige y sabe tu nombre.'],
    ['Elegís tu camilla', 'Reservás viendo el plano real de la sala y te ubicás donde estés más cómoda.'],
    ['Profes formadas', 'Todo el equipo está certificado y arma progresiones según cómo venís.'],
    ['Sin perder clases', 'Cancelás hasta 2 h antes y la clase vuelve a tu plan, sin llamar a nadie.'],
  ],
}

export const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const DIAS_LARGOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                      'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "Ana Gómez" -> "AG" */
export const iniciales = (nombre = '') =>
  nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('')

export const docenteDe = (id) => DOCENTES.find((d) => d.id === id) ?? DOCENTES[0]
export const tipoDe = (id) => TIPOS[id] ?? TIPOS.reformer
