// app/upload-test/UploadClient.tsx
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

// === One knob to rule them all ===
const THUMB = 160 // ← change this number to resize ALL thumbnails (px)

// --- API response types (adjust if your API differs) ---
interface PresignResp { url: string; key: string }
interface ViewUrlResp  { url: string }

// --- Upload item state ---
interface FileItem {
  id: string
  file: File
  key?: string
  putUrl?: string
  getUrl?: string
  progress: number // 0..100
  status: "queued" | "uploading" | "done" | "error"
  error?: string
}

const isImage = (file: File) =>
  (file.type && file.type.startsWith("image/")) ||
  /\.(png|jpe?g|gif|webp|bmp|tiff|svg)$/i.test(file.name)

export default function UploadClient() {
  const [items, setItems] = useState<FileItem[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [concurrency, setConcurrency] = useState(3)
  const [autoStart, setAutoStart] = useState(true)
// Zoom modal (lightbox)
// views declared later (so they don't get redeclared)

// then lightbox state + helpers
const [lightbox, setLightbox] = useState<{ index: number } | null>(null)
const [copied, setCopied] = useState(false)

// open / close / navigation helpers for the lightbox
const openAt = useCallback((index: number) => setLightbox({ index }), [])
const close = useCallback(() => setLightbox(null), [])
const prev = useCallback(() => {
  setLightbox(lb => {
    if (!lb) return null
    const imgs = items.filter(i => i.getUrl && isImage(i.file))
    if (imgs.length === 0) return null
    return { index: (lb.index - 1 + imgs.length) % imgs.length }
  })
}, [items])
const next = useCallback(() => {
  setLightbox(lb => {
    if (!lb) return null
    const imgs = items.filter(i => i.getUrl && isImage(i.file))
    if (imgs.length === 0) return null
    return { index: (lb.index + 1) % imgs.length }
  })
}, [items])

useEffect(() => {
  if (!lightbox) return
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close()
    else if (e.key === "ArrowLeft") prev()
    else if (e.key === "ArrowRight") next()
  }
  window.addEventListener("keydown", onKey)
  return () => window.removeEventListener("keydown", onKey)
}, [lightbox, close, prev, next])


  const inputRef = useRef<HTMLInputElement | null>(null)

  const queued = items.filter(i => i.status === "queued").length
  const uploading = items.filter(i => i.status === "uploading").length
  const done = items.filter(i => i.status === "done").length

  // ---------- Helpers ----------
  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files)
    setItems(prev => [
      ...prev,
      ...arr.map((f, idx) => ({
        id: `${Date.now()}-${prev.length + idx}`,
        file: f,
        progress: 0,
        status: "queued" as const,
      })),
    ])
  }, [])

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files)
    if (inputRef.current) inputRef.current.value = ""
  }, [addFiles])

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(true)
  }, [])
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"; setDragOver(true)
  }, [])
  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false)
  }, [])
  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false)
    const files = e.dataTransfer?.files
    if (files && files.length) addFiles(files)
  }, [addFiles])

  // ---------- API ----------
  async function presign(f: File): Promise<PresignResp> {
    const r = await fetch("/api/s3/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: f.name, contentType: f.type || "application/octet-stream", size: f.size }),
    })
    if (!r.ok) throw new Error(`presign failed: ${r.status}`)
    return r.json()
  }

  async function viewUrl(key: string): Promise<string> {
    const r = await fetch("/api/s3/view-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    })
    if (!r.ok) throw new Error(`view-url failed: ${r.status}`)
    const data = (await r.json()) as ViewUrlResp
    return data.url
  }

  function putWithProgress(putUrl: string, file: File, onProgress: (pct: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open("PUT", putUrl)
      xhr.upload.onprogress = evt => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100)
          onProgress(pct)
        }
      }
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`PUT ${xhr.status}`)))
      xhr.onerror = () => reject(new Error("Network error during PUT"))
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream")
      xhr.send(file)
    })
  }

  // ---------- Concurrency pool ----------
  const startUploads = useCallback(async () => {
    const queue = () => itemsRef.current.filter(i => i.status === "queued")

    const runNext = async (): Promise<void> => {
      const next = queue().shift()
      if (!next) return

      setItems(prev => prev.map(i => (i.id === next.id ? { ...i, status: "uploading", progress: 2 } : i)))

      try {
        const { url, key } = await presign(next.file)
        setItems(prev => prev.map(i => (i.id === next.id ? { ...i, putUrl: url, key } : i)))

        await putWithProgress(url, next.file, pct => {
          setItems(prev => prev.map(i => (i.id === next.id ? { ...i, progress: pct } : i)))
        })

        const getUrl = await viewUrl(key)
        setItems(prev => prev.map(i => (i.id === next.id ? { ...i, getUrl, progress: 100, status: "done" } : i)))
      } catch (err: any) {
        setItems(prev => prev.map(i => (i.id === next.id ? { ...i, status: "error", error: err?.message || String(err) } : i)))
      } finally {
        await runNext()
      }
    }

    const workers = Array.from({ length: Math.max(1, concurrency) }, () => runNext())
    await Promise.all(workers)
  }, [concurrency])

  // keep latest items inside the pool
  const itemsRef = useRef<FileItem[]>(items)
  useEffect(() => { itemsRef.current = items }, [items])

  useEffect(() => {
    if (autoStart && items.some(i => i.status === "queued")) {
      // fire-and-forget
      startUploads()
    }
  }, [autoStart, items, startUploads])

  // ---------- Views ----------
  const imageGrid = useMemo(() => items.filter(i => i.getUrl && isImage(i.file)), [items])
  const otherFiles = useMemo(() => items.filter(i => i.getUrl && !isImage(i.file)), [items])
  const overall = useMemo(() => {
  if (items.length === 0) return 0
  const total = items.reduce((sum, i) => sum + (i.status === "done" ? 100 : i.progress), 0)
  return Math.round(total / items.length)
}, [items])
// Load existing images from S3 on mount
useEffect(() => {
  let cancelled = false

  async function run() {
    try {
      // 1) list keys
      const listRes = await fetch("/api/s3/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: "" }), // e.g. "uploads/" if you use a folder
      })
      if (!listRes.ok) throw new Error(`list failed: ${listRes.status}`)
      const { keys } = (await listRes.json()) as { keys: string[] }

      // 2) keep images only
      const imgKeys = keys.filter(k =>
        /\.(png|jpe?g|gif|webp|bmp|tiff|svg)$/i.test(k)
      )

      // 3) get short-TTL view URLs for each key (parallel, but cap to 10 at a time)
      const batches: string[][] = []
      const B = 10
      for (let i = 0; i < imgKeys.length; i += B) batches.push(imgKeys.slice(i, i + B))

      const results: { key: string; url: string }[] = []
      for (const chunk of batches) {
        const urls = await Promise.all(
          chunk.map(async key => {
            const r = await fetch("/api/s3/view-url", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key }),
            })
            if (!r.ok) throw new Error(`view-url failed for ${key}`)
            const { url } = (await r.json()) as { url: string }
            return { key, url }
          })
        )
        results.push(...urls)
        if (cancelled) return
      }

      // 4) merge into items state if not already present
      setItems(prev => {
        // build a set of already-known keys
        const have = new Set(prev.map(i => i.key))
        const newcomers = results
          .filter(r => !have.has(r.key))
          .map((r, idx) => ({
            id: `existing-${r.key}-${idx}`,
            file: new File([""], r.key.split("/").pop() || r.key, { type: "image/*" }),
            key: r.key,
            putUrl: undefined,
            getUrl: r.url,
            progress: 100,
            status: "done" as const,
          }))
        return [...newcomers, ...prev] // show existing first
      })
    } catch (e) {
      console.warn("initial gallery load failed:", e)
    }
  }

  run()
  return () => { cancelled = true }
}, [])


  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">S3 Upload Test · Thumbnails + Parallel Uploads</h1>

      <div className="flex items-center gap-4">
        <button className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50" onClick={() => inputRef.current?.click()}>
          Choose files
        </button>
        <input ref={inputRef} type="file" multiple hidden onChange={onPick} />

        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={autoStart} onChange={e => setAutoStart(e.target.checked)} />
          Auto-start uploads
        </label>

        <label className="text-sm flex items-center gap-2">
          Concurrency
          <input
            type="number"
            min={1}
            max={6}
            value={concurrency}
            onChange={e => setConcurrency(Number(e.target.value) || 1)}
            className="w-16 rounded border px-2 py-1"
          />
        </label>

        <button
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          disabled={items.every(i => i.status !== "queued")}
          onClick={() => startUploads()}
        >
          Start now
        </button>

        <div className="ml-auto flex items-center gap-3">
  <div className="w-40 h-2 bg-gray-100 rounded-full overflow-hidden relative" title={`Overall ${overall}%`}>
    <div className="h-full bg-black" style={{ width: `${overall}%` }} />
  </div>
  <div className="text-sm text-gray-600 whitespace-nowrap">
    Overall: {overall}% · {done} done · {uploading} uploading · {queued} queued
  </div>
</div>

      </div>

      {/* Drag & drop zone */}
      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-2xl border border-dashed p-10 text-center min-h-[140px] flex flex-col items-center justify-center ${dragOver ? "bg-gray-50" : ""}`}
      >
        <p className="font-medium">Drag & drop files here</p>
        <p className="text-sm text-gray-600">or click "Choose files"</p>
      </div>

      {/* Upload list */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="rounded-xl border p-3 flex items-center gap-4">
  <div className="w-40 truncate text-sm">{item.file.name}</div>

  {/* progress bar + % */}
  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
    <div
      className={`h-full ${item.status === "error" ? "bg-red-500" : "bg-black"}`}
      style={{ width: `${item.progress}%` }}
    />
    {item.status !== "done" && (
      <span className="absolute right-1 -top-5 text-xs">{item.progress}%</span>
    )}
  </div>

  {/* error + retry only when needed */}
  {item.status === "error" && (
    <div className="flex items-center gap-2">
      <div className="text-xs text-red-600 truncate max-w-[240px]">{item.error}</div>
      <button
        className="text-xs underline"
        onClick={() => {
          setItems(p =>
            p.map(i =>
              i.id === item.id
                ? { ...i, status: "queued", progress: 0, error: undefined }
                : i
            )
          )
        }}
      >
        Retry
      </button>
    </div>
  )}
</div>

          ))}
        </div>
      )}

      {/* Thumbnails grid (INLINE sizes; controlled by THUMB) */}
      {imageGrid.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Uploaded images</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fill, minmax(${THUMB + 16}px, 1fr))`,
              gap: 12,
            }}
          >
            {imageGrid.map((item,idx) => (
              <figure
  key={item.id}
  className="rounded-xl overflow-hidden border cursor-zoom-in"
  onClick={() => openAt(idx)} // <- add idx in the map callback params
>
  <div
    style={{ width: THUMB, height: THUMB, background: "#f3f4f6", overflow: "hidden" }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={item.getUrl!}
      alt={item.file.name}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  </div>
  <figcaption
    style={{ padding: "6px 8px", fontSize: 12, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}
  >
    {item.file.name}
  </figcaption>
</figure>

            ))}
          </div>
        </div>
      )}

      {/* Non-image files */}
      {otherFiles.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mt-6 mb-2">Other uploads</h2>
          <ul className="space-y-2">
            {otherFiles.map(item => (
              <li key={item.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                <span className="truncate mr-3">{item.file.name}</span>
                <a href={item.getUrl!} target="_blank" className="underline">Open</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Lightbox modal */}
{lightbox && imageGrid[lightbox.index] && (() => {
  const current = imageGrid[lightbox.index]
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(current.getUrl!)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
      onClick={close}
    >
      {/* Stop clicks from closing when interacting with content */}
      <div className="relative max-w-[90vw] max-h-[85vh]" onClick={e => e.stopPropagation()}>
        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.getUrl!}
          alt={current.file.name}
          className="max-w-[90vw] max-h-[80vh] object-contain rounded-xl shadow-2xl"
        />

        {/* Top-right close */}
        <button
          onClick={close}
          className="absolute -top-10 right-0 text-white/90 hover:text-white text-sm"
          aria-label="Close"
        >
          ✕ Close (Esc)
        </button>

        {/* Prev / Next */}
        <button
          onClick={prev}
          className="absolute left-[-56px] top-1/2 -translate-y-1/2 text-white/90 hover:text-white text-2xl"
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          onClick={next}
          className="absolute right-[-56px] top-1/2 -translate-y-1/2 text-white/90 hover:text-white text-2xl"
          aria-label="Next"
        >
          ›
        </button>

        {/* Bottom bar */}
        <div className="mt-3 flex items-center justify-between text-white/90 text-sm">
          <div className="truncate max-w-[60vw]">{current.file.name}</div>
          <div className="flex items-center gap-3">
            <button
              onClick={copyUrl}
              className="rounded-full border border-white/30 px-3 py-1 hover:bg-white/10"
            >
              {copied ? "Copied!" : "Copy URL"}
            </button>
            <button
              onClick={() => window.open(current.getUrl!, "_blank")}
              className="rounded-full border border-white/30 px-3 py-1 hover:bg-white/10"
            >
              Open full
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})()}

    </div>
  )
}
