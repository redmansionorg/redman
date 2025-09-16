import { keccak256, solidityPacked, toUtf8Bytes } from 'ethers'
import { FormValues } from '../types'

/**
 * 计算哈希值：AWID, PUID, RUID
 */
function hashes(
  title: string,
  logoCid: string,
  fullname: string,
  identity: string
): [string, string, string] {
  const awid = keccak256(solidityPacked(['string', 'string'],[title.trim() + logoCid.trim()]))
  const puid = keccak256(solidityPacked(['string', 'string'],[fullname.trim() + identity.trim()]))
  const ruid = keccak256(solidityPacked(['bytes32', 'bytes32'],[puid + awid]))
  return [awid, puid, ruid]
}

/**
 * 构建完整 metadata JSON 对象
 */
function metadata(params: {
  title: string
  description: string
  pseudonym: string
  fullname: string
  identity: string
  royalty: string
  logoCid: string
  tokenId: string
  authorAddr: string
  awid: string
  puid: string
  ruid: string
  artAddress: string
}) {
  const {
    title,
    description,
    pseudonym,
    logoCid,
    tokenId,
    authorAddr,
    awid,
    puid,
    ruid,
    artAddress,
  } = params

  return {
    name: title,
    description,
    image: `ipfs://${logoCid}`,
    external_url: 'https://redmansion.io/artwork/watchartwork',
    attributes: [
      { trait_type: 'Art', value: 'Image' },
      { trait_type: 'Resolution', value: '350x350' },
    ],
    copyright: {
      puid,
      awid,
      ruid,
    },
    properties: {
      collectionAddr: artAddress,
      tokenId,
      authorAddr,
      author: pseudonym,
      timestamp: Date.now(),
    },
  }
}

export const buildMetadata = {
  hashes,
  metadata,
}
