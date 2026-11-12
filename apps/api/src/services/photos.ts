import { MAX_PHOTO_BYTES } from '@kapitwatt/shared';
import { AppError } from '../lib/errors';

/**
 * Meter photos live in a PRIVATE R2 bucket (binding PHOTOS). Keys are random and carry no personal
 * data; there are no public URLs. Operators view a photo only through the authenticated
 * GET /readings/:id/photo route. Retention is a bucket lifecycle rule (see the API README note).
 */

/** JPEG files start with FF D8 FF. The content type a client sends is not trusted. */
export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

/** Rejects anything that is not a non-empty JPEG within the size limit. */
export function assertValidPhoto(bytes: Uint8Array): void {
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new AppError(413, 'photo_too_large', 'The photo is too large.');
  }
  if (!isJpeg(bytes)) {
    throw new AppError(422, 'invalid_photo', 'The photo must be a JPEG from the in-app camera.');
  }
}

export function requireBucket(bucket: R2Bucket | undefined): R2Bucket {
  if (!bucket) {
    throw new AppError(503, 'misconfigured', 'Photo storage is not configured. Ask the API owner.');
  }
  return bucket;
}

export async function storePhoto(bucket: R2Bucket, bytes: Uint8Array): Promise<string> {
  const key = `photos/${crypto.randomUUID()}.jpg`;
  await bucket.put(key, bytes, { httpMetadata: { contentType: 'image/jpeg' } });
  return key;
}

/** Best effort: used to undo a store when the database write is refused. */
export async function deletePhoto(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key).catch(() => {});
}
