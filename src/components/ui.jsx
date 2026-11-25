import { useEffect, useId, useRef, useState } from 'react'
import { iniciales } from '../lib/config'

/**
 * Botón de dos pasos para lo que no se puede deshacer: el primer toque abre
 * la pregunta con la consecuencia escrita, el segundo la ejecuta.
 */
export function Confirmar({ etiqueta, confirmacion = 'Sí, dale', aviso, onConfirmar, chico = false }) {
  const [pedido, setPedido] = useState(false)
  const tam = chico ? ' btn--chico' : ''

  if (!pedido) {
    return (
      <button className={'btn btn--peligro' + tam} onClick={() => setPedido(true)}>
        {etiqueta}
      </button>
    )
  }

  return (
    <span className="confirmar" role="group">
      {aviso && <span className="confirmar__txt">{aviso}</span>}
      <button className={'btn btn--fantasma' + tam} onClick={() => setPedido(false)}>
        No
      </button>
      <button className={'btn btn--peligro' + tam}
              onClick={() => { setPedido(false); onConfirmar() }}>
        {confirmacion}
      </button>
    </span>
  )
}

/** Hoja modal: panel centrado en desktop, hoja desde abajo en celular. */
export function Modal({ titulo, subtitulo, children, onCerrar, acciones, tamano = 'md' }) {
  const hoja = useRef(null)
  const idTitulo = useId()
  // onCerrar cambia en cada render; con la ref el efecto corre una sola vez y
  // no le roba el foco a quien está usando la ventana.
  const cerrar = useRef(onCerrar)
  cerrar.current = onCerrar

  useEffect(() => {
    const antes = document.activeElement
    hoja.current.focus()
    const teclas = (e) => {
      if (e.key === 'Escape') return cerrar.current()
      if (e.key !== 'Tab') return
      // El Tab da la vuelta dentro de la ventana.
      const f = [...hoja.current.querySelectorAll(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled)')]
      const i = f.indexOf(document.activeElement)
      if (f.length === 0 || (i !== -1 && i !== (e.shiftKey ? 0 : f.length - 1))) return
      e.preventDefault()
      f[e.shiftKey ? f.length - 1 : 0].focus()
    }
    window.addEventListener('keydown', teclas)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', teclas)
      document.body.style.overflow = ''
      if (antes?.isConnected) antes.focus()
    }
  }, [])

  return (
    <div className="overlay" onClick={onCerrar}>
      <div ref={hoja} tabIndex={-1} className={'hoja hoja--' + tamano} role="dialog" aria-modal="true"
           aria-labelledby={idTitulo} onClick={(e) => e.stopPropagation()}>
        <header className="hoja__head">
          <div className="hoja__tit">
            <h3 id={idTitulo}>{titulo}</h3>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button className="iconbtn" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </header>
        <div className="hoja__body">{children}</div>
        {acciones && <footer className="hoja__pie">{acciones}</footer>}
      </div>
    </div>
  )
}

export function Avatar({ nombre, tamano = 'md', tono = 'acento' }) {
  return (
    <span className={`avatar avatar--${tamano} avatar--${tono}`} aria-hidden="true">
      {iniciales(nombre)}
    </span>
  )
}

export const Chip = ({ children, tono = 'neutro', className = '' }) => (
  <span className={`chip chip--${tono} ${className}`}>{children}</span>
)

export const Stat = ({ valor, label, tono }) => (
  <div className={'stat' + (tono ? ' stat--' + tono : '')}>
    <span className="stat__valor">{valor}</span>
    <span className="stat__label">{label}</span>
  </div>
)

export function Campo({ etiqueta, ayuda, error, children }) {
  return (
    <label className={'campo' + (error ? ' campo--error' : '')}>
      <span className="campo__lbl">{etiqueta}</span>
      {children}
      {error ? <span className="campo__error">{error}</span>
        : ayuda ? <span className="campo__ayuda">{ayuda}</span> : null}
    </label>
  )
}

export const Barra = ({ valor, max, tono = 'acento' }) => (
  <div className="barraprog" role="progressbar" aria-valuenow={valor} aria-valuemax={max}>
    <span className={'barraprog__fill barraprog__fill--' + tono}
          style={{ width: Math.min(100, (valor / (max || 1)) * 100) + '%' }} />
  </div>
)

export const Vacio = ({ icono = '○', titulo, texto, accion }) => (
  <div className="vacio">
    <span className="vacio__icono">{icono}</span>
    <p className="vacio__tit">{titulo}</p>
    {texto && <p className="vacio__txt">{texto}</p>}
    {accion}
  </div>
)

/** La región queda siempre montada para que el lector de pantalla anuncie lo nuevo. */
export function Aviso({ aviso }) {
  return (
    <div role="status">
      {aviso && <div className={'aviso aviso--' + aviso.tipo}>{aviso.texto}</div>}
    </div>
  )
}

export function Segmentado({ opciones, valor, onCambio, className = '' }) {
  return (
    <div className={'segmentado ' + className} role="tablist">
      {opciones.map(([id, txt]) => (
        <button
          key={id}
          role="tab"
          aria-selected={valor === id}
          className={'segmentado__op' + (valor === id ? ' es-activo' : '')}
          onClick={() => onCambio(id)}
        >
          {txt}
        </button>
      ))}
    </div>
  )
}
