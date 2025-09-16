'use client'

import React,{useState} from 'react'

import Image from 'next/image'
import Link from 'next/link'

import { useAllNovels } from "@/hooks/useAllNovels";

import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

export default function Page() {

  const {books,loading,percent, error} = useAllNovels();

  return (
    <div className="container w-5xl min-h-5/6 mx-auto px-4">
      {/* 标签部分 */}
      {/* <div id="tags-container" className='flex shadow-md p-5 mt-5 mb-4 space-x-4 h-max flex-wrap text-xs'>
        <span className='p-2 border rounded-2xl border-gray-200 bg-gray-200'>Romance</span>
        <span className='p-2 border rounded-2xl border-gray-200 bg-gray-50'>Fantasy</span>
        <span className='p-2 border rounded-2xl border-gray-200 bg-gray-50'>Mystery</span>
        <span className='p-2 border rounded-2xl border-gray-200 bg-gray-50'>Thriller</span>
        <span className='p-2 border rounded-2xl border-gray-200 bg-gray-50'>Science Fiction</span>
        <span className='p-2 border rounded-2xl border-gray-200 bg-gray-50'>Adventure</span>
      </div> */}

      <Progress value={percent} className="bg-gray-100 w-full h-[1px] mt-5" indicatorClassName="bg-rose-200"/>
      {/* 主要内容区域 */}
      <main id="content-container" className='shadow-md p-5 mt-5 mb-4 min-h-[calc(100vh-56px-186px)]'>
        <article id="novel-results" className='w-full'>
          {loading?(<Skeleton className="h-[518px] w-full"/>):
          (<>
          {/* 书籍列表 - 使用grid布局实现每行2个 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {books.map(book => (
              <div key={book.id} className='flex gap-4 p-4 rounded-lg'>
                {/* 图片部分 - 固定宽度142px */}
                <div className='flex-shrink-0 w-[142px] h-auto'>
                  <Link href={{
                          pathname: '/literature/readbook', 
                          query: {
                            book_id: book.id
                        },}}>
                    <div className='relative w-full h-[212px]'>
                      <Image 
                        src={book.coverUrl} 
                        alt={book.title}
                        fill
                        className='object-cover rounded'
                        sizes="142px"
                        unoptimized
                      />
                    </div>
                  </Link>
                </div>

                {/* 书籍信息部分 - 固定宽度295px */}
                <div className='w-[295px] flex flex-col'>
                  <h2 className='text-xl font-bold mb-2 line-clamp-1'>{book.title}</h2>
                  <div className='text-gray-600 mb-3'>{book.author}</div>
                  
                  {/* 社交信息 */}
                  <div className='flex gap-2 mb-4 flex-wrap'>
                    <span className='text-sm bg-gray-100 px-2 py-1 rounded'>192 ★</span>
                    <span className='text-sm bg-gray-100 px-2 py-1 rounded'>{book.chapterCount} chapters</span>
                  </div>
                  
                  <p className='text-gray-700 line-clamp-3 flex-grow'>
                    {book.description}
                  </p>
                  
                </div>
              </div>
            ))}
          </div>
          </>)}
        </article>
      </main>
    </div>
  )
}
