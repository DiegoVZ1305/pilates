# Core 40 (C40) — Sistema de reservas (prototipo)

Prototipo en React + Vite de un sistema de reservas para un studio de pilates con
**10 camillas (reformers) por clase**, donde cada alumno elige en qué camilla quiere
estar sobre el plano real de la sala.

```bash
npm install
npm run dev     # http://localhost:5173
```

## Cuentas para probar

En la pantalla de entrada hay dos botones de acceso rápido:

| Cuenta | Email | PIN | Qué ve |
|---|---|---|---|
| Alumna | `demo@pilates.com` | `1234` | La web, con sus reservas y el pedido de paquetes |
| Studio | `studio@pilates.com` | `1111` | Sólo el panel de administración |

También se puede crear una cuenta nueva desde cero (dos pasos: datos y PIN). Nace sin clases.

---

## Lo que incluye

### Sitio público (landing)
Lo primero que ve alguien que entra sin cuenta, en la línea de los studios de pilates
que suelen publicarse con Mindbody:
- **Hero** a pantalla completa con el nombre en tipografía display y botones de reserva.
- **Manifiesto** con el logo sobre fondo de cemento, **tres pilares** (flexibilidad, fuerza, resistencia)
  y la **grilla de tipos de clase**.
- **¿Por qué nosotros?** en amarillo suave, con el plano de la sala dibujado como argumento de
  venta ("elegís tu camilla").
- **Frase** a todo ancho, **coaches** con las fichas del equipo y **paquetes** con precios.
- **Horarios reales**: muestra la disponibilidad de verdad de los próximos días, tomada
  del mismo estado que usa la app. Sin sesión, cada botón lleva al login.
- **Footer** con dirección, horario de atención, redes y accesos a reservar.
- Las secciones tienen deep link (`/#horarios`, `/#paquetes`) para compartir.

**Fotos y logos**: los originales están en `Assets/`. `npm run marca` (Python 3 con Pillow)
genera lo que usa la web en `public/marca/`, `public/fotos/`, los iconos y el manifest. Las
rutas están en `FOTOS` y `LOGOS` dentro de `src/lib/config.js`; los textos, en `SITIO`.

### Cuenta y acceso
- Entrar con email + PIN, o crear cuenta en dos pasos con validación de cada campo.
- **El alumno no tiene panel**: al entrar vuelve a la web y la sección de horarios se
  convierte en su reserva, con sus clases disponibles, avisos, reservas y cerrar sesión.
- **El studio entra directo a su panel** y no ve las pantallas de alumno.

### Paquetes
- El alumno **pide** un paquete desde la web; queda pendiente.
- El studio lo **activa** (cuando recibió el pago) o lo rechaza desde *Pedidos*.
- Un abono reemplaza al anterior; la clase suelta se suma y no se renueva.

### Reservar

La reserva va **por pasos**, y cada uno aparece cuando el anterior está resuelto:
**día → tipo de clase → profe (o cualquiera) → hora y camilla**. Cambiar un paso
reinicia los siguientes.

- **Calendario por semana** de borde a borde, con flechas, lugares libres por día,
  días cerrados apagados y un punto en los que ya tenés clase.
- Cada paso ofrece sólo lo que ese día todavía se da.
- **Tus reservas** debajo de los pasos, con acceso al plano y cancelar.
- **Cancelar pide confirmación** y dice antes qué pasa con la clase: vuelve al plan, o
  no vuelve si faltan menos de 2 h.
- **Bandeja de avisos**: si entrás desde la lista de espera, el studio cierra tu día o
  activa tu paquete, te queda el aviso arriba de los pasos.

### Plano de la sala
- Pantalla grande con la sala dibujada: paredes, piso, puerta, ventanas y los reformers
  vistos desde arriba — 5 contra una pared, 5 contra la otra y **el del instructor cruzado
  al medio** (no reservable).
- Estados por camilla: **libre**, **ocupada** (iniciales de quien la tomó; el studio ve el
  nombre), **tu elección**, **tu lugar** y **fuera de servicio**.
- La camilla favorita del alumno aparece marcada con ★.
- Confirmación explícita: el botón dice "Confirmar camilla 7".
- Si ya tenés lugar, tocás otra libre y te movés. En celular se abre como hoja desde abajo.
- **Entra completo en pantalla, sin scroll**: la sala se escala al alto disponible
  (filas `flex: 1` + SVG con `preserveAspectRatio`), así que las camillas crecen o se
  achican según la ventana en vez de obligar a scrollear.

### Lista de espera
- Si no quedan camillas, el alumno se anota y ve su puesto en la cola.
- Cuando alguien cancela, pasa a confirmado el primero de la cola **que todavía tenga
  clases en el plan**, toma la camilla que quedó libre, se le descuenta la clase y le
  queda un aviso en su cuenta.

### Panel del studio (admin)
- **Pedidos**: paquetes pendientes de activar.
- **Agenda**: métricas del día (anotados, ocupación, clases completas, en espera) y por
  cada clase la lista de quién viene con su camilla, su teléfono, su alerta de lesión y
  botones para marcar **asistió / ausente**. También la lista de espera.
  - **Anotar a mano** a una alumna que llamó por teléfono: toma la primera camilla
    libre, o la lista de espera si la clase está completa. Le descuenta la clase a
    ella, no a la cuenta del studio.
  - **Darla de baja** desde la misma lista, con el mismo efecto que si cancelara ella.
- **Grilla**: alta y baja de clases por día de la semana, eligiendo hora, tipo y docente.
  Dar de baja un horario cancela sus reservas futuras, **devuelve la clase al plan** de
  cada alumna y le deja un aviso; antes de confirmar se ve cuántas son.
- **Cierres**: feriados y días sueltos. Cerrar un día cancela y devuelve igual que lo
  anterior, y el día desaparece de la grilla para todos hasta que se reabra.
- **Sala**: habilitar o deshabilitar camillas (mantenimiento). Las deshabilitadas dejan de
  ofrecerse y bajan la capacidad real de todas las clases.
- **Alumnos**: buscador por nombre, email o teléfono, con plan y clases restantes de cada
  uno, más un ranking de reservas por docente.

---

## Estructura

```
src/
  lib/config.js    studio, camillas, disposición de la sala, tipos de clase,
                   docentes, grilla base y planes        ← lo que se toca primero
  lib/fechas.js    días, ids de clase, "en 3 h", validaciones de hora
  lib/db.js        estado completo (usuarios, reservas, espera, grilla, sala)
                   + todas las acciones, persistido en localStorage
  components/
    Landing.jsx       la web: hero, paquetes, horarios, footer
    Cuenta.jsx        la reserva del alumno con sesión, dentro de la web
    Auth.jsx          entrar y crear cuenta
    Reservar.jsx      semana, filtros y lista de horarios del día
    ClaseDetalle.jsx  pantalla grande de la clase
    PlanoSala.jsx     el plano y el dibujo SVG del reformer
    Admin.jsx         agenda, pedidos, grilla, sala y alumnos
    ui.jsx            modal, avatar, chip, stat, campo, barra, vacío, aviso, confirmar
  App.jsx          elige entre web, acceso y panel; ventana de clase
  styles.css       todo el diseño (negro / cemento / amarillo, responsive)
scripts/
  pruebas.mjs      las reglas de reserva, espera, cierres y avisos
  react-stub.js    React mínimo para correr el hook en Node
  test.mjs         empaqueta y corre las pruebas (npm test)
  marca.py         logos, fotos, iconos y manifest desde Assets/ (npm run marca)
public/
  marca/ · fotos/ · favicon.png · icono-192.png · icono-512.png · apple-touch-icon.png
  manifest.webmanifest
```

### Configurar el studio

Casi todo sale de `src/lib/config.js`:

```js
export const STUDIO = { nombre: 'Core 40', sigla: 'C40', camillas: 10, maxActivas: 4,
                        diasVisibles: 14, horasCancelacion: 2 }
export const DISPOSICION = { arriba: [1, 2, 3, 4, 5], abajo: [6, 7, 8, 9, 10] }
```

Si tu sala es de otra forma (7 y 8 como el plano original, o una sola fila), cambiás
`DISPOSICION` y `camillas` y el plano se redibuja solo. El reformer es un SVG en
`PlanoSala.jsx` que toma el color de su estado, así que no hay imágenes que mantener.

### Identidad

Negro, blanco, gris cemento y el amarillo del rayo del logo. Los títulos van en Archivo
ancha y pesada, en mayúsculas; el texto, en Inter. Los colores salen de `:root` en
`styles.css`:

| token | valor | para qué |
| --- | --- | --- |
| `--amarillo` | `#fabf00` | acento: botones, estados activos, camilla elegida |
| `--amarillo-osc` | `#dca600` | hover, bordes y barras de progreso |
| `--amarillo-prof` | `#7d5c00` | texto de acento sobre fondo claro |
| `--amarillo-tinta` | `#2e2400` | texto sobre relleno amarillo |
| `--amarillo-suave` | `#fff5d1` | tarjetas y franjas claras |
| `--tinta` / `--tinta-media` | `#0b0b0a` / `#181713` | negro de marca y superficies oscuras |
| `--sala` | `#24231f` | el plano de la sala |
| `--hueso` | `#f6f5f2` | fondo general |
| `--salvia` / `--arcilla` | `#3f7550` / `#b2412f` | ok y alerta |

---

## Reglas de reserva

Las que hacen que los números cierren, todas verificadas en `npm test`:

- El **tope de 4 reservas activas** cuenta las reservas y también los lugares en lista
  de espera: una espera se vuelve reserva sola cuando se libera un cupo.
- Anotarse en espera **no descuenta** del plan todavía, pero exige tener clases. La
  clase se cobra **al entrar**, cuando alguien cancela y la cola corre.
- Entra el primero de la cola **que todavía tenga clases en el plan**; a quien entra se
  le avisa en su bandeja.
- Cancelar con **más de 2 h** devuelve la clase al plan; con menos, no.
- Si el studio **cierra un día** o **da de baja un horario**, las reservas futuras se
  cancelan, la clase vuelve al plan y queda el aviso. Las pasadas no se tocan.
- Los abonos **se renuevan solos el 1º de cada mes** (en producción lo haría el
  servidor; acá se pone al día al abrir la app).

---

## Probar y generar

```bash
npm test            # las reglas de arriba, contra la lógica de verdad
npm run marca       # regenera logos, fotos e iconos desde Assets/
```

`useStudio` es un hook, así que para probarlo fuera del navegador
`scripts/test.mjs` empaqueta `scripts/pruebas.mjs` reemplazando `react` por
`scripts/react-stub.js`: un React mínimo que guarda el estado y vuelve a correr el
hook hasta que se estabiliza. Se prueba el código real, no una copia de la lógica.

---

## Para pasarlo a producción

Todo vive en `localStorage` bajo la clave `pilates-studio-v4`. La forma de los datos ya es
la de una base real:

```js
usuarios: [{ id, nombre, email, telefono, rol, plan, preferencias, notas }]
reservas: { "2026-11-24|19:00": [{ id, usuarioId, camilla, creado, asistencia }] }
espera:   { "2026-11-24|19:00": [{ id, usuarioId, creado }] }
grilla:   { 1: [{ hora, tipo, docente }] }
fueraDeServicio: [4]
```

Para llevarlo a un backend (Supabase, Firebase, API propia) se reemplazan las funciones de
`useStudio` por llamadas al servidor. Tres cosas a resolver ahí:

1. **Carrera por la misma camilla**: dos personas pueden tocar la camilla 7 a la vez. Se
   resuelve en la base con un índice único sobre `(fecha, hora, camilla)`: la segunda
   inserción falla y se le avisa "alguien la tomó, elegí otra" (ese mensaje ya existe).
2. **Autenticación real**: hoy el PIN se guarda en texto plano en el navegador y no es
   seguridad de ningún tipo. En producción: login con OTP por WhatsApp/SMS (funciona muy
   bien para studios) o email + contraseña con hash del lado del servidor.
3. **Permisos**: el rol `admin` hoy sólo cambia la interfaz. En el servidor, cada acción
   del panel tiene que validar el rol.

Agregados naturales para la siguiente etapa: cobro del abono, aviso por WhatsApp al
liberarse un cupo, penalización automática por ausencias, feriados y excepciones en la
grilla, y reserva recurrente ("anotame todos los martes a las 19").
