import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION! });
const bucket = process.env.S3_BUCKET_NAME!;

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 300 } // 5 minutes
    );

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("view-url error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to create view URL" }, { status: 500 });
  }
}
