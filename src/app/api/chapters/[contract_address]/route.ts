import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/api/db';
import { isValidContractAddress } from '@/lib/api/web3';

// GET /api/chapters/:contract_address
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

