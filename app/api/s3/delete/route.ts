import { NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

function getS3() {
  const region = process.env.AWS_REGION;
  const bucket = process.env.S3_BUCKET || process.env.S3_BUCKET_NAME;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !bucket) return { error: "Missing AWS_REGION or S3_BUCKET" };
  if (!accessKeyId || !secretAccessKey) return { error: "Missing AWS keys" };
  return {
    s3: new S3Client({ region, credentials: { accessKeyId, secretAccessKey } }),
    bucket,
  };
}

export async function POST(req: Request) {
  const env = getS3();
  if ("error" in env)
    return NextResponse.json({ error: env.error }, { status: 400 });
  const { s3, bucket } = env;

  try {
    const body = await req.json();
    const key = String(body.key || "");
    if (!key)
      return NextResponse.json({ error: "Missing key" }, { status: 400 });

    const cmd = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("delete presign error:", err);
    const code = err?.$metadata?.httpStatusCode || 500;
    return NextResponse.json(
      { error: err?.message || "delete presign failed" },
      { status: code },
    );
  }
}
