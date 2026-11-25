// ---- Movimiento del sitio ------------------------------------------------
// Tres ayudantes para la web pública. Todos siguen la misma regla: el HTML
// sale completo y visible, y sólo si el script corre —y el visitante no pidió
// menos movimiento— se oculta primero para después encenderse. Sin JS, o con
// `prefers-reduced-motion`, la página se ve igual, quieta.

import { useEffect, useLayoutEffect, useState } from 'react'

const quieto = () =>
  typeof window === 'undefined' ||
  !window.IntersectionObserver ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * ¿El navegador sabe atar una animación al scroll? Entonces el revelado lo
 * hace el CSS (`animation-timeline: view()`), que corre en el compositor y no
 * necesita que nadie escuche el scroll. Acá sólo queda el plan B.
 */
const conScrollTimeline = () =>
  typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline', 'view()')

/**
 * Plan B del revelado, para los navegadores sin `animation-timeline`: muestra
 * los `[data-rev]` del contenedor cuando entran en pantalla, una sola vez cada
 * uno. Lo que ya está a la vista al cargar no se oculta: nadie tiene que hacer
 * scroll para leer lo primero.
 *
 * Corre en layout para que no se vea el parpadeo de mostrar y volver a ocultar.
 */
export function useRevelar(ref, deps = []) {
  useLayoutEffect(() => {
    const raiz = ref.current
    if (!raiz || quieto() || conScrollTimeline()) return

    const obs = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue
        e.target.classList.replace('es-oculto', 'es-visible')
        obs.unobserve(e.target)
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })

    for (const el of raiz.querySelectorAll('[data-rev]')) {
      if (el.classList.contains('es-visible')) continue
      // Lo que quedó oculto con el observador anterior (cambió la pestaña, entró
      // la cuenta) sigue oculto, pero hay que volver a mirarlo.
      if (!el.classList.contains('es-oculto')) {
        // Ya está en pantalla (o quedó arriba, por un deep link): va visible.
        if (el.getBoundingClientRect().top < window.innerHeight * 0.88) {
          el.classList.add('es-visible')
          continue
        }
        el.classList.add('es-oculto')
      }
      obs.observe(el)
    }
    return () => obs.disconnect()
  }, deps)
}

/**
 * Cuál de las secciones está siendo leída, para marcarla en el menú. Mira la
 * franja del medio de la pantalla y devuelve la primera de la lista que la toque.
 */
export function useSeccionALaVista(ids, activo = true) {
  const [aca, setAca] = useState(null)
  const clave = ids.join(',')

  useEffect(() => {
    if (!activo) { setAca(null); return }
    if (typeof window === 'undefined' || !window.IntersectionObserver) return
    const lista = clave.split(',')
    const vistas = new Set()
    const obs = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) vistas.add(e.target.id)
        else vistas.delete(e.target.id)
      }
      setAca(lista.find((id) => vistas.has(id)) ?? null)
    }, { rootMargin: '-48% 0px -48% 0px' })

    for (const id of lista) {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    }
    return () => obs.disconnect()
  }, [clave, activo])

  return aca
}

/**
 * La foto de la portada se queda un poco atrás al bajar. Escribe los píxeles
 * en `--paralaje`; el CSS le da margen de sobra arriba y abajo para que nunca
 * se vea el borde de la imagen.
 */
export function useParalaje(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el || quieto()) return

    let pedido = 0
    const pintar = () => {
      pedido = 0
      const alto = window.innerHeight
      el.style.setProperty('--paralaje', (Math.min(window.scrollY, alto) * 0.08).toFixed(1) + 'px')
    }
    const mirar = () => { pedido ||= requestAnimationFrame(pintar) }

    pintar()
    window.addEventListener('scroll', mirar, { passive: true })
    window.addEventListener('resize', mirar, { passive: true })
    return () => {
      window.removeEventListener('scroll', mirar)
      window.removeEventListener('resize', mirar)
      cancelAnimationFrame(pedido)
      el.style.removeProperty('--paralaje')
    }
  }, [])
}
