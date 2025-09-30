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
    return NextResponse.json({ error: "filename + contentType required" }, { status: 400 });
  }

  const key = `uploads/${Date.now()}-${filename}`;

  // ⬅️ Include ContentType here (and nothing exotic: no ACL, no checksum)
  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  // ⬅️ Give yourself some time margin
  const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });

  return NextResponse.json({ url, key });
}
