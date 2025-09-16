'use client'

import React,{useState,useEffect} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

import Stamp from '@/components/Stamp';

import { useSearchParams } from "next/navigation";
import {useReadNovel} from '@/hooks/useReadNovel'
import {useBookArts} from '@/hooks/useBookArts'

import { Skeleton } from "@/components/ui/skeleton"

import {ht} from '@/utils/ht'


export default function Page() {
  const searchParams = useSearchParams();
  const bookAddress = searchParams.get('book_id');
  const chapterIdNum = searchParams.get('chapter_id')||"0";

  const [bookId, setBookId] = useState<string | null>(bookAddress);
  const [chapterId, setChapterId] = useState(Number(chapterIdNum));

  const {book,loading,error} = useReadNovel(bookId,chapterId);
  const {arts} = useBookArts(bookId);

  useEffect(() => {
      if (!chapterId) return;
      window.scrollTo(0, 0);
  }, [chapterId]);

  return (
    <div>
      {
        loading ? (
          <Skeleton className="h-[32px] w-full"/>
        ) : (
        <header className='flex flex-row justify-center pt-8'>
            <div className='flex flex-col items-center pt-3 lg:w-5xl justify-center gap-4'>
                  <>
                  <div className='text-2xl'>{book?.chapterTitle}</div>
                    <div>
                      <Link className='text-sm text-gray-400' href={`/literature/readbook?book_id=${bookId}`}>{book?.title}</Link>
                    </div>
                    <div>
                      <div className='flex gap-2 mb-4 flex-wrap'>
                        <span className='text-sm bg-gray-100 px-2 py-1 rounded'>173 ★</span>
                        <span className='text-sm bg-gray-100 px-2 py-1 rounded'>192 reviews</span>
                        <span className='text-sm bg-gray-100 px-2 py-1 rounded'>{book?.chapterCount} chapters</span>
                      </div>
                    </div>
                  </>                  
            </div>
        </header>
        )}
              
      {loading?(
        <Skeleton className="w-full h-[502px]" />
        ):(
        <div className='flex flex-col lg:flex-row lg:w-5xl m-3 lg:pt-10'>

            <div id="authorInfo" className='flex flex-row gap-3 items-center w-full pt-10 lg:flex-col lg:w-40'>
                <div className='flex flex-col items-center text-lg'>
                    <div className='m-3'><Image src="/b.128.jpg" width={72} height={72} alt="avarta" className='rounded-full'/></div>
                    <div className='text-gray-500 text-sm'>{book?.author}</div>
                </div>
                {/* Empty spans removed as they serve no purpose */}
                <div><br></br></div>
                <div><Image src="/author_legacy/cunzhuangren.gif" width={50} height={50} alt="avarta" className='rounded-full'/></div>
                <div><Image src="/author_legacy/goldvip.png" width={50} height={50} alt="avarta" className='rounded-full'/></div>
                <div><Image src="/author_legacy/advancevip.png" width={50} height={50} alt="avarta" className='rounded-full'/></div>
                <div><Image src="/author_legacy/huodongdaren.png" width={50} height={50} alt="avarta" className='rounded-full'/></div>
            </div>

            <main id="contents" className='w-full p-3'>
                <div>
                    <div className='text-lg font-bold pb-4'></div>
                    <div>
                        <pre className="whitespace-pre-wrap break-words font-sans">
                            {book?.content}
                        </pre>
                    </div>
                </div>
                <div className='text-sm pt-14 pb-4'>
                    <div className='p-5 shadow-xl bg-rose-50'>
                        <div className='flex justify-between  mb-2 border-b border-b-rose-200'>
                            <div className='text-lg font-bold mb-1 pb-1'>Copyright Notice</div>
                        </div>
                        <div><span className='font-bold'>License:</span><span> {book?.terms}</span></div>
                        <div><span className='font-bold'>Book ID:</span><span> {ht(book?.buid)}</span></div>
                        <div><span className='font-bold'>Chapter ID:</span><span> {ht(book?.cuid)}</span></div>
                        <div><span className='font-bold'>Person ID:</span><span> {ht(book?.puid)}</span></div>
                        <div><span className='font-bold'>Timestamp:</span><span> {book?.chapterTime}</span></div>
                    </div>
                    <Stamp text="RMC" rotate={-20} className="absolute bottom-30 left-8" width={200} height={90}/>
                </div>
                <div className='flex justify-center gap-3'>
                  {chapterId>1&&(
                    <Button variant={"outline"} onClick={() => setChapterId(chapterId - 1)}>返回第{chapterId-1}章</Button>
                  )}
                  {book?.chapterCount&&chapterId<book?.chapterCount&&(
                     <Button variant={"outline"} onClick={() => setChapterId(chapterId + 1)}>继续第{chapterId+1}章</Button>
                  )}
                </div>
            </main>

            <div className='flex flex-col items-center pt-20 lg:min-w-40 lg:w-40'>
                <div className='flex justify-center w-full font-bold mb-5 p-2 border-b border-gray-200'>Derivatives</div>                
                {arts.map((collect)=> (
                  <Link href={`${collect.marketUrl}`} target="_blank" rel="noopener noreferrer" key={collect.id}>
                    <div id={`collection-${collect.id}`} className='flex flex-col gap-1 rounded-lg mb-6'>
                        <div className='lg:text-xs'>{collect.title}</div>
                        <div className="grid grid-cols-3 gap-2 lg:gap-1">
                            {collect.items.slice(0,3).map((item) => (
                            <div key={item.token} className='w-full flex rounded-lg'>
                                <div>
                                <Image
                                    src={item.image}
                                    alt={`Collection Item ${item.token}`}
                                    width={336}
                                    height={336}
                                    className='object-cover rounded-lg'
                                    unoptimized
                                    style={{ 
                                      width: '100%', 
                                      height: 'auto' // 保持比例
                                    }}
                                />
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                  </Link>
                ))}
                <div>
                  <Button><Link href={`/creative/createcollection?book_id=${bookId}&book_title=${book?.title}`}>Create Derivative</Link></Button>
                </div>
            </div>
        </div>
        )}
    </div>
  )
}
