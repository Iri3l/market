import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export const runtime = "nodejs"

function getS3() {
  const region = process.env.AWS_REGION
  const bucket = process.env.S3_BUCKET || process.env.S3_BUCKET_NAME
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  if (!region || !bucket) return { error: "Missing AWS_REGION or S3_BUCKET" }
  if (!accessKeyId || !secretAccessKey) return { error: "Missing AWS keys" }
  return {
    s3: new S3Client({ region, credentials: { accessKeyId, secretAccessKey } }),
    bucket,
  }
}

export async function POST(req: Request) {
  const env = getS3()
  if ("error" in env) return NextResponse.json({ error: env.error }, { status: 400 })
  const { s3, bucket } = env

  try {
    const body = await req.json().catch(() => ({} as any))
    const filename = String(body.filename || "file.bin")
    const contentType = String(body.contentType || "application/octet-stream")
    const prefix = typeof body.prefix === "string" ? body.prefix : "uploads/"
    const dir = prefix.endsWith("/") ? prefix : `${prefix}/`
    const key = `${dir}${Date.now()}-${Math.random().toString(36).slice(2)}-${filename}`
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType })
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 })
    return NextResponse.json({ url, key })
  } catch (err: any) {
    console.error("presign error:", err)
    const code = err?.$metadata?.httpStatusCode || 500
    return NextResponse.json({ error: err?.message || "presign failed" }, { status: code })
  }
}
