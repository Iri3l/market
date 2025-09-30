# Sprint Log — MARKET Project

## 2025-09-26
- Repo scaffolding + professional docs setup ✅
- API skeleton with Express + /health endpoint ✅
- ESLint + Prettier configured ✅

### Next Up (paused here)
- Add MongoDB connection (Atlas free tier or local)
- Implement User model
- Add Auth routes (register/login with JWT)

👉 Resume with Step 1 in Auth/Mongo plan (see docs/roadmap.md).

## 2025-09-28 — S3 Upload v1 shipped (presign + preview)

**Done**
- Next.js API `/api/s3/presign` returns presigned **PUT** URL.
- Next.js API `/api/s3/view-url` returns presigned **GET** URL (5-min TTL).
- Client page `/upload-test`:
  - File picker (accept image/*), upload **progress bar**, success status.
  - Short-lived preview link (now shown as **“Open preview”**).
  - Inline preview for images.
- Infra/config:
  - S3 CORS allows `PUT, GET, HEAD` from `http://localhost:3000`.
  - IAM allows `s3:PutObject` (+ `s3:GetObject` for preview) on `uploads/*`.
  - Root `.env.local` (kept out of git); cleaned legacy `api/` from repo.

**Notes / fixes we did**
- Resolved Node/TS loader quirks, moved scripts to `/scripts`.
- Fixed env loading + region mismatch + NoSuchBucket.
- Created ROADMAP + CLI cheat sheet docs.

**Next up (tiny wins)**
- Key namespacing: `products/<id>/images/<timestamp>-<slug>.<ext>`.
- Guards: image-only + max 5 MB + friendly errors.
- Multi-image upload (parallel with concurrency limit, per-file progress).
- Image validation (e.g., car listings must contain a car) via Rekognition/Vision.
- Hide long querystrings everywhere (UX polish).
### 2025-09-30
- Fixed local/remote builds (Next.js preset).
- Wired Vercel envs: AWS creds, region=eu-west-2, bucket=marketplace-images-irinel-uk-dev.
- DNS: switched from A to CNAME; removed conflicting A/AAAA; SSL issued.
- Verified API: /api/s3/presign and /api/s3/view-url on custom domain.
2025-09-30
- Fixed custom domain (IONOS CNAME → Vercel).
- Deploy working on production.
- S3 uploads working; inline preview fixed using Next API proxy.
2025-09-30
- Vercel prod live on market.lazarovici.co.uk with SSL.
- S3 uploads: presign PUT + GET, inline preview via /api/s3/proxy-image.
- Local env parity: pulled Vercel envs to .env.local; localhost upload works.
- S3 CORS: allowed localhost:3000 + market.lazarovici.co.uk (PUT/GET/HEAD).
2025-09-30
- Domain + SSL on Vercel working (market.lazarovici.co.uk)
- S3 uploads stable in prod & localhost (env + CORS aligned)
- Added multi-image selection (sequential queue with progress)
- Inline preview via /api/s3/proxy-image; preview reliability fixed
- Batch summary UX: X/Y uploaded, failed list, per-file open links
