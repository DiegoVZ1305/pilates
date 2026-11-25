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
| Alumna | `demo@pilates.com` | `1234` | Reservar, mis clases, docentes, perfil |
| Studio | `studio@pilates.com` | `1111` | Todo lo anterior + el panel de administración |

También se puede crear una cuenta nueva desde cero (dos pasos: datos y PIN + plan).

---

## Lo que incluye

### Sitio público (landing)
Lo primero que ve alguien que entra sin cuenta, en la línea de los studios de pilates
que suelen publicarse con Mindbody:
- **Hero** a pantalla completa con el nombre en tipografía display y botones de reserva.
- **Manifiesto** en franja rosa empolvado, **tres pilares** (flexibilidad, fuerza, resistencia)
  y la **grilla de tipos de clase**.
- **¿Por qué nosotros?** en crema rosado, con el plano de la sala dibujado como argumento de
  venta ("elegís tu camilla").
- **Frase** a todo ancho, **coaches** con las fichas del equipo y **paquetes** con precios.
- **Horarios reales**: muestra la disponibilidad de verdad de los próximos días, tomada
  del mismo estado que usa la app. Cada botón lleva al login.
- **Footer** con dirección, horario de atención, redes y accesos a reservar.
- Las secciones tienen deep link (`/#horarios`, `/#paquetes`) para compartir.

**Fotos**: el sitio funciona sin ninguna imagen — donde va una foto se dibuja un bloque
gráfico. Para poner las reales, dejá los archivos en `public/fotos/` y cargá la ruta en
`FOTOS` dentro de `src/lib/config.js` (hay instrucciones en `public/fotos/LEEME.txt`).
Los textos, la dirección y los pilares salen de `SITIO` en el mismo archivo.

### Cuenta y acceso
- Entrar con email + PIN, o crear cuenta en dos pasos con validación de cada campo.
- Elección de plan al registrarse.
- Menú de usuario en el header con perfil, mis clases y cerrar sesión.

### Reservar

El flujo es **semana → día → horario**, en ese orden y en una sola pantalla.

- **Calendario por semana**: los siete días de lunes a domingo, con flechas para pasar a
  la semana siguiente (se reservan 14 días, así que son dos semanas y media). Cada día
  muestra cuántos **lugares libres** le quedan y una barrita de ocupación, los cerrados
  quedan apagados y un punto rosa marca los días en los que ya tenés clase.
- **Filtros a la vista**: un renglón de clases y otro de profes, con la foto de cada una.
  Lo que ese día no se da aparece deshabilitado, así que no se puede filtrar hasta dejar
  la lista vacía. Se suma el check de "solo con lugar".
- **Horarios del día en lista**, partidos en **mañana** y **tarde** y ordenados por hora.
  Cada fila trae la hora y la duración, el tipo y el nivel, **quién da la clase** (foto,
  nombre y especialidad), el estado (*N libres*, *completa*, *tu camilla*, *en espera*,
  *terminada*), el mini plano de las 10 camillas y el botón de reserva.
- Si el studio no abre ese día, el estado vacío ofrece el **próximo día con clases**.
- Banner con **tu próxima clase** y cuánto falta, que abre el plano directo.
- La **camilla favorita** del perfil viene preseleccionada al abrir el plano (si está
  libre), y la **profe favorita** aparece primera entre los filtros y con una estrella
  en los horarios que da. No se filtra sola: el orden por hora manda al elegir.
- **Cancelar pide confirmación** y dice antes qué pasa con la clase: vuelve al plan, o
  no vuelve si faltan menos de 2 h. Se puede cancelar desde la fila de "mis clases",
  sin abrir el plano.
- **Bandeja de avisos**: si entrás desde la lista de espera o el studio cierra tu día,
  te queda el aviso arriba de "mis clases" con un punto en la pestaña.
- **Repetir semanal**: desde un horario guardado se reservan de una vez todas las
  fechas que entren en los próximos 14 días, con tu camilla de siempre cuando está
  libre, respetando el plan y el tope de reservas.

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

### Mis clases
- **Próximas**: con camilla, cuánto falta y acceso al plano.
- **Guardadas**: horarios fijos de la semana marcados como favoritos (★ en el plano),
  con la ocupación de la próxima fecha, botón para reservar de un toque y **Repetir
  semanal** para tomar de una vez todas las fechas que entren en los próximos 14 días.
- **Historial**: clases pasadas con asistencia (*asististe* / *faltaste*), más estadísticas:
  clases hechas, racha sin faltar, ausencias y clase favorita.

### Docentes
- Ficha de cada profe: especialidad, bio, años en el studio, reservas acumuladas y sus
  próximas clases, clickeables para ir al plano.

### Perfil
- Datos editables, incluido un campo de **lesiones / cosas a tener en cuenta** que el
  docente ve en su lista de asistencia.
- **Plan**: clases restantes con barra de progreso y cambio de plan. Reservar descuenta
  una clase; cancelar con más de 2 h la devuelve, cancelar sobre la hora no.
- **Preferencias**: camilla favorita, docente favorito y recordatorio 2 h antes.
- Actividad: clases hechas, ausencias, clase y docente más frecuentes.

### Panel del studio (admin)
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
    Landing.jsx       sitio público: hero, paquetes, horarios, footer
    Auth.jsx          entrar y crear cuenta
    Reservar.jsx      semana, filtros y lista de horarios del día
    ClaseDetalle.jsx  pantalla grande de la clase
    PlanoSala.jsx     el plano y el dibujo SVG del reformer
    MisClases.jsx     próximas, guardadas e historial
    Docentes.jsx      fichas del equipo
    Perfil.jsx        datos, plan, preferencias y actividad
    Admin.jsx         agenda, grilla, sala y alumnos
    ui.jsx            modal, avatar, chip, stat, campo, barra, vacío, aviso, confirmar
  App.jsx          sesión, navegación y modal de clase
  styles.css       todo el diseño (rosa empolvado / crema / tinta malva, responsive)
scripts/
  pruebas.mjs      las reglas de reserva, espera, cierres y avisos
  react-stub.js    React mínimo para correr el hook en Node
  test.mjs         empaqueta y corre las pruebas (npm test)
  iconos.mjs       genera el favicon, los PNG y el manifest (npm run iconos)
public/
  icono.svg · icono-192.png · icono-512.png · apple-touch-icon.png
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

### Paleta

Toda la paleta sale de los tokens de `:root` en `styles.css`, así que para recolorear el
studio entero alcanza con tocar esas lineas:

| token | valor | para qué |
| --- | --- | --- |
| `--rosa` | `#e7b9be` | acento principal: botones, estados activos, camilla elegida |
| `--rosa-osc` | `#d6a2a9` | hover del botón primario, bordes y barras de progreso |
| `--rosa-prof` | `#8e5a63` | rosa legible: eyebrows, chips y textos chicos sobre claro |
| `--rosa-tinta` | `#6a4850` | texto cuando apoya sobre un relleno rosa pleno |
| `--rosa-suave` | `#fbeff1` | franjas y tarjetas rosas (manifiesto, "por qué nosotros") |
| `--tinta` | `#4c3f46` | el "negro" de la marca: un plomo cálido de fondo malva |
| `--tinta-media` | `#5e4f57` | superficies oscuras suaves: pie, paquete destacado, CTA |
| `--sala` | `#645660` | las paredes del plano de la sala |
| `--hueso` | `#faf6f5` | fondo general, crema rosada |
| `--salvia` / `--arcilla` | `#5d7b68` / `#a8625a` | ok y alerta, también rebajados |

No hay negro ni blanco puros fuera de `--blanco`: los velos sobre fotos y las sombras
están teñidos con el malva de `--tinta` para que nada corte.

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
npm run iconos      # regenera el favicon y los iconos de pantalla de inicio
```

`useStudio` es un hook, así que para probarlo fuera del navegador
`scripts/test.mjs` empaqueta `scripts/pruebas.mjs` reemplazando `react` por
`scripts/react-stub.js`: un React mínimo que guarda el estado y vuelve a correr el
hook hasta que se estabiliza. Se prueba el código real, no una copia de la lógica.

`scripts/iconos.mjs` dibuja el monograma C40 con formas y escribe
`public/icono.svg`, los PNG y el `manifest.webmanifest`, todo desde la misma
geometría. Si cambia la paleta, se cambian los dos colores de arriba del script y se
vuelve a correr.

---

## Para pasarlo a producción

Todo vive en `localStorage` bajo la clave `pilates-studio-v3`. La forma de los datos ya es
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
