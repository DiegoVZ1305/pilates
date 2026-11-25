import { useState } from 'react'
import { DOCENTES, PLANES, STUDIO } from '../lib/config'
import { etiquetaCorta } from '../lib/fechas'
import { Avatar, Barra, Campo, Chip, Stat } from './ui'

const TODAS = Array.from({ length: STUDIO.camillas }, (_, i) => i + 1)

export default function Perfil({ studio, onAviso }) {
  const { usuario } = studio
  const stats = studio.estadisticas
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({
    nombre: usuario.nombre, email: usuario.email, telefono: usuario.telefono, notas: usuario.notas,
  })

  const plan = PLANES[usuario.plan.id]
  const prefs = usuario.preferencias

  function guardar(e) {
    e.preventDefault()
    studio.actualizarPerfil(form)
    setEditando(false)
    onAviso({ tipo: 'ok', texto: 'Perfil actualizado.' })
  }

  const setPref = (parche) =>
    studio.actualizarPerfil({ preferencias: { ...prefs, ...parche } })

  return (
    <section className="perfilvista">
      <header className="perfilcab">
        <Avatar nombre={usuario.nombre} tamano="xl" />
        <div className="perfilcab__datos">
          <h2>{usuario.nombre}</h2>
          <p className="tenue">{usuario.email} · {usuario.telefono}</p>
          <div className="perfilcab__chips">
            <Chip tono="tinta">{usuario.rol === 'admin' ? 'Studio' : 'Alumno'}</Chip>
            <Chip>{plan.nombre}</Chip>
            {stats.racha >= 3 && <Chip tono="ok">Racha de {stats.racha} clases</Chip>}
          </div>
        </div>
        <button className="btn btn--linea" onClick={() => setEditando((v) => !v)}>
          {editando ? 'Cancelar' : 'Editar datos'}
        </button>
      </header>

      {editando && (
        <form className="panel formperfil" onSubmit={guardar}>
          <div className="grid2">
            <Campo etiqueta="Nombre y apellido">
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </Campo>
            <Campo etiqueta="Teléfono">
              <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </Campo>
            <Campo etiqueta="Email">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Campo>
            <Campo etiqueta="Lesiones o cosas a tener en cuenta"
                   ayuda="Lo ve el docente antes de la clase.">
              <input value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })}
                     placeholder="Ej: cuidado con lumbares" />
            </Campo>
          </div>
          <button className="btn btn--primario" type="submit">Guardar cambios</button>
        </form>
      )}

      <div className="cols">
        <div className="panel">
          <h3 className="panel__tit">Mi plan</h3>
          <div className="planbox">
            <div>
              <p className="planbox__nombre">{plan.nombre}</p>
              <p className="tenue">
                {plan.detalle} · renueva el {etiquetaCorta(usuario.plan.renuevaEl)}
              </p>
            </div>
            <span className="planbox__num">{usuario.plan.clasesRestantes}</span>
          </div>
          <Barra valor={usuario.plan.clasesRestantes} max={plan.clases} />
          <p className="tenue">
            {usuario.plan.clasesRestantes} de {plan.clases} clases disponibles
          </p>

          <p className="panel__sub">Cambiar de plan</p>
          <div className="planes">
            {Object.entries(PLANES).map(([id, p]) => (
              <button
                key={id}
                className={'planop' + (usuario.plan.id === id ? ' es-activo' : '')}
                onClick={() => { studio.cambiarPlan(id); onAviso({ tipo: 'ok', texto: `Plan cambiado a ${p.nombre}.` }) }}
              >
                <strong>{p.nombre}</strong>
                <span>{p.detalle}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3 className="panel__tit">Preferencias</h3>

          <Campo etiqueta="Camilla favorita"
                 ayuda="Viene preseleccionada al abrir el plano, si está libre.">
            <select
              value={prefs.camillaFavorita ?? ''}
              onChange={(e) => setPref({ camillaFavorita: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Sin preferencia</option>
              {TODAS.map((n) => <option key={n} value={n}>Camilla {n}</option>)}
            </select>
          </Campo>

          <Campo etiqueta="Docente favorita"
                 ayuda="Se marca con una estrella en los horarios que da.">
            <select
              value={prefs.docenteFavorito ?? ''}
              onChange={(e) => setPref({ docenteFavorito: e.target.value || null })}
            >
              <option value="">Sin preferencia</option>
              {DOCENTES.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </Campo>

          <label className="switch">
            <input
              type="checkbox"
              checked={prefs.recordatorios}
              onChange={(e) => setPref({ recordatorios: e.target.checked })}
            />
            <span>Recordarme la clase 2 h antes</span>
          </label>

          <p className="panel__sub">Mi actividad</p>
          <div className="stats stats--2">
            <Stat valor={stats.asistidas} label="clases hechas" tono="rosa" />
            <Stat valor={stats.ausencias} label="ausencias" />
            <Stat valor={stats.favorita} label="clase favorita" />
            <Stat valor={stats.docenteTop} label="docente más visto" />
          </div>
        </div>
      </div>

      <div className="panel panel--riesgo">
        <div>
          <h3 className="panel__tit">Sesión y datos</h3>
          <p className="tenue">
            Prototipo: todo se guarda en este navegador. Reiniciar borra cuentas y reservas
            y vuelve a cargar los datos de ejemplo.
          </p>
        </div>
        <div className="panel__acciones">
          <button className="btn btn--linea" onClick={studio.salir}>Cerrar sesión</button>
          <button className="btn btn--peligro" onClick={studio.reiniciar}>Reiniciar demo</button>
        </div>
      </div>
    </section>
  )
}
