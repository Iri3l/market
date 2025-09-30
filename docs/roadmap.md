# MARKET — Roadmap & Dev Log

## ✅ Completed (latest first)
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
- **Thumbnails grid** on `/upload-test` (show all uploaded images at once)
- **Parallel uploads** (small pool: 3–4) with per-file progress
- **Client limits**: image/* only (done), add max size & nice errors (partly done)
- **Server validation**: MIME sniffing, size guard, per-listing image cap
- **Key namespacing**: `products/<id>/images/<ts>-<slug>.<ext>`
- **Rotate AWS keys** (leaked earlier; replace in Vercel, disable old)

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

