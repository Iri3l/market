"use client";
import { useState } from "react";

export default function UploadClient() {
  const [status, setStatus] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [pct, setPct] = useState<number | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(null);
    setIsImage(false);
    setStatus("Requesting URL…");
    setPct(null);

    // 1) Presign PUT (API expects filename + contentType)
    const presign = await fetch("/api/s3/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      }),
    });

    if (!presign.ok) {
      const errTxt = await presign.text();
      setStatus(`Presign failed: ${presign.status} ${errTxt}`);
      return;
    }

    const { url, key } = await presign.json();

    // 2) Upload with progress
    setStatus("Uploading…");
    setPct(0);

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const p = Math.round((ev.loaded / ev.total) * 100);
            setPct(p);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });
    } catch (err: any) {
      setPct(null);
      setStatus(err?.message || "Upload failed");
      return;
    }

    setPct(null);
    setStatus(`✅ Uploaded as ${key}`);

    // 3) If it's an image, get a short-lived GET URL and preview it
    const looksLikeImage =
      (file.type && file.type.startsWith("image/")) ||
      /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);
    setIsImage(!!looksLikeImage);

    const viewRes = await fetch("/api/s3/view-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });

    if (!viewRes.ok) {
      const msg = await viewRes.text();
      setStatus((s) => s + ` | Preview link failed: ${viewRes.status} ${msg}`);
      return;
    }

    const { url: viewUrl } = await viewRes.json();
    setPreviewUrl(viewUrl);
  }

  return (
    <div className="max-w-md space-y-3 p-4 border rounded-xl">
      <h2 className="text-lg font-semibold">S3 Upload Test</h2>
      <input type="file" accept="image/*" onChange={onChange} />

      {/* Progress bar */}
      {pct !== null && (
        <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
          <div className="bg-black h-2" style={{ width: `${pct}%`, transition: "width 120ms linear" }} />
        </div>
      )}

      <p className="text-sm">{status}</p>

      {previewUrl && (
        <div className="mt-3">
          <div className="text-sm mb-2">Preview link (expires in ~5 min):</div>
          <a className="underline break-all" href={previewUrl} target="_blank" rel="noreferrer">
            {previewUrl}
          </a>

          {isImage && (
            <div className="mt-3">
              <img
                src={previewUrl}
                alt="Uploaded preview"
                className="rounded-md"
                style={{ maxWidth: 600, width: "100%", maxHeight: 380, objectFit: "contain", border: "1px solid #eee" }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
