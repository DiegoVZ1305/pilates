import { useState } from 'react'
import { SITIO, STUDIO } from '../lib/config'
import { Campo } from './ui'

const MOTIVOS = [
  'Quiero probar una clase',
  'Consulta por paquetes y precios',
  'Clases pre o post parto',
  'Clases para un grupo o empresa',
  'Otra cosa',
]

const tel = SITIO.telefono.replace(/\s/g, '')

/**
 * Pestaña de contacto. El studio no tiene servidor que reciba formularios, así
 * que el mensaje se arma acá y se abre en WhatsApp con todo escrito: el alumno
 * sólo lo envía. Debajo quedan los datos del studio y las preguntas de siempre.
 */
export default function Contacto({ onReservar }) {
  const [datos, setDatos] = useState({ nombre: '', contacto: '', motivo: MOTIVOS[0], mensaje: '' })
  const [errores, setErrores] = useState({})
  const [enviado, setEnviado] = useState(false)

  const cambiar = (campo) => (e) => {
    setDatos((d) => ({ ...d, [campo]: e.target.value }))
    setErrores((x) => ({ ...x, [campo]: null }))
    setEnviado(false)
  }

  const enviar = (e) => {
    e.preventDefault()
    const fallas = {}
    if (datos.nombre.trim().length < 2) fallas.nombre = 'Decinos cómo te llamás'
    if (datos.mensaje.trim().length < 5) fallas.mensaje = 'Contanos un poco más'
    setErrores(fallas)
    if (Object.keys(fallas).length > 0) return

    const texto = [
      `Hola ${STUDIO.nombre}, soy ${datos.nombre.trim()}.`,
      datos.motivo,
      datos.mensaje.trim(),
      datos.contacto.trim() && `Me podés escribir a: ${datos.contacto.trim()}`,
    ].filter(Boolean).join('\n\n')

    window.open(`https://wa.me/${SITIO.whatsapp}?text=${encodeURIComponent(texto)}`,
                '_blank', 'noopener,noreferrer')
    setEnviado(true)
  }

  return (
    <div className="contacto">
      <section className="contacto__cab">
        <p className="eyebrow">Contactanos</p>
        <h1>Escribinos y te contamos</h1>
        <p className="contacto__intro">
          Si querés probar una clase, preguntar por los paquetes o no sabés con cuál empezar,
          mandanos un mensaje. Contestamos en el día, en horario del studio.
        </p>
      </section>

      <section className="contacto__grid">
        {/* ---- el mensaje ---- */}
        <form className="contacto__form" onSubmit={enviar} noValidate data-rev>
          <h2>Mandanos un mensaje</h2>
          <p className="contacto__nota">
            Se abre WhatsApp con el mensaje ya escrito. Lo revisás y lo enviás vos.
          </p>

          <Campo etiqueta="Tu nombre" error={errores.nombre}>
            <input value={datos.nombre} onChange={cambiar('nombre')}
                   autoComplete="name" placeholder="Ana Gómez" />
          </Campo>

          <Campo etiqueta="Teléfono o email (opcional)"
                 ayuda="Para poder responderte si se corta la charla">
            <input value={datos.contacto} onChange={cambiar('contacto')}
                   autoComplete="email" placeholder="ana@mail.com" />
          </Campo>

          <Campo etiqueta="¿De qué se trata?">
            <select value={datos.motivo} onChange={cambiar('motivo')}>
              {MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Campo>

          <Campo etiqueta="Tu mensaje" error={errores.mensaje}>
            <textarea rows={4} value={datos.mensaje} onChange={cambiar('mensaje')}
                      placeholder="Nunca hice pilates y me gustaría empezar por la mañana…" />
          </Campo>

          <button type="submit" className="btn btn--primario btn--pill">Enviar por WhatsApp</button>
          <p className="contacto__ok" role="status">
            {enviado && 'Abrimos WhatsApp con tu mensaje. Si no se abrió, escribinos al ' + SITIO.telefono + '.'}
          </p>
        </form>

        {/* ---- los datos ---- */}
        <div className="contacto__datos" data-rev>
          <h2>El studio</h2>
          <dl className="contacto__lista">
            <div>
              <dt>Dónde estamos</dt>
              <dd>
                {SITIO.direccion}
                <a className="contacto__mapa" href={SITIO.mapa} target="_blank" rel="noreferrer">
                  Cómo llegar ↗
                </a>
              </dd>
            </div>
            <div>
              <dt>Horario de atención</dt>
              <dd>{SITIO.horarioAtencion}</dd>
            </div>
            <div>
              <dt>Teléfono</dt>
              <dd><a href={`tel:${tel}`}>{SITIO.telefono}</a></dd>
            </div>
            <div>
              <dt>Instagram</dt>
              <dd>
                <a href={`https://www.instagram.com/${SITIO.instagram}/`} target="_blank" rel="noreferrer">
                  @{SITIO.instagram} ↗
                </a>
              </dd>
            </div>
          </dl>

          <div className="contacto__botones">
            <a className="btn btn--linea btn--pill"
               href={`https://wa.me/${SITIO.whatsapp}`} target="_blank" rel="noreferrer">
              Abrir WhatsApp ↗
            </a>
            <button type="button" className="btn btn--primario btn--pill" onClick={onReservar}>
              Reservar una clase
            </button>
          </div>

          <p className="contacto__pie">
            Sala de {STUDIO.camillas} camillas · Clases de hasta {STUDIO.camillas} personas
          </p>
        </div>
      </section>

      {/* ---- preguntas ---- */}
      <section className="contacto__faq">
        <div className="seccion__cab">
          <p className="eyebrow">Preguntas</p>
          <h2>Lo que más nos preguntan</h2>
        </div>
        <div className="faq">
          {SITIO.preguntas.map(([p, r], i) => (
            <details className="faq__item" key={p} data-rev style={{ '--i': i }}>
              <summary>{p}<span aria-hidden="true" /></summary>
              <p>{r}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
