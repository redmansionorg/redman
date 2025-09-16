import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import OpusFactoryAbi from '@/contracts/OpusFactory.abi.json';
import LiteratureOpusAbi from '@/contracts/LiteratureOpus.abi.json';

// ✅ 修改为你的 OpusFactory 部署地址
const OPUS_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_LITERATURE_FACTORY||'';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://redmansion.io/srpc/';
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

// 智能合约OpusFactory.NovelInfo中相对应的变量，与本地NovelMetadata栏位对应关系
// address author;
// address novel;       -> id
// string title;        -> title
// string synopsisCid;  -> description
// string logoCid;      -> coverUrl
// string pseudonym;    -> author

export interface NovelMetadata {
  id: string;              // 合约地址
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  chapterCount: number;    // ✅ 新增章节数字段
  updatedAt?: string;      // 可选：未来支持链上时间戳或章节信息
}

export function useAllNovels(): { 
  books: NovelMetadata[]; 
  loading: boolean;
  percent: number;
  error: string | null;
} {
  const { address } = useAccount();
  const [books, setBooks] = useState<NovelMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [percent, setPercent] = useState<number>(0);

  useEffect(() => {
    //if (!address) return;

    const fetchNovels = async () => {
      setLoading(true);
      setError(null);
      let _percent = 0;

      try {
        //const provider = new ethers.BrowserProvider(window.ethereum);
        let provider = null;
        let factory = null;
        if(!address){
          provider = new ethers.JsonRpcProvider(RPC_URL); 
        }else{
          provider = new ethers.BrowserProvider(window.ethereum);
        }
        factory = new ethers.Contract(OPUS_FACTORY_ADDRESS, OpusFactoryAbi, provider);

        setPercent(3)
        // 获取当前作者发布的所有小说合约地址
        const totalCount = await factory.totalNovels();
        const novelCount = Number(totalCount)
        console.log('Total Novels Count: ' + novelCount);

        setPercent(6)
        const novelPromises = Array.from({ length: Number(novelCount) }, (_, i) => 
          factory.novelInfos(factory.allNovels(i))
        );
        const novelInfos = await Promise.all(novelPromises);

        setPercent(10)
        const novels = await Promise.all(
          novelInfos.map(async (novelInfo) => {
            try {
              const description = await fetch(`${IPFS_GATEWAY}${novelInfo.synopsisCid}`)
                .then((res) => res.text())
                .catch(() => ('Failed to load.'));

              const novelContract = new ethers.Contract(novelInfo.novel, LiteratureOpusAbi, provider);
              const chapterCount: number = await novelContract.totalChapters();

              console.log('Chapter Count: '+chapterCount)
              setPercent(_percent += 100*1/novelCount)

              return {
                id: novelInfo.novel,
                title:novelInfo.title,
                author: novelInfo.pseudonym,
                description,
                coverUrl: `${IPFS_GATEWAY}${novelInfo.logoCid}`,
                chapterCount: Number(chapterCount),
              };
            } catch (error) {
              console.error('Error fetching novel info:', error);
              return null;
            }
          })
        );

        setPercent(100);
        const validNovels = novels.filter((item): item is NovelMetadata => item !== null);
        setBooks(validNovels);
      } catch (error) {
        console.error('Error fetching novels:', error);
        setError('Failed to fetch arts.');
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNovels();
  }, [address]);

  return {books, loading, percent, error };
}
