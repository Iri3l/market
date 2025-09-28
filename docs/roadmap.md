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
