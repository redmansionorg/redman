import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import LiteratureOpusAbi from '@/contracts/LiteratureOpus.abi.json';

import dayjs from 'dayjs';

//const OPUS_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_LITERATURE_FACTORY||'';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://redmansion.io/srpc/';
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';


export interface Novel {
  //book info
  id: string;              // 合约地址
  title: string;
  description: string;
  coverUrl: string;
  buid: string;
  //author info
  author: string;
  puid: string;
  bookTime: string;
  //copyright
  ruid: string;
  //License
  terms: string;
  royalty: number;
  luid: string;
  //all chapter
  chapterCount: number;    // ✅ 新增章节数字段
  allChapterTitle: string[];
  //current chapter
  chapterId: number;      // 0表示当前没有读具体某一个章节
  chapterTitle: string | null;
  //contentCid: string;     // 当前章节的小说内容
  content: string | null;
  cuid: string | null; // 当前章节的内容CID
  price: number | 0; // 当前章节的价格
  chapterTime: string | null; // 当前章节的时间戳
}

export function useReadNovel(bookId: string|null, chapterId: number = 0): {
  book: Novel | null;
  loading: boolean;
  error: string | null;
}{
  const { address } = useAccount();
  const [book, setBook] = useState<Novel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 🟢 初次加载：获取小说元信息（作者、书名、简介、所有章节标题）
  useEffect(() => {
    if (!address || !bookId) return;
    
    const fetchBookMetadata = async () => {
      setLoading(true);
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const novelContract = new ethers.Contract(bookId, LiteratureOpusAbi, provider);

        const { pseudonym, puid } = await novelContract.author();
        const { timestamp } = await novelContract.copyright();
        const { terms, royalty, ruid, luid } = await novelContract.license();
        const { title, synopsisCid, logoCid, buid } = await novelContract.novel();
        const chapterCount = await novelContract.totalChapters();

        const chapterPromises = Array.from({ length: Number(chapterCount) }, (_, i) =>
          novelContract.chapters(i + 1)
        );
        const chapters = await Promise.all(chapterPromises);
        const allChapterTitle = chapters.map(ch => ch.title);

        const description = await fetch(`${IPFS_GATEWAY}${synopsisCid}`)
          .then((res) => res.text())
          .catch(() => 'Failed to load.');

        console.log(timestamp)

        setBook({
          id: bookId,
          title,
          description,
          coverUrl: `${IPFS_GATEWAY}${logoCid}`,
          buid,
          author: pseudonym,
          puid,
          bookTime: dayjs.unix(Number(timestamp)).format('YYYY-MM-DD HH:mm:ss'),
          ruid,
          terms,
          royalty,
          luid,
          chapterCount: Number(chapterCount),
          allChapterTitle,
          chapterId: 0,
          chapterTitle: null,
          content: null,
          cuid: null,
          price: 0,
          chapterTime: null,
        });
      } catch (err) {
        console.error('Error fetching book metadata:', err);
        setError('加载小说信息失败');
        setBook(null);
      }finally{
        setLoading(false);
      }
    };

    fetchBookMetadata();
  }, [address, bookId]);

  // 🟡 后续加载：只在 chapterId 变化时加载章节内容
  // 这里发现一个bug，就是监听book如果有变化就重新执行章节读取，但是最后又需要更新book的内容，导致变化，死循环
  // 解决办法就是判断book.chapterId是否已经更新为跟目标chapterId是一样的，如果一样就没必要重复读取chapter内容了
  useEffect(() => {
    if (!bookId || !book || chapterId <= 0 || chapterId > book.chapterCount || book.chapterId === chapterId) return;

    console.log("chater id: "+chapterId)
    
    const fetchChapterContent = async () => {
      setLoading(true);
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const novelContract = new ethers.Contract(bookId, LiteratureOpusAbi, provider);
        const chapter = await novelContract.chapters(chapterId);
        const contentCid = chapter.contentCid;
        const cuid = chapter.cuid;
        const price = chapter.price;
        const chapterTime = dayjs.unix(Number(chapter.copyright.timestamp)).format('YYYY-MM-DD HH:mm:ss');

        const content = await fetch(`${IPFS_GATEWAY}${contentCid}`)
          .then((res) => res.text())
          .catch(() => 'Failed to load.');

        setBook((prev) =>
          prev
            ? {
              ...prev,
              chapterId,
              chapterTitle: chapter.title,
              content,
              cuid,
              price,
              chapterTime
            }
            : prev
        );
      } catch (err) {
        console.error('Error loading chapter:', err);
        setError('加载章节失败');
      }finally{
        setLoading(false);
      }
    };

    fetchChapterContent();
  }, [chapterId, book]);

  return { book, loading, error };
}
