import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/api/db';
import { isValidContractAddress } from '@/lib/api/web3';

// GET /api/novels/:contract_address
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

