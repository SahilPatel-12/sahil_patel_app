const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Load configurations
const endpoint = 'https://a045e609b00573a60d924ffc9effec6b.r2.cloudflarestorage.com';
const accessKeyId = '5894f44294482e9138902a324c661925';
const secretAccessKey = 'eef192ddaa787fcb080ec1f69949ac4f7dcfceaa5e6b16dce6709df80130775e';
const bucketName = 'mantrapujaapp';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

async function testUpload() {
  try {
    console.log('Testing Cloudflare R2 upload with credentials...');
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: 'test-connection.txt',
      Body: 'Hello Cloudflare R2 from Antigravity!',
      ContentType: 'text/plain',
    });

    const response = await r2Client.send(command);
    console.log('Success! File uploaded successfully.');
    console.log('Response:', response);
  } catch (err) {
    console.error('R2 Connection/Upload Failed:', err);
  }
}

testUpload();
