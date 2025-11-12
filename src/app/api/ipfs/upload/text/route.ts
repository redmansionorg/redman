import { NextRequest, NextResponse } from 'next/server';
import { uploadToIPFS } from '@/lib/api/ipfs';

// POST /api/ipfs/upload/text
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, key } = body;

    if (!content) {
      return NextResponse.json(
        {
          error: 'No content provided',
          message: 'Please provide content to upload',
        },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileKey = key || `text/${timestamp}_${randomStr}.txt`;

    // 上传到IPFS
    const cid = await uploadToIPFS(fileKey, content, 'text/plain');

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
    console.error('Error uploading text to IPFS:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload text',
        message: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

