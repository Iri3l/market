"use client";
import { useState } from "react";

export default function UploadClient() {
  const [status, setStatus] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("Requesting URL…");
    const presign = await fetch("/api/s3/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      }),
    });
    if (!presign.ok) {
      setStatus("Presign failed.");
      return;
    }
    const { url, key } = await presign.json();

    setStatus("Uploading…");
    const put = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!put.ok) {
      setStatus(`Upload failed (${put.status}).`);
      return;
    }

    setStatus(`✅ Uploaded as ${key}`);
  }

  return (
    <div className="max-w-md space-y-3 p-4 border rounded-xl">
      <h2 className="text-lg font-semibold">S3 Upload Test</h2>
      <input type="file" onChange={onChange} />
      <p className="text-sm">{status}</p>
    </div>
  );
}
