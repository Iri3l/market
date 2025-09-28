import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: NextRequest) {
  try {
    const region = requireEnv("AWS_REGION");
    const bucket = requireEnv("S3_BUCKET_NAME");
    const s3 = new S3Client({ region });

    const { filename, contentType } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
    }

    const key = `uploads/${Date.now()}-${filename}`;
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 });
    return NextResponse.json({ url, key });
  } catch (err: any) {
    console.error("Presign error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to create presigned URL" }, { status: 500 });
  }
}
