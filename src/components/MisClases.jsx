import { useState } from 'react'
import { DIAS_LARGOS, STUDIO, tipoDe, docenteDe } from '../lib/config'
import { cuandoEs, etiquetaLarga } from '../lib/fechas'
import { avisoCancelar, resultadoCancelar } from '../lib/mensajes'
import { Avatar, Chip, Confirmar, Segmentado, Stat, Vacio } from './ui'

/** Traduce lo que devolvió `reservarSerie` a un aviso en una línea. */
function resumenSerie({ hechas, saltadas }) {
  if (hechas.length === 0) {
    const motivo = saltadas[0]?.motivo
    return {
      tipo: 'error',
      texto: motivo ? `No se pudo reservar ninguna: ${motivo}.` : 'No hay fechas para reservar.',
    }
  }
  const base = `Reservaste ${hechas.length} clase${hechas.length === 1 ? '' : 's'}`
  const quedaron = saltadas.filter((s) => s.motivo !== 'ya tenías lugar')
  return {
    tipo: quedaron.length ? 'alerta' : 'ok',
    texto: quedaron.length
      ? `${base}. Quedaron ${quedaron.length} afuera: ${quedaron[0].motivo}.`
      : `${base}, con tu camilla de siempre cuando estaba libre.`,
  }
}

function FilaClase({ fecha, hora, children, tipo, docente, tono }) {
  return (
    <li className={'fila' + (tono ? ' fila--' + tono : '')}>
      <div className="fila__cuando">
        <strong>{hora}</strong>
        <span>{etiquetaLarga(fecha)}</span>
      </div>
      <div className="fila__que">
        <p>{tipo.nombre}</p>
        <p className="tenue">{docente.nombre}</p>
      </div>
      <div className="fila__acciones">{children}</div>
    </li>
  )
}

/** Lo que pasó con las reservas mientras no estabas mirando. */
function Avisos({ studio }) {
  if (studio.misAvisos.length === 0) return null
  return (
    <ul className="bandeja">
      {studio.misAvisos.map((a) => (
        <li key={a.id} className="bandeja__item">
          <span>{a.texto}</span>
          <button className="iconbtn" aria-label="Descartar aviso"
                  onClick={() => studio.descartarAviso(a.id)}>
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function MisClases({ studio, dias, onAbrirClase, onIrAReservar, onAviso }) {
  const [tab, setTab] = useState('proximas')
  const { proximas, espera, historial } = studio.misClases
  const stats = studio.estadisticas

  /** Próxima fecha que cae en ese día de la semana con esa hora. */
  const proximaFecha = (diaSemana, hora) =>
    dias.find((d) => d.diaSemana === Number(diaSemana) &&
      studio.horariosDeFecha(d.iso).some((c) => c.hora === hora) &&
      !studio.clase(d.iso, hora)?.pasado)

  return (
    <section>
      <Avisos studio={studio} />

      <div className="barra">
        <h2>Mis clases</h2>
        <Chip tono="tinta">{proximas.length} próxima{proximas.length === 1 ? '' : 's'}</Chip>
      </div>

      <Segmentado
        valor={tab}
        onCambio={setTab}
        opciones={[
          ['proximas', `Próximas (${proximas.length + espera.length})`],
          ['guardadas', `Guardadas (${studio.guardadas.length})`],
          ['historial', `Historial (${historial.length})`],
        ]}
      />

      {tab === 'proximas' && (
        proximas.length + espera.length === 0 ? (
          <Vacio
            icono="◠"
            titulo="No tenés clases reservadas"
            texto="Elegí un horario y tu camilla para empezar."
            accion={<button className="btn btn--primario" onClick={onIrAReservar}>Ver horarios</button>}
          />
        ) : (
          <ul className="lista">
            {proximas.map((r) => {
              const clase = studio.clase(r.fecha, r.hora)
              return (
                <FilaClase key={r.fecha + r.hora} {...r}>
                  <Chip tono="tinta">Camilla {r.camilla}</Chip>
                  <span className="tenue">{cuandoEs(r.fecha, r.hora)}</span>
                  <button className="btn btn--linea btn--chico" onClick={() => onAbrirClase(clase)}>
                    Ver sala
                  </button>
                  <Confirmar
                    chico
                    etiqueta="Cancelar"
                    confirmacion="Sí, cancelar"
                    aviso={clase ? avisoCancelar(clase) : ''}
                    onConfirmar={() => onAviso(resultadoCancelar(studio.cancelar(r.fecha, r.hora)))}
                  />
                </FilaClase>
              )
            })}
            {espera.map((r) => (
              <FilaClase key={r.fecha + r.hora} {...r} tono="espera">
                <Chip tono="alerta">En espera · #{r.posicion}</Chip>
                <span className="tenue">{cuandoEs(r.fecha, r.hora)}</span>
                <button className="btn btn--linea btn--chico"
                        onClick={() => onAbrirClase(studio.clase(r.fecha, r.hora))}>
                  Ver clase
                </button>
                <Confirmar
                  chico
                  etiqueta="Salir"
                  confirmacion="Sí, salir"
                  aviso="Salís de la lista de espera."
                  onConfirmar={() => onAviso(resultadoCancelar(studio.cancelar(r.fecha, r.hora)))}
                />
              </FilaClase>
            ))}
          </ul>
        )
      )}

      {tab === 'guardadas' && (
        studio.guardadas.length === 0 ? (
          <Vacio
            icono="☆"
            titulo="Todavía no guardaste horarios"
            texto="Guardá los horarios a los que vas siempre y reservalos de un toque desde acá."
            accion={<button className="btn btn--primario" onClick={onIrAReservar}>Ver horarios</button>}
          />
        ) : (
          <>
            <ul className="lista">
              {studio.guardadas.map((llave) => {
                const [ds, hora] = llave.split('|')
                const def = studio.horariosDe(Number(ds)).find((c) => c.hora === hora)
                const dia = proximaFecha(ds, hora)
                const clase = dia ? studio.clase(dia.iso, hora) : null
                return (
                  <li key={llave} className="fila fila--guardada">
                    <div className="fila__cuando">
                      <strong>{hora}</strong>
                      <span>{DIAS_LARGOS[Number(ds)]}</span>
                    </div>
                    <div className="fila__que">
                      <p>{def ? tipoDe(def.tipo).nombre : 'Horario dado de baja'}</p>
                      <p className="tenue">
                        {def ? docenteDe(def.docente).nombre : 'El studio quitó esta clase de la grilla'}
                      </p>
                    </div>
                    <div className="fila__acciones">
                      {clase && (
                        <Chip tono={clase.libres === 0 ? 'neutro' : 'ok'}>
                          {clase.libres === 0 ? 'Completa' : `${clase.libres} libres`}
                        </Chip>
                      )}
                      {clase && (
                        <button className="btn btn--primario btn--chico" onClick={() => onAbrirClase(clase)}>
                          {clase.miCamilla ? `Camilla ${clase.miCamilla}` : 'Reservar'}
                        </button>
                      )}
                      {def && (
                        <button
                          className="btn btn--linea btn--chico"
                          title="Reservar este mismo horario todas las semanas que se puedan"
                          onClick={() => onAviso(resumenSerie(studio.reservarSerie(Number(ds), hora)))}
                        >
                          Repetir semanal
                        </button>
                      )}
                      <button className="iconbtn" title="Quitar de guardadas"
                              onClick={() => studio.alternarGuardada(Number(ds), hora)}>★</button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="nota">
              Las clases guardadas son horarios fijos de la semana. Sirven para reservar rápido
              el mismo turno de siempre, sin buscarlo en la grilla.
            </p>
          </>
        )
      )}

      {tab === 'historial' && (
        historial.length === 0 ? (
          <Vacio icono="◷" titulo="Todavía no hay clases pasadas" />
        ) : (
          <>
            <div className="stats">
              <Stat valor={stats.asistidas} label="clases hechas" tono="rosa" />
              <Stat valor={stats.racha} label="seguidas sin faltar" />
              <Stat valor={stats.ausencias} label="ausencias" />
              <Stat valor={stats.favorita} label="tu clase favorita" />
            </div>
            <ul className="lista">
              {historial.map((r) => (
                <FilaClase key={r.fecha + r.hora} {...r} tono="pasada">
                  <Chip tono={r.asistencia === 'asistio' ? 'ok' : r.asistencia === 'ausente' ? 'alerta' : 'neutro'}>
                    {r.asistencia === 'asistio' ? 'Asististe'
                      : r.asistencia === 'ausente' ? 'Faltaste' : 'Sin registrar'}
                  </Chip>
                  <span className="tenue">Camilla {r.camilla}</span>
                </FilaClase>
              ))}
            </ul>
            <p className="nota">
              La asistencia la marca el studio desde su panel. Cancelando con más de{' '}
              {STUDIO.horasCancelacion} h la clase vuelve a tu plan.
            </p>
          </>
        )
      )}
    </section>
  )
}
