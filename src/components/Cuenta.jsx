import { etiquetaLarga, cuandoEs } from '../lib/fechas'
import { avisoCancelar, resultadoCancelar } from '../lib/mensajes'
import Reservar from './Reservar'
import { Chip, Confirmar } from './ui'

/** Lo que el alumno ya tiene tomado, para ver su camilla o cancelar. */
function TusReservas({ studio, onAbrirClase, onAviso }) {
  const { proximas, espera } = studio.misClases
  const lista = [...proximas, ...espera]
  if (lista.length === 0) return null

  return (
    <>
      <div className="barra"><h3>Tus reservas</h3></div>
      <ul className="lista">
        {lista.map((r) => {
          const clase = studio.clase(r.fecha, r.hora)
          const enEspera = r.posicion != null
          return (
            <li key={r.fecha + r.hora} className={'fila' + (enEspera ? ' fila--espera' : '')}>
              <div className="fila__cuando">
                <strong>{r.hora}</strong>
                <span>{etiquetaLarga(r.fecha)}</span>
              </div>
              <div className="fila__que">
                <p>{r.tipo.nombre}</p>
                <p className="tenue">{r.docente.nombre} · {cuandoEs(r.fecha, r.hora)}</p>
              </div>
              <div className="fila__acciones">
                <Chip tono={enEspera ? 'alerta' : 'tinta'}>
                  {enEspera ? `En espera · #${r.posicion}` : `Camilla ${r.camilla}`}
                </Chip>
                {clase && (
                  <button className="btn btn--linea btn--chico" onClick={() => onAbrirClase(clase)}>
                    Ver sala
                  </button>
                )}
                <Confirmar
                  chico
                  etiqueta={enEspera ? 'Salir' : 'Cancelar'}
                  confirmacion={enEspera ? 'Sí, salir' : 'Sí, cancelar'}
                  aviso={enEspera || !clase ? 'Salís de la lista de espera.' : avisoCancelar(clase)}
                  onConfirmar={() => onAviso(resultadoCancelar(studio.cancelar(r.fecha, r.hora)))}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}

/** La sección de reservas cuando hay sesión de alumno. */
export default function Cuenta({ studio, dias, diaSel, setDiaSel, onAbrirClase, onAviso }) {
  const { usuario, misAvisos } = studio
  const quedan = usuario.plan.clasesRestantes

  return (
    <div className="cuenta">
      <div className="cuenta__cab">
        <p>Hola, <strong>{usuario.nombre.split(' ')[0]}</strong></p>
        <Chip tono={quedan === 0 ? 'alerta' : 'ok'}>
          {quedan} clase{quedan === 1 ? '' : 's'} disponible{quedan === 1 ? '' : 's'}
        </Chip>
        <button className="btn btn--fantasma btn--chico" onClick={studio.salir}>Cerrar sesión</button>
      </div>

      {misAvisos.length > 0 && (
        <ul className="bandeja">
          {misAvisos.map((a) => (
            <li key={a.id} className="bandeja__item">
              <span>{a.texto}</span>
              <button className="iconbtn" aria-label="Descartar aviso"
                      onClick={() => studio.descartarAviso(a.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}

      {quedan === 0 && (
        <p className="nota nota--alerta cuenta__sinclases">
          {usuario.solicitud
            ? 'Tu paquete está pendiente: se activa cuando el studio confirme el pago.'
            : <>Para reservar necesitás un paquete. <a href="#paquetes">Ver paquetes</a></>}
        </p>
      )}

      <Reservar studio={studio} dias={dias} diaSel={diaSel} setDiaSel={setDiaSel}
                onAbrirClase={onAbrirClase} />

      <TusReservas studio={studio} onAbrirClase={onAbrirClase} onAviso={onAviso} />
    </div>
  )
}
