import { NextRequest, NextResponse } from 'next/server';
import { validateAndUploadFiles } from '@/lib/utils/ipfs-upload';

/**
 * @swagger
 * /api/ipfs/upload:
 *   post:
 *     tags: [ipfs]
 *     summary: 上传文件到IPFS（需要签名验证）
 *     description: 通过Filebase上传文件到IPFS，需要提供合约地址、预期CID、签名等信息。只有已上链的CID才能被上传，且只有合约作者才能上传。
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - contractAddress
 *               - expectedCid
 *               - signature
 *               - message
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 要上传的文件
 *               contractAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: 小说合约地址
 *               expectedCid:
 *                 type: string
 *                 description: 前端计算好的预期CID
 *               signature:
 *                 type: string
 *                 description: 钱包签名（用于验证作者身份）
 *               message:
 *                 type: string
 *                 description: 签名的原始消息
 *               context:
 *                 type: string
 *                 enum: [novel, chapter]
 *                 default: novel
 *                 description: 上传上下文（novel=小说，chapter=章节）
 *               chapterNumber:
 *                 type: integer
 *                 description: 章节编号（当context=chapter时必需）
 *     responses:
 *       200:
 *         description: 上传成功
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
 *                     expectedCid:
 *                       type: string
 *                       description: 预期CID
 *                     actualCid:
 *                       type: string
 *                       description: 实际上传后的CID
 *                     key:
 *                       type: string
 *                       description: 文件存储路径
 *                     url:
 *                       type: string
 *                       description: Filebase网关URL
 *                     gateway_url:
 *                       type: string
 *                       description: IPFS网关URL
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
 *       500:
 *         description: 上传失败
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
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contractAddress = formData.get('contractAddress') as string;
    const expectedCid = formData.get('expectedCid') as string;
    const signature = formData.get('signature') as string;
    const message = formData.get('message') as string;
    const context = (formData.get('context') as 'novel' | 'chapter') || 'novel';
    const chapterNumber = formData.get('chapterNumber') 
      ? Number(formData.get('chapterNumber')) 
      : undefined;

    // 验证必要参数
    if (!file || !contractAddress || !expectedCid || !signature || !message) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          message: 'Please provide: file, contractAddress, expectedCid, signature, message',
        },
        { status: 400 }
      );
    }

    // 验证合约地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json(
        {
          error: 'Invalid contract address format',
          message: 'Contract address must be a valid Ethereum address',
        },
        { status: 400 }
      );
    }

    // 如果是章节上传，需要章节号
    if (context === 'chapter' && !chapterNumber) {
      return NextResponse.json(
        {
          error: 'Missing chapter number',
          message: 'Chapter number is required for chapter context',
        },
        { status: 400 }
      );
    }

    // 将单个文件包装成数组，调用通用函数
    const result = await validateAndUploadFiles(
      [{ file, expectedCid }],
      contractAddress,
      signature,
      message,
      context,
      chapterNumber
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Upload failed',
          message: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.results[0], // 返回单个结果
    });
  } catch (error: any) {
    console.error('Error uploading to IPFS:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        message: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

