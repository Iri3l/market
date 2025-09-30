"use client";

import { useRef, useState } from "react";

const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default function UploadClient() {
  const [status, setStatus] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [pct, setPct] = useState<number | null>(null);

  const [uploaded, setUploaded] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function niceBytes(n: number) {
    return n < 1024 ? `${n} B`
      : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB`
      : `${(n / 1024 ** 2).toFixed(1)} MB`;
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Copy the FileList immediately; don't rely on the event later
    const files = Array.from(e.currentTarget.files || []);
    if (files.length === 0) return;

    // reset per-batch summary
    setUploaded([]);
    setFailed([]);

    const uploadedKeys: string[] = [];
    const failedNames: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        failedNames.push(`${file.name} (not an image)`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        failedNames.push(`${file.name} (>${MAX_MB} MB, ${niceBytes(file.size)})`);
        continue;
      }

      setPreviewUrl(null);
      setIsImage(false);
      setStatus(`Requesting URL for ${file.name}…`);
      setPct(null);

      // 1) Presign
      const presign = await fetch("/api/s3/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });
      if (!presign.ok) {
        failedNames.push(`${file.name} (presign ${presign.status})`);
        continue;
      }
      const { url, key } = await presign.json();

      // 2) Upload (PUT) with progress
      setStatus(`Uploading ${file.name}…`);
      setPct(0);
      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", url, true);
          xhr.setRequestHeader(
            "Content-Type",
            file.type || "application/octet-stream"
          );
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              setPct(Math.round((ev.loaded / ev.total) * 100));
            }
          };
          xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(new Error(String(xhr.status)));
          xhr.onerror = () => reject(new Error("network error"));
          xhr.send(file);
        });
      } catch {
        failedNames.push(`${file.name} (upload failed)`);
        setPct(null);
        continue;
      }

      setPct(null);
      uploadedKeys.push(key);
      setStatus((s) => `✅ Uploaded ${file.name}`);

      // 3) Inline preview for the LAST uploaded item (via same-origin proxy)
      const proxyUrl = `/api/s3/proxy-image?key=${encodeURIComponent(key)}`;
      setPreviewUrl(proxyUrl);
      setIsImage(true);
    }

    setUploaded(uploadedKeys);
    setFailed(failedNames);

    const ok = uploadedKeys.length;
    const no = failedNames.length;
    setStatus(
      `Batch complete: ${ok}/${files.length} uploaded${no ? `, ${no} failed` : ""}.`
    );

    // Safely reset chooser using the ref (event may be nulled after await)
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="max-w-md space-y-3 p-4 border rounded-xl">
      <h2 className="text-lg font-semibold">S3 Upload Test</h2>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onChange}
      />

      {/* Progress bar */}
      {pct !== null && (
        <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
          <div
            className="bg-black h-2"
            style={{ width: `${pct}%`, transition: "width 120ms linear" }}
          />
        </div>
      )}

      <p className="text-sm">{status}</p>

      {previewUrl && (
        <div className="mt-3">
          <div className="text-sm mb-2">Preview link (expires in ~5 min):</div>

          <a
            className="underline"
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open preview of uploaded file in a new tab"
          >
            Open preview
          </a>

          {isImage && (
            <div className="mt-3">
              <img
                src={previewUrl}
                alt="Uploaded preview"
                className="rounded-md"
                style={{
                  maxWidth: 600,
                  width: "100%",
                  maxHeight: 380,
                  objectFit: "contain",
                  border: "1px solid #eee",
                }}
                onLoad={() => setStatus((s) => s + " | ✅ preview loaded")}
                onError={() => setStatus((s) => s + " | ⚠️ preview failed")}
              />
            </div>
          )}
        </div>
      )}

      {/* Batch summary */}
      {(uploaded.length > 0 || failed.length > 0) && (
        <div className="mt-4 space-y-2 text-sm">
          {uploaded.length > 0 && (
            <div>
              <div className="font-medium">Uploaded ({uploaded.length}):</div>
              <ul className="list-disc ml-5">
                {uploaded.map((key) => (
                  <li key={key}>
                    <a
                      className="underline"
                      href={`/api/s3/proxy-image?key=${encodeURIComponent(key)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open {key.split("/").pop()}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {failed.length > 0 && (
            <div>
              <div className="font-medium">Failed ({failed.length}):</div>
              <ul className="list-disc ml-5">
                {failed.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
