import { createHash, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type StoredAsset = {
  url: string;
  key: string;
  storage: "local" | "s3";
};

const LOCAL_ASSETS_DIR = path.join(process.cwd(), "uploads", "generated");
const publicBaseUrl = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");

function extensionFromMime(mimeType: string) {
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}

function getS3Client() {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || "us-east-1";
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket || !accessKeyId || !secretAccessKey) return null;

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true" || !!endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  return { client, bucket };
}

export async function storeGeneratedImage(base64: string, mimeType = "image/png"): Promise<StoredAsset> {
  const buffer = Buffer.from(base64, "base64");
  const ext = extensionFromMime(mimeType);
  const digest = createHash("sha256").update(buffer).digest("hex").slice(0, 16);
  const key = `generated/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${digest}.${ext}`;

  const s3 = getS3Client();
  if (s3) {
    await s3.client.send(new PutObjectCommand({
      Bucket: s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: "public, max-age=31536000, immutable",
    }));

    const base = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
    const url = base
      ? `${base}/${key}`
      : `https://${s3.bucket}.s3.${process.env.S3_REGION || "us-east-1"}.amazonaws.com/${key}`;
    return { url, key, storage: "s3" };
  }

  const localPath = path.join(LOCAL_ASSETS_DIR, key.replace(/\//g, path.sep));
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, buffer);

  const localUrl = `/uploads/generated/${key.replace(/^generated\//, "")}`;
  return {
    url: publicBaseUrl ? `${publicBaseUrl}${localUrl}` : localUrl,
    key,
    storage: "local",
  };
}

export { LOCAL_ASSETS_DIR };
