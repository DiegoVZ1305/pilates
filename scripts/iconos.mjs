/**
 * Genera los iconos de la app dibujando el monograma C40 con formas, sin
 * dependencias: el favicon SVG y los PNG de la pantalla de inicio salen de
 * la misma geometría, así no se despegan uno del otro.
 *
 *   node scripts/iconos.mjs
 *
 * Si cambia la paleta de styles.css, se cambian los colores de acá y se
 * vuelve a correr.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const FONDO = '#e7b9be'   // --rosa
const TINTA = '#4c3f46'   // --tinta
const aRGB = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

// ---- geometría del monograma -------------------------------------------
// Caja de ANCHO x 1, con la misma escala en los dos ejes para que los
// anillos salgan redondos y no elipses.
const G = 0.115                  // grosor del trazo
const R = 0.355                  // radio medio de los anillos
const ANCHO = 2.35
const BOCA = 0.70                // media abertura de la C, en radianes

const C = { cx: 0.44, cy: 0.5 }
const O = { cx: 1.93, cy: 0.5 }
const N4 = {
  x: 1.33,                       // la pata vertical
  arriba: 0.145,
  abajo: 0.855,
  travY: 0.63,
  travDe: 0.90,
  travA: 1.47,
  diagDe: 0.93,
}

const distSeg = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** ¿El punto cae sobre alguna letra? (x en 0..ANCHO, y en 0..1) */
function enMonograma(x, y) {
  const m = G / 2

  const dCx = x - C.cx, dCy = y - C.cy
  if (Math.abs(Math.hypot(dCx, dCy) - R) < m && Math.abs(Math.atan2(dCy, dCx)) > BOCA) return true

  const dOx = x - O.cx, dOy = y - O.cy
  if (Math.abs(Math.hypot(dOx, dOy) - R) < m) return true

  if (distSeg(x, y, N4.x, N4.arriba, N4.diagDe, N4.travY) < m) return true
  if (distSeg(x, y, N4.travDe, N4.travY, N4.travA, N4.travY) < m) return true
  if (distSeg(x, y, N4.x, N4.arriba, N4.x, N4.abajo) < m) return true

  return false
}

/** Dónde cae la caja del monograma dentro de un lienzo cuadrado. */
function encuadre(lado, margen = 0.11) {
  const escala = (lado * (1 - margen * 2)) / ANCHO
  return {
    escala,
    x: (lado - ANCHO * escala) / 2,
    y: (lado - escala) / 2,
  }
}

// ---- PNG mínimo (RGBA, sin filtros) -------------------------------------
const tablaCRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = tablaCRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function trozo(tipo, datos) {
  const largo = Buffer.alloc(4)
  largo.writeUInt32BE(datos.length)
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(cuerpo))
  return Buffer.concat([largo, cuerpo, crc])
}

function png(lado, rgba) {
  const fila = lado * 4
  const cruda = Buffer.alloc((fila + 1) * lado)
  for (let y = 0; y < lado; y++) {
    cruda[y * (fila + 1)] = 0 // sin filtro
    rgba.copy(cruda, y * (fila + 1) + 1, y * fila, (y + 1) * fila)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(lado, 0)
  ihdr.writeUInt32BE(lado, 4)
  ihdr[8] = 8   // bits por canal
  ihdr[9] = 6   // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr),
    trozo('IDAT', deflateSync(cruda, { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ])
}

/** Pinta el icono con supermuestreo 4x4 para que los bordes salgan suaves. */
function dibujar(lado) {
  const fondo = aRGB(FONDO)
  const tinta = aRGB(TINTA)
  const { escala, x: ox, y: oy } = encuadre(lado)
  const buf = Buffer.alloc(lado * lado * 4)
  const M = 4

  for (let py = 0; py < lado; py++) {
    for (let px = 0; px < lado; px++) {
      let dentro = 0
      for (let sy = 0; sy < M; sy++) {
        for (let sx = 0; sx < M; sx++) {
          const u = (px + (sx + 0.5) / M - ox) / escala
          const v = (py + (sy + 0.5) / M - oy) / escala
          if (enMonograma(u, v)) dentro++
        }
      }
      const a = dentro / (M * M)
      const i = (py * lado + px) * 4
      for (let c = 0; c < 3; c++) buf[i + c] = Math.round(fondo[c] * (1 - a) + tinta[c] * a)
      buf[i + 3] = 255
    }
  }
  return png(lado, buf)
}

// ---- favicon vectorial, con la misma geometría --------------------------
function svg(lado = 64) {
  const { escala, x: ox, y: oy } = encuadre(lado)
  const X = (v) => +(ox + v * escala).toFixed(2)
  const Y = (v) => +(oy + v * escala).toFixed(2)
  const r = +(R * escala).toFixed(2)
  const grosor = +(G * escala).toFixed(2)

  // La C es un arco abierto a la derecha: de +BOCA a -BOCA por la izquierda.
  const cx = C.cx + R * Math.cos(BOCA)
  const cyA = C.cy + R * Math.sin(BOCA)
  const cyB = C.cy - R * Math.sin(BOCA)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" role="img" aria-label="C40">
  <rect width="${lado}" height="${lado}" rx="${Math.round(lado * 0.22)}" fill="${FONDO}"/>
  <g fill="none" stroke="${TINTA}" stroke-width="${grosor}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M ${X(cx)} ${Y(cyA)} A ${r} ${r} 0 1 1 ${X(cx)} ${Y(cyB)}"/>
    <path d="M ${X(N4.x)} ${Y(N4.arriba)} L ${X(N4.diagDe)} ${Y(N4.travY)}
             M ${X(N4.travDe)} ${Y(N4.travY)} L ${X(N4.travA)} ${Y(N4.travY)}
             M ${X(N4.x)} ${Y(N4.arriba)} L ${X(N4.x)} ${Y(N4.abajo)}"/>
    <circle cx="${X(O.cx)}" cy="${Y(O.cy)}" r="${r}"/>
  </g>
</svg>
`
}

const manifiesto = {
  name: 'Core 40',
  short_name: 'C40',
  description: 'Reservá tu clase de pilates reformer y elegí tu camilla.',
  start_url: '/',
  display: 'standalone',
  background_color: '#faf6f5',
  theme_color: '#faf6f5',
  lang: 'es',
  icons: [
    { src: '/icono.svg', sizes: 'any', type: 'image/svg+xml' },
    { src: '/icono-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icono-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}

mkdirSync('public', { recursive: true })
writeFileSync('public/icono.svg', svg())
writeFileSync('public/manifest.webmanifest', JSON.stringify(manifiesto, null, 2) + '\n')
for (const lado of [180, 192, 512]) {
  const nombre = lado === 180 ? 'public/apple-touch-icon.png' : `public/icono-${lado}.png`
  writeFileSync(nombre, dibujar(lado))
  console.log(nombre, lado + '×' + lado)
}
console.log('public/icono.svg\npublic/manifest.webmanifest')
