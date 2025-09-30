# MARKET — Roadmap & Dev Log

## [2025-09-28] Milestone: S3 Upload v1 (presigned PUT + preview)
**Status:** ✅ Done

**What shipped**
- Next.js API: `/api/s3/presign` → presigned **PUT** URL
- Next.js API: `/api/s3/view-url` → presigned **GET** URL (5 min TTL)
- Client page: `/upload-test` with:
  - File picker
  - Upload progress bar (XHR)
  - Success status
  - Short-lived preview link
  - Inline image preview (if image/*)
- Infra/config:
  - S3 bucket CORS for `http://localhost:3000` with `PUT, GET, HEAD`
  - IAM policy: `s3:PutObject` (+ `s3:GetObject` for preview) on `uploads/*`
  - `.env.local` at repo root (never committed)

**Artifacts**
- `app/api/s3/presign/route.ts`
- `app/api/s3/view-url/route.ts`
- `app/upload-test/UploadClient.tsx`
- `docs/S3_UPLOAD.md` (how-to)

**Follow-ups (next bite-size steps)**
- [ ] Key namespacing: `products/<id>/images/<timestamp>-<slug>.<ext>`
- [ ] Client guards: accept image/*, max size (e.g., 5 MB), friendly errors
- [ ] Hide long preview URL (link text like “Open preview”)
- [ ] Prod CORS: swap to real domain(s) when live
- [ ] CloudFront for public read / caching (optional)
- [ ] Harden IAM further (least privilege + KMS if needed)
- [ ] Cleanup: remove `test/` objects from bucket
- [ ] Unit test: presign endpoint returns 200 with `{ url, key }`

**Notes**
- Bucket region: `eu-west-2` (must match `AWS_REGION`)
- Keep keys out of Git; set envs in hosting platform for prod.

## [Planned] Multi-image uploads + Image validation (cars, etc.)

**Goal**
- Allow sellers to upload multiple images at once with per-file progress.
- Automatically validate images (e.g., car listings must contain a car). Block or flag mismatches.

**Why**
- Faster listing creation for sellers.
- Higher quality, trusted listings (avoid irrelevant/abusive images).

**Scope (v1)**
- Client: multi-select input + drag-and-drop; show a list with file name, size, progress, status.
- API: batch presign endpoint (returns array of {key, url}), configurable max files (e.g., 10).
- Upload: parallel with concurrency=3–4; retry failed files; cap size (e.g., 5 MB each), enforce `image/*`.
- UX: thumbnail preview for each image after upload; “Remove”/“Retry” actions.

**Scope (v2) — Image validation (cars)**
- Run an **image classifier** on each file (pre- or post-upload).
- If listing type = “car”, require classifier confidence ≥ threshold (e.g., 0.7) that the image contains a car.
- Actions on fail: block upload (hard stop) or allow upload but **flag for review** (soft validation).

**Tech options**
- AWS Rekognition (label detection, moderation), keeps infra in AWS.
- Google Vision (labels + safety).
- Custom model via serverless (e.g., ONNX/TensorRT) if we need more control/cost efficiency.
- (Optional) Safety/mature-content checks via the same service.

**Data flow (recommended)**
1. Client → `/api/s3/presign-batch` with file metadata [{filename, contentType, size}] → returns array of PUT URLs + keys.
2. Client uploads in parallel (max N), shows individual progress bars.
3. Server enqueue validation job per uploaded key (SQS/Lambda or queue).
4. Validator fetches object (temporary signed GET), runs classifier:
   - Pass: mark `validated=true`.
   - Fail: set `validated=false`, reason=`no_car_detected`; optionally auto-delete object or move to `quarantine/`.
5. UI polls or receives webhook to update status badges.

**Policy/UX**
- Show seller a clear message if an image is rejected and why.
- Provide “Override & submit for manual review” toggle for edge cases.
- Keep a visible counter: “0/10 images uploaded”.

**Limits**
- Max files per listing: 10 (config).
- Max size: 5 MB per image (config).
- Allowed types: JPEG/PNG/WebP.
- Timeouts: presigned URL TTL 60–120s.

**Security/Privacy**
- Don’t store images publicly by default; use private S3 + signed GETs.
- Log only minimal metadata (key, size, MIME, validation result).
- Keep classifier decisions auditable (confidence, labels).

**Acceptance criteria**
- Can select 2–10 images at once; each shows progress and finishes.
- On a car listing, a non-car image is blocked or flagged per policy.
- Batch presign returns URLs for all valid inputs; errors are per-file, not fatal to the whole batch.
- No leaked secrets; envs in platform settings; CORS locked to prod domain.

**Nice-to-haves (later)**
- Client-side pre-checks (dimensions, aspect ratio).
- Auto-cropping/resize to standard sizes.
- Deduping (hash) to skip duplicate uploads.
- Reorder images with drag-and-drop.

## 2025-09-30 — Staging live on Vercel
- Deployed Next.js app to Vercel (prod).
- Subdomain `market.lazarovici.co.uk` pointed via CNAME to `cname.vercel-dns.com`.
- S3 uploads working from /upload-test (presign+PUT+preview).
- Next: multi-file upload, type/size guardrails, basic moderation, rotate AWS keys.
