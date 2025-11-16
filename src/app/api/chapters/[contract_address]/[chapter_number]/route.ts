import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/api/db';
import { getNovelContract, fetchFromIPFS, isValidContractAddress } from '@/lib/api/web3';
import { verifyMessage, keccak256, solidityPacked } from 'ethers';

/**
 * @swagger
 * /api/chapters/{contract_address}/{chapter_number}:
 *   get:
 *     tags: [chapters]
 *     summary: 获取章节内容
 *     description: 获取指定小说的指定章节内容。如果是付费章节，需要提供用户钱包地址进行验证
 *     parameters:
 *       - in: path
 *         name: contract_address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: 小说合约地址
 *       - in: path
 *         name: chapter_number
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 章节编号（从1开始）
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: 用户钱包地址（访问付费章节时需要）
 *     responses:
 *       200:
 *         description: 成功返回章节内容
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
 *                     novel_id:
 *                       type: integer
 *                     chapter_number:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                       nullable: true
 *                     content_cid:
 *                       type: string
 *                       nullable: true
 *                     metadata_cid:
 *                       type: string
 *                       nullable: true
 *                     price:
 *                       type: string
 *                       format: bigint
 *                     is_paid:
 *                       type: boolean
 *                     word_count:
 *                       type: integer
 *                     source:
 *                       type: string
 *                       enum: [database, ipfs]
 *                     access_denied:
 *                       type: boolean
 *                       nullable: true
 *                     message:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: 无效的合约地址或章节编号
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: 未授权（访问付费章节需要提供钱包地址）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       404:
 *         description: 章节未找到
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

    // 2. 如果是付费章节，验证用户购买权限。此方法为临时方案，后续可改为X402支付协议功能
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
          [chapter.id, address?.toLowerCase()]
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
    if (chapter.content_cid&&chapter.content_cid.startsWith('Qm')) {
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

/**
 * @swagger
 * /api/chapters/{contract_address}/{chapter_number}:
 *   post:
 *     tags: [chapters]
 *     summary: 上传付费章节内容
 *     description: 上传付费章节内容到托管服务器。需要验证作者身份签名，并校验章节元数据与链上数据的一致性
 *     parameters:
 *       - in: path
 *         name: contract_address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: 小说合约地址
 *       - in: path
 *         name: chapter_number
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 章节编号（从1开始）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - title
 *               - author_address
 *               - signature
 *               - message
 *             properties:
 *               content:
 *                 type: string
 *                 description: 章节正文内容（最大1MB）
 *               title:
 *                 type: string
 *                 description: 章节标题（用于CUID校验）
 *               author_address:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: 作者钱包地址
 *               signature:
 *                 type: string
 *                 description: 签名（用于验证作者身份）
 *               message:
 *                 type: string
 *                 description: 签名的原始消息
 *     responses:
 *       200:
 *         description: 成功上传章节内容
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
 *                     chapter_id:
 *                       type: integer
 *                     chapter_number:
 *                       type: integer
 *                     word_count:
 *                       type: integer
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: 未授权（签名验证失败或不是作者）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       404:
 *         description: 小说或章节未找到
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       409:
 *         description: CUID校验失败
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
export async function POST(
  request: NextRequest,
  { params }: { params: { contract_address: string; chapter_number: string } }
) {
  const { contract_address, chapter_number } = params;
  const chapterNum = Number(chapter_number);

  // 1. 验证基本参数
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
    // 2. 解析请求体
    const body = await request.json();
    const { content, title, author_address, signature, message } = body;

    // 3. 验证必需字段
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required and must be a string' },
        { status: 400 }
      );
    }

    if (!author_address || !isValidContractAddress(author_address)) {
      return NextResponse.json(
        { error: 'Valid author_address is required' },
        { status: 400 }
      );
    }

    if (!signature || typeof signature !== 'string') {
      return NextResponse.json(
        { error: 'Signature is required' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 4. 验证内容大小（最大1MB）
    const MAX_CONTENT_SIZE = 1024 * 1024; // 1MB
    if (content.length > MAX_CONTENT_SIZE) {
      return NextResponse.json(
        { 
          error: 'Content too large',
          message: `Content size (${content.length} bytes) exceeds maximum allowed size (${MAX_CONTENT_SIZE} bytes)`
        },
        { status: 400 }
      );
    }

    // 5. 验证签名
    try {
      const recoveredAddress = verifyMessage(message, signature);
      console.log('Recovered address:', recoveredAddress);
      console.log('Author address:', author_address);
      if (recoveredAddress.toLowerCase() !== author_address.toLowerCase()) {
        return NextResponse.json(
          {
            error: 'Signature verification failed',
            message: 'Recovered address does not match author_address',
          },
          { status: 401 }
        );
      }
    } catch (error: any) {
      return NextResponse.json(
        {
          error: 'Invalid signature',
          message: error.message,
        },
        { status: 401 }
      );
    }

    // 6. 从数据库获取小说信息并验证作者身份
    const novel = await queryOne(
      `
      SELECT id, author_address, contract_address
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

    // 验证上传者是否为作者
    if (novel.author_address.toLowerCase() !== author_address.toLowerCase()) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Only the novel author can upload chapter content',
        },
        { status: 401 }
      );
    }

    // 7. 从链上读取章节数据
    const novelContract = getNovelContract(contract_address);
    let chainChapter;
    try {
      chainChapter = await novelContract.chapters(chapterNum);
    } catch (error: any) {
      console.error('Error fetching chapter from chain:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch chapter from chain',
          message: error.message,
        },
        { status: 500 }
      );
    }

    // 验证章节是否存在
    if (!chainChapter.exists) {
      return NextResponse.json(
        {
          error: 'Chapter not found',
          message: `Chapter ${chapterNum} does not exist on chain`,
        },
        { status: 404 }
      );
    }

    // 8. 提取链上章节信息
    const {
      title: chainTitle,
      contentCid: chainContentCid,
      price: chainPrice,
      cuid: chainCuid,
    } = chainChapter;

    // 9. 验证标题是否匹配（额外验证，确保数据一致性）
    if (title !== chainTitle) {
      return NextResponse.json(
        {
          error: 'Title mismatch',
          message: `Request title (${title}) does not match chain title (${chainTitle})`,
        },
        { status: 409 }
      );
    }

    // 10. 验证CUID
    // 付费章节的contentCid可能为null或空字符串，计算CUID时使用空字符串
    const contentCidForCuid = chainContentCid || '';
    const calculatedCuid = keccak256(
      solidityPacked(['string', 'string'], [title, contentCidForCuid])
    );

    if (calculatedCuid !== chainCuid) {
      return NextResponse.json(
        {
          error: 'CUID verification failed',
          message: `Calculated CUID (${calculatedCuid}) does not match chain CUID (${chainCuid}). Title or contentCid mismatch.`,
        },
        { status: 409 }
      );
    }

    // 11. 计算字数
    const wordCount = content.length;

    // 12. 更新数据库
    // 使用 INSERT ... ON CONFLICT 更新，只更新content和word_count
    const result = await query(
      `
      INSERT INTO chapters (
        novel_id, chapter_number, title, content,
        price, is_paid, word_count, cuid,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (novel_id, chapter_number)
      DO UPDATE SET
        content = EXCLUDED.content,
        word_count = EXCLUDED.word_count,
        updated_at = NOW()
      RETURNING id, chapter_number, word_count, updated_at
      `,
      [
        novel.id,
        chapterNum,
        title,
        content,
        Number(chainPrice),
        Number(chainPrice) > 0, // is_paid
        wordCount,
        chainCuid,
      ]
    );

    const updatedChapter = result[0];

    return NextResponse.json({
      success: true,
      data: {
        chapter_id: updatedChapter.id,
        chapter_number: updatedChapter.chapter_number,
        word_count: updatedChapter.word_count,
        updated_at: updatedChapter.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error uploading chapter content:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload chapter content',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

