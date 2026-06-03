import 'react-native-get-random-values';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const endpoint = process.env.EXPO_PUBLIC_CLOUDFLARE_ENDPOINT;
const accessKeyId = process.env.EXPO_PUBLIC_CLOUDFLARE_ACCESS_KEY_ID;
const secretAccessKey = process.env.EXPO_PUBLIC_CLOUDFLARE_SECRET_ACCESS_KEY;
const bucketName = process.env.EXPO_PUBLIC_CLOUDFLARE_BUCKET_NAME;
const publicBaseUrl = process.env.EXPO_PUBLIC_CLOUDFLARE_PUBLIC_BASE_URL;

// Initialize the S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

/**
 * Uploads a local image file URI to Cloudflare R2
 * @param uri The local file URI from expo-image-picker
 * @param folder The bucket folder (default: 'profiles')
 * @returns The public custom domain URL of the uploaded asset
 */
export async function uploadToR2(uri: string, folder: string = 'profiles'): Promise<string> {
  if (!uri) {
    throw new Error('No local image URI provided.');
  }

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicBaseUrl) {
    throw new Error('Cloudflare R2 configuration environment variables are missing in your Expo .env.local file.');
  }

  try {
    // 1. Fetch the local URI to obtain a Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // 2. Generate a unique key
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const filename = `${uniqueId}-${Date.now()}.${fileExt}`;
    const key = folder ? `${folder}/${filename}` : filename;

    console.log(`[Cloudflare R2] Initiating upload of ${uri} to ${bucketName}/${key}...`);

    // 3. Convert Blob to Uint8Array for React Native compatibility with S3 Client
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read Blob as ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(reader.error || new Error('FileReader error'));
      reader.readAsArrayBuffer(blob);
    });

    const uint8Array = new Uint8Array(arrayBuffer);

    console.log(`[Cloudflare R2] Extracted binary size: ${uint8Array.byteLength} bytes.`);

    // 4. Upload the Uint8Array to R2
    const parallelUploads3 = new Upload({
      client: r2Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: uint8Array,
        ContentType: blob.type || 'image/jpeg',
      },
    });

    await parallelUploads3.done();
    console.log(`[Cloudflare R2] Upload completed successfully.`);

    // 5. Construct and return public URL
    const cleanBaseUrl = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
    return `${cleanBaseUrl}/${key}`;
  } catch (err: any) {
    console.error('[Cloudflare R2] S3 upload failed:', err);
    throw new Error(err.message || 'Cloudflare R2 upload failed.');
  }
}
