# L'Oréal Claims Intelligence Engine

A runnable assessment prototype for comparing cosmetic product claims with clinical study evidence. It uses React, NestJS, Prisma, PostgreSQL, and the OpenAI Responses API and returns a structured recommendation with confidence and reasoning.

## What is included

- `POST /api/claims/assess` with validation, OpenAI Structured Outputs, persistence, and human-review routing
- Prisma `Claim` and `Assessment` models plus an initial PostgreSQL migration
- Responsive React assessment UI with loading, error, result, confidence, and trace states
- API and UI unit tests
- [Technical proposal](docs/technical-proposal.md)
- [Architecture diagram and runtime sequence](docs/architecture.md)

## Prerequisites

- Node.js 20 or later
- pnpm 10
- Docker Desktop or another PostgreSQL 16 instance
- An OpenAI API key

## Run locally

```bash
cp .env.example .env
# Add OPENAI_API_KEY to .env
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:3000/api`.

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp` if desired.

## API contract

```http
POST /api/claims/assess
Content-Type: application/json
```

```json
{
  "claim": "Reduces the appearance of wrinkles by 20% in 4 weeks",
  "productFormula": "Leave-on emulsion containing 0.3% encapsulated retinol...",
  "evidence": "Randomized, evaluator-blinded, vehicle-controlled study..."
}
```

Successful response:

```json
{
  "claimId": "cm...",
  "assessmentId": "cm...",
  "justified": true,
  "confidence": 0.91,
  "reasoning": "The controlled endpoint, effect magnitude and timeframe align with the claim.",
  "reviewRequired": false,
  "assessedAt": "2026-11-01T10:00:00.000Z"
}
```

Confidence below `0.70` sets the claim status to `REVIEW_REQUIRED`. This is decision support; an evaluator remains responsible for approval.

## Commands

```bash
pnpm build       # compile API and production web bundle
pnpm test        # run API and UI tests
pnpm lint        # strict TypeScript checks
pnpm db:studio   # inspect persisted records
```

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection | local Docker database |
| `OPENAI_API_KEY` | Server-side OpenAI credential | required |
| `OPENAI_MODEL` | Model used for structured assessment | `gpt-4o-mini` |
| `PORT` | API port | `3000` |
| `WEB_ORIGIN` | Allowed browser origin | `http://localhost:5173` |
| `VITE_API_URL` | Browser API base URL | `http://localhost:3000/api` |

## Repository structure

```text
apps/api/                 NestJS API, Prisma schema, migration and tests
apps/web/                 React/Vite assessment UI and test
docs/architecture.md      Mermaid diagram and boundary rationale
docs/technical-proposal.md Business process, research, design and roadmap
docker-compose.yml        Local PostgreSQL
```

## Production considerations

Before production use, add authentication and role-based permissions, encrypted evidence storage, jurisdiction and privacy review, idempotency, request tracing, rate limiting, model timeouts/retries, a labelled scientific evaluation suite, reviewer overrides, and end-to-end audit logging. Do not use the model response as autonomous regulatory approval.
