// app/upload-test/UploadClient.tsx
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

// ====== Config knobs ======
const THUMB = 160                 // ← change this number to resize ALL thumbnails (px)
const DEFAULT_PREFIX = "uploads/" // ← S3 folder to use for list/clear/presign

// ====== API response types ======
interface PresignResp { url: string; key: string }
interface ViewUrlResp  { url: string }

// ====== Upload item state ======
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
  // ---------- State ----------
  const [items, setItems] = useState<FileItem[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [concurrency, setConcurrency] = useState(3)
  const [autoStart, setAutoStart] = useState(true)
  const [visible, setVisible] = useState(24) // thumbnails shown initially
  const [undo, setUndo] = useState<{ item: File; key?: string; id: string; timeoutId: number } | null>(null)

  // Lightbox
  const [lightbox, setLightbox] = useState<{ index: number } | null>(null)
  const [copied, setCopied] = useState(false)

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
      body: JSON.stringify({
        filename: f.name,
        contentType: f.type || "application/octet-stream",
        size: f.size,
        prefix: DEFAULT_PREFIX,
      }),
    })
    if (!r.ok) {
      const data = await r.json().catch(() => ({} as any))
      throw new Error(data?.error || `presign failed: ${r.status}`)
    }
    return r.json()
  }

  async function viewUrl(key: string): Promise<string> {
    const r = await fetch("/api/s3/view-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    })
    if (!r.ok) {
      const data = await r.json().catch(() => ({} as any))
      throw new Error(data?.error || `view-url failed: ${r.status}`)
    }
    const data = (await r.json()) as ViewUrlResp
    return data.url
  }

  async function refreshGallery(prefix = DEFAULT_PREFIX) {
    const listRes = await fetch("/api/s3/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix }),
    })
    if (!listRes.ok) {
      const data = await listRes.json().catch(() => ({} as any))
      const msg = (data && (data.error || data.message)) || `list failed: ${listRes.status}`
      throw new Error(msg)
    }
    const { keys } = (await listRes.json()) as { keys: string[] }

    const imgKeys = keys.filter(k => /\.(png|jpe?g|gif|webp|bmp|tiff|svg)$/i.test(k))

    const results: { key: string; url: string }[] = []
    const B = 10
    for (let i = 0; i < imgKeys.length; i += B) {
      const chunk = imgKeys.slice(i, i + B)
      const urls = await Promise.all(
        chunk.map(async key => {
          const r = await fetch("/api/s3/view-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key }),
          })
          if (!r.ok) {
            const data = await r.json().catch(() => ({} as any))
            throw new Error(data?.error || `view-url failed for ${key}`)
          }
          const { url } = (await r.json()) as { url: string }
          return { key, url }
        })
      )
      results.push(...urls)
    }

    setItems(prev => {
      const have = new Set(prev.map(i => i.key))
      const newcomers = results
        .filter(r => !have.has(r.key))
        .map((r, idx) => ({
          id: `existing-${r.key}-${idx}`,
          file: new File([""], r.key.split("/").pop() || r.key, { type: "image/*" }),
          key: r.key,
          getUrl: r.url,
          progress: 100,
          status: "done" as const,
        }))
      return [...newcomers, ...prev]
    })
  }

  async function clearGallery(prefix = DEFAULT_PREFIX): Promise<void> {
    if (!confirm(`This will permanently delete ALL objects under "${prefix}". Continue?`)) return
    const r = await fetch("/api/s3/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix }),
    })
    const data = await r.json().catch(() => ({} as any))
    if (!r.ok) throw new Error(data?.error || `clear failed: ${r.status}`)
    setItems(prev => prev.filter(i => !(i.key?.startsWith(prefix))))
    alert(`Deleted ${data.deleted ?? 0} objects under "${prefix}".`)
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
  async function deleteItemByKey(id: string, key: string, file: File) {
  setItems(prev => prev.filter(i => i.id !== id))
  const timeoutId = window.setTimeout(async () => {
    try {
      const r = await fetch("/api/s3/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      })
      const data = await r.json().catch(() => ({} as any))
      if (!r.ok) throw new Error(data?.error || `delete failed: ${r.status}`)
    } catch (e:any) {
      setItems(prev => [{ id, file, key, progress: 100, status: "done", getUrl: prev.find(p => p.id===id)?.getUrl }, ...prev])
      alert(e.message)
    } finally {
      setUndo(u => (u && u.id === id ? null : u))
    }
  }, 5000)
  setUndo({ item: file, key, id, timeoutId })
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

  // Keep latest items inside the pool
  const itemsRef = useRef<FileItem[]>(items)
  useEffect(() => { itemsRef.current = items }, [items])

  // Auto-start uploads when new queued items appear
  useEffect(() => {
    if (autoStart && items.some(i => i.status === "queued")) {
      startUploads()
    }
  }, [autoStart, items, startUploads])

  // ---------- Views & metrics ----------
  const imageGrid = useMemo(() => items.filter(i => i.getUrl && isImage(i.file)), [items])
  const otherFiles = useMemo(() => items.filter(i => i.getUrl && !isImage(i.file)), [items])
  const existingCount = useMemo(() => items.filter(i => i.id.startsWith("existing-")).length, [items])
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
        await refreshGallery(DEFAULT_PREFIX)
      } catch (e) {
        console.warn("initial gallery load failed:", e)
      }
      if (cancelled) return
    }
    run()
    return () => { cancelled = true }
  }, [])

  // Lightbox keyboard handlers
  const openAt = useCallback((index: number) => setLightbox({ index }), [])
  const close = useCallback(() => setLightbox(null), [])
  const prev = useCallback(() => {
    setLightbox(lb => {
      if (!lb) return null
      const imgs = imageGrid
      if (imgs.length === 0) return null
      return { index: (lb.index - 1 + imgs.length) % imgs.length }
    })
  }, [imageGrid])
  const next = useCallback(() => {
    setLightbox(lb => {
      if (!lb) return null
      const imgs = imageGrid
      if (imgs.length === 0) return null
      return { index: (lb.index + 1) % imgs.length }
    })
  }, [imageGrid])

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

  // ---------- UI ----------
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">S3 Upload Test · Thumbnails + Parallel Uploads</h1>

      {/* Controls row — wrapper is a DIV (no nested buttons) */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Choose files */}
        <button
          type="button"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          onClick={() => inputRef.current?.click()}
        >
          Choose files
        </button>
        <input ref={inputRef} type="file" multiple hidden onChange={onPick} />

        {/* Refresh */}
        <button
          type="button"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          onClick={async () => {
            try { await refreshGallery(DEFAULT_PREFIX) } catch (e:any) { alert(e.message) }
          }}
        >
          Refresh gallery
        </button>

        {/* Clear */}
        <button
          type="button"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          onClick={async () => {
            try { await clearGallery(DEFAULT_PREFIX) } catch (e:any) { alert(e.message) }
          }}
        >
          Clear gallery
        </button>

        {/* Auto-start */}
        <label className="text-sm flex items-center gap-2 ml-2">
          <input type="checkbox" checked={autoStart} onChange={e => setAutoStart(e.target.checked)} />
          Auto-start uploads
        </label>

        {/* Concurrency */}
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

        {/* Start now */}
        <button
          type="button"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          disabled={items.every(i => i.status !== "queued")}
          onClick={() => startUploads()}
        >
          Start now
        </button>

        {/* Overall bar + counters */}
        <div className="ml-auto flex items-center gap-3">
          <div className="w-40 h-2 bg-gray-100 rounded-full overflow-hidden relative" title={`Overall ${overall}%`}>
            <div className="h-full bg-black" style={{ width: `${overall}%` }} />
          </div>
          <div className="text-sm text-gray-600 whitespace-nowrap">
            Overall: {overall}% · {done} done · {uploading} uploading · {queued} queued · Loaded from S3:{" "}
            {useMemo(() => items.filter(i => i.id.startsWith("existing-")).length, [items])}
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
{imageGrid.slice(0, visible).map((item, idx) => (
  <div key={item.id} className="relative">
    {item.key && (
      <button
        type="button"
        aria-label="Delete image"
        title="Delete"
        onClick={(e) => { e.stopPropagation(); deleteItemByKey(item.id, item.key!, item.file) }}
        className="absolute right-2 top-2 z-10 rounded-full border bg-white px-2 py-1 text-xs shadow hover:bg-white/90"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 3h6m-9 4h12M9 7v12m6-12v12M5 7l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    )}

    <div
      className="rounded-xl overflow-hidden border cursor-zoom-in"
      onClick={() => setLightbox({ index: idx })}
    >
      <div style={{ width: THUMB, height: THUMB, background: "#f3f4f6", overflow: "hidden" }}>
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
    </div>
  </div>
))}
          </div>

          {/* Show more */}
          {imageGrid.length > visible && (
            <div className="mt-4">
              <button
                type="button"
                className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
                onClick={() => setVisible(v => v + 24)}
              >
                Show more ({imageGrid.length - visible} remaining)
              </button>
            </div>
          )}
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
            <div className="relative max-w-[90vw] max-h-[85vh]" onClick={e => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.getUrl!}
                alt={current.file.name}
                className="max-w-[90vw] max-h-[80vh] object-contain rounded-xl shadow-2xl"
              />
              <button
                onClick={close}
                className="absolute -top-10 right-0 text-white/90 hover:text-white text-sm"
                aria-label="Close"
              >
                ✕ Close (Esc)
              </button>
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
