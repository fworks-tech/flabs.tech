import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const bucket = process.env.AWS_S3_BUCKET;

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  client = new S3Client({ region });
  return client;
}

export function isS3Configured(): boolean {
  // The SDK resolves credentials from its default chain (env, shared config,
  // instance/role); only the bucket is required to know S3 is usable.
  return Boolean(bucket);
}

export function getBucket(): string {
  if (!bucket) throw new Error('AWS_S3_BUCKET is not set');
  return bucket;
}

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string,
): Promise<string> {
  const s3 = getClient();
  await s3.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      // No ACL: modern buckets block public ACLs by default. Read access is
      // granted by the bucket policy / CloudFront distribution.
    }),
  );
  return publicUrl(key);
}

export async function deleteFile(key: string): Promise<void> {
  const s3 = getClient();
  await s3.send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const s3 = getClient();
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: getBucket(), Key: key }), { expiresIn });
}

export function publicUrl(key: string): string {
  return `https://${getBucket()}.s3.${region}.amazonaws.com/${key}`;
}
