import React from 'react'

import Image from 'next/image'
import Link from 'next/link'

export default function Page() {

  // 模拟2本书的阅读历史数据，这部份数据可以来自localStorage中，其他模块例如阅读模块会将用户阅读行为存在localStorage中。
  const books = [
    {
      id: 1,
      title: "The Great Novel",
      author: "Author One",
      description: "This is a fascinating book about adventures and discoveries...",
      coverUrl: "/novel_item01.jpg"
    },
    {
      id: 2,
      title: "Mystery of the Old House",
      author: "Author Two",
      description: "A thrilling mystery that will keep you guessing until the end...",
      coverUrl: "/novel_item02.jpg"
    }
  ]

  return (
    <div>
      <header className='flex flex-col content-between bg-gray-600 text-white w-full h-[423px] pt-27'>
        <div id="avatar" className='flex justify-center'><Image src="/b.128.jpg" width={96} height={96} alt="avarta" className='rounded-full'></Image></div>
        <div id="name" className='flex justify-center mt-3 mb-1 text-2xl'>你的名字</div>
        <div className='w-full h-96'></div>
        <div className='flex justify-center bg-white w-full h-full border-b border-gray-300'>
          <div className='flex items-center w-[960px] h-full text-xl text-gray-800 pt-5 ml-5'>Reading History</div>
        </div>
      </header>
      <main className='flex justify-center bg-white w-full pl-5 pr-5'>
        <div className='flex w-xl md:w-3xl lg:w-5xl h-full text-gray-800 pt-5'>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {books.map(book => (
              <div key={book.id} className='flex flex-col w-[110px] p-2 rounded-lg'>
                {/* 图片部分 - 固定宽度142px */}
                <div className='flex-shrink-0 w-auto h-auto'>
                  <Link href={`/books/${book.id}`}>
                    <div className='relative w-auto h-[148px]'>
                      <Image 
                        src={book.coverUrl} 
                        alt={book.description}
                        fill
                        className='object-cover rounded'
                        sizes="100px"
                      />
                    </div>
                  </Link>
                </div>

                {/* 书籍信息部分 - 固定宽度295px */}
                <div className='w-auto flex flex-col'>
                  <h2 className='font-bold text-sm mt-2 mb-2 line-clamp-1'>{book.title}</h2>
                  <div className='text-sm text-gray-600 mb-3'>{book.author}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
