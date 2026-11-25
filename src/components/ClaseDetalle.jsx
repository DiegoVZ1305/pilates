import { useState } from 'react'
import { cuandoEs, diaSemanaDe, etiquetaLarga } from '../lib/fechas'
import { avisoCancelar, resultadoCancelar } from '../lib/mensajes'
import PlanoSala from './PlanoSala'
import { Avatar, Chip, Confirmar, Modal } from './ui'

/** Pantalla grande de una clase: info + plano de la sala para elegir camilla. */
export default function ClaseDetalle({ clase, studio, onCerrar, onAviso }) {
  const { usuario } = studio
  const favorita = usuario?.preferencias?.camillaFavorita ?? null
  const diaSemana = diaSemanaDe(clase.fecha)
  const guardada = studio.estaGuardada(diaSemana, clase.hora)

  // Si se puede reservar y la camilla favorita está libre, ya viene elegida:
  // la reserva de siempre queda a un solo toque.
  const [seleccion, setSeleccion] = useState(() => {
    if (clase.pasado || clase.miCamilla || clase.enEspera || !favorita) return null
    return clase.plano.some((c) => c.numero === favorita && c.libre) ? favorita : null
  })

  const cerrar = () => { setSeleccion(null); onCerrar() }

  function confirmar() {
    const r = studio.reservar(clase.fecha, clase.hora, seleccion)
    cerrar()
    if (!r.ok) return onAviso({ tipo: 'error', texto: r.motivo })
    onAviso({
      tipo: 'ok',
      texto: r.enEspera
        ? `Quedaste en lista de espera (puesto ${r.posicion}) para las ${clase.hora}.`
        : `Listo. Camilla ${r.camilla} reservada · ${clase.tipo.nombre} ${etiquetaLarga(clase.fecha)} ${clase.hora}.`,
    })
  }

  function mover() {
    const r = studio.moverCamilla(clase.fecha, clase.hora, seleccion)
    cerrar()
    onAviso(r.ok
      ? { tipo: 'ok', texto: `Te movimos a la camilla ${r.camilla}.` }
      : { tipo: 'error', texto: r.motivo })
  }

  function cancelar() {
    const r = studio.cancelar(clase.fecha, clase.hora)
    cerrar()
    onAviso(resultadoCancelar(r))
  }

  const acciones = clase.pasado ? (
    <button className="btn btn--fantasma" onClick={cerrar}>Cerrar</button>
  ) : clase.miCamilla ? (
    <>
      <Confirmar
        etiqueta="Cancelar reserva"
        confirmacion="Sí, cancelar"
        aviso={avisoCancelar(clase)}
        onConfirmar={cancelar}
      />
      <button className="btn btn--primario" disabled={!seleccion || seleccion === clase.miCamilla}
              onClick={mover}>
        {seleccion && seleccion !== clase.miCamilla
          ? `Moverme a la ${seleccion}`
          : 'Elegí otra camilla'}
      </button>
    </>
  ) : clase.enEspera ? (
    <>
      <button className="btn btn--fantasma" onClick={cerrar}>Cerrar</button>
      <Confirmar
        etiqueta="Salir de la espera"
        confirmacion="Sí, salir"
        aviso={avisoCancelar(clase)}
        onConfirmar={cancelar}
      />
    </>
  ) : clase.libres === 0 ? (
    <>
      <button className="btn btn--fantasma" onClick={cerrar}>Volver</button>
      <button className="btn btn--secundario" onClick={confirmar}>Anotarme en lista de espera</button>
    </>
  ) : (
    <>
      <button className="btn btn--fantasma" onClick={cerrar}>Volver</button>
      <button className="btn btn--primario" disabled={!seleccion} onClick={confirmar}>
        {seleccion ? `Confirmar camilla ${seleccion}` : 'Elegí tu camilla'}
      </button>
    </>
  )

  return (
    <Modal
      tamano="xl"
      titulo={`${clase.hora} · ${clase.tipo.nombre}`}
      subtitulo={`${etiquetaLarga(clase.fecha)} · ${cuandoEs(clase.fecha, clase.hora)}`}
      onCerrar={cerrar}
      acciones={acciones}
    >
      {/* Cabecera compacta: todo en una fila para que el plano entre sin scroll. */}
      <div className="detalle" title={clase.tipo.desc}>
        <Avatar nombre={clase.docente.nombre} tamano="sm" />
        <div className="detalle__quien">
          <p className="detalle__nombre">{clase.docente.nombre}</p>
          <p className="detalle__esp">{clase.tipo.duracion} min · {clase.tipo.nivel}</p>
        </div>

        <div className="detalle__chips">
          <Chip tono={clase.libres === 0 ? 'tinta' : clase.libres <= 3 ? 'alerta' : 'ok'}>
            {clase.libres === 0 ? 'Completa' : `${clase.libres} libres de ${clase.total}`}
          </Chip>
          {clase.espera.length > 0 && <Chip tono="alerta">{clase.espera.length} en espera</Chip>}
          {studio.fueraDeServicio.length > 0 && (
            <Chip>{studio.fueraDeServicio.length} en mantenimiento</Chip>
          )}
        </div>

        <button
          className={'guardar' + (guardada ? ' es-activo' : '')}
          onClick={() => studio.alternarGuardada(diaSemana, clase.hora)}
          title="Guardar este horario como favorito"
        >
          {guardada ? '★ Guardada' : '☆ Guardar'}
        </button>
      </div>

      <p className="plano__ayuda">
        {clase.pasado ? 'Así quedó la sala en esta clase.'
          : clase.miCamilla ? `Tu lugar es la camilla ${clase.miCamilla}. Tocá una libre para moverte.`
          : clase.enEspera ? 'Estás en la lista de espera de esta clase.'
          : clase.libres === 0 ? 'No quedan camillas libres.'
          : 'Tocá la camilla donde querés ubicarte.'}
      </p>

      <PlanoSala
        clase={clase}
        seleccion={seleccion}
        onSeleccionar={setSeleccion}
        soloLectura={clase.pasado || clase.enEspera || clase.libres === 0}
        favorita={favorita}
        mostrarNombres={studio.esAdmin}
      />
    </Modal>
  )
}
