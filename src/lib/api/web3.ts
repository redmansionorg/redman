import { ethers } from 'ethers';
import LiteratureOpus from '@/contracts/LiteratureOpus.json';

const RPC_URL = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC || 'https://redmansion.io/srpc';
const IPFS_GATEWAY = process.env.IPFS_GATEWAY || process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

// 创建Provider
export const provider = new ethers.JsonRpcProvider(RPC_URL);

// 获取小说合约实例
export function getNovelContract(contractAddress: string) {
  return new ethers.Contract(contractAddress, LiteratureOpus.abi, provider);
}

// 从IPFS获取内容
export async function fetchFromIPFS(cid: string): Promise<string> {
  try {
    const response = await fetch(`${IPFS_GATEWAY}${cid}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching IPFS content for CID ${cid}:`, error);
    throw error;
  }
}

// 验证合约地址格式
export function isValidContractAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

