'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { useAccount } from 'wagmi'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import MyDrop from './mydrop'

export default function Header() {

    const { isConnected } = useAccount()
    
    return (
        <div id="header-container" className='fixed top-0 left-0 w-full h-14 p-0 bg-white border-b border-gray-200 z-50'>
            <div role="banner" id="header" className='h-full flex justify-between'>
                <nav className='flex items-center justify-center font-bold'>
                    <Link href="/" className="pl-3">
                        <Image src="/wp-logo-red.png" alt="Logo" width={126} height={27.5} className='bg-no-repeat' />
                    </Link>
                    <Link href="/literature" className="ml-7 mt-1 p-2 hover:text-amber-500 text-gray-900">
                        文学
                    </Link>
                    <Link href="/artwork" className="ml-3 mt-1 p-2 hover:text-amber-500 text-gray-900">
                        艺术
                    </Link>
                    <Link href="/community" className="ml-3 mt-1 p-2 hover:text-amber-500 text-gray-900">
                        社群
                    </Link>

                    {/* {isConnected && (
                        <MyDrop/>
                    )} */}
                    <MyDrop/>
                </nav>
                
                <div className='flex items-center mr-5'>
                    <ConnectButton label='Launch' chainStatus='icon' showBalance={false}></ConnectButton>
                </div>
            </div>
        </div>
    )
}
