/**
 * Corre scripts/pruebas.mjs en Node.
 *
 * useStudio es un hook, así que para probarlo fuera del navegador se empaqueta
 * la prueba reemplazando 'react' por scripts/react-stub.js: un React mínimo
 * que guarda el estado y vuelve a correr el hook hasta que se estabiliza. Así
 * se prueba el código de verdad, no una copia de la lógica.
 */
import { build } from 'esbuild'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const carpeta = mkdtempSync(join(tmpdir(), 'c40-'))
const salida = join(carpeta, 'pruebas.mjs')

try {
  await build({
    entryPoints: ['scripts/pruebas.mjs'],
    outfile: salida,
    bundle: true,
    platform: 'node',
    format: 'esm',
    alias: { react: './scripts/react-stub.js' },
    logLevel: 'warning',
  })
  await import(pathToFileURL(salida).href)
} finally {
  rmSync(carpeta, { recursive: true, force: true })
}
