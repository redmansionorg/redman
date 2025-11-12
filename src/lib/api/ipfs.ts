import AWS from 'aws-sdk';

// 初始化S3客户端（Filebase）
export const s3 = new AWS.S3({
  endpoint: process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.com',
  region: process.env.FILEBASE_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.FILEBASE_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.FILEBASE_SECRET_ACCESS_KEY || '',
  },
  httpOptions: {
    timeout: 50000,
    connectTimeout: 20000,
  },
});

export const BUCKET_NAME = process.env.FILEBASE_BUCKET || 'redmansion';

// 上传文件到IPFS并返回CID
export function uploadToIPFS(
  key: string,
  body: Buffer | string,
  contentType: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    };

    const request = s3.putObject(params);

    request.on('httpHeaders', (statusCode, headers) => {
      const cid = headers['x-amz-meta-cid'];
      if (cid) {
        resolve(cid as string);
      } else {
        reject(new Error('CID not found in response headers'));
      }
    });

    request.on('error', (err) => {
      console.error('S3 upload error:', err);
      reject(err);
    });

    request.send();
  });
}

