import { useState } from 'react'
import { STUDIO } from '../lib/config'
import { etiquetaDia, proximosDias } from '../lib/fechas'

/**
 * La pestaña de Reservar.
 *
 * Sin sesión muestra la disponibilidad real de la semana —la misma que usa la
 * app, no una copia— y cada botón lleva al acceso. Con sesión, el lugar lo
 * ocupa la reserva del alumno: `cuenta` llega armada desde App.
 *
 * Ojo con el nombre: `Reservar.jsx` es el paso a paso de la reserva, que vive
 * adentro de `Cuenta`. Esto es la pestaña que lo contiene.
 */
export default function Turnos({ studio, cuenta, onEntrar }) {
  const alumno = cuenta ? studio.usuario : null
  const dias = proximosDias().slice(0, 7).filter((d) => studio.horariosDeFecha(d.iso).length > 0)
  const [diaSel, setDiaSel] = useState(dias[0]?.iso)
  const clases = diaSel ? studio.clasesDeDia(diaSel) : []

  return (
    <div className="turnos">
      <section className="pagina__cab">
        <p className="eyebrow">Reservar</p>
        <h1>{alumno ? 'Reservá tu clase' : 'Elegí tu clase de esta semana'}</h1>
        <p className="pagina__intro">
          {alumno
            ? `Elegí el día, la clase y tu camilla. Cancelás hasta ${STUDIO.horasCancelacion} h antes y la clase vuelve a tu plan.`
            : 'Esta es la disponibilidad de verdad del studio. Entrá con tu cuenta para quedarte con tu camilla.'}
        </p>
      </section>

      <section className={'horarios' + (alumno ? ' es-cuenta' : '')}>
        {cuenta ?? (
          <>
            <div className="horarios__dias">
              {dias.map((d) => (
                <button key={d.iso}
                        className={'horarios__dia' + (d.iso === diaSel ? ' es-activo' : '')}
                        onClick={() => setDiaSel(d.iso)}>
                  <span>{d.esHoy ? 'Hoy' : d.nombreCorto}</span>
                  <strong>{d.numero}</strong>
                </button>
              ))}
            </div>

            <p className="horarios__fecha">{etiquetaDia(dias.find((d) => d.iso === diaSel))}</p>

            <ul className="horarios__lista">
              {clases.map((c) => (
                <li key={c.hora} className={'turno' + (c.pasado ? ' es-pasado' : '')}>
                  <span className="turno__hora">{c.hora}</span>
                  <span className="turno__que">
                    <strong>{c.tipo.nombre}</strong>
                    <small>{c.docente.nombre} · {c.tipo.duracion} min</small>
                  </span>
                  <span className={'turno__cupo' + (c.libres === 0 ? ' es-lleno' : '')}>
                    {c.pasado ? 'terminada' : c.libres === 0 ? 'completa' : `${c.libres} libres`}
                  </span>
                  {c.pasado
                    ? <span className="turno__fin">—</span>
                    : <button className="btn btn--chico btn--linea" onClick={onEntrar}>
                        {c.libres === 0 ? 'Lista de espera' : 'Reservar'}
                      </button>}
                </li>
              ))}
            </ul>

            <div className="horarios__cta">
              <button className="btn btn--primario btn--pill" onClick={onEntrar}>
                Entrar para reservar
              </button>
              <p className="horarios__nota">
                ¿Todavía no tenés cuenta? La creás en el mismo paso, con tu email y un PIN.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
