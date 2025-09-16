'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import OpusFactoryAbi from '@/contracts/OpusFactory.abi.json';
import ArtworkOpusAbi from '@/contracts/ArtworkOpus.abi.json';

const OPUS_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_ART_FACTORY || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://redmansion.io/srpc/';
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

export interface ArtMetadata {
  id: string;              // 合约地址
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  artCount: number;
  marketUrl: string;
  items: {
    token: number;
    image: string;
    price: number;
  }[];
}

export function useBookArts(bookAddress: string|null): {
  arts: ArtMetadata[];
  loading: boolean;
  percent: number;
  error: string | null;
} {
  const { address } = useAccount();
  const [arts, setArts] = useState<ArtMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [percent, setPercent] = useState<number>(0);

  useEffect(() => {
    //if (!address) return;

    const fetchArts = async () => {
      setLoading(true);
      setError(null);
      let _percent = 0;

      try {
        //const provider = new ethers.BrowserProvider(window.ethereum);
        const provider = new ethers.JsonRpcProvider(RPC_URL); 
        const factory = new ethers.Contract(OPUS_FACTORY_ADDRESS, OpusFactoryAbi, provider);

        setPercent(3)
        const arts = await factory.getArtsByBook(bookAddress);
        const totalNum = arts?.length;

        setPercent(6)
        const artInfos = await Promise.all(
          Array.from({ length: totalNum }, (_, i) =>
            factory.artInfos(factory.allArts(i))
          )
        );

        setPercent(10)
        const fetchedArts = await Promise.all(
          artInfos.map(async (info,index) => {

            try {
              // 加载主 metadata（集合级别）
              const metaRes = await fetch(`${IPFS_GATEWAY}${info.metadataCid}`);
              const metaJson = await metaRes.json();
              const description = metaJson.description || '';

              const artContract = new ethers.Contract(info.artwork, ArtworkOpusAbi, provider);
              const tokenCount = Number(await artContract.totalSupply());

              const itemResults = await Promise.allSettled(
                Array.from({ length: tokenCount }, (_, i) => i + 1).map(async (tokenId, i) => {
                  try {
                    const tokenUri = await artContract.tokenURI(tokenId);
                    const cid = tokenUri.replace('ipfs://', '');
                    const metaUri = `${IPFS_GATEWAY}${cid}`;

                    const res = await fetch(metaUri);
                    const json = await res.json();
                    const imageUri = json.image.replace('ipfs://', '');
                    const image = imageUri.startsWith('https://')?imageUri:`${IPFS_GATEWAY}${imageUri}`;
                    const price = Number(json.properties.price) || 0;

                    setPercent(_percent += 1/totalNum*100*1/tokenCount)

                    return { token: tokenId, image, price };
                  } catch {
                    return null;
                  }
                })
              );

              const items = itemResults
                .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
                .map((r) => r.value);

              return {
                id: String(info.artwork),
                title: info.name,
                author: info.pseudonym,
                description,
                coverUrl: `${IPFS_GATEWAY}${info.logoCid}`,
                artCount: tokenCount,
                marketUrl: 'https://opensea.io/collection/art-lace-collection', // 可做动态拼接
                items,
              };
            } catch (innerErr) {
              console.error('Error fetching individual art info:', innerErr);
              return null;
            }
          })
        );

        setPercent(100)
        const validArts = fetchedArts.filter((item): item is ArtMetadata => item !== null);

        setArts(validArts);
      } catch (e) {
        console.error('Error fetching all arts:', e);
        setError('Failed to fetch arts.');
        setArts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArts();
  }, [address]);

  return { arts, loading, percent, error };
}
