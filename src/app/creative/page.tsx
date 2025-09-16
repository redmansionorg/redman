'use client'

import React,{useState} from 'react'
import Link from "next/link"
import Image from 'next/image'
import { Button } from "@/components/ui/button"

//获得作者自己部署的小说基本信息集合
import { useSearchParams } from "next/navigation";
import { useMyNovels } from "@/hooks/useMyNovels";
import { useMyArts } from "@/hooks/useMyArts";

import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"


const MAX_BYTES=50

export default function Page() {


  const searchParams = useSearchParams();
  const trigger = searchParams.get('refresh') === 'true';
  const typeParam = searchParams.get('type');
  const type: 'novel' | 'art' = typeParam === 'art' ? 'art' : 'novel';
  const {books,percent,loading} = useMyNovels(trigger);
  const {arts,artLoading} = useMyArts();

  const [activeTab, setActiveTab] = useState<'novel' | 'art'>(type) // 控制tab状态


  return (
    <div>
      <div id="creative-space" className='mt-8 w-full md:w-3xl lg:w-5xl pl-3 pr-3'>
        <div className='col-md-9'>
          <header className='p-5'>
            <div className='flex flex-row justify-between items-center'>
              <div className='text-2xl font-bold'>我的作品</div>
              <Button  asChild>
                <Link href="/creative/writebook">+ 写小说</Link>
              </Button>
            </div>
          </header>

          <Progress value={percent} className="bg-gray-100 w-full h-[2px]"/>
          <div id="panel" className='mb-6 shadow-lg p-4 border border-gray-100'>
            {/* tab 栏 */}
            <div id="works_type" className='text-lg flex flex-row gap-2'>
              <div onClick={() => setActiveTab('novel')} className={`hover:bg-gray-100 hover:cursor-pointer flex w-31 h-11 justify-center items-center ${activeTab=='novel' && 'border-b-1 border-amber-700'}`}>小说</div>
              <div onClick={() => setActiveTab('art')} className={`hover:bg-gray-100 hover:cursor-pointer flex w-31 h-11 justify-center items-center ${activeTab=='art' && 'border-b-1 border-amber-700'}`}>艺术品</div>
            </div>
            {/* tab 内容 */}
            <div id="works_list">

              {activeTab === 'novel' && (<>

              {books.map((book)=>(
              <div id="works_item" className='pt-4 pb-5 border-t border-gray-200' key={book.id}>
                <div id="row-container" className='flex flex-row justify-between'>
                  <div id="left-container">
                    <div id="item_wrapper" className='flex flex-row '>
                      <div className='w-3'></div>
                      <Link href={{
                          pathname: '/literature/readbook', 
                          query: {
                            book_id: book.id
                        },}}>
                        <div className='relative w-[80px] h-[125px] mr-4'>
                          <Image 
                            src={book.coverUrl} 
                            alt={book.title}
                            fill
                            className='object-cover rounded'
                            sizes="100px"
                            unoptimized // ✅ 关闭服务端优化
                          />
                        </div>
                      </Link>
                      <div id="item_info">
                        <div className='w-auto flex flex-col'>
                          <h2 className='font-bold text-sm mt-2 mb-2 line-clamp-1'>{book.title}</h2>
                          <div className='text-sm text-gray-600 mb-3'>{book.description.length>MAX_BYTES?book.description.slice(0,MAX_BYTES)+' ......':book.description}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div id="rght-container" className='flex flex-col justify-between items-center ml-3 gap-3'>
                    <div id="new_item">
                      <Button variant={"outline"}>
                        <Link href={{
                          pathname: '/creative/writechapter', 
                          query: {
                          book_id: book.id,
                          book_title: book.title,
                          chapter_id: book.chapterCount+1,},
                        }}>写第{book.chapterCount+1}章</Link></Button>
                    </div>
                    <div id="last_item" className='text-sm'>共 {book.chapterCount} 章</div>
                    <div></div>
                    <div id="new_item">
                      {/* <Button variant={"secondary"}><Link href="#">入驻红馆</Link></Button> */}
                    </div>
                  </div>
                </div>
              </div>
              ))}
              {loading && <Skeleton className='w-full h-[360px]'/>}
              {!loading && books.length==0 && (<div className='flex justify-center text-center pt-30 pb-30'>立刻留下点滴的思想！</div>)}
            </>)}

            {activeTab === 'art' && (<>

              {arts.map((art,index)=>(
              <div id="works_item" className='pt-4 pb-5 border-t border-gray-200' key={art.id}>
                <div id="row-container" className='flex flex-row justify-between'>
                  <div id="left-container">
                    <div id="item_wrapper" className='flex flex-row '>
                      <div className='w-3'></div>
                      <Link href={{
                          pathname: '/literature/readbook', 
                          query: {
                            book_id: art.id
                        },}}>
                        <div className='relative w-[100px] h-[100px] mr-2'>
                          <Image 
                            src={art.coverUrl} 
                            alt={art.name}
                            fill
                            className='object-cover rounded'
                            sizes="100px"
                            unoptimized // ✅ 关闭服务端优化
                          />
                        </div>
                      </Link>
                      <div id="item_info" className='w-full'>
                        <div className='w-auto flex flex-col'>
                          <h2 className='font-bold text-sm mt-2 mb-2 line-clamp-1'>{art.name} - [{art.symbol}]</h2>
                          <div className='text-sm text-gray-600 mb-3'>{art.description.length>MAX_BYTES?art.description.slice(0,MAX_BYTES)+' ......':art.description}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div id="rght-container" className='flex flex-col justify-between items-center gap-3'>
                    <div id="new_item">
                      <Button variant={"outline"}>
                        <Link href={{
                          pathname: '/creative/createartwork', 
                          query: {
                          art_id: art.id,
                          art_name: art.name,
                          token_id: art.artCount+1,
                          person_id: art.personId,
                          author: art.author,
                          royalty: art.royalty
                        },
                        }}>铸第{art.artCount+1}个</Link></Button>
                    </div>
                    <div id="last_item" className='text-sm'>共 {art.artCount} 个</div>
                    <div></div>
                    <div id="new_item">
                      {/* <Button variant={"secondary"}><Link href="#">入驻红馆</Link></Button> */}
                    </div>
                  </div>
                </div>
              </div>
              ))}
              {artLoading && <Skeleton className='w-full h-[360px]'/>}
              {!artLoading && arts.length==0 && (<div className='flex justify-center text-center pt-30 pb-30'>找到喜欢的小说，创造你的艺术作品吧！</div>)}

            </>)}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
