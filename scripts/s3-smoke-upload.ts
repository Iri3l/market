// scripts/s3-smoke-upload.ts
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Resolve project root (the /api folder) and load its .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.resolve(__dirname, ".."); // scripts/.. -> api
const envPath = path.join(apiRoot, ".env.local");
config({ path: envPath });

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name} (looked in ${envPath})`);
  return v;
}

async function main() {
  console.log("cwd:", process.cwd());
  console.log("env loaded from:", envPath);

  const region = requireEnv("AWS_REGION");
  const bucket = requireEnv("S3_BUCKET_NAME");

  const s3 = new S3Client({ region });

  const key = `test/${Date.now()}-hello.txt`;
  const body = Buffer.from("Hello from MARKET S3 smoke test 👋");

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "text/plain",
      })
    );
    console.log(`✅ Uploaded s3://${bucket}/${key}`);
  } catch (err: any) {
    console.error("❌ Upload failed");
    console.error("name:", err.name);
    console.error("code:", err.$metadata?.httpStatusCode);
    console.error("message:", err.message);
    process.exit(1);
  }
}

main();
