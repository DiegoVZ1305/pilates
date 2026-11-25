/* React mínimo para correr useStudio en Node: slots de estado, efectos y
   re-render hasta que se estabiliza. Las actualizaciones se aplican al toque,
   que es lo que hace React cuando no hay otra pendiente en el mismo tick. */
let slots = []
let i = 0
let sucio = false
let efectos = []

export function useState(init) {
  const n = i++
  if (!(n in slots)) slots[n] = typeof init === 'function' ? init() : init
  const set = (v) => {
    const previo = slots[n]
    slots[n] = typeof v === 'function' ? v(previo) : v
    if (slots[n] !== previo) sucio = true
  }
  return [slots[n], set]
}

export const useCallback = (f) => f
export const useMemo = (f) => f()
export const useRef = (v) => ({ current: v })
export const useEffect = (f) => { efectos.push(f) }

/** Corre el hook hasta que deja de pedir renders y devuelve lo último. */
export function render(hook) {
  for (let n = 0; n < 30; n++) {
    i = 0
    sucio = false
    efectos = []
    const out = hook()
    for (const e of efectos) e()
    if (!sucio) return out
  }
  throw new Error('el hook no se estabiliza')
}

export function reiniciar() {
  slots = []
  i = 0
}

export default { useState, useCallback, useMemo, useEffect, useRef }
