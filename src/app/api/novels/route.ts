import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/api/db';
import { isValidContractAddress } from '@/lib/api/web3';

// GET /api/novels
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

    const totalResult = await queryOne<{ count: string }>(
      `
      SELECT COUNT(*) as count FROM novels ${whereClause}
      `,
      authorAddress ? [authorAddress.toLowerCase()] : []
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

