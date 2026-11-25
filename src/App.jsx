import { useEffect, useMemo, useState } from 'react'
import Admin from './components/Admin'
import Auth from './components/Auth'
import ClaseDetalle from './components/ClaseDetalle'
import Landing from './components/Landing'
import Docentes from './components/Docentes'
import MisClases from './components/MisClases'
import Perfil from './components/Perfil'
import Reservar from './components/Reservar'
import { Avatar, Aviso, Chip } from './components/ui'
import { PLANES, STUDIO } from './lib/config'
import { cuandoEs, etiquetaLarga, proximosDias } from './lib/fechas'
import { useStudio } from './lib/db'

const NAV = [
  ['reservar', 'Reservar', '◠'],
  ['mias', 'Mis clases', '☰'],
  ['docentes', 'Docentes', '✦'],
  ['perfil', 'Perfil', '●'],
]

/** Tarjeta con la próxima clase del alumno. */
function ProximaClase({ clase, onAbrir }) {
  if (!clase) return null
  return (
    <button className="proxima" onClick={onAbrir}>
      <div>
        <p className="proxima__lbl">Tu próxima clase · {cuandoEs(clase.fecha, clase.hora)}</p>
        <p className="proxima__tit">{clase.hora} · {clase.tipo.nombre}</p>
        <p className="proxima__sub">
          {etiquetaLarga(clase.fecha)} · {clase.docente.nombre} · camilla {clase.miCamilla}
        </p>
      </div>
      <span className="proxima__camilla">{clase.miCamilla}</span>
    </button>
  )
}

export default function App() {
  const studio = useStudio()
  const [vista, setVista] = useState('reservar')
  const [abierta, setAbierta] = useState(null)   // {fecha, hora} de la clase en pantalla
  const [aviso, setAviso] = useState(null)
  const [menu, setMenu] = useState(false)
  const [publico, setPublico] = useState('sitio')  // 'sitio' | 'cuenta'

  const dias = useMemo(proximosDias, [])
  const [diaSel, setDiaSel] = useState(dias[0].iso)

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4200)
    return () => clearTimeout(t)
  }, [aviso])

  const { usuario } = studio

  // La clase abierta se relee del estado para que el plano quede siempre al día.
  const clase = abierta ? studio.clase(abierta.fecha, abierta.hora) : null
  const abrirClase = (c) => c && setAbierta({ fecha: c.fecha, hora: c.hora })

  // Sin sesión: primero el sitio público, y desde ahí se entra a la cuenta.
  if (!usuario) return (
    <>
      {publico === 'sitio'
        ? <Landing studio={studio} onEntrar={() => { setPublico('cuenta'); scrollTo(0, 0) }} />
        : <Auth studio={studio} onAviso={setAviso} onVolver={() => setPublico('sitio')} />}
      <Aviso aviso={aviso} />
    </>
  )

  const nav = studio.esAdmin ? [...NAV, ['admin', 'Studio', '▦']] : NAV
  const hayAvisos = studio.misAvisos.length > 0
  const proxima = studio.misClases.proximas[0]
  const proximaClase = proxima ? studio.clase(proxima.fecha, proxima.hora) : null

  return (
    <div className="app">
      <header className="top">
        <button className="marca" onClick={() => setVista('reservar')}>
          <span className="marca__logo">{STUDIO.sigla}</span>
          <span className="marca__txt">
            <strong>{STUDIO.nombre}</strong>
            <small>{STUDIO.camillas} reformers por clase</small>
          </span>
        </button>

        <nav className="nav">
          {nav.map(([id, txt]) => (
            <button key={id} className={'nav__item' + (vista === id ? ' es-activo' : '')}
                    onClick={() => setVista(id)}>
              {txt}
              {id === 'mias' && hayAvisos && <span className="punto-aviso" aria-label="Tenés avisos" />}
            </button>
          ))}
        </nav>

        <div className="usuario">
          {!studio.esAdmin && (
            <Chip tono={usuario.plan.clasesRestantes === 0 ? 'alerta' : 'rosa'} className="oculta-cel">
              {usuario.plan.clasesRestantes} clases
            </Chip>
          )}
          <button className="usuario__btn" onClick={() => setMenu((v) => !v)}>
            <Avatar nombre={usuario.nombre} tamano="sm" />
          </button>
          {menu && (
            <>
              <div className="menu__fondo" onClick={() => setMenu(false)} />
              <div className="menu">
                <p className="menu__nombre">{usuario.nombre}</p>
                <p className="menu__mail">{usuario.email}</p>
                <p className="menu__plan">{PLANES[usuario.plan.id].nombre}</p>
                <button onClick={() => { setVista('perfil'); setMenu(false) }}>Mi perfil</button>
                <button onClick={() => { setVista('mias'); setMenu(false) }}>Mis clases</button>
                <button className="menu__salir" onClick={() => { studio.salir(); setMenu(false); setPublico('sitio') }}>
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="contenido">
        {vista === 'reservar' && (
          <>
            <ProximaClase clase={proximaClase} onAbrir={() => abrirClase(proximaClase)} />
            <Reservar
              studio={studio}
              dias={dias}
              diaSel={diaSel}
              setDiaSel={setDiaSel}
              onAbrirClase={abrirClase}
            />
          </>
        )}
        {vista === 'mias' && (
          <MisClases
            studio={studio}
            dias={dias}
            onAbrirClase={abrirClase}
            onIrAReservar={() => setVista('reservar')}
            onAviso={setAviso}
          />
        )}
        {vista === 'docentes' && <Docentes studio={studio} onAbrirClase={abrirClase} />}
        {vista === 'perfil' && <Perfil studio={studio} onAviso={setAviso} />}
        {vista === 'admin' && studio.esAdmin && (
          <Admin studio={studio} dias={dias} onAbrirClase={abrirClase} onAviso={setAviso} />
        )}
      </main>

      <nav className="tabbar">
        {nav.map(([id, txt, icono]) => (
          <button key={id} className={'tabbar__item' + (vista === id ? ' es-activo' : '')}
                  onClick={() => setVista(id)}>
            <span className="tabbar__ico" aria-hidden="true">
              {icono}
              {id === 'mias' && hayAvisos && <span className="punto-aviso" aria-label="Tenés avisos" />}
            </span>
            {txt}
          </button>
        ))}
      </nav>

      {clase && (
        <ClaseDetalle
          clase={clase}
          studio={studio}
          onCerrar={() => setAbierta(null)}
          onAviso={setAviso}
        />
      )}

      <Aviso aviso={aviso} />
    </div>
  )
}
