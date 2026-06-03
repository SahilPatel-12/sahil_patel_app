import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const endpoint = import.meta.env.VITE_CLOUDFLARE_ENDPOINT;
const accessKeyId = import.meta.env.VITE_CLOUDFLARE_ACCESS_KEY_ID;
const secretAccessKey = import.meta.env.VITE_CLOUDFLARE_SECRET_ACCESS_KEY;
const bucketName = import.meta.env.VITE_CLOUDFLARE_BUCKET_NAME;
const publicBaseUrl = import.meta.env.VITE_CLOUDFLARE_PUBLIC_BASE_URL;

// Initialize the S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto', // Cloudflare R2 uses 'auto' region
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

/**
 * Uploads a file directly to Cloudflare R2 storage bucket
 * @param {File} file The file object from <input type="file" />
 * @param {string} folder Optional folder path inside bucket (default: 'hero')
 * @param {function} onProgress Optional callback receiving upload percentage (0-100)
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export async function uploadToR2(file, folder = 'hero', onProgress = null) {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicBaseUrl) {
    throw new Error('Cloudflare R2 environment configurations are missing in your Admin .env file.');
  }

  try {
    const fileExt = file.name.split('.').pop();
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const uniqueFilename = `${uniqueId}-${Date.now()}.${fileExt}`;
    const key = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;

    console.log(`[Cloudflare R2] Initiating upload of ${file.name} to ${bucketName}/${key}...`);

    const parallelUploads3 = new Upload({
      client: r2Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: file,
        ContentType: file.type,
      },
    });

    if (onProgress) {
      parallelUploads3.on('httpUploadProgress', (progress) => {
        const total = progress.total || file.size;
        const percent = Math.round((progress.loaded * 100) / total);
        onProgress(Math.min(percent, 100));
      });
    }

    await parallelUploads3.done();
    console.log(`[Cloudflare R2] Upload completed successfully.`);

    // Build the public CDN URL using the R2 public custom domain
    const cleanBaseUrl = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
    const publicUrl = `${cleanBaseUrl}/${key}`;
    
    return publicUrl;
  } catch (err) {
    console.error('[Cloudflare R2] S3 upload command failed:', err);
    throw new Error(err.message || 'Cloudflare R2 upload failed.');
  }
}

/**
 * Deletes a file from Cloudflare R2 storage bucket given its public URL
 * @param {string} fileUrl The public CDN URL of the file
 */
export async function deleteFromR2(fileUrl) {
  if (!fileUrl) return;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicBaseUrl) {
    console.warn('[Cloudflare R2] Environment configurations are missing. Cannot delete from R2.');
    return;
  }

  try {
    const cleanBaseUrl = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
    if (!fileUrl.startsWith(cleanBaseUrl)) {
      console.log(`[Cloudflare R2] URL ${fileUrl} is not an R2 custom domain URL. Skipping deletion.`);
      return;
    }

    const key = fileUrl.replace(`${cleanBaseUrl}/`, '');
    console.log(`[Cloudflare R2] Attempting to delete object key: ${key} from bucket ${bucketName}...`);

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await r2Client.send(command);
    console.log(`[Cloudflare R2] Successfully deleted key: ${key} from R2 bucket.`);
  } catch (err) {
    console.error('[Cloudflare R2] S3 delete command failed:', err);
  }
}

