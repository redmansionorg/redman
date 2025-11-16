import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/api/db';
import { isValidContractAddress } from '@/lib/api/web3';

/**
 * @swagger
 * /api/novels/{contract_address}:
 *   get:
 *     tags: [novels]
 *     summary: 获取小说详情
 *     description: 根据合约地址获取小说的详细信息
 *     parameters:
 *       - in: path
 *         name: contract_address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: 小说合约地址
 *     responses:
 *       200:
 *         description: 成功返回小说详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     contract_address:
 *                       type: string
 *                     title:
 *                       type: string
 *                     author_address:
 *                       type: string
 *                     author_name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     cover_cid:
 *                       type: string
 *                     synopsis_cid:
 *                       type: string
 *                     metadata_cid:
 *                       type: string
 *                     chapter_count:
 *                       type: integer
 *                     buid:
 *                       type: string
 *                     puid:
 *                       type: string
 *                     ruid:
 *                       type: string
 *                     luid:
 *                       type: string
 *                     price:
 *                       type: string
 *                       format: bigint
 *                     lock_chapter:
 *                       type: integer
 *                     mature:
 *                       type: boolean
 *                     completed:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     synced_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 无效的合约地址格式
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: 小说未找到
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       500:
 *         description: 服务器错误
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
  { params }: { params: { contract_address: string } }
) {
  const { contract_address } = params;

  if (!isValidContractAddress(contract_address)) {
    return NextResponse.json(
      { error: 'Invalid contract address format' },
      { status: 400 }
    );
  }

  try {
    const novel = await queryOne(
      `
      SELECT 
        id, contract_address, title, author_address, author_name,
        description, cover_cid, synopsis_cid, metadata_cid,
        chapter_count, buid, puid, ruid, luid,
        price, lock_chapter, mature, completed,
        created_at, updated_at, synced_at
      FROM novels
      WHERE contract_address = $1
      `,
      [contract_address.toLowerCase()]
    );

    if (!novel) {
      return NextResponse.json(
        {
          error: 'Novel not found',
          message: `Novel with contract address ${contract_address} not found in database`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: novel,
    });
  } catch (error: any) {
    console.error(`Error fetching novel ${contract_address}:`, error);
    return NextResponse.json(
      {
        error: 'Failed to fetch novel',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

