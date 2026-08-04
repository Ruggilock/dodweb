# DevOpsDays Lima 2026 — Speaker Dashboard

Dashboard interno (con login) que muestra en vivo los speakers, charlas y agenda de
DevOpsDays Lima 2026, consumiendo directamente la API de Pretalx — sin base de datos.

Fondo de decisiones y modelo de datos completo en [`PRETALX.md`](./PRETALX.md).
Design system (colores, tipografía, tokens) en [`DESIGN.md`](./DESIGN.md).

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4**, theme mapeado 1:1 a los tokens de `DESIGN.md`
- **iron-session** — cookie de sesión cifrada, sin base de datos
- **Pretalx REST API** como única fuente de datos (fetch server-side, cacheado 5 min)

## Correr en local

```bash
bun install
bun dev
```

Abre [http://localhost:3000](http://localhost:3000). Te redirige a `/login`.

## Variables de entorno

Viven en `.env.local` (gitignorado, nunca se commitea). Copia estos valores al
configurar un nuevo entorno (Vercel, otra máquina, etc):

| Variable | Descripción |
|---|---|
| `PRETALX_BASE_URL` | `https://talks.devopsdays.org` |
| `PRETALX_EVENT_SLUG` | `devopsdays-lima-2026` |
| `PRETALX_API_TOKEN` | Token de organizador de Pretalx (nunca exponer en el cliente) |
| `AUTH_USER` | Usuario para entrar al dashboard |
| `AUTH_PASS` | Contraseña para entrar al dashboard |
| `SESSION_SECRET` | Clave de 32+ caracteres para cifrar la cookie de sesión (`openssl rand -base64 32`) |

## Deploy en Vercel

1. Conecta el repo (`github.com/Ruggilock/dodweb`) a un proyecto nuevo en Vercel.
2. En **Settings → Environment Variables**, agrega las 6 variables de la tabla de
   arriba (con los valores reales de `.env.local`, no los subas al repo).
3. Deploy. No hace falta configurar nada más — no hay base de datos ni servicios
   externos aparte de Pretalx.

## Estructura

```
app/
  login/                 # /login — form + server action
  (dashboard)/
    page.tsx             # /        — overview / stats
    speakers/page.tsx     # /speakers — grid de speakers
    talks/page.tsx         # /talks    — lista de charlas (filtro por estado)
    agenda/page.tsx         # /agenda   — agenda por día
  api/refresh/route.ts      # POST — fuerza revalidación del cache de Pretalx
lib/
  pretalx.ts                # cliente de la API, joins, filtrado de PII
  session.ts                  # config de iron-session
  types.ts                     # tipos del dominio
components/                    # Badge, StateBadge, StatCard, NavBar, RefreshButton
proxy.ts                        # gate de auth (antes "middleware.ts" en Next <16)
```

## Privacidad

`lib/pretalx.ts` solo pide las preguntas custom de Pretalx marcadas como públicas
(Company, Job Title, Location, LinkedIn, Social Networks). Teléfono, documento de
identidad, talla de polo y notas del comité **nunca se solicitan** a la API — no es
un filtro post-fetch, simplemente esos endpoints no se llaman. Detalle completo en
`PRETALX.md`.

## Refresh de datos

Cada fetch a Pretalx cachea 5 minutos. Para forzar una actualización inmediata sin
esperar el TTL, usa el botón **Refrescar** en la barra superior (llama a
`POST /api/refresh`, que invalida el cache).
