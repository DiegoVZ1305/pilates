import { etiquetaLarga } from '../lib/fechas'
import { Avatar, Chip } from './ui'

export default function Docentes({ studio, onAbrirClase }) {
  const ranking = studio.rankingDocentes()

  return (
    <section>
      <div className="barra">
        <h2>Docentes</h2>
        <span className="tenue">{ranking.length} en el equipo</span>
      </div>

      <div className="docentes">
        {ranking.map((d) => {
          const proximas = studio.clasesDeDocente(d.id, 3)
          return (
            <article key={d.id} className="docente">
              <header className="docente__top">
                <Avatar nombre={d.nombre} tamano="lg" />
                <div>
                  <h3>{d.nombre}</h3>
                  <p className="tenue">{d.especialidad}</p>
                </div>
              </header>

              <p className="docente__bio">{d.bio}</p>

              <div className="docente__chips">
                <Chip>Desde {d.desde}</Chip>
                <Chip tono="ok">{d.alumnos} reservas</Chip>
              </div>

              <p className="docente__sub">Próximas clases</p>
              {proximas.length === 0 ? (
                <p className="tenue">Sin clases cargadas en la grilla.</p>
              ) : (
                <ul className="mini">
                  {proximas.map((c) => (
                    <li key={c.id}>
                      <button className="mini__btn" onClick={() => onAbrirClase(c)}>
                        <span className="mini__hora">{c.hora}</span>
                        <span className="mini__txt">
                          {etiquetaLarga(c.fecha)} · {c.tipo.nombre}
                        </span>
                        <span className={'mini__cupo' + (c.libres === 0 ? ' es-lleno' : '')}>
                          {c.libres === 0 ? 'completa' : `${c.libres} libres`}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
