import { useEffect, useMemo, useState } from 'react'
import Admin from './components/Admin'
import Auth from './components/Auth'
import ClaseDetalle from './components/ClaseDetalle'
import Cuenta from './components/Cuenta'
import Landing from './components/Landing'
import { Aviso } from './components/ui'
import { LOGOS, STUDIO } from './lib/config'
import { proximosDias } from './lib/fechas'
import { useStudio } from './lib/db'

export default function App() {
  const studio = useStudio()
  const [abierta, setAbierta] = useState(null)   // {fecha, hora} de la clase en pantalla
  const [aviso, setAviso] = useState(null)
  const [publico, setPublico] = useState('sitio')  // 'sitio' | 'cuenta'

  const dias = useMemo(proximosDias, [])
  const [diaSel, setDiaSel] = useState(dias[0].iso)

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4200)
    return () => clearTimeout(t)
  }, [aviso])

  const { usuario, esAdmin } = studio

  // Al entrar o crear la cuenta se vuelve a la web, directo a reservar. El hash
  // se escribe antes de volver, así la web ya nace en esa pestaña.
  useEffect(() => {
    if (!usuario) { setAbierta(null); return }
    if (publico !== 'cuenta') return
    if (!esAdmin) history.replaceState(null, '', '#reservar')
    setPublico('sitio')
  }, [usuario?.id])

  // La clase abierta se relee del estado para que el plano quede siempre al día.
  const clase = abierta ? studio.clase(abierta.fecha, abierta.hora) : null
  const abrirClase = (c) => c && setAbierta({ fecha: c.fecha, hora: c.hora })

  // Tres vistas: acceso, panel (sólo el studio) y la web pública, donde el
  // alumno con sesión además reserva.
  let vista
  if (!usuario && publico === 'cuenta') {
    vista = <Auth studio={studio} onAviso={setAviso} onVolver={() => setPublico('sitio')} />
  } else if (esAdmin) {
    vista = (
      <div className="app">
        <header className="top">
          <div className="marca">
            <img className="marca__logo" src={LOGOS.palabra} alt={STUDIO.nombre} />
          </div>
          <button className="btn btn--fantasma btn--chico top__salir" onClick={studio.salir}>
            Cerrar sesión
          </button>
        </header>
        <main className="contenido">
          <Admin studio={studio} dias={dias} onAbrirClase={abrirClase} onAviso={setAviso} />
        </main>
      </div>
    )
  } else {
    vista = (
      <Landing
        studio={studio}
        onEntrar={() => { setPublico('cuenta'); scrollTo(0, 0) }}
        cuenta={usuario && (
          <Cuenta studio={studio} dias={dias} diaSel={diaSel} setDiaSel={setDiaSel}
                  onAbrirClase={abrirClase} onAviso={setAviso} />
        )}
      />
    )
  }

  // El fragmento mantiene a <Aviso> en el mismo lugar en las tres vistas.
  return (
    <>
      {vista}
      {usuario && clase && (
        <ClaseDetalle
          clase={clase}
          studio={studio}
          onCerrar={() => setAbierta(null)}
          onAviso={setAviso}
        />
      )}
      <Aviso aviso={aviso} />
    </>
  )
}
