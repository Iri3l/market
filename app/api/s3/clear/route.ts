import { NextResponse } from "next/server";
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

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
    const { prefix = "uploads/" } = await req.json().catch(() => ({}) as any);
    const dir = prefix.endsWith("/") ? prefix : `${prefix}/`;

    let token: string | undefined;
    let total = 0;
    do {
      const list = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: dir,
          ContinuationToken: token,
          MaxKeys: 1000,
        }),
      );
      const Objects = (list.Contents || [])
        .filter((o) => o.Key && !o.Key.endsWith("/"))
        .map((o) => ({ Key: o.Key! }));
      if (Objects.length) {
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects, Quiet: true },
          }),
        );
        total += Objects.length;
      }
      token = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (token);

    return NextResponse.json({ deleted: total });
  } catch (err: any) {
    console.error("clear error:", err);
    const code = err?.$metadata?.httpStatusCode || 500;
    return NextResponse.json(
      { error: err?.message || "clear failed" },
      { status: code },
    );
  }
}
