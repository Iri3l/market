# MARKET — NEXT_STEPS (v3)

## Next session
1) Click-to-zoom modal for thumbnails (Esc to close, arrows to navigate; “Copy URL” button).
2) Load existing images from S3 on page load (`/api/s3/list?prefix=uploads/`) → render into the same grid.
3) Delete from S3 with confirm (`/api/s3/delete`) + small trash icon on each thumb.
4) Upload guardrails before presign (file type allow-list + max size; friendly errors).
5) Robust retry with exponential backoff on failed PUT; keep manual “Retry” button.
6) (Optional) Cancel in-flight upload (track `XMLHttpRequest` per file; add “Cancel”).
7) Concurrency polish: cap at 4 and disable “Start now” while pool is active.
8) UI pass later (spacing, typography, light/dark).

## Notes
- Current page has: drag-and-drop, multi-file uploads with concurrency, per-file progress + %, overall progress %, adjustable thumbnail size (`THUMB`), image-only grid + “Other uploads”.
