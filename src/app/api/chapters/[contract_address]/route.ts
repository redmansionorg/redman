import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/api/db';
import { isValidContractAddress } from '@/lib/api/web3';

/**
 * @swagger
 * /api/chapters/{contract_address}:
 *   get:
 *     tags: [chapters]
 *     summary: 获取章节列表
 *     description: 获取指定小说的所有章节列表
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
 *         description: 成功返回章节列表
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
 *                     contract_address:
 *                       type: string
 *                     chapters:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           chapter_number:
 *                             type: integer
 *                           title:
 *                             type: string
 *                           price:
 *                             type: string
 *                             format: bigint
 *                           is_paid:
 *                             type: boolean
 *                           word_count:
 *                             type: integer
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: integer
 *       400:
 *         description: 无效的合约地址格式
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
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
    const chapters = await query(
      `
      SELECT 
        c.chapter_number, c.title, c.price, c.is_paid,
        c.word_count, c.created_at, c.updated_at
      FROM chapters c
      JOIN novels n ON c.novel_id = n.id
      WHERE n.contract_address = $1
      ORDER BY c.chapter_number ASC
      `,
      [contract_address.toLowerCase()]
    );

    return NextResponse.json({
      success: true,
      data: {
        contract_address,
        chapters,
        count: chapters.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch chapters',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

