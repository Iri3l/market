// app/api/s3/presign/route.ts
import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export const runtime = "nodejs" // AWS SDK v3 needs Node runtime

const REGION = process.env.AWS_REGION
const BUCKET = process.env.S3_BUCKET || process.env.S3_BUCKET_NAME

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: Request) {
  try {
    if (!REGION || !BUCKET) {
      return NextResponse.json(
        { error: "Missing AWS_REGION or S3_BUCKET" },
        { status: 400 }
      )
    }

    const body = await req.json().catch(() => ({} as any))
    const filename = String(body.filename || "file.bin")
    const contentType = String(body.contentType || "application/octet-stream")
    const prefix = typeof body.prefix === "string" ? body.prefix : "uploads/"

    // normalize: ensure prefix ends with /
    const dir = prefix.endsWith("/") ? prefix : `${prefix}/`

    // create a unique key (keep original name at the end)
    const key = `${dir}${Date.now()}-${Math.random().toString(36).slice(2)}-${filename}`

    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      // do NOT set ACL here; keep bucket private
    })

    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 }) // 5 minutes
    return NextResponse.json({ url, key })
  } catch (err: any) {
    console.error("presign error:", err)
    const code = err?.$metadata?.httpStatusCode || 500
    const msg =
      err?.name === "AccessDenied"
        ? "AccessDenied: missing s3:PutObject on the bucket/*"
        : err?.message || "presign failed"
    return NextResponse.json({ error: msg }, { status: code })
  }
}
