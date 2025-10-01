// app/api/s3/view-url/route.ts
import { NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export const runtime = "nodejs" // ensure Node runtime (not Edge)

// Accept both env names to avoid mismatch issues
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
    let key: string | undefined = body.key
    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Missing 'key'" }, { status: 400 })
    }

    // Normalise: no leading slash
    if (key.startsWith("/")) key = key.slice(1)

    // Generate short-TTL signed GET url
    const cmd = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      // Optional: force browser download filename
      // ResponseContentDisposition: `inline; filename="${key.split("/").pop()}"`,
    })

    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 }) // 5 min
    return NextResponse.json({ url })
  } catch (err: any) {
    console.error("view-url error:", err)
    // Helpful messages
    let msg = err?.name === "AccessDenied"
      ? "AccessDenied: missing s3:GetObject on the bucket/*"
      : err?.message || "view-url failed"
    const code = err?.$metadata?.httpStatusCode || 500
    return NextResponse.json({ error: msg }, { status: code })
  }
}
