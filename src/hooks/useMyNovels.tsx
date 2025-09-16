import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import OpusFactoryAbi from '@/contracts/OpusFactory.abi.json';
import LiteratureOpusAbi from '@/contracts/LiteratureOpus.abi.json';

// ✅ 修改为你的 OpusFactory 部署地址
const OPUS_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_LITERATURE_FACTORY||'';
//const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://redmansion.io/srpc/';
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

export function useMyNovels(triggerReload: boolean = false): {
  books:NovelMetadata[],
  percent: number,
  loading:boolean,
  error:string|null
} {
  const { address } = useAccount();
  const [books, setBooks] = useState<NovelMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [percent, setPercent] = useState<number>(0);
  const [error, setError] = useState<string|null>(null);


  useEffect(() => {
    if (!address) return;

    const fetchNovels = async () => {
      setLoading(true)
      let _percent = 0;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const factory = new ethers.Contract(OPUS_FACTORY_ADDRESS, OpusFactoryAbi, provider);

        setPercent(3)
        // 获取当前作者发布的所有小说合约地址
        const novelAddresses: string[] = await factory.getNovelsByAuthor(address);
        const novelCount = novelAddresses?.length

        setPercent(6)
        const novels = await Promise.all(
          novelAddresses.map(async (novelAddr) => {
            try {
              const { title, synopsisCid, logoCid, pseudonym} = await factory.novelInfos(novelAddr);

              setPercent(10)
              // 暂时并没有一个元数据 JSON（包含 cover 和 description 字段）的文件
              // synopsisCid指向直接就是故事梗概的纯文本
              // logoCid直接就是指向图标的地址
              const description = await fetch(`${IPFS_GATEWAY}${synopsisCid}`)
                .then((res) => res.text())
                .catch(() => ('Failed to load.'));

              // 获取章节总数，其实到这里发现novelInfo还是有用的，它一次就获得全部基本信息
              // 如果改为向小说合约直接读取，那小说合约最好增加一个一次获得全部基本信息的方法
              const novelContract = new ethers.Contract(novelAddr, LiteratureOpusAbi, provider);
              const chapterCount: number = await novelContract.totalChapters();

              console.log('Chapter Count: '+chapterCount)
              setPercent(_percent += 100*1/novelCount)

              return {
                id: novelAddr,
                title,
                author: pseudonym,
                description,
                coverUrl: `${IPFS_GATEWAY}${logoCid}`,
                chapterCount: Number(chapterCount),
              };
            } catch (error) {
              console.error('Error fetching novel info:', error);
              return null;
            } finally {
              setLoading(false);
            }
          })
        );

        setPercent(100)
        const validNovels = novels.filter((item): item is NovelMetadata => item !== null);
        setBooks(validNovels);
      } catch (error) {
        console.error('Error fetching novels:', error);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNovels();
  }, [address, triggerReload]);

  return {books,percent,loading,error};
}
