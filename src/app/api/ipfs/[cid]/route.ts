import { NextRequest, NextResponse } from 'next/server';

// GET /api/ipfs/:cid
export async function GET(
  request: NextRequest,
  { params }: { params: { cid: string } }
) {
  const { cid } = params;

  try {
    // 尝试从IPFS网关获取内容
    const gateway = process.env.IPFS_GATEWAY || process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    const response = await fetch(`${gateway}${cid}`, {
      method: 'HEAD',
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        data: {
          cid,
          exists: true,
          url: `${gateway}${cid}`,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          data: {
            cid,
            exists: false,
          },
        },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error(`Error verifying CID ${cid}:`, error);
    return NextResponse.json(
      {
        error: 'Failed to verify CID',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

