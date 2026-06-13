# LedgerPulse

A FinTech dashboard for freelancers and small businesses that ingests unstructured transaction data, uses an LLM to parse and structure it, runs cashflow forecasting, and visualizes everything in a real-time UI.

## Architecture

```
LedgerPulse/
├── backend/                    # Fastify API server + BullMQ workers
│   ├── src/
│   │   ├── config/             # Environment configuration (Zod validated)
│   │   ├── lib/                # Prisma, Queue, LLM, SSE utilities
│   │   ├── routes/             # API route handlers
│   │   ├── workers/            # BullMQ background worker
│   │   ├── types/              # TypeScript interfaces
│   │   └── server.ts           # Entry point
│   ├── prisma/                 # Database schema + seed
│   └── uploads/                # Local file storage
├── frontend/                   # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── lib/                # API client, utilities
│   │   ├── types/              # TypeScript interfaces
│   │   └── App.tsx             # Main dashboard
│   └── public/
└── docker-compose.yml          # PostgreSQL + Redis
```

## Quick Start

### Prerequisites
- Node.js 20+
- Docker (for PostgreSQL + Redis)
- OpenAI API key

### 1. Start Infrastructure
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env          # Fill in your OPENAI_API_KEY
npm install
npx prisma generate
npx prisma db push
npm run db:seed               # Populate test data
npm run dev                   # API server on :3001
```

In a separate terminal:
```bash
cd backend
npm run worker                # Background processor
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev                   # UI on :5173
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ingest/webhook` | Ingest raw webhook payload |
| POST | `/api/v1/ingest/upload` | Upload PDF/image receipt |
| GET | `/api/v1/analytics/cashflow` | Cashflow data + 30-day forecast |
| GET | `/api/v1/analytics/categories` | Expense breakdown by category |
| GET | `/api/v1/analytics/summary` | Transaction summary stats |
| GET | `/api/v1/events` | SSE stream for real-time updates |
| GET | `/api/v1/health` | Health check |

## Webhook Format

```bash
curl -X POST http://localhost:3001/api/v1/ingest/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer whsec_your_secret_here" \
  -d '{"text": "Payment to Stripe Inc. on 2024-01-15 for $49.99 USD"}'
```

## Tech Stack

- **Backend**: Fastify, Prisma, BullMQ, OpenAI
- **Frontend**: React, Vite, Tailwind CSS, Recharts
- **Database**: PostgreSQL
- **Queue**: Redis + BullMQ
- **Real-time**: Server-Sent Events
