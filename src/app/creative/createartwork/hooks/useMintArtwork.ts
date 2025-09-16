'use client'

import { useCallback } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEventLogs } from 'viem'
import ArtworkOpusAbi from '@/contracts/ArtworkOpus.abi.json'

/**
 * 封装艺术品 mint NFT 的合约调用逻辑
 *
 * 自动监听交易确认，解析 ArtMinted 事件。
 */
export function useMintArtwork() {
  const { writeContractAsync } = useWriteContract()

  return useCallback(
    async (
      metadataCid: string,
      puid: string,
      awid: string,
      ruid: string,
      artAddress: string,
      tokenId: string,
      onSuccess: () => void
    ) => {
      try {
        const txHash = await writeContractAsync({
          address: artAddress as `0x${string}`,
          abi: ArtworkOpusAbi,
          functionName: 'mintArt',
          args: [`ipfs://${metadataCid}`, puid, awid, ruid],
        })

        const receipt = await useWaitForTransactionReceipt({
          hash: txHash,
          confirmations: 2,
        }).data

        if (!receipt) throw new Error('交易未确认')

        const logs = parseEventLogs({
          abi: ArtworkOpusAbi,
          logs: receipt.logs,
          eventName: 'ArtMinted',
        }) as any[]

        const mintedTokenId = logs[0]?.args?.tokenId
        if (mintedTokenId === tokenId) {
          onSuccess()
        } else {
          throw new Error('铸造事件 tokenId 不匹配')
        }
      } catch (err: any) {
        console.error('Mint Error:', err)
        throw err
      }
    },
    []
  )
}