'use client'

import { useCallback } from 'react'
import s3 from '@/lib/aws3'

/**
 * 上传 metadata 到 AWS S3，并提取 CID（来自 x-amz-meta-cid）
 *
 * @returns 函数 uploadMetadata(json, artAddress, tokenId, title) => Promise<string>
 */
export function useUploadMetadata() {
  return useCallback(
    async (
      metadata: Record<string, any>,
      artAddress: string,
      tokenId: string,
      title: string
    ): Promise<string> => {
      const key = `artwork/${artAddress}_${tokenId}_${title}_metadata`
      const json = JSON.stringify(metadata)

      return new Promise((resolve, reject) => {
        const params = {
          Bucket: 'redmansion',
          Key: key,
          Body: json,
          ContentType: 'application/json',
        }

        try {
          const request = s3.putObject(params)

          request.on('httpHeaders', (_statusCode, headers) => {
            const cid = headers['x-amz-meta-cid']
            if (cid) {
              resolve(cid as string)
            } else {
              reject(new Error('CID 提取失败'))
            }
          })

          request.on('error', (err) => {
            reject(err)
          })

          request.send()
        } catch (err: any) {
          reject(err)
        }
      })
    },
    []
  )
}