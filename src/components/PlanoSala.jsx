import { DISPOSICION, INSTRUCTOR, iniciales } from '../lib/config'

/** Reformer visto desde arriba. */
function Reformer() {
  return (
    <svg viewBox="0 0 44 80" className="rf" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <rect className="rf-marco" x="9" y="2" width="26" height="76" rx="3" />
      <path className="rf-correas" d="M12 4 H32 M15 4 V13 L19 28 M29 4 V13 L25 28" />
      <rect className="rf-carro" x="6.5" y="28" width="31" height="26" rx="4" />
      <rect className="rf-hombro" x="11" y="30.5" width="7" height="5" rx="1.5" />
      <rect className="rf-hombro" x="26" y="30.5" width="7" height="5" rx="1.5" />
      <rect className="rf-barra" x="7" y="61" width="30" height="5" rx="2" />
      <rect className="rf-barra" x="5" y="71" width="34" height="4" rx="1.5" />
    </svg>
  )
}

function Camilla({ c, elegida, favorita, onSeleccionar, soloLectura, mostrarNombres }) {
  const clickeable = !soloLectura && c.libre
  const estado =
    c.mia ? 'mia' :
    elegida ? 'elegida' :
    c.fuera ? 'fuera' :
    c.reserva ? 'ocupada' : 'libre'

  const quien = c.usuario?.nombre
  const titulo =
    c.fuera ? `Camilla ${c.numero} — fuera de servicio`
      : c.mia ? `Camilla ${c.numero} — tu lugar`
      : quien ? `Camilla ${c.numero} — ${quien}`
      : `Camilla ${c.numero} — libre`

  return (
    <button
      type="button"
      className={'camilla camilla--' + estado}
      disabled={!clickeable}
      onClick={() => clickeable && onSeleccionar(c.numero)}
      title={titulo}
      aria-label={titulo + (elegida ? ' — elegida' : '')}
      aria-pressed={clickeable ? elegida : undefined}
    >
      <Reformer />
      <span className="camilla__num">{c.numero}</span>
      {favorita && !c.reserva && (
        <span className="camilla__fav" aria-hidden="true" title="Tu camilla favorita">★</span>
      )}
      <span className="camilla__estado">
        {c.mia ? 'Vos'
          : elegida ? '✓'
          : c.fuera ? '✕'
          : c.reserva ? (mostrarNombres ? quien?.split(' ')[0] : iniciales(quien))
          : 'Libre'}
      </span>
    </button>
  )
}

/**
 * Plano de la sala: las camillas ubicadas como están físicamente,
 * más el reformer del instructor cruzado al medio.
 */
export default function PlanoSala({
  clase, seleccion, onSeleccionar, soloLectura, mostrarNombres, favorita,
}) {
  const porNumero = new Map(clase.plano.map((c) => [c.numero, c]))
  const fila = (numeros) => numeros.map((n) => porNumero.get(n)).filter(Boolean)

  const render = (numeros) => fila(numeros).map((c) => (
    <Camilla
      key={c.numero}
      c={c}
      elegida={seleccion === c.numero}
      favorita={favorita === c.numero}
      onSeleccionar={onSeleccionar}
      soloLectura={soloLectura}
      mostrarNombres={mostrarNombres}
    />
  ))

  return (
    <div className="sala">
      <div className="sala__plano">
        <span className="puerta"><i>puerta</i></span>
        <span className="ventana ventana--1" aria-hidden="true" />
        <span className="ventana ventana--2" aria-hidden="true" />

        <div className="sala__fila">{render(DISPOSICION.arriba)}</div>

        <div className="sala__centro">
          <div className="instructor" title="Reformer del instructor">
            <span className="instructor__rf"><Reformer /></span>
            <span className="instructor__txt">{INSTRUCTOR.etiqueta}</span>
          </div>
        </div>

        <div className="sala__fila sala__fila--invertida">{render(DISPOSICION.abajo)}</div>
      </div>

      <div className="leyenda">
        <span><i className="punto punto--libre" /> Libre</span>
        <span><i className="punto punto--ocupada" /> Ocupada</span>
        <span><i className="punto punto--elegida" /> Tu elección</span>
        <span><i className="punto punto--mia" /> Tu lugar</span>
        <span><i className="punto punto--fuera" /> Fuera de servicio</span>
      </div>
    </div>
  )
}
