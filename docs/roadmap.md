# MARKET — Roadmap & Dev Log
# MARKET — Roadmap (v4) • 2025-10-01

## ✅ Shipped today
- Drag & drop uploads (multi-file)
- Parallel uploads (adjustable concurrency)
- Per-file progress + % and overall progress bar
- Robust error surfacing (server messages bubbled to UI)
- Adjustable thumbnail size via single constant `THUMB`
- Image-only grid + separate “Other uploads”
- Lightbox (click-to-zoom, Esc/←/→, Copy URL, Open full)
- Load existing images from S3 on page load (`/api/s3/list`)
- Manual “Refresh gallery”
- Bulk “Clear gallery” via `/api/s3/clear`
- Client “Show more” pagination (no API changes)
- Tailwind v4 wiring (`@tailwindcss/postcss`), hydration fix (no nested buttons)
- AWS IAM tightened: `s3:ListBucket`, `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`
- Consistent S3 prefix: `uploads/` across list/clear/presign

## ✅ Completed 
### [2025-09-30] Staging live on Vercel
- Deployed Next.js app to Vercel (Production)
- Custom subdomain `market.lazarovici.co.uk` (CNAME → `cname.vercel-dns.com`), SSL issued
- S3 uploads working end-to-end on prod & localhost
- CORS locked to `http://localhost:3000` and `https://market.lazarovici.co.uk`
- **Inline preview via same-origin proxy** `/api/s3/proxy-image` (no CORS drama)
- **Multi-image selection** (sequential queue), progress bar
- Batch summary: shows **X/Y uploaded**, failed list + per-item “Open” links
- Env parity: pulled Vercel envs locally

**Artifacts**
- `app/api/s3/presign/route.ts`
- `app/api/s3/view-url/route.ts`
- `app/api/s3/proxy-image/route.ts`
- `app/upload-test/UploadClient.tsx`
- `docs/S3_UPLOAD.md`

### [2025-09-28] Milestone: S3 Upload v1 (presigned PUT + preview)
- `/api/s3/presign` → presigned **PUT**
- `/api/s3/view-url` → presigned **GET** (short TTL)
- `/upload-test` client page with progress + preview (initial)
- IAM: `s3:PutObject` + `s3:GetObject` on `uploads/*`
- Bucket region: `eu-west-2`, CORS for localhost

---

## ⏭️ Up Next (short horizon)
## 🎯 Next session (priority)
1) Per-thumb **Delete** (small trash icon + `/api/s3/delete`), optimistic UI, undo toast.
2) **Real S3 pagination** (ListObjectsV2 continuation token) → “Load next 50”.
3) **Upload guardrails** before presign (type allow-list + max size), friendly errors.
4) **Cancel upload** (track XHR per file, `abort()`); disable “Start now” during active pool.
5) **EXIF orientation** fix (iOS), optional canvas normalize pre-upload.
6) **UI polish** (hover states, skeletons, dark mode).
7) (Stretch) **Copy URL** on thumb + keyboard focus traps in lightbox.

## 🧱 Foundations (backlog)
- Choose DB (Neon/Supabase) + Prisma
- Auth.js (email OTP) + server session checks
- Listings schema & CRUD; attach uploaded `s3Key[]` to draft listing
- Listings browse with filters + pagination
- CI: lint + typecheck; `.nvmrc`, ESLint, Prettier

## 📌 Notes
- API routes run on **Node runtime**, not Edge.
- Env: `S3_BUCKET` (fallback `S3_BUCKET_NAME`), `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.
- Signed GET URL TTL: 5 minutes (tweakable).
- Default concurrency: 3 (cap at 4 recommended).

---

## 🧱 Foundations (backlog)
- Choose DB (Neon/Supabase) + **Prisma**
- Schema: `users`, `listings`, `images`, `sessions`, `categories`
- Auth.js (email OTP) + server session checks
- Listings CRUD APIs (POST/GET/PATCH/DELETE)
- Attach uploaded `s3Key[]` to a **draft listing**
- Listings browse page with filters + pagination
- Add `.nvmrc`, ESLint, Prettier; GitHub CI (lint + typecheck)
- Optional: CloudFront for caching public reads later

---

## 📌 Notes
- Keep secrets out of Git; manage env in Vercel.  
- Private S3 + signed GETs by default; proxy for inline display.  
- Clean up `test/` objects in the bucket periodically.

