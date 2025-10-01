// app/api/s3/list/route.ts
import { NextResponse } from "next/server"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"

export const runtime = "nodejs" // ensure not on Edge

const region = process.env.AWS_REGION!
const bucket = process.env.S3_BUCKET!

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: Request) {
  try {
    if (!region || !bucket) {
      return NextResponse.json(
        { error: "Missing AWS_REGION or S3_BUCKET" },
        { status: 400 }
      )
    }

    const { prefix = "" } = await req.json().catch(() => ({}))
    const cmd = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: 100 })
    const out = await s3.send(cmd)

    const keys =
      out.Contents?.filter(o => o.Key && !o.Key.endsWith("/")).map(o => o.Key!) ?? []

    return NextResponse.json({ keys })
  } catch (err: any) {
    // Log full error to server console for debugging
    console.error("S3 list error:", err)
    const code = err?.$metadata?.httpStatusCode || 500
    const msg = err?.name === "AccessDenied"
      ? "AccessDenied: missing s3:ListBucket on the bucket"
      : err?.message || "list failed"
    return NextResponse.json({ error: msg }, { status: code })
  }
}
