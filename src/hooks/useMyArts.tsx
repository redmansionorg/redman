import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import ArtworkFactoryAbi from '@/contracts/OpusFactory.abi.json';
import ArtworkOpusAbi from '@/contracts/ArtworkOpus.abi.json';

// ✅ 修改为你的 OpusFactory 部署地址
const OPUS_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_ART_FACTORY||'';
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

// 智能合约OpusFactory.NovelInfo中相对应的变量，与本地NovelMetadata栏位对应关系
// address author;
// address novel;       -> id
// string title;        -> title
// string synopsisCid;  -> description
// string logoCid;      -> coverUrl
// string pseudonym;    -> author

export interface ArtMetadata {
  id: string;              // 合约地址
  name: string;
  symbol: string;
  personId: string;
  author: string;
  description: string;
  coverUrl: string;
  artCount: number;    // ✅ 新增章节数字段
  royalty: number;
  updatedAt?: string;      // 可选：未来支持链上时间戳或章节信息
}

export function useMyArts(): {arts:ArtMetadata[],artLoading:boolean} {
  const { address } = useAccount();
  const [arts, setArts] = useState<ArtMetadata[]>([]);
  const [artLoading, setArtLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!address) return;

    const fetchArts = async () => {
      setArtLoading(true)
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const factory = new ethers.Contract(OPUS_FACTORY_ADDRESS, ArtworkFactoryAbi, provider);

        // 获取当前作者发布的所有小说合约地址
        const artAddresses: string[] = await factory.getArtsByAuthor(address);
        console.log(artAddresses);

        const arts = await Promise.all(
          artAddresses.map(async (artAddr) => {
            try {
              const { name, metadataCid, symbol, logoCid, pseudonym} = await factory.artInfos(artAddr);

              console.log({ name, metadataCid, symbol, logoCid, pseudonym})
              // 暂时并没有一个元数据 JSON（包含 cover 和 description 字段）的文件
              // synopsisCid指向直接就是故事梗概的纯文本
              // logoCid直接就是指向图标的地址
              const metadata = await fetch(`${IPFS_GATEWAY}${metadataCid}`)
                .then((res) => res.text())
                .catch(() => ('Failed to load.'));
              
              // 现在有了
              const metaobj = JSON.parse(metadata)
              const description = metaobj.description
              const personId = metaobj.copyright.puid
              const royalty = metaobj.license.royalty

              // 获取章节总数，其实到这里发现novelInfo还是有用的，它一次就获得全部基本信息
              // 如果改为向小说合约直接读取，那小说合约最好增加一个一次获得全部基本信息的方法
              const artContract = new ethers.Contract(artAddr, ArtworkOpusAbi, provider);
              const artCount: number = await artContract.totalSupply();

              console.log('Art Count: '+artCount)

              return {
                id: artAddr,
                name,
                symbol,
                personId,
                author: pseudonym,
                description,
                coverUrl: `${IPFS_GATEWAY}${logoCid}`,
                artCount: Number(artCount),
                royalty: royalty
              };
            } catch (error) {
              console.error('Error fetching art info:', error);
              return null;
            } finally {
              setArtLoading(false);
            }
          })
        );

        const validArts = arts.filter((item): item is ArtMetadata => item !== null);
        setArts(validArts);
      } catch (error) {
        console.error('Error fetching novels:', error);
        setArts([]);
      } finally {
        setArtLoading(false);
      }
    };

    fetchArts();
  }, [address]);

  return {arts,artLoading};
}
