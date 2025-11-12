import { NextRequest, NextResponse } from 'next/server';
import { uploadToIPFS, BUCKET_NAME } from '@/lib/api/ipfs';

// POST /api/ipfs/upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const key = formData.get('key') as string | null;
    const type = (formData.get('type') as string) || 'text';

    if (!file) {
      return NextResponse.json(
        {
          error: 'No file provided',
          message: 'Please provide a file to upload',
        },
        { status: 400 }
      );
    }

    // 生成文件key
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileKey = key || `${type}/${timestamp}_${randomStr}_${file.name || 'file'}`;

    // 确定ContentType
    let contentType = 'application/octet-stream';
    if (type === 'image') {
      contentType = file.type || 'image/jpeg';
    } else if (type === 'json') {
      contentType = 'application/json';
    } else if (type === 'text' || type === 'chapter') {
      contentType = 'text/plain';
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到IPFS
    const cid = await uploadToIPFS(fileKey, buffer, contentType);

    const gateway = process.env.IPFS_GATEWAY || process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

    return NextResponse.json({
      success: true,
      data: {
        cid,
        key: fileKey,
        url: `https://ipfs.filebase.io/ipfs/${cid}`,
        gateway_url: `${gateway}${cid}`,
      },
    });
  } catch (error: any) {
    console.error('Error uploading to IPFS:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        message: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

