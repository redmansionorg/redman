import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/api/db';
import { isValidContractAddress } from '@/lib/api/web3';

/**
 * @swagger
 * /api/novels:
 *   get:
 *     tags: [novels]
 *     summary: 获取小说列表
 *     description: 分页获取小说列表，支持按作者钱包地址筛选
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码，从1开始
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页返回的数量
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: 作者钱包地址（可选），用于筛选特定作者的小说
 *     responses:
 *       200:
 *         description: 成功返回小说列表
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
 *                     novels:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           contract_address:
 *                             type: string
 *                           title:
 *                             type: string
 *                           author_address:
 *                             type: string
 *                           author_name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           cover_cid:
 *                             type: string
 *                           chapter_count:
 *                             type: integer
 *                           mature:
 *                             type: boolean
 *                           completed:
 *                             type: boolean
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
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
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 20;
  const offset = (page - 1) * limit;
  const authorAddress = searchParams.get('author');

  try {
    let whereClause = '';
    const params: any[] = [limit, offset];

    if (authorAddress && isValidContractAddress(authorAddress)) {
      whereClause = 'WHERE author_address = $3';
      params.push(authorAddress.toLowerCase());
    }

    const novels = await query(
      `
      SELECT 
        id, contract_address, title, author_address, author_name,
        description, cover_cid, synopsis_cid,
        chapter_count, mature, completed,
        created_at, updated_at, synced_at
      FROM novels
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
      `,
      params
    );

    // 为总数查询构建独立的 whereClause 和参数
    let countWhereClause = '';
    const countParams: any[] = [];
    
    if (authorAddress && isValidContractAddress(authorAddress)) {
      countWhereClause = 'WHERE author_address = $1';
      countParams.push(authorAddress.toLowerCase());
    }

    const totalResult = await queryOne<{ count: string }>(
      `
      SELECT COUNT(*) as count FROM novels ${countWhereClause}
      `,
      countParams
    );

    const total = totalResult ? Number(totalResult.count) : 0;

    return NextResponse.json({
      success: true,
      data: {
        novels,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching novels:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch novels',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

