import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/api/db';
import { getNovelContract, fetchFromIPFS, isValidContractAddress } from '@/lib/api/web3';

// GET /api/chapters/:contract_address/:chapter_number
export async function GET(
  request: NextRequest,
  { params }: { params: { contract_address: string; chapter_number: string } }
) {
  const { contract_address, chapter_number } = params;
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  const chapterNum = Number(chapter_number);

  if (!isValidContractAddress(contract_address)) {
    return NextResponse.json(
      { error: 'Invalid contract address format' },
      { status: 400 }
    );
  }

  if (!chapterNum || chapterNum <= 0) {
    return NextResponse.json(
      { error: 'Invalid chapter number' },
      { status: 400 }
    );
  }

  try {
    // 1. 从数据库获取章节信息
    const chapter = await queryOne(
      `
      SELECT 
        c.id, c.novel_id, c.chapter_number, c.title,
        c.content, c.content_cid, c.metadata_cid,
        c.price, c.is_paid, c.word_count,
        n.contract_address, n.author_address
      FROM chapters c
      JOIN novels n ON c.novel_id = n.id
      WHERE n.contract_address = $1 AND c.chapter_number = $2
      `,
      [contract_address.toLowerCase(), chapterNum]
    );

    if (!chapter) {
      return NextResponse.json(
        {
          error: 'Chapter not found',
          message: `Chapter ${chapterNum} not found for novel ${contract_address}`,
        },
        { status: 404 }
      );
    }

    // 2. 如果是付费章节，验证用户购买权限
    if (chapter.is_paid) {
      if (!address || !isValidContractAddress(address)) {
        return NextResponse.json(
          {
            error: 'Authentication required',
            message: 'User address is required to access paid chapters',
          },
          { status: 401 }
        );
      }

      // 验证链上购买记录
      try {
        // 检查数据库中的购买记录
        const purchase = await queryOne(
          `
          SELECT * FROM chapter_purchases
          WHERE chapter_id = $1 AND buyer_address = $2
          `,
          [chapter.id, address.toLowerCase()]
        );

        if (!purchase) {
          // 如果没有购买记录，返回章节元数据但不返回内容
          return NextResponse.json({
            success: true,
            data: {
              ...chapter,
              content: null, // 不返回内容
              access_denied: true,
              message: 'This is a paid chapter. Please purchase to access content.',
            },
          });
        }
      } catch (error: any) {
        console.error('Error verifying chapter access:', error);
        // 如果验证失败，保守处理：不返回内容
        return NextResponse.json({
          success: true,
          data: {
            ...chapter,
            content: null,
            access_denied: true,
            message: 'Unable to verify access. Please try again.',
          },
        });
      }
    }

    // 3. 如果数据库中有内容，直接返回
    if (chapter.content) {
      return NextResponse.json({
        success: true,
        data: {
          ...chapter,
          source: 'database',
        },
      });
    }

    // 4. 如果数据库中没有内容，尝试从IPFS获取
    if (chapter.content_cid) {
      try {
        const content = await fetchFromIPFS(chapter.content_cid);
        return NextResponse.json({
          success: true,
          data: {
            ...chapter,
            content,
            source: 'ipfs',
          },
        });
      } catch (error: any) {
        console.error(`Error fetching content from IPFS for CID ${chapter.content_cid}:`, error);
        return NextResponse.json({
          success: true,
          data: {
            ...chapter,
            content: null,
            error: 'Failed to fetch content from IPFS',
          },
        });
      }
    }

    // 5. 如果既没有数据库内容也没有IPFS CID
    return NextResponse.json({
      success: true,
      data: {
        ...chapter,
        content: null,
        message: 'Content not available',
      },
    });
  } catch (error: any) {
    console.error('Error fetching chapter:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch chapter',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

