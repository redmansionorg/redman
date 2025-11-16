import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/api/db';
import { getNovelContract, fetchFromIPFS, isValidContractAddress } from '@/lib/api/web3';

/**
 * @swagger
 * /api/novels/sync/{contract_address}:
 *   post:
 *     tags: [novels]
 *     summary: 同步小说元数据
 *     description: 从链上同步指定合约地址的小说元数据和章节信息到数据库
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
 *         description: 同步成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Novel synced successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     contract_address:
 *                       type: string
 *                     novel_id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     chapter_count:
 *                       type: integer
 *                     chapters_synced:
 *                       type: integer
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
 *                 message:
 *                   type: string
 *       500:
 *         description: 同步失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *                 contract_address:
 *                   type: string
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { contract_address: string } }
) {
  const { contract_address } = params;

  // 验证合约地址格式
  if (!isValidContractAddress(contract_address)) {
    return NextResponse.json(
      {
        error: 'Invalid contract address format',
        message: 'Contract address must be a valid Ethereum address (0x...)',
      },
      { status: 400 }
    );
  }

  try {
    console.log(`Starting sync for novel: ${contract_address}`);

    // 获取合约实例
    const novelContract = getNovelContract(contract_address);

    // 1. 获取作者信息
    const author = await novelContract.author();
    const { pseudonym, puid, account: authorAddress } = author;

    // 2. 获取小说基本信息
    const novelData = await novelContract.novel();
    const {
      title,
      synopsisCid,
      logoCid,
      buid,
      price,
      lock: lockChapter,
      metadataCid,
      mature,
      completed,
    } = novelData;

    // 3. 获取版权信息
    const copyright = await novelContract.copyright();
    const { timestamp, ruid } = copyright;

    // 4. 获取许可信息
    const license = await novelContract.license();
    const { terms, royalty, advance, luid } = license;

    // 5. 获取章节总数
    const chapterCount = await novelContract.totalChapters();
    const chapterCountNum = Number(chapterCount);

    // 6. 从IPFS获取简介内容
    let description = '';
    if (synopsisCid) {
      try {
        description = await fetchFromIPFS(synopsisCid);
      } catch (error) {
        console.warn(`Failed to fetch description from IPFS: ${synopsisCid}`, error);
        description = 'Failed to load description.';
      }
    }

    // 7. 插入或更新小说数据
    const novelResult = await queryOne<{ id: number }>(
      `
      INSERT INTO novels (
        contract_address, title, author_address, author_name,
        description, cover_cid, synopsis_cid, metadata_cid,
        chapter_count, buid, puid, ruid, luid,
        price, lock_chapter, mature, completed, synced_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
      ON CONFLICT (contract_address) 
      DO UPDATE SET
        title = EXCLUDED.title,
        author_address = EXCLUDED.author_address,
        author_name = EXCLUDED.author_name,
        description = EXCLUDED.description,
        cover_cid = EXCLUDED.cover_cid,
        synopsis_cid = EXCLUDED.synopsis_cid,
        metadata_cid = EXCLUDED.metadata_cid,
        chapter_count = EXCLUDED.chapter_count,
        buid = EXCLUDED.buid,
        puid = EXCLUDED.puid,
        ruid = EXCLUDED.ruid,
        luid = EXCLUDED.luid,
        price = EXCLUDED.price,
        lock_chapter = EXCLUDED.lock_chapter,
        mature = EXCLUDED.mature,
        completed = EXCLUDED.completed,
        updated_at = NOW(),
        synced_at = NOW()
      RETURNING id
      `,
      [
        contract_address.toLowerCase(),
        title,
        authorAddress.toLowerCase(),
        pseudonym,
        description,
        logoCid || null,
        synopsisCid || null,
        metadataCid || null,
        chapterCountNum,
        buid || null,
        puid || null,
        ruid || null,
        luid || null,
        Number(price),
        Number(lockChapter),
        mature || false,
        completed || false,
      ]
    );

    if (!novelResult) {
      throw new Error('Failed to insert/update novel');
    }

    const novelId = novelResult.id;

    // 8. 同步章节信息
    let chaptersSynced = 0;
    if (chapterCountNum > 0) {
      const chapterPromises = Array.from({ length: chapterCountNum }, (_, i) =>
        novelContract.chapters(i + 1)
      );
      const chapters = await Promise.all(chapterPromises);

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const chapterNumber = i + 1;

        if (!chapter.exists) {
          continue;
        }

        const {
          title: chapterTitle,
          contentCid,
          price: chapterPrice,
          cuid,
          copyright: chapterCopyright,
          metadataCid: chapterMetadataCid,
        } = chapter;

        // 判断是否为付费章节
        const isPaid = Number(chapterPrice) > 0;

        // 插入或更新章节
        await query(
          `
          INSERT INTO chapters (
            novel_id, chapter_number, title, content_cid, metadata_cid,
            price, is_paid, cuid,
            copyright_wuid, copyright_puid, copyright_ruid, copyright_timestamp,
            synced_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
          ON CONFLICT (novel_id, chapter_number)
          DO UPDATE SET
            title = EXCLUDED.title,
            content_cid = EXCLUDED.content_cid,
            metadata_cid = EXCLUDED.metadata_cid,
            price = EXCLUDED.price,
            is_paid = EXCLUDED.is_paid,
            cuid = EXCLUDED.cuid,
            copyright_wuid = EXCLUDED.copyright_wuid,
            copyright_puid = EXCLUDED.copyright_puid,
            copyright_ruid = EXCLUDED.copyright_ruid,
            copyright_timestamp = EXCLUDED.copyright_timestamp,
            updated_at = NOW(),
            synced_at = NOW()
          `,
          [
            novelId,
            chapterNumber,
            chapterTitle,
            contentCid || null,
            chapterMetadataCid || null,
            Number(chapterPrice),
            isPaid,
            cuid || null,
            chapterCopyright.wuid || null,
            chapterCopyright.puid || null,
            chapterCopyright.ruid || null,
            Number(chapterCopyright.timestamp),
          ]
        );

        chaptersSynced++;
      }
    }

    // 9. 记录同步日志
    await query(
      `
      INSERT INTO sync_logs (contract_address, sync_type, status, chapters_synced)
      VALUES ($1, 'novel', 'success', $2)
      `,
      [contract_address.toLowerCase(), chaptersSynced]
    );

    console.log(`Successfully synced novel ${contract_address}: ${chaptersSynced} chapters`);

    return NextResponse.json({
      success: true,
      message: 'Novel synced successfully',
      data: {
        contract_address,
        novel_id: novelId,
        title,
        chapter_count: chapterCountNum,
        chapters_synced: chaptersSynced,
        synced_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error(`Error syncing novel ${contract_address}:`, error);

    // 记录失败日志
    await query(
      `
      INSERT INTO sync_logs (contract_address, sync_type, status, error_message)
      VALUES ($1, 'novel', 'failed', $2)
      `,
      [contract_address.toLowerCase(), error.message || 'Unknown error']
    ).catch((err) => {
      console.error('Failed to log sync error:', err);
    });

    return NextResponse.json(
      {
        error: 'Failed to sync novel',
        message: error.message || 'Unknown error occurred',
        contract_address,
      },
      { status: 500 }
    );
  }
}

