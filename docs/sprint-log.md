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
# Sprint Log — MARKET Project (Europe/London)

## 2025-10-01 — Uploads v2, Lightbox, S3 Backfill, Cleanup
**Summary**  
Implemented end-to-end image workflow: DnD, parallel uploads, per-file & overall progress, lightbox, S3 backfill, refresh, bulk clear, and client pagination. Fixed Tailwind v4 setup and hydration issues. Standardized AWS routes and IAM.

**Timeline (approx):**
- 14:10 — DnD wired; thumbnails constrained to square tiles; filtered non-images.
- 15:00 — Build typo fixed (`useMemo`), discovered missing Tailwind; installed Tailwind v4 + `@tailwindcss/postcss`; globals wired.
- 15:40 — Per-file % label + overall % bar; removed noisy “DONE” chips.
- 16:00 — Lightbox (Esc/←/→, Copy URL, Open full) added.
- 16:30 — `/api/s3/list` added; surfaced errors; standardized envs (`S3_BUCKET`).
- 16:50 — Forced Node runtime on API routes; better server error messages.
- 17:10 — IAM fixed: `s3:ListBucket` + `s3:GetObject` → gallery backfilled historical images.
- 17:30 — Presign 500 fixed: Node runtime + `s3:PutObject`; uploads good again.
- 17:50 — “Refresh gallery” + client “Show more” (24 per click).
- 18:00 — `/api/s3/clear` bulk delete + `s3:DeleteObject`; sandbox reset.
- 18:20 — Hydration error (“button inside button”) resolved; controls row sanitized.

**Files touched (high-level)**
- `app/upload-test/UploadClient.tsx` — DnD, concurrency, progress, grid, lightbox, refresh, clear, show more.
- `app/upload-test/page.tsx` — renders `UploadClient`.
- `app/api/s3/presign/route.ts` — signed PUT (Node runtime).
- `app/api/s3/view-url/route.ts` — signed GET (Node runtime).
- `app/api/s3/list/route.ts` — list by prefix (Node runtime).
- `app/api/s3/clear/route.ts` — bulk delete by prefix (Node runtime).
- `postcss.config.js` — Tailwind v4 plugin (`@tailwindcss/postcss`).
- `app/globals.css` — Tailwind layers.
- (optional) `tailwind.config.js` — content globs if kept.

**IAM (dev)**
- Bucket: `marketplace-images-irinel-uk-dev`
- Allowed: `s3:ListBucket` (bucket), `s3:GetObject|PutObject|DeleteObject` (bucket/*)
- Prefix: `uploads/` for list/clear/presign.

**Open questions**
- Per-thumb delete: optimistic vs after-confirm?
- Dev size/type limits (e.g., 10 MB, image/* only)?

