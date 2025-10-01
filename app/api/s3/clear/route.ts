// app/api/s3/clear/route.ts
import { NextResponse } from "next/server"
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3"

export const runtime = "nodejs"

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
      return NextResponse.json({ error: "Missing AWS_REGION or S3_BUCKET" }, { status: 400 })
    }

    const { prefix = "uploads/" } = await req.json().catch(() => ({} as any))
    const dir = prefix.endsWith("/") ? prefix : `${prefix}/`

    let token: string | undefined
    let total = 0

    do {
      const list = await s3.send(new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: dir,
        ContinuationToken: token,
        MaxKeys: 1000,
      }))

      const Keys = (list.Contents || [])
        .filter(o => o.Key && !o.Key.endsWith("/"))
        .map(o => ({ Key: o.Key! }))

      if (Keys.length) {
        await s3.send(new DeleteObjectsCommand({
          Bucket: BUCKET,
          Delete: { Objects: Keys, Quiet: true },
        }))
        total += Keys.length
      }

      token = list.IsTruncated ? list.NextContinuationToken : undefined
    } while (token)

    return NextResponse.json({ deleted: total })
  } catch (err: any) {
    console.error("clear error:", err)
    const code = err?.$metadata?.httpStatusCode || 500
    const msg = err?.message || "clear failed"
    return NextResponse.json({ error: msg }, { status: code })
  }
}
