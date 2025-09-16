'use client'

import React,{useState} from 'react'
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


  return (
    <div className='m-3'>
      {
        loading?(
          <Skeleton className="w-full h-[287px]" />
        ):(
        <header className='flex flex-col items-center md:items-start md:flex-row w-full justify-center p-5'>
          <Image src={`${book?.coverUrl}`} alt="" width={184} height={287} unoptimized></Image>
          <div className='flex flex-col p-3 justify-center gap-12'>
            <div className='text-2xl'>{book?.title}</div>
            <div>
              <div className='flex gap-2 mb-4 flex-wrap'>
                <span className='text-sm bg-gray-100 px-2 py-1 rounded'>192 ★</span>
                <span className='text-sm bg-gray-100 px-2 py-1 rounded'>168 reviews</span>
                <span className='text-sm bg-gray-100 px-2 py-1 rounded'>{book?.chapterCount} chapters</span>
              </div>
            </div>
            <div className='flex flex-row justify-center'>
              <Button>
                <Link href={{
                  pathname: '/literature/readchapter', 
                  query: {
                    book_id: book?.id,
                    chapter_id: 1,
                },}}>
                  Start reading
                </Link>
              </Button>
            </div>
          </div>
        </header>
      )}

      {loading?(
          <Skeleton className="w-full h-[383px]" />
        ):(
         <div className='flex flex-col w-auto lg:flex-row lg:w-5xl pt-5 lg:pt-10'>

            <div id="authorInfo" className='flex flex-row gap-3 items-center w-full pt-3 lg:flex-col lg:w-40'>
                <div className='flex flex-col items-center text-lg'>
                    <div className=''><Image src="/b.128.jpg" width={72} height={72} alt="avarta" className='rounded-full'/></div>
                    <div className='text-gray-500 text-sm'>{book?.author}</div>
                </div>
                {/* Empty spans removed as they serve no purpose */}
                <div><br></br></div>
                <div><Image src="/author_legacy/cunzhuangren.gif" width={50} height={50} alt="avarta" className='rounded-full'/></div>
                <div><Image src="/author_legacy/goldvip.png" width={50} height={50} alt="avarta" className='rounded-full'/></div>
                <div><Image src="/author_legacy/advancevip.png" width={50} height={50} alt="avarta" className='rounded-full'/></div>
                <div><Image src="/author_legacy/huodongdaren.png" width={50} height={50} alt="avarta" className='rounded-full'/></div>
            </div>

           <main id="contents" className='w-full p-5'>
                <div>
                    <div className='text-lg font-bold pb-2 mb-2 border-b border-b-gray-200'>故事梗概</div>
                    <div>
                        <pre className="whitespace-pre-wrap break-words font-sans">
                            {book?.description}
                        </pre>
                    </div>
                </div>
                <div className=' pt-14 pb-4'>
                    <div className='text-sm p-5 shadow-xl bg-rose-50'>
                        <div className='flex justify-between'>
                            <div className='text-lg font-bold mb-1 pb-1 border-b border-b-rose-200'>版权指纹印章</div>
                        </div>
                        <div><span className='font-bold'>许可方式：</span><span> {book?.terms}</span></div>
                        <div><span className='font-bold'>小说指纹：</span><span>{ht(book?.buid)}</span></div>
                        <div><span className='font-bold'>身份指纹：</span><span> {ht(book?.puid)}</span></div>
                        <div><span className='font-bold'>时间戳印：</span><span> {book?.bookTime}</span></div>
                    </div>
                    <Stamp text="RMC" rotate={-20} className="absolute bottom-30 left-8" width={200} height={90}/>
                </div>                                 

                <div className='flex justify-center text-lg font-bold pb-4 border-b border-b-gray-100'>小说章节</div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 list-none w-full shadow-lg">
                  {book?.allChapterTitle && book.allChapterTitle.length > 0 ? (
                    book.allChapterTitle.map((title, index) => (
                      <li key={index} className="p-2 hover:bg-gray-200 transition-colors">
                        <Link href={{
                          pathname: '/literature/readchapter', 
                          query: {
                            book_id: book?.id,
                            chapter_id: index+1,
                        },}}>{title}</Link>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400 p-2">No chapters found.</li>
                  )}
                </ul>
            </main>

            <div className='flex flex-col items-center pt-20 lg:min-w-40 lg:w-40'>
                <div className='flex justify-center w-full font-bold mb-5 p-2 border-b border-gray-200'>小说衍生品</div>                
                {arts.map((collect)=> (
                  <Link href={`${collect.marketUrl}`} target="_blank" rel="noopener noreferrer" key={collect.id}>
                    <div id={`collection-${collect.id}`} className='flex flex-col max-w-lg gap-1 rounded-lg mb-6'>
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
                <div key="create_button">
                    <Button><Link href={`/creative/createcollection?book_id=${bookId}&book_title=${book?.title}`}>衍生创作</Link></Button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
