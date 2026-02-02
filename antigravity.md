# Antigravity Local Execution Guide

This document explains how **Antigravity** (your AI Coding Assistant) has configured and is running the Prunebox application in your local environment.

## 🏗️ Environment Architecture

Prunebox is running in a **hybrid Windows/WSL2** environment:
- **OS**: Windows 11 (Host)
- **Runtime**: Ubuntu 22.04 (WSL2)
- **Database**: PostgreSQL & Redis via Docker (WSL2)
- **Application**: Next.js 15+ (Node.js v22.19.0)

## 🚀 Execution Workflow

Antigravity manages the application through two primary persistent terminal processes:

### 1. Main Next.js Dev Server
Running the frontend and API routes.
- **Command**: `npm run dev -- -p 3001`
- **Context**: Executed via `wsl bash` inside the project root.
- **URL**: [http://localhost:3001](http://localhost:3001)
- **Why Port 3001?**: Configured to avoid conflicts with standard local services and match the Google OAuth redirect URI configuration.

### 2. Background Task Workers
BullMQ workers that handle Gmail scanning and rollup generation.
- **Command**: `npm run worker`
- **Entry Point**: `src/modules/queues/workers.run.ts` (Managed via `tsx`)
- **Handles**: 
  - `EMAIL_SCAN`: Identifying subscriptions.
  - `UNSUBSCRIBE`: Automating one-click and mailto unsubs.
  - `ROLLUP`: Generating daily digest emails.

## 💾 Infrastructure Management

### Database & Redis
Managed via `docker-compose.yml`. 
- To start: `npm run docker:up`
- To stop: `npm run docker:down`
- **Prisma**: Database schema is synced using `npx prisma db push`.

### Seeding (Development Only)
When needed, the local database is populated with test data using:
- `npm run db:seed` (Executes `prisma/seed.ts`)

## 🔐 Authentication Config

- **Google OAuth**: Real Google login is active.
- **Environment**: `.env` is configured with `AUTH_URL`, `AUTH_SECRET`, and Google API credentials.
- **Trust Host**: Initialized with `trustHost: true` in the Auth configuration to ensure seamless redirection within the WSL environment.

## 🛠️ Performance Tuning (Antigravity Specific)

To improve scanning for large inboxes:
- **GMAIL_BATCH_SIZE**: Increased to 50 for parallel header processing.
- **SCAN_WINDOW**: Set to 90 days for Fast Scan, and unrestricted for Full Scan.
- **CONCURRENCY**: Background workers are configured with a concurrency of 5 to maximize throughput without hitting Gmail rate limits too quickly.
