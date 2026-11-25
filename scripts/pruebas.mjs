/* Pruebas de la lógica del studio: corre useStudio de verdad contra el stub
   de React y verifica las reglas de reserva, espera, cierres y avisos. */
import { render } from './react-stub.js'
import { useStudio } from '../src/lib/db.js'
import { proximosDias } from '../src/lib/fechas.js'

// crypto.randomUUID no existe fuera de contexto seguro: lo sacamos para
// comprobar que reservar sigue funcionando igual (bug A3).
delete globalThis.crypto

let fallas = 0
const ok = (cond, texto) => {
  console.log('   ' + (cond ? 'ok   ' : 'FALLA ') + texto)
  if (!cond) fallas++
}
const titulo = (t) => console.log('\n' + t)

let st = render(useStudio)
const refrescar = () => { st = render(useStudio) }

/** Deja a una alumna sin reservas ni esperas futuras. */
function limpiar(id) {
  for (let v = 0; v < 30; v++) {
    const pendiente = Object.entries(st.db.reservas)
      .concat(Object.entries(st.db.espera))
      .find(([k, l]) => l.some((r) => r.usuarioId === id)
        && new Date(k.split('|')[0] + 'T' + k.split('|')[1]) > new Date())
    if (!pendiente) return
    const [fecha, hora] = pendiente[0].split('|')
    st.cancelar(fecha, hora, id)
    refrescar()
  }
}

const dias = proximosDias()
const diasAbiertos = () => dias.filter((d) => d.offset > 0 && st.horariosDeFecha(d.iso).length > 0)

// ------------------------------------------------------------------ sesión
st.entrar('demo@pilates.com', '1234')
refrescar()

titulo('sesión y datos sembrados')
ok(st.usuario?.id === 'demo', 'entra la cuenta demo')
ok(st.alumnos.length > 10, `hay ${st.alumnos.length} alumnas`)
ok(st.usuario.plan.renuevaEl > new Date().toISOString().slice(0, 10),
  `el plan renueva el ${st.usuario.plan.renuevaEl} (B4)`)

limpiar('demo')

titulo('A3 · reservar sin crypto.randomUUID')
{
  const c = st.clasesDeDia(diasAbiertos()[0].iso).find((x) => x.libres > 1)
  const antes = st.usuario.plan.clasesRestantes
  const n = c.plano.find((x) => x.libre).numero
  const r = st.reservar(c.fecha, c.hora, n)
  refrescar()
  ok(r.ok, r.ok ? `reserva la camilla ${r.camilla}` : `rechazada: ${r.motivo}`)
  ok(st.clase(c.fecha, c.hora).miCamilla === n, 'queda tomada en el plano')
  ok(st.usuario.plan.clasesRestantes === antes - 1, 'descuenta una clase del plan')
  ok(typeof st.clase(c.fecha, c.hora).reservas.at(-1).id === 'string', 'la reserva tiene id propio')
}

titulo('A2 · la lista de espera ocupa el tope de reservas activas')
{
  limpiar('demo')
  const sueltas = []
  for (const d of diasAbiertos()) {
    for (const c of st.clasesDeDia(d.iso)) {
      if (sueltas.length >= 3 || c.libres === 0 || c.miCamilla) continue
      if (st.reservar(c.fecha, c.hora, c.plano.find((x) => x.libre).numero).ok) {
        sueltas.push(c.hora)
        refrescar()
      }
    }
    if (sueltas.length >= 3) break
  }
  ok(sueltas.length === 3, 'toma 3 reservas sueltas')

  const llena = diasAbiertos().flatMap((d) => st.clasesDeDia(d.iso))
    .find((c) => c.libres === 0 && !c.miCamilla && !c.enEspera)
  const r = st.reservar(llena.fecha, llena.hora, null)
  refrescar()
  ok(r.ok && r.enEspera, `la cuarta la toma como espera (puesto ${r.posicion})`)
  ok(st.misClases.espera.length === 1, 'aparece en "mis clases · espera"')

  const otra = diasAbiertos().flatMap((d) => st.clasesDeDia(d.iso))
    .find((c) => c.libres > 0 && !c.miCamilla && !c.enEspera)
  const r2 = st.reservar(otra.fecha, otra.hora, otra.plano.find((x) => x.libre).numero)
  ok(!r2.ok && /máximo/.test(r2.motivo), 'con 3 reservas + 1 espera, la quinta se rechaza (A2)')
}

titulo('A1 + D3 · promover desde la espera cobra la clase y avisa')
{
  // Achicamos la sala a 2 camillas para poder llenar la clase sin mover a
  // media agenda: el resto quedan fuera de servicio.
  for (let n = 3; n <= 10; n++) { st.alternarCamilla(n); refrescar() }

  const dia = diasAbiertos().at(-1)
  const c0 = st.clasesDeDia(dia.iso)[0]
  for (const r of c0.reservas) { st.cancelar(c0.fecha, c0.hora, r.usuarioId); refrescar() }
  for (const r of st.clase(c0.fecha, c0.hora).espera) { st.cancelar(c0.fecha, c0.hora, r.usuarioId); refrescar() }

  const [a, b, esperando] = st.alumnos.filter((u) => u.id !== 'demo').slice(0, 3)
  for (const u of [a, b, esperando]) limpiar(u.id)

  st.reservar(c0.fecha, c0.hora, 1, a.id); refrescar()
  st.reservar(c0.fecha, c0.hora, 2, b.id); refrescar()
  ok(st.clase(c0.fecha, c0.hora).libres === 0, 'la clase quedó completa (2 camillas)')

  const planAntes = st.usuarioPorId(esperando.id).plan.clasesRestantes
  const r = st.reservar(c0.fecha, c0.hora, null, esperando.id)
  refrescar()
  ok(r.ok && r.enEspera, `${esperando.nombre} queda en espera`)
  ok(st.usuarioPorId(esperando.id).plan.clasesRestantes === planAntes,
    'estar en espera todavía no le cobra nada')

  const res = st.cancelar(c0.fecha, c0.hora, a.id)
  refrescar()
  ok(res.promovido === esperando.id, 'al liberarse el lugar entra quien esperaba')
  ok(st.clase(c0.fecha, c0.hora).reservas.some((x) => x.usuarioId === esperando.id),
    'y pasa a tener camilla')
  ok(st.usuarioPorId(esperando.id).plan.clasesRestantes === planAntes - 1,
    'recién ahí se le cobra la clase (A1)')
  ok((st.db.avisos[esperando.id] ?? []).some((x) => /espera/i.test(x.texto)),
    'le queda un aviso en su bandeja (D3)')
  ok(st.clase(c0.fecha, c0.hora).espera.length === 0, 'la cola queda vacía')

  for (let n = 3; n <= 10; n++) { st.alternarCamilla(n); refrescar() }
}

titulo('D1 · el studio anota y da de baja por una alumna')
{
  const dia = diasAbiertos().at(-2)
  const c = st.clasesDeDia(dia.iso).find((x) => x.libres > 0)
  const quien = st.alumnos.find((u) => u.id !== 'demo')
  limpiar(quien.id)
  const plan = st.usuarioPorId(quien.id).plan.clasesRestantes
  const n = st.clase(c.fecha, c.hora).plano.find((x) => x.libre).numero

  const r = st.reservar(c.fecha, c.hora, n, quien.id)
  refrescar()
  ok(r.ok, r.ok ? `el studio anota a ${quien.nombre} en la camilla ${n}` : `rechazada: ${r.motivo}`)
  ok(st.clase(c.fecha, c.hora).reservas.some((x) => x.usuarioId === quien.id), 'figura anotada')
  ok(st.usuarioPorId(quien.id).plan.clasesRestantes === plan - 1, 'le descuenta a ella, no al admin')
  ok(st.usuario.id === 'demo', 'la sesión sigue siendo la del studio')

  st.cancelar(c.fecha, c.hora, quien.id)
  refrescar()
  ok(!st.clase(c.fecha, c.hora).reservas.some((x) => x.usuarioId === quien.id), 'y la da de baja')
}

titulo('D2 · cerrar un día cancela, devuelve y avisa')
{
  const dia = diasAbiertos().at(-3)
  const clases = st.clasesDeDia(dia.iso)
  const anotadas = clases.reduce((t, c) => t + c.ocupados, 0)
  const victima = clases.flatMap((c) => c.reservas)[0].usuarioId
  const suyas = clases.flatMap((c) => c.reservas).filter((r) => r.usuarioId === victima).length
  const planAntes = st.usuarioPorId(victima).plan.clasesRestantes

  const r = st.alternarCerrado(dia.iso)
  refrescar()
  ok(r.cerrado && r.devueltas === anotadas, `cierra y devuelve ${r.devueltas} de ${anotadas} clases`)
  ok(st.estaCerrado(dia.iso), 'el día queda marcado como cerrado')
  ok(st.horariosDeFecha(dia.iso).length === 0 && st.clasesDeDia(dia.iso).length === 0,
    'no quedan horarios ni clases ese día')
  ok(st.usuarioPorId(victima).plan.clasesRestantes === planAntes + suyas,
    `a la alumna le vuelven sus ${suyas} clase(s) al plan`)
  ok((st.db.avisos[victima] ?? []).some((x) => /cierra/i.test(x.texto)), 'y le queda el aviso del cierre')

  const rechazo = st.reservar(dia.iso, clases[0].hora, 1, 'demo')
  ok(!rechazo.ok && /cerrado/.test(rechazo.motivo), 'no se puede reservar un día cerrado')

  st.alternarCerrado(dia.iso)
  refrescar()
  ok(!st.estaCerrado(dia.iso) && st.horariosDeFecha(dia.iso).length > 0,
    'reabrirlo lo devuelve a la grilla')
}

titulo('A4 · dar de baja un horario devuelve las clases y avisa')
{
  const dia = diasAbiertos().at(-4)
  const hora = st.horariosDeFecha(dia.iso)[0].hora
  const afectadas = st.clase(dia.iso, hora).reservas.length
  const victima = st.clase(dia.iso, hora).reservas[0].usuarioId
  const suyas = st.anotadasDeHorario(dia.diaSemana, hora)
  const planAntes = st.usuarioPorId(victima).plan.clasesRestantes

  ok(suyas >= afectadas, `el panel anuncia ${suyas} anotadas antes de quitar`)

  const r = st.quitarClase(dia.diaSemana, hora)
  refrescar()
  ok(r.devueltas === suyas, `devuelve las ${r.devueltas} clases que anunciaba`)
  ok(!st.horariosDeFecha(dia.iso).some((c) => c.hora === hora), 'el horario sale de la grilla')
  ok(st.usuarioPorId(victima).plan.clasesRestantes > planAntes, 'a la alumna le vuelve la clase')
  ok((st.db.avisos[victima] ?? []).some((x) => /baja/i.test(x.texto)), 'y le queda el aviso')
}

titulo('D4 · reservar la serie de las próximas semanas')
{
  st.salir(); refrescar()
  st.entrar('belen@mail.com', '0000'); refrescar()
  limpiar('belen')

  const dia = diasAbiertos()[0]
  const hora = st.horariosDeFecha(dia.iso)[0].hora
  const plan = st.usuario.plan.clasesRestantes

  const serie = st.reservarSerie(dia.diaSemana, hora, 4)
  refrescar()
  const total = serie.hechas.length
  ok(total > 0, `reserva ${total} fecha(s) del mismo horario`)
  ok(total <= 4, 'nunca más de las semanas pedidas')
  ok(st.usuario.plan.clasesRestantes === plan - total, 'descuenta exactamente las que reservó')
  ok(st.misClases.proximas.length === total, 'aparecen todas en "mis clases"')
  ok(serie.hechas.every((h) => st.clase(h.fecha, hora)?.miCamilla === h.camilla),
    'cada una con la camilla que informó')

  const otra = st.reservarSerie(dia.diaSemana, hora, 4)
  ok(otra.hechas.length === 0 && otra.saltadas.every((x) => x.motivo === 'ya tenías lugar'),
    'repetirla no duplica reservas')
}

console.log(fallas === 0 ? '\nTodo bien.' : `\n${fallas} fallas.`)
process.exit(fallas === 0 ? 0 : 1)
