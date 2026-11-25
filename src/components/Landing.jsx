import { useEffect, useState } from 'react'
import { DISPOSICION, DOCENTES, FOTOS, PLANES, SITIO, STUDIO, TIPOS } from '../lib/config'
import { etiquetaDia, proximosDias } from '../lib/fechas'
import { Avatar } from './ui'

/**
 * Foto del sitio. Mientras no haya archivo cargado en config.FOTOS
 * se dibuja un bloque gráfico en su lugar, para que la página se vea
 * terminada sin depender de imágenes.
 */
function Foto({ nombre, etiqueta, className = '', fondo }) {
  const src = FOTOS[nombre]
  if (src) return <img className={'foto ' + className} src={src} alt={etiqueta} loading="lazy" />
  // Sin archivo cargado: bloque gráfico. Si va de fondo, la etiqueta se corre
  // a una esquina para no competir con el texto que lleva encima.
  return (
    <div className={'foto foto--vacia ' + (fondo ? 'foto--fondo ' : '') + className}
         role="img" aria-label={etiqueta}>
      {!fondo && <span className="foto__marca">{STUDIO.sigla}</span>}
      <span className="foto__txt">{etiqueta}</span>
    </div>
  )
}

/** Miniatura del plano de la sala, como argumento de venta. */
function SalaMini() {
  const fila = (nums, invertida) => (
    <div className={'minisala__fila' + (invertida ? ' es-inv' : '')}>
      {nums.map((n) => (
        <span key={n} className={'minicamilla' + (n === 4 ? ' es-elegida' : '')}>
          <i />
        </span>
      ))}
    </div>
  )
  return (
    <div className="minisala" aria-hidden="true">
      {fila(DISPOSICION.arriba)}
      <div className="minisala__centro"><span className="minicamilla minicamilla--prof"><i /></span></div>
      {fila(DISPOSICION.abajo, true)}
    </div>
  )
}

export default function Landing({ studio, onEntrar }) {
  const dias = proximosDias().slice(0, 7).filter((d) => studio.horariosDeFecha(d.iso).length > 0)
  const [diaSel, setDiaSel] = useState(dias[0]?.iso)
  const clases = diaSel ? studio.clasesDeDia(diaSel) : []

  // Deep link: si alguien entra con /#horarios, vamos directo a esa sección.
  // Lo repetimos al terminar de cargar, porque las tipografías y las fotos
  // mueven el alto de la página y dejarían el scroll a mitad de camino.
  useEffect(() => {
    const id = location.hash.slice(1)
    if (!id) return
    const ir = () => document.getElementById(id)?.scrollIntoView()
    ir()
    window.addEventListener('load', ir, { once: true })
    return () => window.removeEventListener('load', ir)
  }, [])

  const ir = (id) => (e) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="sitio">
      {/* ---- barra ---- */}
      <header className="sitio__top">
        <a className="sitio__marca" href="#inicio" onClick={ir('inicio')}>
          <span className="marca__logo">{STUDIO.sigla}</span>
          <span>{STUDIO.nombre}</span>
        </a>
        <nav className="sitio__nav">
          <a href="#clases" onClick={ir('clases')}>Clases</a>
          <a href="#nosotros" onClick={ir('nosotros')}>Nosotros</a>
          <a href="#coaches" onClick={ir('coaches')}>Coaches</a>
          <a href="#paquetes" onClick={ir('paquetes')}>Paquetes</a>
          <a href="#horarios" onClick={ir('horarios')}>Horarios</a>
        </nav>
        <div className="sitio__acciones">
          <button className="btn btn--fantasma btn--chico" onClick={onEntrar}>Entrar</button>
          <button className="btn btn--primario btn--chico" onClick={onEntrar}>Reservar</button>
        </div>
      </header>

      {/* ---- hero ---- */}
      <section className="hero" id="inicio">
        <Foto nombre="hero" etiqueta="Foto de la sala" className="hero__fondo" fondo />
        <div className="hero__velo" />
        <div className="hero__contenido">
          <p className="hero__eyebrow">Reformer · Mat · Funcional</p>
          <h1 className="hero__titulo">{STUDIO.nombre}</h1>
          <p className="hero__lema">{SITIO.lema}</p>
          <div className="hero__botones">
            <button className="btn btn--primario btn--pill" onClick={onEntrar}>Reservar clase</button>
            <a className="btn btn--claro btn--pill" href="#paquetes" onClick={ir('paquetes')}>Ver paquetes</a>
          </div>
        </div>
        <a className="hero__scroll" href="#manifiesto" onClick={ir('manifiesto')} aria-label="Bajar">↓</a>
      </section>

      {/* ---- manifiesto ---- */}
      <section className="manifiesto" id="manifiesto">
        <div className="manifiesto__marca">
          <span className="marca__logo marca__logo--lg">{STUDIO.sigla}</span>
          <p className="manifiesto__nombre">{STUDIO.nombre}</p>
        </div>
        <div className="manifiesto__texto">
          <h2>Más que un estudio de pilates</h2>
          <p>
            Un lugar chico, de {STUDIO.camillas} camillas, donde la profe te conoce y la clase
            se arma según cómo venís. Trabajamos el movimiento consciente: fuerza real,
            movilidad y cabeza tranquila.
          </p>
          <p>
            Reservás desde el celular, elegís en qué camilla querés estar y listo. Sin
            mensajes, sin listas de papel, sin quedarte afuera a último momento.
          </p>
        </div>
      </section>

      {/* ---- pilares ---- */}
      <section className="pilares" id="clases">
        {SITIO.pilares.map((p) => (
          <article className="pilar" key={p.titulo}>
            <Foto nombre={p.foto} etiqueta={`Foto ${p.titulo.toLowerCase()}`} className="pilar__foto" fondo />
            <div className="pilar__txt">
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </div>
          </article>
        ))}
      </section>

      {/* ---- tipos de clase ---- */}
      <section className="tipos">
        <div className="seccion__cab">
          <p className="eyebrow">Nuestras clases</p>
          <h2>Elegí cómo querés entrenar</h2>
        </div>
        <div className="tipos__grid">
          {Object.entries(TIPOS).map(([id, t]) => (
            <article className="tipo" key={id}>
              <h3>{t.nombre}</h3>
              <p className="tipo__meta">{t.duracion} min · {t.nivel}</p>
              <p className="tipo__desc">{t.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---- por qué nosotros ---- */}
      <section className="nosotros" id="nosotros">
        <div className="nosotros__txt">
          <p className="eyebrow">¿Por qué nosotros?</p>
          <h2>Clases de diez personas, y tu lugar elegido por vos</h2>
          <ul className="razones">
            {SITIO.razones.map(([titulo, texto]) => (
              <li key={titulo}>
                <strong>{titulo}</strong>
                <span>{texto}</span>
              </li>
            ))}
          </ul>
          <button className="btn btn--primario btn--pill" onClick={onEntrar}>Quiero probar</button>
        </div>
        <div className="nosotros__plano">
          <SalaMini />
          <p className="nosotros__pie">
            Así ves la sala al reservar: {STUDIO.camillas} camillas, la del instructor al medio
            y la tuya elegida por vos.
          </p>
        </div>
      </section>

      {/* ---- frase ---- */}
      <section className="frase">
        <Foto nombre="frase" etiqueta="Foto del studio" className="frase__fondo" fondo />
        <div className="frase__velo" />
        <h2>{SITIO.frase}</h2>
      </section>

      {/* ---- coaches ---- */}
      <section className="coaches" id="coaches">
        <div className="seccion__cab">
          <p className="eyebrow">The coaches</p>
          <h2>Quiénes te van a dar clase</h2>
        </div>
        <div className="coaches__grid">
          {DOCENTES.map((d) => (
            <article className="coach" key={d.id}>
              <Avatar nombre={d.nombre} tamano="xl" />
              <h3>{d.nombre}</h3>
              <p className="coach__esp">{d.especialidad}</p>
              <p className="coach__bio">{d.bio}</p>
              <p className="coach__desde">En el studio desde {d.desde}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---- paquetes ---- */}
      <section className="paquetes" id="paquetes">
        <div className="seccion__cab">
          <p className="eyebrow">Paquetes</p>
          <h2>Elegí el plan que te sirva</h2>
        </div>
        <div className="paquetes__grid">
          {Object.entries(PLANES).map(([id, p]) => (
            <article className={'paquete' + (id === 'ocho' ? ' es-destacado' : '')} key={id}>
              {id === 'ocho' && <span className="paquete__sello">El más elegido</span>}
              <h3>{p.nombre}</h3>
              <p className="paquete__precio">{p.precio}<small>{id === 'suelta' ? '/ clase' : '/ mes'}</small></p>
              <p className="paquete__detalle">{p.detalle}</p>
              <ul className="paquete__lista">
                {p.incluye.map((x) => <li key={x}>{x}</li>)}
              </ul>
              <button className={'btn btn--pill ' + (id === 'ocho' ? 'btn--primario' : 'btn--linea')}
                      onClick={onEntrar}>
                Empezar
              </button>
            </article>
          ))}
        </div>
        <p className="paquetes__nota">
          Precios de referencia del prototipo. El cobro todavía no está conectado.
        </p>
      </section>

      {/* ---- horarios ---- */}
      <section className="horarios" id="horarios">
        <div className="seccion__cab">
          <p className="eyebrow">Horarios</p>
          <h2>Mirá la disponibilidad de esta semana</h2>
        </div>

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
          <button className="btn btn--primario btn--pill" onClick={onEntrar}>Reservar mi camilla</button>
        </div>
      </section>

      {/* ---- footer ---- */}
      <footer className="pie">
        <div className="pie__grid">
          <div>
            <div className="sitio__marca sitio__marca--pie">
              <span className="marca__logo">{STUDIO.sigla}</span>
              <span>{STUDIO.nombre}</span>
            </div>
            <p className="pie__lema">{SITIO.lema}</p>
          </div>

          <div>
            <p className="pie__tit">El studio</p>
            <p>{SITIO.direccion}</p>
            <p>{SITIO.horarioAtencion}</p>
            <p>{SITIO.telefono}</p>
          </div>

          <div>
            <p className="pie__tit">Seguinos</p>
            <p>{SITIO.instagram}</p>
            <p className="pie__app">
              <span>Próximamente en iOS</span>
              <span>Próximamente en Android</span>
            </p>
          </div>

          <div>
            <p className="pie__tit">Reservas</p>
            <button className="btn btn--primario btn--pill" onClick={onEntrar}>Reservar</button>
            <button className="btn btn--claro btn--pill" onClick={onEntrar}>Iniciar sesión</button>
          </div>
        </div>
        <p className="pie__legal">
          Prototipo de demostración · {new Date().getFullYear()} · Los datos son de ejemplo
        </p>
      </footer>
    </div>
  )
}
