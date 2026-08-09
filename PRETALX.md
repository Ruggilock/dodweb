# Pretalx — Fuente de datos del Speaker Dashboard

Conocimiento acumulado sobre la API de Pretalx para DevOpsDays Lima 2026, de cara a construir un dashboard que consuma los datos **en vivo** (sin base de datos propia).

## Conexión

```
Base:  https://talks.devopsdays.org
Event: devopsdays-lima-2026
API:   https://talks.devopsdays.org/api/events/devopsdays-lima-2026/
Auth:  Authorization: Token <PRETALX_API_TOKEN>
```

El token es de **nivel organizador** (orga), no público: expone campos extra que la API pública no da (`internal_notes`, `has_arrived`, `review_code`, `reviews`, respuestas a preguntas privadas, etc).

Credenciales reales están en `.env.local` (gitignorado, **nunca** commitear el token). Variables:
- `PRETALX_BASE_URL`
- `PRETALX_EVENT_SLUG`
- `PRETALX_API_TOKEN`

> **Nota:** la API de Pretalx (via curl) rechaza requests sin un User-Agent normal — `urllib` de Python default da 403. Usar `curl` o un cliente HTTP que mande headers estándar.

## Endpoints relevantes

| Endpoint | Uso |
|---|---|
| `/speakers/` | 113 speakers — perfil, bio, avatar, respuestas a preguntas |
| `/submissions/` | 165 charlas — título, estado, track, tipo, tags, speakers |
| `/questions/` | Preguntas custom del CFP (ver tabla abajo) |
| `/tracks/` | 6 tracks |
| `/submission-types/` | Tipos de sesión (Talk, Workshop, Keynote, etc.) |
| `/tags/` | 4 tags de nivel de dificultad |
| `/rooms/` | 6 salas |
| `/slots/` | **Agenda publicada** — día, hora, sala por charla (ver abajo) |
| `/schedules/` | Versiones del schedule (12 versiones, actual: `latest`) |

Todos paginan con `?page=N` (o siguen el campo `next` de la respuesta). **No** soporta `?limit=` custom (devuelve 403).

## Modelo de datos

### Speaker
Campos nativos: `code`, `name`, `biography`, `avatar_url`, `email`, `timezone`, `locale`, `has_arrived`, `internal_notes`, `submissions` (códigos de charlas), `answers` (IDs de respuestas a preguntas).

Preguntas custom con `target: speaker`:

| ID | Pregunta | Tipo | Clasificación |
|---|---|---|---|
| 385 | Company | string | ✅ pública |
| 386 | Job Title | string | ✅ pública |
| 387 | Location | string | ✅ pública |
| 388 | LinkedIn | url | ✅ pública |
| 398 | Social Networks / Public Profile | url | ✅ pública |
| 401 | Phone number | string | 🔒 interna — solo `/speakers/[code]` y `/pendientes` |
| 463 | Identity document (tipo y número) | string | 🔒 interna — solo `/speakers/[code]` y `/pendientes` |
| 464 | T-shirt size | choices | 🔒 interna — solo `/speakers/[code]` y `/pendientes` |

Estas tres SÍ se piden a la API (a diferencia de `399` "Notas para el comité", que nunca se fetchea) pero solo se renderizan en las dos vistas internas — nunca en el grid público de `/speakers`. Ver `INTERNAL_SPEAKER_QUESTIONS` en `lib/pretalx.ts`.

### Submission (charla)
Campos nativos: `code`, `title`, `abstract`, `speakers[]`, `submission_type`, `track`, `tags[]`, `state`, `duration`, `slots`, `resources` (slides), `answers`, `created`, `updated`.

`state` values observados: `confirmed`, `submitted`, `withdrawn`, `canceled`, `rejected`.

Preguntas custom con `target: submission`:

| ID | Pregunta | Tipo | Clasificación |
|---|---|---|---|
| 382 | ¿Has sido speaker antes? | choices | interna (screening) |
| 383 | ¿Usar como muestra en mentoring? | boolean | interna |
| 384 | ¿Quién creó esta presentación? | choices | interna |
| 396 | Link a charla previa | url | interna |
| 397 | ¿Primera vez en DevOpsDays? | choices | interna |
| 399 | Notas para el comité | text | 🔒 nunca se fetchea |
| 462 | Slides | file | ⚙️ tracked en `/pendientes` (2/165 subidas a la fecha del último check) |

### Tracks (6)
`Platform Engineering & DevOps` (200) · `Enterprise AI & Data Strategy` (202) · `Security & Technology Transformation` (201) · `Modern Leadership & Culture` (199) · `Event` (229) · `Lightning talk` (230)

### Tipos de sesión (6, uno agregado durante la planeación)
| Tipo | Duración | id |
|---|---|---|
| Talk | 25 min | 366 |
| Workshops | 90 min | 372 |
| Event | 30 min | 424 |
| Panel | 40 min | 428 |
| Demo session | 20 min | 432 |
| **Keynote** *(agregado después)* | 30 min | 463 |

### Tags (4, nivel de contenido)
`1. Introductory` · `2. Intermediate` · `3. Advanced / Scale` · `4. Leadership / Strategy` (cada uno con color hex propio, ver API).

### Agenda / Schedule (`/slots/`)
La agenda **ya está publicada** (versión `0.11`, 12 versiones de historial). Cada slot:

```json
{ "id": 22156, "room": 286, "start": "2026-08-27T08:00:00-05:00",
  "end": "2026-08-27T08:30:00-05:00", "submission": "W8D3KN",
  "schedule": 589, "duration": 30, "is_visible": true }
```

- `submission` referencia el `code` de la charla (join con `/submissions/`).
- El campo `slots: [id]` dentro de cada submission apunta a estos IDs — **no** trae día/hora directo, hay que resolverlo contra `/slots/`.
- **112 slots totales**, 111 con día/hora/sala asignados, 1 sin publicar (`is_visible: false`, sin `room`/`start`).
- Distribución: **60 slots el 27-ago**, **51 el 28-ago**.
- Por sala: Main Room 35 · Terrace 22 · Room A/B/C ~16 c/u · Workshop room 6.
- También existe un feed público sin auth con room/day/hora ya resuelto (útil como referencia, no como fuente principal): `GET https://talks.devopsdays.org/devopsdays-lima-2026/schedule/widget/v2.json`

**Implicación para el dashboard:** sí se puede mostrar "speaker X → charla Y → día/hora/sala Z". El join es: `speaker.submissions[]` → `submission.code` → `slot.submission == code` → `slot.start/end/room`.

## Snapshot de datos (referencia, no autoritativo — el dashboard debe leer en vivo)

> Capturado durante la sesión de planeación. Los números cambian a medida que avanza el CFP — **no hardcodear**, siempre pull en vivo.

- **113 speakers**, **165 submissions**
- Estados: 97 `confirmed` · 61 `submitted` · 3 `withdrawn` · 2 `canceled` · 2 `rejected`
- Por tipo (confirmadas / en revisión / total):
  - Talk: 60 / 51 / 117
  - Demo session: 18 / 1 / 19
  - Workshops: 3 / 9 / 13
  - Event: 7 / 0 / 7
  - Keynote: 6 / 0 / 6
  - Panel: 3 / 0 / 3

## Plan del dashboard

**Stack elegido:** Next.js en **Vercel**. Sin base de datos — todo se hace *pull* en vivo (o cacheado con revalidación) directo a la API de Pretalx desde una API route / server component.

**Auth:** gate simple usuario/contraseña (no multi-usuario), sin DB:
- Credenciales en env vars (`AUTH_USER` / `AUTH_PASS`)
- `middleware.ts` intercepta rutas protegidas, valida cookie de sesión firmada (httpOnly)
- `/login` compara contra las env vars y setea la cookie

**Vistas implementadas:**
1. **`/speakers`** — grid con avatar, nombre, company, job title, ubicación, charla(s) asociadas. Solo campos públicos. Filtros por estado (Confirmados por defecto) y por track. Cada card linkea al detalle.
2. **`/speakers/[code]`** — detalle de un speaker: bio, contacto (email/teléfono/LinkedIn/redes), **logística interna** (talla de polo, DNI — con badge "Falta" si no están), y sus charlas con estado, horario y status de láminas.
3. **`/talks`** — título, track, tipo (badge "Keynote" destacado, junto con Talk/Workshop/Panel/Demo — no separado), duración, tag de nivel, estado (Confirmadas por defecto), día/hora/sala (join con `/slots/`). Excluye submissions tipo "Event" (registro, bienvenida, almuerzo, cierre — son bloques de programa, no charlas).
4. **`/agenda`** — timeline agrupado por día (27/28 ago) y sala, incluye los bloques "Event" (sí pertenecen aquí).
5. **`/` (Overview)** — conteos por track, por tipo, confirmadas vs en revisión.
6. **`/pendientes`** — dashboard de logística para charlas/speakers **confirmados**: barras de completitud (%) + listado de quién falta, para tres cosas: láminas subidas (por charla), talla de polo (por speaker), DNI (por speaker).

**Decisiones tomadas:**
- Keynote va agrupado con Talks en `/talks` (badge distinto), no en sección separada.
- Sí se incluyó el panel interno de logística — vive en `/speakers/[code]` y `/pendientes`, detrás del mismo login (no hay segundo nivel de acceso). El grid público (`/speakers`) sigue sin mostrar esos campos.
- Cache: fetch-level `revalidate: 300` en `lib/pretalx.ts` + páginas en `force-dynamic` (no prerender en build time — evita que el build dependa de que la API de Pretalx esté disponible). Botón "Refrescar" en el nav fuerza `revalidateTag`.

## MCP

`app/api/mcp/route.ts` expone un servidor MCP **público, sin auth, sin token — ni siquiera el `PRETALX_API_TOKEN` del organizador**. Excluido a propósito del login gate en `proxy.ts` (matcher con `|api/mcp`). Transporte: Streamable HTTP stateless (`WebStandardStreamableHTTPServerTransport`, sin `sessionIdGenerator`), un `McpServer` nuevo por request.

**Fuente de datos: la API pública real de Pretalx, no la de organizador.** `lib/pretalx-public.ts` pega directo contra `talks.devopsdays.org` **sin mandar ningún header `Authorization`** — son los mismos endpoints que usaría cualquier página pública del evento. Verificado a mano cuáles preguntas custom expone Pretalx sin token (con `?expand=answers.question`):

| Campo | ¿Público sin token? |
|---|---|
| Company, Job Title, Location, LinkedIn | ✅ sí |
| Social Networks, Phone, DNI, Talla de polo | ❌ no — Pretalx los bloquea igual, no es algo que filtremos nosotros |
| Todas las preguntas a nivel de charla (incl. Slides) | ❌ no — por eso el MCP no tiene `slidesUrl` |
| `/speakers/`, `/submissions/`, `/tracks/`, `/submission-types/`, `/rooms/`, `/slots/`, evento base | ✅ sí, sin token |
| `/answers/` y `/tags/` como endpoints sueltos | ❌ no (401) — por eso se usa `?expand=` en vez de pedirlos aparte |

**Regla de oro:** el MCP nunca toca `lib/pretalx.ts` (el cliente autenticado del dashboard). Todo pasa por `lib/pretalx-public.ts` → `lib/mcp-data.ts`. Si se agrega un tool nuevo, debe consumir `lib/mcp-data.ts`, nunca `lib/pretalx.ts` — así el límite de "cero token" queda garantizado por qué archivo importas, no por disciplina manual.

Alcance: solo **confirmados** (charlas y speakers), excluye submissions tipo "Event" en `list_talks`/`list_speakers` (sí aparecen en `get_agenda`, igual que en el dashboard). Solo lectura, sin tools de escritura.

**Tools (9):** `list_speakers`, `get_speaker`, `list_talks`, `get_talk`, `get_agenda`, `list_tracks`, `list_session_types`, `get_event_info`, `search`.

Probado end-to-end con un cliente MCP real (`@modelcontextprotocol/sdk` `Client` + `StreamableHTTPClientTransport`), incluyendo un chequeo automatizado de que ningún campo de PII aparece en la respuesta de `list_speakers`.
