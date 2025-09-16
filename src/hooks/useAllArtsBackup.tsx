'use client'

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import OpusFactoryAbi from '@/contracts/OpusFactory.abi.json';
import ArtworkOpusAbi from '@/contracts/ArtworkOpus.abi.json';

// ✅ 修改为你的 OpusFactory 部署地址
const OPUS_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_ART_FACTORY || '';


export interface ArtMetadata {
  id: string;              // 合约地址
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  artCount: number;    // ✅ 新增章节数字段
  marketUrl: string,
  items: [{
    token:number,
    metaUri:string,
    price:number
  }]
}

export function useAllArtsBackup(): ArtMetadata[] {
  const { address } = useAccount();
  const [books, setBooks] = useState<ArtMetadata[]>([]);

  useEffect(() => {
    if (!address) return;

    const fetchArts = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const factory = new ethers.Contract(OPUS_FACTORY_ADDRESS, OpusFactoryAbi, provider);

        // 获取当前作者发布的所有艺术品集合的合约地址
        const collectCount = await factory.totalArts();

        const collectPromises = Array.from({ length: Number(collectCount) }, (_, i) => 
          factory.artInfos(factory.allArts(i))
        );
        const collectInfos = await Promise.all(collectPromises);

        const collects = await Promise.all(
          collectInfos.map(async (artInfo) => {
            try {
              const metadata = await fetch(`https://ipfs.io/ipfs/${artInfo.metadataCid}`)
                .then((res) => res.text())
                .catch(() => ('Failed to load.'));

              const metaobj = JSON.parse(metadata)
              const description = metaobj.description

              const artContract = new ethers.Contract(artInfo.artwork, ArtworkOpusAbi, provider);
              const tokenCount: number = await artContract.totalSupply();

              let items = []

              for(let id=1;id<=tokenCount;id++){
                const tokenUri = await artContract.tokenURI(id);
                const uri = tokenUri.slice(6)
                const metaUri = `https://ipfs.io/ipfs/${uri}`;
                const mdata = await fetch(metaUri)
                  .then((res) => res.text())
                  .catch(() => ('Failed to load.'));
                const mdataobj = JSON.parse(mdata);
                items.push({token: id, metaUri: metaUri, price: Number(mdataobj.price)})
              }

              console.log('Artwork Count: '+tokenCount)

              return {
                id: String(artInfo.artwork),
                title: artInfo.name,
                author: artInfo.pseudonym,
                description,
                coverUrl: `https://ipfs.io/ipfs/${artInfo.logoCid}`,
                artCount: tokenCount,
                marketUrl:"https://opensea.io/collection/art-lace-collection",
                items:items
              };
            } catch (error) {
              console.error('Error fetching novel info:', error);
              return null;
            }
          })
        );

        const validArts = collects.filter((item): item is ArtMetadata => item !== null);
        setBooks(validArts);
      } catch (error) {
        console.error('Error fetching novels:', error);
        setBooks([]);
      }
    };

    fetchArts();
  }, [address]);

  return books;
}
