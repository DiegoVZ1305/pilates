import { useState } from 'react'
import { PLANES, STUDIO } from '../lib/config'
import { Campo } from './ui'

const VACIO = { nombre: '', email: '', telefono: '', pin: '', pin2: '', plan: 'ocho' }

export default function Auth({ studio, onAviso, onVolver }) {
  const [modo, setModo] = useState('entrar')
  const [paso, setPaso] = useState(1)
  const [form, setForm] = useState(VACIO)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  function entrar(e) {
    e.preventDefault()
    const r = studio.entrar(form.email, form.pin)
    if (!r.ok) return setError(r.motivo)
    onAviso({ tipo: 'ok', texto: `Hola, ${r.usuario.nombre.split(' ')[0]}.` })
  }

  function accesoRapido(email, pin) {
    const r = studio.entrar(email, pin)
    if (r.ok) onAviso({ tipo: 'ok', texto: `Entraste como ${r.usuario.nombre}.` })
  }

  function siguiente(e) {
    e.preventDefault()
    setError('')
    if (form.nombre.trim().split(' ').length < 2) return setError('Poné nombre y apellido.')
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Revisá el email.')
    if (form.telefono.replace(/\D/g, '').length < 8) return setError('Revisá el teléfono.')
    setPaso(2)
  }

  function crear(e) {
    e.preventDefault()
    setError('')
    if (!/^\d{4}$/.test(form.pin)) return setError('El PIN son 4 números.')
    if (form.pin !== form.pin2) return setError('Los PIN no coinciden.')
    const r = studio.registrar(form)
    if (!r.ok) { setPaso(1); return setError(r.motivo) }
    onAviso({ tipo: 'ok', texto: `Cuenta creada. Bienvenido/a, ${r.usuario.nombre.split(' ')[0]}.` })
  }

  return (
    <div className="auth">
      <aside className="auth__marca">
        {onVolver && (
          <button className="auth__volver" onClick={onVolver}>← Volver al sitio</button>
        )}
        <span className="marca__logo marca__logo--lg">{STUDIO.sigla}</span>
        <h1>{STUDIO.nombre}</h1>
        <p>Reservá tu camilla, elegí dónde ubicarte y seguí tus clases.</p>
        <ul className="auth__puntos">
          <li>{STUDIO.camillas} reformers por clase</li>
          <li>Elegís tu lugar en el plano de la sala</li>
          <li>Lista de espera automática si está completa</li>
        </ul>
      </aside>

      <div className="auth__caja">
        <div className="segmentado">
          {[['entrar', 'Entrar'], ['crear', 'Crear cuenta']].map(([id, txt]) => (
            <button
              key={id}
              className={'segmentado__op' + (modo === id ? ' es-activo' : '')}
              onClick={() => { setModo(id); setError(''); setPaso(1) }}
            >
              {txt}
            </button>
          ))}
        </div>

        {modo === 'entrar' ? (
          <form onSubmit={entrar} className="auth__form">
            <Campo etiqueta="Email">
              <input type="email" value={form.email} onChange={set('email')}
                     placeholder="vos@mail.com" autoComplete="username" required />
            </Campo>
            <Campo etiqueta="PIN de 4 números" error={error}>
              <input type="password" inputMode="numeric" maxLength={4} value={form.pin}
                     onChange={set('pin')} placeholder="····" required />
            </Campo>
            <button className="btn btn--primario btn--ancho" type="submit">Entrar</button>

            <div className="auth__demo">
              <p className="tenue">Acceso rápido para probar el prototipo:</p>
              <div className="auth__demobtns">
                <button type="button" className="btn btn--linea btn--chico"
                        onClick={() => accesoRapido('demo@pilates.com', '1234')}>
                  Entrar como alumna
                </button>
                <button type="button" className="btn btn--linea btn--chico"
                        onClick={() => accesoRapido('studio@pilates.com', '1111')}>
                  Entrar como studio
                </button>
              </div>
            </div>
          </form>
        ) : paso === 1 ? (
          <form onSubmit={siguiente} className="auth__form">
            <p className="auth__paso">Paso 1 de 2 · Tus datos</p>
            <Campo etiqueta="Nombre y apellido">
              <input value={form.nombre} onChange={set('nombre')} placeholder="Ana Gómez" required />
            </Campo>
            <Campo etiqueta="Email">
              <input type="email" value={form.email} onChange={set('email')} placeholder="ana@mail.com" required />
            </Campo>
            <Campo etiqueta="Teléfono" ayuda="Lo usamos para avisarte si se libera un cupo." error={error}>
              <input value={form.telefono} onChange={set('telefono')} placeholder="11 5555 0000" required />
            </Campo>
            <button className="btn btn--primario btn--ancho" type="submit">Continuar</button>
          </form>
        ) : (
          <form onSubmit={crear} className="auth__form">
            <p className="auth__paso">Paso 2 de 2 · Acceso y plan</p>
            <div className="grid2">
              <Campo etiqueta="Elegí un PIN">
                <input type="password" inputMode="numeric" maxLength={4} value={form.pin}
                       onChange={set('pin')} placeholder="4 números" required />
              </Campo>
              <Campo etiqueta="Repetilo" error={error}>
                <input type="password" inputMode="numeric" maxLength={4} value={form.pin2}
                       onChange={set('pin2')} required />
              </Campo>
            </div>

            <p className="campo__lbl">Plan</p>
            <div className="planes">
              {Object.entries(PLANES).map(([id, p]) => (
                <button key={id} type="button"
                        className={'planop' + (form.plan === id ? ' es-activo' : '')}
                        onClick={() => setForm({ ...form, plan: id })}>
                  <strong>{p.nombre}</strong>
                  <span>{p.detalle}</span>
                </button>
              ))}
            </div>

            <div className="auth__botones">
              <button className="btn btn--fantasma" type="button" onClick={() => setPaso(1)}>Volver</button>
              <button className="btn btn--primario" type="submit">Crear mi cuenta</button>
            </div>
          </form>
        )}

        <p className="nota">
          Prototipo sin servidor: las cuentas se guardan sólo en este navegador y el PIN no
          es seguridad real. No uses una clave que uses en otro lado.
        </p>
      </div>
    </div>
  )
}
