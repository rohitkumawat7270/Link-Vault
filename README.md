# LinkVault

I built LinkVault to share text and files securely for a short time. I support password‑protected links, one‑time view/download, max view limits, and automatic expiry.

- I run a Node.js/Express API with Multer for uploads and MongoDB (Mongoose) for metadata and JWT auth.
- I ship a React (Vite) frontend with Tailwind‑based components.

## Features
- I accept either text or a file and return a shareable link.
- I enforce an expiry window (10 minutes → 24 hours).
- I optionally require a password to access the content.
- I can restrict access to a single view/download or cap total views.
- I include auth so I can list and delete my own uploads.
- I run a cleanup job to purge expired records/files.

## Requirements
- I expect Node.js 18+ and npm 9+.
- I expect a MongoDB connection (Atlas or local).

## Setup Instructions
I keep dev defaults in examples; copy them and set your values.

backend/.env
```
MONGODB_URI=your-mongodb-uri
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace-with-a-strong-secret
```

frontend/.env
```
VITE_API_URL=http://localhost:5001/api
```

Note: on macOS, ControlCenter sometimes binds to port 5000; I default the API to 5001 in development to avoid conflicts.

### Install & Run
From the project root, I install and start both apps with:

```
npm run install-all
npm run dev
```

- I serve the frontend at http://localhost:5173
- I expose a health check at http://localhost:5001/health

## API Overview
- Base URL: `http://localhost:5001/api`

- Content
  - `POST /upload` (multipart/form-data)
    - Fields: `text` OR `file`; optional `expiryMinutes` (number), `password` (string), `isOneTimeView` ('true'), `maxViews` (number)
    - Response: `201 { success, data: { contentId, url, type, expiresAt, expiresIn } }`
  - `POST /content/:id`
    - Body: `{ password?: string }`
    - Response: `200 { success, data }` or `401 { requiresPassword: true }` or `404/410`
  - `GET /download/:id`
    - Streams file (attachment); errors: `404` not found, `410` expired/view-limit
  - `DELETE /content/:id` (auth required)
    - Marks content deleted if requester is the owner
  - `GET /my-uploads` (auth required)
    - Returns my uploads

- Auth
  - `POST /auth/register` → `{ username, email, password }` → token + user
  - `POST /auth/login` → `{ email, password }` → token + user
  - `GET /auth/me` (Bearer token) → user profile

Authorization header: `Authorization: Bearer <token>`

## API Quickstart (curl)
- Upload text
```
curl -s -X POST -F "text=hello" -F "expiryMinutes=10" \
  http://localhost:5001/api/upload | jq
```

- Upload a file
```
curl -s -X POST -F "file=@backend/server.js" -F "expiryMinutes=10" \
  http://localhost:5001/api/upload | jq
```

- Upload a password‑protected file
```
curl -s -X POST -F "file=@backend/server.js" -F "password=secret123" \
  http://localhost:5001/api/upload | jq
```

- View content (with optional password)
```
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"password":"secret123"}' \
  http://localhost:5001/api/content/<contentId> | jq
```

- Download a file
```
curl -i http://localhost:5001/api/download/<contentId>
```

## Troubleshooting
- If uploads fail with 403, I verify the frontend uses `VITE_API_URL=http://localhost:5001/api` and the backend actually listens on 5001.
- If a download 404s, I check whether the item expired, was deleted, or a one‑time file was already downloaded.
- If ports collide, I keep using 5001 (or free 5000 with `lsof -nP -iTCP:5000 -sTCP:LISTEN`).

## Design Decisions
- Storage: I store files on disk via Multer under `backend/uploads/`, and I keep metadata in MongoDB for simple local development.
- IDs/URLs: I generate short IDs with `nanoid(10)`. I build share URLs with `FRONTEND_URL`, and I derive download URLs from the incoming request host/port to avoid dev port mismatches.
- Counting policy: I increment views for text on page view. For files, I increment and enforce one‑time/max only on actual download so simply opening the page doesn’t “consume” the file.
- Size limits: I cap files at 50 MB using Multer limits.
- CORS: In development I allow any origin; in production I restrict to `FRONTEND_URL`.

## Assumptions and Limitations
- Deployment: I assume a single process/host. If I scale horizontally, I’ll move files to shared/object storage and coordinate cleanup.
- Durability: I keep uploads on local disk in dev; there’s no replication. For durability I’d use S3/GCS.
- Security scope: I hash passwords (bcrypt), but I don’t do end‑to‑end encryption; I rely on HTTPS. I don’t include rate limiting or antivirus scanning.
- Entropy: I use `nanoid(10)` for compact, unguessable IDs; for stricter needs I’d increase the length.
- Cleanup cadence: I purge expired records/files every ~5 minutes via a cron job (or on access), so deletion can lag until the next run.
- Browser support: I target modern evergreen browsers; I don’t test legacy browsers.

