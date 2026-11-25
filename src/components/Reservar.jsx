import { useMemo, useState } from 'react'
import { DOCENTES, TIPOS } from '../lib/config'
import { etiquetaDia, etiquetaSemana, rangoSemana, semanasDe } from '../lib/fechas'
import { Avatar, Chip, Vacio } from './ui'

/** Mini plano: una marca por camilla con su estado. */
function Cupos({ plano }) {
  return (
    <div className="cupos" aria-hidden="true">
      {plano.map((c) => (
        <span
          key={c.numero}
          className={'cupo' + (c.mia ? ' cupo--mio' : c.reserva ? ' cupo--lleno'
            : c.fuera ? ' cupo--fuera' : '')}
        />
      ))}
    </div>
  )
}

/** El día se parte en mañana y tarde para que la lista se lea de un saque. */
const FRANJAS = [
  ['Mañana', (hora) => Number(hora.slice(0, 2)) < 13],
  ['Tarde', (hora) => Number(hora.slice(0, 2)) >= 13],
]

/** Una clase de la grilla, como fila de la lista del día. */
function FilaClase({ clase: c, onAbrir, esFavorita }) {
  // El estado "pasada" manda: una clase terminada se ve apagada aunque
  // hayas estado anotado.
  const estado = c.pasado ? 'pasada'
    : c.miCamilla ? 'mia' : c.enEspera ? 'espera'
    : c.libres === 0 ? 'llena'
    : c.libres <= 3 ? 'pocos' : 'libre'

  return (
    <li className={'clase clase--' + estado}>
      <div className="clase__hora">
        <strong>{c.hora}</strong>
        <span>{c.tipo.duracion}′</span>
      </div>

      <div className="clase__que">
        <p className="clase__tipo">{c.tipo.nombre}</p>
        <p className="clase__nivel">{c.tipo.nivel}</p>
      </div>

      <div className="clase__profe">
        <Avatar nombre={c.docente.nombre} tamano="md" tono="gris" />
        <span className="clase__quien">
          <strong>
            {c.docente.nombre}
            {esFavorita && <span className="estrella" title="Tu profe favorita"> ★</span>}
          </strong>
          <small>{c.docente.especialidad}</small>
        </span>
      </div>

      <div className="clase__lugar">
        <Chip tono={
          c.pasado ? 'neutro'
            : c.miCamilla ? 'tinta' : c.enEspera ? 'alerta'
            : c.libres === 0 ? 'neutro'
            : c.libres <= 3 ? 'alerta' : 'ok'
        }>
          {c.pasado ? (c.miCamilla ? `Fuiste · camilla ${c.miCamilla}` : 'Terminada')
            : c.miCamilla ? `Tu camilla ${c.miCamilla}`
            : c.enEspera ? `Espera #${c.posicionEspera}`
            : c.libres === 0 ? 'Completa'
            : `${c.libres} libres`}
        </Chip>
        <Cupos plano={c.plano} />
        <p className="clase__conteo">{c.ocupados} de {c.total} camillas</p>
      </div>

      <div className="clase__accion">
        <button
          className={'btn ' + (
            c.pasado ? 'btn--fantasma'
              : c.miCamilla || c.enEspera ? 'btn--linea'
              : c.libres === 0 ? 'btn--secundario' : 'btn--primario')}
          onClick={onAbrir}
        >
          {c.pasado ? 'Ver la sala'
            : c.miCamilla ? 'Cambiar camilla'
            : c.enEspera ? 'Ver la clase'
            : c.libres === 0 ? 'Anotarme en espera'
            : 'Elegir camilla'}
        </button>
      </div>
    </li>
  )
}

export default function Reservar({ studio, dias, diaSel, setDiaSel, onAbrirClase }) {
  const [filtroDocente, setFiltroDocente] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [soloLibres, setSoloLibres] = useState(false)

  const semanas = useMemo(() => semanasDe(dias), [dias])
  // La semana visible es siempre la del día elegido: así no hay dos estados
  // que se puedan desincronizar.
  const iSemana = Math.max(0, semanas.findIndex((s) => s.some((d) => d.iso === diaSel)))
  const semana = semanas[iSemana] ?? []

  const abierto = (d) => d.reservable && studio.horariosDeFecha(d.iso).length > 0

  /** Mueve la vista a otra semana parando en su primer día con clases. */
  const irASemana = (i) => {
    const s = semanas[i]
    if (!s) return
    const dest = s.find(abierto) ?? s.find((d) => d.reservable)
    if (dest) setDiaSel(dest.iso)
  }

  // Ocupación de cada día de la semana, para que se vea dónde queda lugar.
  const resumen = useMemo(() => {
    const out = {}
    for (const d of semana) {
      if (!d.reservable) continue
      out[d.iso] = studio.horariosDeFecha(d.iso).length === 0
        ? { cerrado: true, feriado: studio.estaCerrado(d.iso) }
        : studio.metricas(d.iso)
    }
    return out
  }, [semana, studio.horariosDeFecha, studio.estaCerrado, studio.metricas])

  // Días en los que el alumno ya tiene clase, para marcarlos en la semana.
  const misDias = useMemo(
    () => new Set(studio.misClases.proximas.map((r) => r.fecha)),
    [studio.misClases.proximas],
  )

  const dia = dias.find((d) => d.iso === diaSel)
  const todas = studio.clasesDeDia(diaSel)
  const metricas = resumen[diaSel]

  // La profe favorita se marca con estrella y aparece primera entre los
  // filtros. No se filtra sola: el orden por hora es lo que importa al elegir.
  const profeFavorita = studio.usuario?.preferencias?.docenteFavorito ?? null
  const docentesOrdenados = useMemo(() => (profeFavorita
    ? [...DOCENTES].sort((a, b) => (b.id === profeFavorita) - (a.id === profeFavorita))
    : DOCENTES), [profeFavorita])

  const clases = useMemo(() => todas.filter((c) =>
    (!filtroDocente || c.docente.id === filtroDocente) &&
    (!filtroTipo || c.tipoId === filtroTipo) &&
    (!soloLibres || c.libres > 0)
  ), [todas, filtroDocente, filtroTipo, soloLibres])

  const hayFiltros = filtroDocente || filtroTipo || soloLibres
  const limpiar = () => { setFiltroDocente(''); setFiltroTipo(''); setSoloLibres(false) }

  // Profes y tipos que realmente dan clase este día: filtrar por algo que no
  // está en la grilla del día solo deja la lista vacía.
  const profesDelDia = new Set(todas.map((c) => c.docente.id))
  const tiposDelDia = new Set(todas.map((c) => c.tipoId))

  // Si el studio no abre, ofrecemos el próximo día que sí tiene clases.
  const proximoAbierto = dias.find((d) => d.iso > diaSel && studio.horariosDeFecha(d.iso).length > 0)

  const franjas = FRANJAS
    .map(([titulo, entra]) => [titulo, clases.filter((c) => entra(c.hora))])
    .filter(([, lista]) => lista.length > 0)

  return (
    <>
      <section className="semana">
        <header className="semana__cab">
          <button
            className="semana__flecha"
            onClick={() => irASemana(iSemana - 1)}
            disabled={iSemana === 0}
            aria-label="Semana anterior"
          >
            ‹
          </button>
          <div className="semana__rotulo">
            <strong>{etiquetaSemana(semana)}</strong>
            <span>{rangoSemana(semana)}</span>
          </div>
          <button
            className="semana__flecha"
            onClick={() => irASemana(iSemana + 1)}
            disabled={iSemana >= semanas.length - 1}
            aria-label="Semana siguiente"
          >
            ›
          </button>
        </header>

        <div className="semana__dias">
          {semana.map((d) => {
            const r = resumen[d.iso]
            const cerrado = !d.reservable || r?.cerrado
            return (
              <button
                key={d.iso}
                disabled={cerrado}
                aria-current={d.iso === diaSel ? 'date' : undefined}
                className={'dia'
                  + (d.iso === diaSel ? ' es-activo' : '')
                  + (d.esHoy ? ' es-hoy' : '')
                  + (cerrado ? ' es-cerrado' : '')}
                onClick={() => setDiaSel(d.iso)}
              >
                <span className="dia__nombre">{d.nombreCorto}</span>
                <span className="dia__num">{d.numero}</span>
                {!d.reservable ? <span className="dia__meta">—</span>
                  : r?.cerrado ? <span className="dia__meta">{r.feriado ? 'feriado' : 'cerrado'}</span>
                  : <>
                      <span className="dia__meta">
                        {r.capacidad - r.anotados} libres
                      </span>
                      <span className="dia__barra">
                        <i style={{ width: r.ocupacion + '%' }} />
                      </span>
                    </>}
                {misDias.has(d.iso) && <span className="dia__mio" aria-label="Tenés clase" />}
              </button>
            )
          })}
        </div>
      </section>

      <div className="filtro">
        <span className="filtro__lbl">Clase</span>
        <div className="filtro__ops">
          <button className={'pill' + (!filtroTipo ? ' es-activo' : '')}
                  onClick={() => setFiltroTipo('')}>
            Todas
          </button>
          {Object.entries(TIPOS).map(([id, t]) => (
            <button
              key={id}
              disabled={!tiposDelDia.has(id) && filtroTipo !== id}
              className={'pill' + (filtroTipo === id ? ' es-activo' : '')}
              onClick={() => setFiltroTipo(filtroTipo === id ? '' : id)}
            >
              {t.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="filtro">
        <span className="filtro__lbl">Profe</span>
        <div className="filtro__ops">
          <button className={'pill' + (!filtroDocente ? ' es-activo' : '')}
                  onClick={() => setFiltroDocente('')}>
            Todas
          </button>
          {docentesOrdenados.map((d) => (
            <button
              key={d.id}
              disabled={!profesDelDia.has(d.id) && filtroDocente !== d.id}
              className={'pill pill--profe' + (filtroDocente === d.id ? ' es-activo' : '')}
              onClick={() => setFiltroDocente(filtroDocente === d.id ? '' : d.id)}
            >
              <Avatar nombre={d.nombre} tamano="sm" tono="gris" />
              {d.nombre.split(' ')[0]}
              {d.id === profeFavorita && <span className="estrella"> ★</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="barra">
        <h2>{etiquetaDia(dia)}</h2>
        <div className="barra__meta">
          {metricas && !metricas.cerrado && (
            <span className="tenue">
              {clases.length} de {todas.length} clase{todas.length === 1 ? '' : 's'}
              {' · '}{metricas.capacidad - metricas.anotados} lugares libres
            </span>
          )}
          <label className="check">
            <input type="checkbox" checked={soloLibres}
                   onChange={(e) => setSoloLibres(e.target.checked)} />
            Solo con lugar
          </label>
          {hayFiltros && (
            <button className="btn btn--fantasma btn--chico" onClick={limpiar}>Limpiar</button>
          )}
        </div>
      </div>

      {clases.length === 0 ? (
        <Vacio
          icono="◠"
          titulo={todas.length === 0
            ? (studio.estaCerrado(diaSel) ? 'El studio cierra este día' : 'El studio no abre este día')
            : 'Ninguna clase coincide'}
          texto={todas.length === 0
            ? 'Elegí otro día de la semana para ver la grilla.'
            : 'Probá sin filtros: este día hay clases, pero no con lo que elegiste.'}
          accion={todas.length === 0
            ? proximoAbierto && (
                <button className="btn btn--primario" onClick={() => setDiaSel(proximoAbierto.iso)}>
                  Ver el {proximoAbierto.nombreLargo.toLowerCase()} {proximoAbierto.numero}
                </button>
              )
            : <button className="btn btn--primario" onClick={limpiar}>Quitar los filtros</button>}
        />
      ) : (
        franjas.map(([titulo, lista]) => (
          <section className="franja" key={titulo}>
            <p className="franja__tit">{titulo} <span>{lista.length}</span></p>
            <ul className="clases">
              {lista.map((c) => (
                <FilaClase
                  key={c.hora}
                  clase={c}
                  esFavorita={c.docente.id === profeFavorita}
                  onAbrir={() => onAbrirClase(c)}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  )
}
