# Hlasovací aplikace (Nest + MySQL + React/TS/Vite)

Jednootázková anketa se 3 odpověďmi, zobrazením výsledků bez hlasování a resetem přes token.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: NestJS (REST)
- Databáze: MySQL 8
- Orchestrace: Docker Compose

## Otázka ankety

**Kolik otevřených záložek je ještě normální?**

- a) 1–5 záložek, jsem minimalista
- b) 6–15 záložek, pořád v pohodě
- c) 16+ záložek, chaos je moje workflow

## Struktura projektu

```text
HlasovaciAplikace/
├─ anketa-wireframe.drawio
├─ docker-compose.yml
├─ .gitignore
├─ README.md
├─ backend/
│  ├─ Dockerfile
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ nest-cli.json
│  ├─ .env
│  ├─ .env.example
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ migrations/
│  │     ├─ migration_lock.toml
│  │     └─ 20260223120000_init/migration.sql
│  └─ src/
│     ├─ main.ts
│     ├─ app.module.ts
│     └─ poll/
│        ├─ poll.module.ts
│        ├─ poll.controller.ts
│        ├─ poll.service.ts
│        ├─ prisma.service.ts
│        └─ dto/
│           ├─ vote.dto.ts
│           └─ reset.dto.ts
├─ frontend/
│  ├─ Dockerfile
│  ├─ nginx.conf
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ vite.config.ts
│  ├─ index.html
│  ├─ .env
│  ├─ .env.example
│  └─ src/
│     ├─ main.tsx
│     ├─ App.tsx
│     ├─ api/pollApi.ts
│     ├─ components/
│     │  ├─ PollQuestion.tsx
│     │  ├─ ResultsPanel.tsx
│     │  └─ ResetPanel.tsx
│     ├─ types/poll.ts
│     └─ styles/app.css
└─ logs/
   ├─ backend/
   │  ├─ app.log
   │  └─ error.log
   └─ frontend/
      └─ dev.log
```

## Kde je co

- Kód backendu: `backend/src`
- Kód frontendu: `frontend/src`
- Konfigurace backendu: `backend/.env`
- Konfigurace frontendu: `frontend/.env`
- Databázový model a migrace: `backend/prisma`
- Logy (doporučené umístění): `logs/backend`, `logs/frontend`

## Endpointy API

Base URL backendu: `http://localhost:40161`

### `GET /api/poll`

- Vrací otázku, možnosti a aktuální výsledky.
- Používá se i pro „Zobrazit výsledky“ bez hlasování.

### `POST /api/poll/vote`

- Uloží hlas a vrátí aktualizované výsledky.
- Body:

```json
{ "optionId": 2 }
```

### `POST /api/poll/reset`

- Vynuluje všechny hlasy pouze při správném tokenu.
- Body:

```json
{ "token": "MY_SECRET_RESET_TOKEN" }
```

## Porty (v rámci 40160–40170)

- `40160` → frontend (Nginx + React app)
- `40161` → backend (Nest API)
- `40162` → MySQL

## Spuštění přes Docker

Požadavek: nainstalovaný Docker + Docker Compose plugin.

V kořeni projektu spusť:

```bash
docker compose up -d --build
```

Potom otevři:

- Aplikace: `http://localhost:40160`
- API test: `http://localhost:40161/api/poll`

Zastavení:

```bash
docker compose down
```

Kompletní smazání dat DB volume:

```bash
docker compose down -v
```

## RESET_TOKEN

Defaultně je nastavený v `docker-compose.yml` na:

`MY_SECRET_RESET_TOKEN`

Na serveru ho změň před nasazením na vlastní tajnou hodnotu.

## Vytvoření TAR archivu

Archiv bez `node_modules` vytvoříš v kořeni projektu:

```bash
tar -cf HlasovaciAplikace.tar .
```

Na serveru pak:

```bash
tar -xf HlasovaciAplikace.tar
cd HlasovaciAplikace
docker compose up -d --build
```

## Pokrytí požadavků

- F1 Hlasování: splněno (`POST /api/poll/vote`)
- F2 Zobrazení výsledků bez hlasu: splněno (`GET /api/poll`)
- F3 Reset tokenem: splněno (`POST /api/poll/reset`)
- Sdílená persistentní data: splněno (MySQL + volume)
