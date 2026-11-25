import { useMemo, useState } from 'react'
import { DIAS_LARGOS, DOCENTES, HORAS_POSIBLES, PLANES, STUDIO, TIPOS, docenteDe, tipoDe } from '../lib/config'
import { etiquetaDia } from '../lib/fechas'
import { Avatar, Campo, Chip, Confirmar, Segmentado, Stat, Vacio } from './ui'

const TODAS = Array.from({ length: STUDIO.camillas }, (_, i) => i + 1)


/** Anotar a una alumna que llamó por teléfono, desde la agenda del día. */
function AnotarAMano({ studio, clase, onAviso }) {
  const [quien, setQuien] = useState('')
  const libres = clase.plano.filter((c) => c.libre)

  if (clase.pasado) return null

  const anotar = () => {
    const camilla = libres[0]?.numero ?? null     // null = lista de espera
    const r = studio.reservar(clase.fecha, clase.hora, camilla, quien)
    const nombre = studio.usuarioPorId(quien)?.nombre ?? 'La alumna'
    setQuien('')
    onAviso(r.ok
      ? {
        tipo: 'ok',
        texto: r.enEspera
          ? `${nombre} quedó en lista de espera (puesto ${r.posicion}).`
          : `${nombre} anotada en la camilla ${r.camilla}.`,
      }
      : { tipo: 'error', texto: r.motivo })
  }

  return (
    <div className="amano">
      <select value={quien} onChange={(e) => setQuien(e.target.value)}
              aria-label="Alumna a anotar">
        <option value="">Anotar a mano…</option>
        {studio.alumnos
          .filter((u) => !clase.reservas.some((r) => r.usuarioId === u.id))
          .map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre} ({u.plan.clasesRestantes})
            </option>
          ))}
      </select>
      <button className="btn btn--primario btn--chico" disabled={!quien} onClick={anotar}>
        {libres.length > 0 ? `Anotar en la ${libres[0].numero}` : 'Anotar en espera'}
      </button>
    </div>
  )
}

// ---- Hoy: asistencia y ocupación ----------------------------------------
function Hoy({ studio, dias, onAbrirClase, onAviso }) {
  const abiertos = dias.filter((d) => studio.horariosDeFecha(d.iso).length > 0)
  const [iso, setIso] = useState(abiertos[0]?.iso)
  const dia = abiertos.find((d) => d.iso === iso) ?? abiertos[0]
  const m = studio.metricas(dia?.iso)
  const clases = studio.clasesDeDia(dia?.iso ?? '')

  return (
    <>
      <select className="select" value={iso} onChange={(e) => setIso(e.target.value)}>
        {abiertos.map((d) => <option key={d.iso} value={d.iso}>{etiquetaDia(d)}</option>)}
      </select>

      <div className="stats">
        <Stat valor={m.anotados} label="alumnos anotados" tono="rosa" />
        <Stat valor={`${m.ocupacion}%`} label="ocupación" />
        <Stat valor={m.llenas} label="clases completas" />
        <Stat valor={m.enEspera} label="en lista de espera" />
      </div>

      <div className="acordeones">
        {clases.map((c) => (
          <details key={c.hora} className="acordeon" open={c.libres === 0}>
            <summary>
              <strong>{c.hora}</strong>
              <span className="acordeon__txt">{c.tipo.nombre} · {c.docente.nombre}</span>
              <Chip tono={c.libres === 0 ? 'tinta' : 'ok'}>{c.ocupados}/{c.total}</Chip>
            </summary>

            <div className="acordeon__cuerpo">
              <button className="btn btn--linea btn--chico" onClick={() => onAbrirClase(c)}>
                Ver plano de la sala
              </button>

              {c.reservas.length === 0 ? (
                <p className="tenue pad">Nadie anotado todavía.</p>
              ) : (
                <ul className="anotados">
                  {[...c.reservas].sort((a, b) => a.camilla - b.camilla).map((r) => {
                    const u = studio.usuarioPorId(r.usuarioId)
                    return (
                      <li key={r.id}>
                        <span className={'num' + (studio.fueraDeServicio.includes(r.camilla) ? ' num--alerta' : '')}>
                          {r.camilla}
                        </span>
                        <span className="anotados__nombre">
                          {u?.nombre ?? 'Alumno'}
                          {u?.notas && <em className="anotados__nota" title={u.notas}> ⚠ {u.notas}</em>}
                        </span>
                        <span className="tenue oculta-cel">{u?.telefono}</span>
                        <span className="asistencia">
                          {['asistio', 'ausente'].map((estado) => (
                            <button
                              key={estado}
                              className={'asis' + (r.asistencia === estado ? ' es-' + estado : '')}
                              onClick={() => studio.marcarAsistencia(c.fecha, c.hora, r.id, r.asistencia === estado ? 'pendiente' : estado)}
                              title={estado === 'asistio' ? 'Marcar que vino' : 'Marcar ausente'}
                            >
                              {estado === 'asistio' ? '✓' : '✕'}
                            </button>
                          ))}
                          {!c.pasado && (
                            <button
                              className="asis asis--quitar"
                              title={`Quitar a ${u?.nombre ?? 'la alumna'} de esta clase`}
                              onClick={() => {
                                studio.cancelar(c.fecha, c.hora, r.usuarioId)
                                onAviso({
                                  tipo: 'ok',
                                  texto: `${u?.nombre ?? 'La alumna'} ya no está en las ${c.hora}.`,
                                })
                              }}
                            >
                              ⌫
                            </button>
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}

              <AnotarAMano studio={studio} clase={c} onAviso={onAviso} />

              {c.espera.length > 0 && (
                <>
                  <p className="panel__sub">Lista de espera</p>
                  <ul className="anotados anotados--espera">
                    {c.espera.map((r, i) => (
                      <li key={r.id}>
                        <span className="num num--espera">{i + 1}</span>
                        <span className="anotados__nombre">{studio.usuarioPorId(r.usuarioId)?.nombre}</span>
                        <span className="tenue oculta-cel">{studio.usuarioPorId(r.usuarioId)?.telefono}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </details>
        ))}
      </div>
    </>
  )
}

// ---- Clases: editar la grilla semanal ------------------------------------
function Clases({ studio, onAviso }) {
  const [dia, setDia] = useState(1)
  const [nueva, setNueva] = useState({ hora: '12:00', tipo: 'reformer', docente: 'carla' })
  const horarios = studio.horariosDe(dia)

  function agregar(e) {
    e.preventDefault()
    const r = studio.agregarClase(dia, nueva)
    onAviso(r.ok
      ? { tipo: 'ok', texto: `Clase de ${nueva.hora} agregada al ${DIAS_LARGOS[dia].toLowerCase()}.` }
      : { tipo: 'error', texto: r.motivo })
  }

  return (
    <>
      <div className="diastabs">
        {DIAS_LARGOS.map((d, i) => (
          <button key={i} className={'diatab' + (dia === i ? ' es-activo' : '')} onClick={() => setDia(i)}>
            {d.slice(0, 3)}
            <span className="diatab__n">{studio.horariosDe(i).length}</span>
          </button>
        ))}
      </div>

      {horarios.length === 0 ? (
        <Vacio icono="○" titulo={`Sin clases los ${DIAS_LARGOS[dia].toLowerCase()}s`}
               texto="Agregá la primera con el formulario de abajo." />
      ) : (
        <ul className="lista">
          {horarios.map((c) => {
            const anotadas = studio.anotadasDeHorario(dia, c.hora)
            return (
              <li key={c.hora} className="fila">
                <div className="fila__cuando"><strong>{c.hora}</strong></div>
                <div className="fila__que">
                  <p>{tipoDe(c.tipo).nombre}</p>
                  <p className="tenue">{docenteDe(c.docente).nombre} · {tipoDe(c.tipo).duracion}′</p>
                </div>
                <div className="fila__acciones">
                  {anotadas > 0 && (
                    <Chip tono="alerta">{anotadas} anotada{anotadas === 1 ? '' : 's'}</Chip>
                  )}
                  <Confirmar
                    chico
                    etiqueta="Quitar"
                    confirmacion="Sí, quitar"
                    aviso={anotadas > 0
                      ? `Se cancelan ${anotadas} reserva${anotadas === 1 ? '' : 's'} a futuro y se devuelven al plan`
                      : 'No hay nadie anotado'}
                    onConfirmar={() => {
                      const r = studio.quitarClase(dia, c.hora)
                      onAviso(r.devueltas > 0
                        ? {
                          tipo: 'alerta',
                          texto: `Clase de ${c.hora} dada de baja. Se devolvieron ${r.devueltas} clases y se avisó a las alumnas.`,
                        }
                        : { tipo: 'ok', texto: `Clase de ${c.hora} quitada de la grilla.` })
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <form className="panel formclase" onSubmit={agregar}>
        <h3 className="panel__tit">Agregar clase al {DIAS_LARGOS[dia].toLowerCase()}</h3>
        <div className="grid3">
          <Campo etiqueta="Hora">
            <select value={nueva.hora} onChange={(e) => setNueva({ ...nueva, hora: e.target.value })}>
              {HORAS_POSIBLES.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Tipo de clase">
            <select value={nueva.tipo} onChange={(e) => setNueva({ ...nueva, tipo: e.target.value })}>
              {Object.entries(TIPOS).map(([id, t]) => <option key={id} value={id}>{t.nombre}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Docente">
            <select value={nueva.docente} onChange={(e) => setNueva({ ...nueva, docente: e.target.value })}>
              {DOCENTES.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </Campo>
        </div>
        <button className="btn btn--primario" type="submit">Agregar a la grilla</button>
        <p className="nota">
          Dar de baja un horario cancela las reservas futuras que tenía, le devuelve la
          clase al plan de cada alumna y le deja un aviso en su cuenta. Las clases que
          ya pasaron quedan intactas en el historial.
        </p>
      </form>
    </>
  )
}

// ---- Sala: camillas habilitadas ------------------------------------------
function Sala({ studio }) {
  return (
    <div className="panel">
      <h3 className="panel__tit">
        Camillas habilitadas · {STUDIO.camillas - studio.fueraDeServicio.length} de {STUDIO.camillas}
      </h3>
      <p className="tenue">
        Tocá una camilla para marcarla fuera de servicio. Deja de ofrecerse en todas las
        clases y baja la capacidad real de la sala.
      </p>
      <div className="toggles">
        {TODAS.map((n) => {
          const fuera = studio.fueraDeServicio.includes(n)
          return (
            <button key={n} className={'toggle' + (fuera ? ' es-off' : '')}
                    onClick={() => studio.alternarCamilla(n)}>
              {n}
            </button>
          )
        })}
      </div>
      {studio.fueraDeServicio.length > 0 && (
        <p className="nota nota--alerta">
          Si alguien ya tenía reservada una camilla deshabilitada, su lugar se mantiene y
          aparece marcado en rojo en la lista de asistencia para reubicarlo a mano.
        </p>
      )}
    </div>
  )
}

// ---- Alumnos --------------------------------------------------------------
function Alumnos({ studio }) {
  const [q, setQ] = useState('')
  const ranking = studio.rankingDocentes()

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    return studio.alumnos.filter((u) =>
      !t || u.nombre.toLowerCase().includes(t) || u.email.toLowerCase().includes(t) ||
      u.telefono.includes(t))
  }, [studio.alumnos, q])

  return (
    <>
      <div className="stats stats--2">
        <Stat valor={studio.alumnos.length} label="alumnos registrados" tono="rosa" />
        <Stat valor={ranking[0]?.nombre.split(' ')[0] ?? '—'} label="docente más pedido" />
      </div>

      <input className="buscador" placeholder="Buscar por nombre, email o teléfono"
             value={q} onChange={(e) => setQ(e.target.value)} />

      {lista.length === 0 ? (
        <Vacio icono="○" titulo="Sin resultados" />
      ) : (
        <ul className="alumnos">
          {lista.map((u) => (
            <li key={u.id} className="alumno">
              <Avatar nombre={u.nombre} tamano="sm" tono="gris" />
              <div className="alumno__datos">
                <p>{u.nombre}</p>
                <p className="tenue">{u.email} · {u.telefono}</p>
                {u.notas && <p className="alumno__nota">⚠ {u.notas}</p>}
              </div>
              <Chip>{PLANES[u.plan.id].nombre}</Chip>
              <Chip tono={u.plan.clasesRestantes === 0 ? 'alerta' : 'ok'}>
                {u.plan.clasesRestantes} restantes
              </Chip>
            </li>
          ))}
        </ul>
      )}

      <div className="panel">
        <h3 className="panel__tit">Reservas por docente</h3>
        <ul className="ranking">
          {ranking.map((d) => (
            <li key={d.id}>
              <Avatar nombre={d.nombre} tamano="sm" tono="gris" />
              <span className="ranking__nombre">{d.nombre}</span>
              <span className="ranking__barra">
                <i style={{ width: (d.alumnos / (ranking[0].alumnos || 1)) * 100 + '%' }} />
              </span>
              <strong>{d.alumnos}</strong>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}


// ---- Cierres: feriados y días sueltos ------------------------------------
function Cierres({ studio, dias, onAviso }) {
  return (
    <div className="panel">
      <h3 className="panel__tit">Días cerrados</h3>
      <p className="tenue">
        Para feriados o cierres sueltos. Cerrar un día cancela las reservas que tenía
        y le devuelve la clase al plan de cada alumna, con un aviso en su cuenta.
      </p>

      <ul className="cierres">
        {dias.map((d) => {
          const cerrado = studio.estaCerrado(d.iso)
          const sinGrilla = studio.horariosDe(d.diaSemana).length === 0
          const anotadas = cerrado || sinGrilla ? 0 : studio.metricas(d.iso).anotados
          return (
            <li key={d.iso} className={'cierre' + (cerrado ? ' es-cerrado' : '')}>
              <span className="cierre__dia">
                <strong>{d.nombreCorto} {d.numero}</strong>
                <small>
                  {sinGrilla ? 'sin grilla'
                    : cerrado ? 'cerrado'
                    : `${anotadas} anotada${anotadas === 1 ? '' : 's'}`}
                </small>
              </span>
              {sinGrilla ? <span className="tenue">—</span> : cerrado ? (
                <button className="btn btn--linea btn--chico"
                        onClick={() => {
                          studio.alternarCerrado(d.iso)
                          onAviso({ tipo: 'ok', texto: `${etiquetaDia(d)} vuelve a estar abierto.` })
                        }}>
                  Reabrir
                </button>
              ) : (
                <Confirmar
                  chico
                  etiqueta="Cerrar"
                  confirmacion="Sí, cerrar"
                  aviso={anotadas > 0
                    ? `Se cancelan ${anotadas} reserva${anotadas === 1 ? '' : 's'} y se devuelven al plan`
                    : 'No hay nadie anotado'}
                  onConfirmar={() => {
                    const r = studio.alternarCerrado(d.iso)
                    onAviso({
                      tipo: r.devueltas > 0 ? 'alerta' : 'ok',
                      texto: r.devueltas > 0
                        ? `${etiquetaDia(d)} cerrado. Se devolvieron ${r.devueltas} clases y se avisó a las alumnas.`
                        : `${etiquetaDia(d)} cerrado.`,
                    })
                  }}
                />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ---- Panel ---------------------------------------------------------------
export default function Admin({ studio, dias, onAbrirClase, onAviso }) {
  const [tab, setTab] = useState('hoy')

  return (
    <section>
      <div className="barra">
        <h2>Panel del studio</h2>
        <button className="btn btn--fantasma btn--chico" onClick={studio.reiniciar}>
          Reiniciar datos
        </button>
      </div>

      <Segmentado
        valor={tab}
        onCambio={setTab}
        opciones={[['hoy', 'Agenda'], ['clases', 'Grilla'], ['cierres', 'Cierres'],
                 ['sala', 'Sala'], ['alumnos', 'Alumnos']]}
      />

      {tab === 'hoy' && <Hoy studio={studio} dias={dias} onAbrirClase={onAbrirClase} onAviso={onAviso} />}
      {tab === 'clases' && <Clases studio={studio} onAviso={onAviso} />}
      {tab === 'cierres' && <Cierres studio={studio} dias={dias} onAviso={onAviso} />}
      {tab === 'sala' && <Sala studio={studio} />}
      {tab === 'alumnos' && <Alumnos studio={studio} />}
    </section>
  )
}
