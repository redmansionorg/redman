'use client'

import React, { useEffect, useState, ChangeEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Book {
  id: number
  title: string
  author: string
  description: string
  coverUrl: string
}

export default function Page() {
  const [userName, setUserName] = useState<string>('你的名字')
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null)
  const [books, setBooks] = useState<Book[]>([])

  // 读取 localStorage 中的用户名和头像
  useEffect(() => {
    const name = localStorage.getItem('profile_name')
    const avatar = localStorage.getItem('profile_avatar')
    const booksStr = localStorage.getItem('reading_history')

    if (name) setUserName(name)
    if (avatar) setAvatarDataUrl(avatar)
    if (booksStr) {
      try {
        const parsed = JSON.parse(booksStr)
        if (Array.isArray(parsed)) setBooks(parsed)
      } catch (e) {
        console.error('Failed to parse reading history:', e)
      }
    }
  }, [])

  // 修改用户名
  const handleChangeName = () => {
    const newName = prompt('请输入你的名字：', userName)
    if (newName && newName.trim()) {
      setUserName(newName.trim())
      localStorage.setItem('profile_name', newName.trim())
    }
  }

  // 修改头像（图片 base64）
  const handleChangeAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setAvatarDataUrl(result)
      localStorage.setItem('profile_avatar', result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <header className='flex flex-col content-between bg-gray-600 text-white w-full h-[423px] pt-27'>
        <div id="avatar" className='flex justify-center'>
          <label className='cursor-pointer'>
            <input type="file" accept="image/*" className='hidden' onChange={handleChangeAvatar} />
            {avatarDataUrl ? (
              <img src={avatarDataUrl} width={96} height={96} className="rounded-full" alt="avatar" />
            ) : (
              <Image src="/b.128.jpg" width={96} height={96} alt="default avatar" className='rounded-full' />
            )}
          </label>
        </div>
        <div id="name" className='flex justify-center mt-3 mb-1 text-2xl'>
          <button onClick={handleChangeName} className='hover:underline'>
            {userName}
          </button>
        </div>
        <div className='sm:w-[620px] md:w-[760px] lg:w-[960px] w-[480px] h-96'></div>

          <div className='flex bg-white w-full h-full border-b border-gray-300'>
            <div className='flex h-full text-lg text-gray-800 pt-10'>Reading History</div>
          </div>

      </header>

      {books.length > 0 && (
        <main className='flex justify-center bg-white w-full pl-5 pr-5'>
          <div className='flex w-xl md:w-3xl lg:w-5xl h-full text-gray-800 pt-5'>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {books.map(book => (
                <div key={book.id} className='flex flex-col w-[110px] p-2 rounded-lg'>
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
                  <div className='w-auto flex flex-col'>
                    <h2 className='font-bold text-sm mt-2 mb-2 line-clamp-1'>{book.title}</h2>
                    <div className='text-sm text-gray-600 mb-3'>{book.author}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
