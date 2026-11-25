"""
Genera los archivos de marca que usa la web a partir de los originales de
Assets/: logos recortados, fotos livianas, iconos y manifest.

    npm run marca        (necesita Python 3 con Pillow)
"""
import json
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN, PUBLICO = RAIZ / 'Assets', RAIZ / 'public'
NEGRO = (11, 11, 10)

# destino en public/fotos -> original en Assets
FOTOS = {
    'sala': 'core40img2.png',
    'flexibilidad': 'core40img1.png',
    'fuerza': 'core40img3.png',
    'resistencia': 'core40img6.png',
    'plancha': 'core40img4.png',
}


def logo(nombre):
    """Original RGBA, con el velo casi invisible borrado y lo sólido bien opaco."""
    im = Image.open(ORIGEN / nombre).convert('RGBA')
    im.putalpha(im.getchannel('A').point(lambda a: 0 if a < 16 else 255 if a > 240 else a))
    return im


def recortar(im):
    return im.crop(im.getchannel('A').getbbox())


def en_blanco(im):
    """Pasa las letras negras a blanco y deja el rayo amarillo."""
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            # cuánto amarillo tiene el pixel: 0 = letra, 1 = rayo
            t = min(1, max(0, r - b) / 245)
            px[x, y] = (round(255 - 5 * t), round(255 - 65 * t), round(255 * (1 - t)), a)
    return out


def guardar_logo(im, nombre, ancho):
    alto = round(im.height * ancho / im.width)
    im.resize((ancho, alto), Image.LANCZOS).save(PUBLICO / 'marca' / nombre, optimize=True)


def icono(mono, lado, nombre):
    fondo = Image.new('RGBA', (lado, lado), NEGRO + (255,))
    ancho = round(lado * .72)  # entra en la zona segura de los iconos "maskable"
    m = mono.resize((ancho, round(mono.height * ancho / mono.width)), Image.LANCZOS)
    fondo.alpha_composite(m, ((lado - m.width) // 2, (lado - m.height) // 2))
    fondo.convert('RGB').save(PUBLICO / nombre, optimize=True)


(PUBLICO / 'marca').mkdir(parents=True, exist_ok=True)
(PUBLICO / 'fotos').mkdir(parents=True, exist_ok=True)

completo = logo('core40logo.png')
caja = completo.getchannel('A').getbbox()
palabra = recortar(completo.crop((0, 0, completo.width, 705)))  # sin "Modern Pilates"
completo = completo.crop(caja)

guardar_logo(completo, 'logo.png', 900)
guardar_logo(en_blanco(completo), 'logo-blanco.png', 900)
guardar_logo(palabra, 'palabra.png', 480)
guardar_logo(en_blanco(palabra), 'palabra-blanca.png', 480)

mono = recortar(logo('core40logo2.png'))
guardar_logo(mono, 'monograma-blanco.png', 480)

# Fondo de cemento: la franja de la foto que está arriba del logo. Sin espejar
# ni repetir, que en una textura así se nota.
fondo = Image.open(ORIGEN / 'core40img5.jpg').convert('RGB')
fondo = fondo.crop((0, 0, fondo.width, round(fondo.height * .44)))
fondo.save(PUBLICO / 'fotos' / 'cemento.jpg', quality=86, optimize=True, progressive=True)

for destino, origen in FOTOS.items():
    foto = Image.open(ORIGEN / origen).convert('RGB')
    foto.thumbnail((1600, 1600), Image.LANCZOS)
    foto.save(PUBLICO / 'fotos' / f'{destino}.jpg', quality=82, optimize=True, progressive=True)

for lado, nombre in [(64, 'favicon.png'), (180, 'apple-touch-icon.png'),
                     (192, 'icono-192.png'), (512, 'icono-512.png')]:
    icono(mono, lado, nombre)

manifiesto = {
    'name': 'Core 40', 'short_name': 'C40',
    'description': 'Reservá tu clase de pilates reformer y elegí tu camilla.',
    'start_url': '/', 'display': 'standalone',
    'background_color': '#f6f5f2', 'theme_color': '#0b0b0a', 'lang': 'es',
    'icons': [
        {'src': '/icono-192.png', 'sizes': '192x192', 'type': 'image/png'},
        {'src': '/icono-512.png', 'sizes': '512x512', 'type': 'image/png'},
        {'src': '/icono-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
    ],
}
(PUBLICO / 'manifest.webmanifest').write_text(json.dumps(manifiesto, indent=2) + '\n')
print('Listo: public/marca, public/fotos, iconos y manifest.')
