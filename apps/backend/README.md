# SourceTrace Backend

Render-targeted ingestion and redirect service.

## Endpoints

1. `GET /health`
2. `GET /r/:slug`
3. `POST /api/mobile/install`
4. `POST /api/events`
5. `POST /api/mobile/skan`
6. `POST /api/costs`

## Local Run

```bash
copy .env.example .env
npm install
npm run prisma:generate
npm run dev
```

Server default port: `8080`.

