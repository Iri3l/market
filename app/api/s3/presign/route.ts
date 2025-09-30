import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
export async function POST(req: Request) {
  const { filename, contentType } = await req.json();

  if (!filename || !contentType) {
    return Response.json({ error: "filename + contentType required" }, { status: 400 });
  }

  // ---- NEW: server-side type check ----
  if (!contentType.startsWith("image/")) {
    return Response.json({ error: "Only image uploads are allowed" }, { status: 400 });
  }
  // -------------------------------------

  const key = `uploads/${Date.now()}-${filename}`;
  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
  return Response.json({ url, key });
}
