// app/api/s3/list/route.ts
import { NextResponse } from "next/server"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: Request) {
  try {
    const { prefix = "" } = await req.json().catch(() => ({}))
    const Bucket = process.env.S3_BUCKET as string
    const cmd = new ListObjectsV2Command({ Bucket, Prefix: prefix, MaxKeys: 100 })
    const out = await s3.send(cmd)

    const keys =
      out.Contents?.filter(o => o.Key && !o.Key.endsWith("/")).map(o => o.Key!) ?? []

    return NextResponse.json({ keys })
  } catch (err: any) {
    console.error("list error:", err)
    return NextResponse.json({ error: err?.message ?? "list failed" }, { status: 500 })
  }
}
