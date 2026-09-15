# KeoTheThao

Monorepo Node.js cho du an web KeoTheThao.

## Stack

- Frontend: Next.js / React
- Backend: Node.js + NestJS
- Database: PostgreSQL
- ORM: TypeORM
- Migration: TypeORM Migration
- Auth: JWT
- API: REST API

## Cau truc

```text
apps/
  api/   NestJS REST API
  web/   Next.js frontend
```

## Yeu cau

- Node.js 22+
- npm 10+
- Docker Desktop hoac PostgreSQL local

## Cai dat

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run db:up
npm run api:migration:run
npm run dev
```

Mac/Linux dung `cp`; Windows PowerShell co the dung:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
```

## Lenh hay dung

```bash
npm run dev                 # chay web va api
npm run build               # build tat ca workspace
npm run lint                # lint tat ca workspace
npm run db:up               # bat PostgreSQL bang Docker
npm run db:down             # tat PostgreSQL
npm run api:migration:run   # chay migration backend
```

## URL local

- Web: http://localhost:3000
- API: http://localhost:3001/api
- Health check: http://localhost:3001/api/health

## Migration

Backend dung TypeORM. Entity dat trong `apps/api/src/**/*.entity.ts`, migration dat trong `apps/api/src/database/migrations`.

Tao migration moi sau khi sua entity:

```bash
npm run api:migration:generate -- src/database/migrations/TenMigration
```

Chay migration:

```bash
npm run api:migration:run
```

