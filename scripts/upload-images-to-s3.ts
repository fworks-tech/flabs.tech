import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { uploadFile } from '../src/lib/s3';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const dryRun = process.argv.includes('--dry-run');

function mimeFor(ext: string): string {
  switch (ext.toLowerCase()) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function main(): Promise<void> {
  const files = await walk(publicDir);
  const images = files.filter((f) => /\.(png|jpe?g|webp|gif|svg)$/i.test(f));
  console.log(`Found ${images.length} image(s) under public/`);

  for (const file of images) {
    const rel = path.relative(publicDir, file).replace(/\\/g, '/');
    // Key without the `public/` prefix so the S3 path mirrors the site path
    // (public/images/a.png -> images/a.png).
    const key = rel;
    if (dryRun) {
      console.log(`  would upload: ${rel} -> ${key}`);
      continue;
    }
    const buf = readFileSync(file);
    const url = await uploadFile(key, buf, mimeFor(path.extname(file).slice(1)));
    console.log(`  uploaded: ${rel} -> ${url}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
