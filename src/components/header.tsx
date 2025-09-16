'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import MyDrop from './mydrop'
import { FiMenu, FiX } from 'react-icons/fi'

export default function Header() {
  const { isConnected } = useAccount()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      {/* 遮罩层 */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* 顶部菜单栏 */}
      <div id="header-container" className='fixed top-0 left-0 w-full h-14 p-0 bg-white border-b border-gray-200 z-50'>
        <div role="banner" id="header" className='h-full flex justify-between items-center px-3'>

          {/* logo 和菜单 */}
          <div className='flex items-center h-full'>
            <Link href="/" className="mr-2">
              <Image src="/wp-logo-red.png" alt="Logo" width={30} height={27.5} className='bg-no-repeat' />
            </Link>

            {/* 汉堡/关闭按钮 */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className='md:hidden text-2xl p-2 focus:outline-none z-50'
            >
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* 菜单项 */}
            <nav
              className={`flex-col md:flex-row md:flex items-start md:items-center font-bold absolute md:static top-14 left-0 w-full md:w-auto bg-white border-t md:border-0 z-40 transition-all duration-300 ease-in-out
              ${menuOpen ? 'flex' : 'hidden'} md:flex`}
            >
              <Link href="/literature" onClick={()=>setMenuOpen(false)} className="ml-3 mt-1 p-2 hover:text-amber-500 text-gray-900">
                文学
              </Link>
              <Link href="/artwork" onClick={()=>setMenuOpen(false)} className="ml-3 mt-1 p-2 hover:text-amber-500 text-gray-900">
                艺术
              </Link>
              <Link href="/community" onClick={()=>setMenuOpen(false)} className="ml-3 mt-1 p-2 hover:text-amber-500 text-gray-900">
                社群
              </Link>
              <div className="ml-3">
                <MyDrop />
              </div>
            </nav>
          </div>

          {/* 钱包连接 */}
          <div className='flex items-center p-3'>
            <ConnectButton label='Launch' chainStatus='icon' showBalance={false} />
          </div>
        </div>
      </div>
    </>
  )
}
