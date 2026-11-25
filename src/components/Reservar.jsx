import { useEffect, useMemo, useRef, useState } from 'react'
import { DOCENTES, TIPOS } from '../lib/config'
import { etiquetaDia, etiquetaSemana, rangoSemana, semanasDe } from '../lib/fechas'
import { Avatar, Chip } from './ui'

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

/** Un paso de la reserva: recién aparece cuando el anterior está resuelto. */
function Paso({ numero, titulo, children }) {
  const ref = useRef(null)
  // El paso nuevo se acerca solo si quedó fuera de la pantalla.
  useEffect(() => {
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ref.current.scrollIntoView({ block: 'nearest', behavior: suave ? 'smooth' : 'auto' })
  }, [])
  return (
    <section className="paso" ref={ref}>
      <h3 className="paso__tit"><span>{numero}</span>{titulo}</h3>
      {children}
    </section>
  )
}

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
  // La reserva va en orden: día → clase → profe → horario y camilla.
  const [diaElegido, setDiaElegido] = useState(false)
  const [tipo, setTipo] = useState(null)
  const [profe, setProfe] = useState(null)     // '' = cualquiera

  const elegirDia = (iso) => { setDiaSel(iso); setDiaElegido(true); setTipo(null); setProfe(null) }

  const semanas = useMemo(() => semanasDe(dias), [dias])
  // La semana visible es siempre la del día elegido: así no hay dos estados
  // que se puedan desincronizar.
  const iSemana = Math.max(0, semanas.findIndex((s) => s.some((d) => d.iso === diaSel)))
  const semana = semanas[iSemana] ?? []

  const abierto = (d) => d.reservable && studio.horariosDeFecha(d.iso).length > 0

  /** Mueve la vista a otra semana; el día lo vuelve a elegir el alumno. */
  const irASemana = (i) => {
    const s = semanas[i]
    if (!s) return
    const dest = s.find(abierto) ?? s.find((d) => d.reservable)
    if (!dest) return
    setDiaSel(dest.iso)
    setDiaElegido(false)
    setTipo(null)
    setProfe(null)
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

  // La profe favorita se marca con estrella y aparece primera.
  const profeFavorita = studio.usuario?.preferencias?.docenteFavorito ?? null
  const docentesOrdenados = useMemo(() => (profeFavorita
    ? [...DOCENTES].sort((a, b) => (b.id === profeFavorita) - (a.id === profeFavorita))
    : DOCENTES), [profeFavorita])

  // Cada paso ofrece sólo lo que de verdad queda, según lo ya elegido.
  const porDar = studio.clasesDeDia(diaSel).filter((c) => !c.pasado)
  const delTipo = porDar.filter((c) => c.tipoId === tipo)
  const horarios = delTipo.filter((c) => !profe || c.docente.id === profe)

  return (
    <>
      <h3 className="paso__tit"><span>1</span>Elegí el día</h3>
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
                aria-pressed={diaElegido && d.iso === diaSel}
                className={'dia'
                  + (diaElegido && d.iso === diaSel ? ' es-activo' : '')
                  + (d.esHoy ? ' es-hoy' : '')
                  + (cerrado ? ' es-cerrado' : '')}
                onClick={() => elegirDia(d.iso)}
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

      {diaElegido && porDar.length === 0 && (
        <p className="nota nota--alerta">
          {etiquetaDia(dia)} ya no quedan clases. Elegí otro día.
        </p>
      )}

      {diaElegido && porDar.length > 0 && (
        <Paso key={'tipo' + diaSel} numero="2" titulo={`Tipo de clase · ${etiquetaDia(dia)}`}>
          <div className="paso__ops">
            {Object.entries(TIPOS)
              .filter(([id]) => porDar.some((c) => c.tipoId === id))
              .map(([id, t]) => (
                <button key={id} className={'pill' + (tipo === id ? ' es-activo' : '')}
                        aria-pressed={tipo === id}
                        onClick={() => { setTipo(id); setProfe(null) }}>
                  {t.nombre}
                </button>
              ))}
          </div>
        </Paso>
      )}

      {diaElegido && delTipo.length > 0 && (
        <Paso key={'profe' + diaSel + tipo} numero="3" titulo="Profe">
          <div className="paso__ops">
            <button className={'pill' + (profe === '' ? ' es-activo' : '')}
                    aria-pressed={profe === ''} onClick={() => setProfe('')}>
              Cualquiera
            </button>
            {docentesOrdenados
              .filter((d) => delTipo.some((c) => c.docente.id === d.id))
              .map((d) => (
                <button key={d.id}
                        className={'pill pill--profe' + (profe === d.id ? ' es-activo' : '')}
                        aria-pressed={profe === d.id} onClick={() => setProfe(d.id)}>
                  <Avatar nombre={d.nombre} tamano="sm" tono="gris" />
                  {d.nombre.split(' ')[0]}
                  {d.id === profeFavorita && <span className="estrella"> ★</span>}
                </button>
              ))}
          </div>
        </Paso>
      )}

      {diaElegido && delTipo.length > 0 && profe !== null && (
        <Paso key={'hora' + diaSel + tipo} numero="4" titulo="Elegí la hora y tu camilla">
          <ul className="clases">
            {horarios.map((c) => (
              <FilaClase
                key={c.hora}
                clase={c}
                esFavorita={c.docente.id === profeFavorita}
                onAbrir={() => onAbrirClase(c)}
              />
            ))}
          </ul>
        </Paso>
      )}
    </>
  )
}
