import { useEffect, useRef, useState } from 'react'
import { useParalaje, useRevelar, useSeccionALaVista } from '../lib/animar'
import { DISPOSICION, DOCENTES, FOTOS, LOGOS, PLANES, RESENAS, SITIO, STUDIO, TIPOS } from '../lib/config'
import { etiquetaDia, proximosDias } from '../lib/fechas'
import Contacto from './Contacto'
import { Avatar } from './ui'

function Foto({ nombre, etiqueta, className = '', diferida = true }) {
  return <img className={'foto ' + className} src={FOTOS[nombre]} alt={etiqueta}
              loading={diferida ? 'lazy' : 'eager'} />
}

const SECCIONES = [
  ['clases', 'Clases'], ['como-reservar', 'Cómo reservar'], ['coaches', 'Coaches'],
  ['paquetes', 'Paquetes'], ['horarios', 'Horarios'],
]

const paginaDelHash = () => (location.hash === '#contacto' ? 'contacto' : 'inicio')

/**
 * Los cuatro rayos del neón. Se apagan sólo si el script corre, así que sin él
 * se ven encendidos; se prenden una vez, cuando entran en pantalla.
 */
function Rayos() {
  const ref = useRef(null)
  const [estado, setEstado] = useState('')
  useEffect(() => {
    const el = ref.current
    // Si ya quedó arriba de la vista (deep link), no hay nada que encender.
    if (!window.IntersectionObserver || el.getBoundingClientRect().bottom < 0) return
    setEstado(' es-apagado')
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      setEstado(' es-encendido')
      obs.disconnect()
    }, { threshold: 1, rootMargin: '0px 0px -15% 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={'frase__rayos' + estado} aria-hidden="true">
      {[1, 2, 3, 4].map((n) => <span className="rayo" key={n} />)}
    </div>
  )
}

/**
 * Miniatura del plano de la sala: el paso en el que elegís tu camilla.
 *
 * `--n` es el orden en que se arma la sala al entrar en pantalla —fila de
 * arriba, la del instructor, fila de abajo—, que es el mismo orden del plano.
 */
function SalaMini() {
  const fila = (nums, invertida) => (
    <div className={'minisala__fila' + (invertida ? ' es-inv' : '')}>
      {nums.map((n) => (
        <span key={n} className={'minicamilla' + (n === 4 ? ' es-elegida' : '')}
              style={{ '--n': invertida ? n : n - 1 }}>
          <i />
        </span>
      ))}
    </div>
  )
  return (
    <div className="minisala" aria-hidden="true">
      {fila(DISPOSICION.arriba)}
      <div className="minisala__centro">
        <span className="minicamilla minicamilla--prof" style={{ '--n': 5 }}><i /></span>
      </div>
      {fila(DISPOSICION.abajo, true)}
    </div>
  )
}

export default function Landing({ studio, onEntrar, cuenta }) {
  // `cuenta` llega sólo con sesión de alumno: las reservas se hacen acá mismo.
  const alumno = cuenta ? studio.usuario : null
  const dias = proximosDias().slice(0, 7).filter((d) => studio.horariosDeFecha(d.iso).length > 0)
  const [diaSel, setDiaSel] = useState(dias[0]?.iso)
  const clases = diaSel ? studio.clasesDeDia(diaSel) : []

  // Dos pestañas: la web y contacto. Van en el hash, así se pueden compartir.
  const [pagina, setPagina] = useState(paginaDelHash)
  const [destino, setDestino] = useState(null)   // sección a la que ir al volver al inicio

  const [bajo, setBajo] = useState(false)
  useEffect(() => {
    const mirar = () => setBajo(window.scrollY > 10)
    mirar()
    window.addEventListener('scroll', mirar, { passive: true })
    return () => window.removeEventListener('scroll', mirar)
  }, [])

  // Menú de secciones para pantallas angostas.
  const [menu, setMenu] = useState(false)
  const botonMenu = useRef(null)
  useEffect(() => {
    if (!menu) return
    const esc = (e) => {
      if (e.key !== 'Escape') return
      setMenu(false)
      botonMenu.current?.focus()
    }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [menu])

  // Movimiento: revelado al entrar en pantalla, la sección marcada en el menú
  // y la foto de la portada un paso atrás del scroll.
  const cuerpo = useRef(null)
  const hero = useRef(null)
  useRevelar(cuerpo, [pagina, Boolean(cuenta)])
  useParalaje(hero)
  const seccionAca = useSeccionALaVista(SECCIONES.map(([id]) => id), pagina === 'inicio')

  // Atrás y adelante del navegador cambian de pestaña.
  useEffect(() => {
    const sinc = () => setPagina(paginaDelHash())
    window.addEventListener('hashchange', sinc)
    window.addEventListener('popstate', sinc)
    return () => {
      window.removeEventListener('hashchange', sinc)
      window.removeEventListener('popstate', sinc)
    }
  }, [])

  // Deep link: si alguien entra con /#horarios, vamos directo a esa sección.
  // Lo repetimos al terminar de cargar, porque las tipografías y las fotos
  // mueven el alto de la página y dejarían el scroll a mitad de camino.
  useEffect(() => {
    const id = location.hash.slice(1)
    if (!id || id === 'contacto') return
    const ir = () => document.getElementById(id)?.scrollIntoView()
    ir()
    window.addEventListener('load', ir, { once: true })
    return () => window.removeEventListener('load', ir)
  }, [])

  const bajarA = (id) => {
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(id)?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto' })
  }

  // Al volver de contacto hay que esperar a que la sección exista.
  useEffect(() => {
    if (!destino || pagina !== 'inicio') return
    bajarA(destino)
    setDestino(null)
  }, [destino, pagina])

  const ir = (id) => (e) => {
    e.preventDefault()
    setMenu(false)
    history.replaceState(null, '', '#' + id)
    if (pagina !== 'inicio') { setPagina('inicio'); setDestino(id); return }
    bajarA(id)
  }

  const verContacto = (e) => {
    e?.preventDefault()
    setMenu(false)
    if (pagina !== 'contacto') {
      history.pushState(null, '', '#contacto')
      setPagina('contacto')
    }
    window.scrollTo(0, 0)
  }

  const reservar = alumno ? ir('horarios') : onEntrar

  return (
    <div className="sitio">
      {/* ---- barra ---- */}
      <header className={'sitio__top' + (bajo || menu || pagina === 'contacto' ? ' es-solida' : '')}>
        <a className="sitio__marca" href="#inicio" onClick={ir('inicio')}>
          <img src={LOGOS.palabraBlanca} alt={STUDIO.nombre} />
        </a>
        <button ref={botonMenu} type="button" className="sitio__menu"
                aria-label={menu ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={menu} aria-controls="secciones"
                onClick={() => setMenu((v) => !v)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={menu ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} />
          </svg>
        </button>
        <nav id="secciones" className={'sitio__nav' + (menu ? ' es-abierto' : '')} aria-label="Secciones">
          {SECCIONES.map(([id, txt]) => {
            const aca = pagina === 'inicio' && seccionAca === id
            return (
              <a key={id} href={'#' + id} onClick={ir(id)}
                 className={aca ? 'es-aca' : undefined}
                 aria-current={aca ? 'true' : undefined}>
                {txt}
              </a>
            )
          })}
          <a href="#contacto" onClick={verContacto}
             className={pagina === 'contacto' ? 'es-aca' : undefined}
             aria-current={pagina === 'contacto' ? 'page' : undefined}>
            Contactanos
          </a>
        </nav>
        <div className="sitio__acciones">
          <button className="btn btn--primario btn--chico" onClick={reservar}>Reservar</button>
        </div>
      </header>

      <main ref={cuerpo}>
        {pagina === 'contacto' ? <Contacto onReservar={reservar} /> : (
          <>
            {/* ---- hero ---- */}
            <section className="hero" id="inicio" ref={hero}>
              <Foto nombre="hero" etiqueta="La sala de reformers de Core 40"
                    className="hero__fondo" diferida={false} />
              <div className="hero__velo" />
              <div className="hero__contenido">
                <p className="hero__eyebrow">Reformer · Mat · Funcional</p>
                <h1 className="hero__titulo">
                  <img src={LOGOS.completoBlanco} alt={`${STUDIO.nombre} · Modern Pilates`} />
                </h1>
                <p className="hero__lema">{SITIO.lema}</p>
                <div className="hero__botones">
                  <button className="btn btn--primario btn--pill" onClick={reservar}>Reservar clase</button>
                  <a className="btn btn--claro btn--pill" href="#paquetes" onClick={ir('paquetes')}>Ver paquetes</a>
                </div>
              </div>
              <a className="hero__scroll" href="#manifiesto" onClick={ir('manifiesto')} aria-label="Bajar">
                <span aria-hidden="true">↓</span>
              </a>
            </section>

            {/* ---- manifiesto ---- */}
            <section className="manifiesto" id="manifiesto">
              <div className="manifiesto__marca" data-rev>
                <img src={LOGOS.completo} alt={`${STUDIO.nombre} · Modern Pilates`} />
              </div>
              <div className="manifiesto__texto" data-rev>
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
              {SITIO.pilares.map((p, i) => (
                <article className="pilar" key={p.titulo} data-rev style={{ '--i': i }}>
                  <Foto nombre={p.foto} etiqueta={`${p.titulo} en Core 40`} className="pilar__foto" />
                  <div className="pilar__txt">
                    <h3>{p.titulo}</h3>
                    <p>{p.texto}</p>
                  </div>
                </article>
              ))}
            </section>

            {/* ---- tipos de clase ---- */}
            <section className="tipos">
              <div className="seccion__cab" data-rev>
                <p className="eyebrow">Nuestras clases</p>
                <h2>Elegí cómo querés entrenar</h2>
              </div>
              <div className="tipos__grid">
                {Object.entries(TIPOS).map(([id, t], i) => (
                  <article className="tipo" key={id} data-rev style={{ '--i': i }}>
                    <h3>{t.nombre}</h3>
                    <p className="tipo__meta">{t.duracion} min · {t.nivel}</p>
                    <p className="tipo__desc">{t.desc}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* ---- cómo se reserva el lugar ---- */}
            <section className="como" id="como-reservar">
              <div className="como__txt" data-rev>
                <p className="eyebrow">Cómo reservar</p>
                <h2>Tu lugar, elegido por vos en cuatro pasos</h2>
                <ol className="pasos">
                  {SITIO.pasos.map(([titulo, texto], i) => (
                    <li key={titulo} style={{ '--i': i }}>
                      <span className="pasos__n" aria-hidden="true">{i + 1}</span>
                      <strong>{titulo}</strong>
                      <span className="pasos__txt">{texto}</span>
                    </li>
                  ))}
                </ol>
                <button className="btn btn--primario btn--pill" onClick={reservar}>
                  {alumno ? 'Reservar mi lugar' : 'Quiero probar'}
                </button>
              </div>
              <div className="como__plano" data-rev>
                <SalaMini />
                <p className="como__pie">
                  Así ves la sala al reservar: {STUDIO.camillas} camillas, la del instructor al medio
                  y la tuya elegida por vos.
                </p>
              </div>
            </section>

            {/* ---- frase ---- */}
            <section className="frase">
              <div>
                <Rayos />
                <h2>{SITIO.frase}</h2>
              </div>
            </section>

            {/* ---- coaches ---- */}
            <section className="coaches" id="coaches">
              <div className="seccion__cab" data-rev>
                <p className="eyebrow">The coaches</p>
                <h2>Quiénes te van a dar clase</h2>
              </div>
              <div className="coaches__grid">
                {DOCENTES.map((d, i) => (
                  <article className="coach" key={d.id} data-rev style={{ '--i': i }}>
                    <Avatar nombre={d.nombre} tamano="xl" />
                    <h3>{d.nombre}</h3>
                    <p className="coach__esp">{d.especialidad}</p>
                    <p className="coach__bio">{d.bio}</p>
                    <p className="coach__desde">En el studio desde {d.desde}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* ---- momento ---- */}
            <section className="momento">
              <div className="momento__foto" data-rev>
                <Foto nombre="momento"
                      etiqueta="Alumna en plancha sobre el reformer: la vida no es perfecta pero, tu plancha puede serlo" />
              </div>
            </section>

            {/* ---- reseñas ---- */}
            <section className="resenas" id="resenas">
              <div className="seccion__cab" data-rev>
                <p className="eyebrow">Reseñas</p>
                <h2>Lo que dicen en Google</h2>
              </div>
              {RESENAS.length > 0 && (
                <div className="resenas__grid">
                  {RESENAS.map((r, i) => (
                    <figure className="resena" key={r.nombre + r.texto} data-rev style={{ '--i': i }}>
                      <p className="resena__estrellas" role="img" aria-label={`${r.estrellas} de 5 estrellas`}>
                        {'★'.repeat(r.estrellas)}{'☆'.repeat(5 - r.estrellas)}
                      </p>
                      <blockquote>{r.texto}</blockquote>
                      <figcaption>{r.nombre} · Google</figcaption>
                    </figure>
                  ))}
                </div>
              )}
              <div className="resenas__cta" data-rev>
                <a className="btn btn--linea btn--pill" href={SITIO.mapa} target="_blank" rel="noreferrer">
                  Ver reseñas en Google Maps ↗
                </a>
              </div>
            </section>

            {/* ---- paquetes ---- */}
            <section className="paquetes" id="paquetes">
              <div className="seccion__cab" data-rev>
                <p className="eyebrow">Paquetes</p>
                <h2>Elegí el plan que te sirva</h2>
              </div>
              <div className="paquetes__grid">
                {Object.entries(PLANES).map(([id, p], i) => (
                  <article className={'paquete' + (id === 'ocho' ? ' es-destacado' : '')} key={id}
                           data-rev style={{ '--i': i }}>
                    {id === 'ocho' && <span className="paquete__sello">El más elegido</span>}
                    <h3>{p.nombre}</h3>
                    <p className="paquete__precio">{p.precio}<small>{id === 'suelta' ? '/ clase' : '/ mes'}</small></p>
                    <p className="paquete__detalle">{p.detalle}</p>
                    <ul className="paquete__lista">
                      {p.incluye.map((x) => <li key={x}>{x}</li>)}
                    </ul>
                    {alumno?.solicitud === id ? (
                      <>
                        <p className="paquete__pendiente">Pendiente de activación</p>
                        <button className="btn btn--pill btn--linea" onClick={() => studio.solicitarPlan(null)}>
                          Anular pedido
                        </button>
                      </>
                    ) : (
                      <button className={'btn btn--pill ' + (id === 'ocho' ? 'btn--primario' : 'btn--linea')}
                              onClick={alumno ? () => studio.solicitarPlan(id) : onEntrar}>
                        {alumno ? 'Pedir este paquete' : 'Empezar'}
                      </button>
                    )}
                  </article>
                ))}
              </div>
              <p className="paquetes__nota">
                Precios por confirmar. El pago se coordina con el studio ({SITIO.telefono}) y el
                paquete se activa cuando lo confirman.
              </p>
            </section>

            {/* ---- horarios ---- */}
            <section className={'horarios' + (alumno ? ' es-cuenta' : '')} id="horarios">
              <div className="seccion__cab" data-rev>
                <p className="eyebrow">Horarios</p>
                <h2>{alumno ? 'Reservá tu clase' : 'Mirá la disponibilidad de esta semana'}</h2>
              </div>

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
                          : <button className="btn btn--chico btn--linea" onClick={reservar}>
                              {c.libres === 0 ? 'Lista de espera' : 'Reservar'}
                            </button>}
                      </li>
                    ))}
                  </ul>

                  <div className="horarios__cta">
                    <button className="btn btn--primario btn--pill" onClick={reservar}>Reservar mi camilla</button>
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </main>

      {/* ---- footer ---- */}
      <footer className="pie">
        <div className="pie__grid">
          <div>
            <div className="sitio__marca sitio__marca--pie">
              <img src={LOGOS.completoBlanco} alt={`${STUDIO.nombre} · Modern Pilates`} />
            </div>
            <p className="pie__lema">{SITIO.lema}</p>
          </div>

          <div>
            <p className="pie__tit">El studio</p>
            <p>{SITIO.direccion}</p>
            <p>
              <a className="pie__mapa" href={SITIO.mapa} target="_blank" rel="noreferrer">
                Cómo llegar ↗
              </a>
            </p>
            <p>{SITIO.horarioAtencion}</p>
            <p><a href={`tel:${SITIO.telefono.replace(/\s/g, '')}`}>{SITIO.telefono}</a></p>
          </div>

          <div>
            <p className="pie__tit">Hablemos</p>
            <p><a href="#contacto" onClick={verContacto}>Contactanos</a></p>
            <p>
              <a href={`https://wa.me/${SITIO.whatsapp}`} target="_blank" rel="noreferrer">
                WhatsApp ↗
              </a>
            </p>
            <p>
              <a href={`https://www.instagram.com/${SITIO.instagram}/`} target="_blank" rel="noreferrer">
                @{SITIO.instagram} ↗
              </a>
            </p>
          </div>

          <div>
            <p className="pie__tit">Reservas</p>
            <button className="btn btn--primario btn--pill" onClick={reservar}>Reservar</button>
            <button className="btn btn--claro btn--pill" onClick={alumno ? studio.salir : onEntrar}>
              {alumno ? 'Cerrar sesión' : 'Iniciar sesión'}
            </button>
          </div>
        </div>
        <p className="pie__legal">
          Prototipo de demostración · {new Date().getFullYear()} · Los datos son de ejemplo
        </p>
      </footer>
    </div>
  )
}
