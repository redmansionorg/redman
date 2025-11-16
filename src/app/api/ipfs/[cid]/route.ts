import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/ipfs/{cid}:
 *   get:
 *     tags: [ipfs]
 *     summary: 验证IPFS CID
 *     description: 验证指定的IPFS CID是否存在并可访问
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         schema:
 *           type: string
 *         description: IPFS内容标识符（CID）
 *     responses:
 *       200:
 *         description: CID验证结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     cid:
 *                       type: string
 *                     exists:
 *                       type: boolean
 *                     url:
 *                       type: string
 *                       nullable: true
 *       404:
 *         description: CID不存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: object
 *                   properties:
 *                     cid:
 *                       type: string
 *                     exists:
 *                       type: boolean
 *                       example: false
 *       500:
 *         description: 验证失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */
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

