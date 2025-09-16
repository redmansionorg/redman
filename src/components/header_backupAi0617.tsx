'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Header() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    return (
        <div id="header-container" className='fixed top-0 left-0 w-full h-14 p-0 bg-white border-b border-gray-200 z-50'>
            <div role="banner" id="header" className='h-full flex justify-between'>
                <nav className='flex items-center justify-center'>
                    <Link href="/" className="pl-3">
                        <Image src="/wp-logo-red.png" alt="Logo" width={128} height={56} className='bg-no-repeat' />
                    </Link>
                    <Link href="/literature" className="ml-10 mt-1 hover:text-amber-500 text-gray-900">
                        Literature
                    </Link>
                    <Link href="/art" className="ml-8 mt-1 hover:text-amber-500 text-gray-900">
                        Art
                    </Link>
                    <Link href="/activity" className="ml-8 mt-1 hover:text-amber-500 text-gray-900">
                        Activity
                    </Link>

                    <div className="relative ml-8">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center space-x-1 focus:outline-none"
                            aria-label="User profile"
                        >
                            <div className="relative">
                                <Image 
                                    src="/avatar.jpg" 
                                    width={25} 
                                    height={25} 
                                    alt="xeyesu"
                                    className="rounded-full"
                                />
                            </div>
                            <span className="hidden md:inline text-gray-900">xeyesu</span>
                            <svg 
                                className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        
                        {/* Dropdown menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                <ul className="py-1">
                                    <li>
                                        <Link href="/user/xeyesu" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                            My Profile
                                        </Link>
                                    </li>
                                    <li className="border-t border-gray-200 my-1"></li>
                                    <li>
                                        <Link href="/inbox" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                            Inbox
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/notifications" className="flex justify-between items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                                            Notifications
                                            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/library" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                            Library
                                        </Link>
                                    </li>
                                    <li className="border-t border-gray-200 my-1"></li>
                                    <li>
                                        <Link href="/settings/language?jq=true" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                            Language: English
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="//support.wattpad.com" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                            Help
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                            Settings
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/logout" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                            Log Out
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </nav>
                
                <div className='flex items-center mr-5'>
                    <ConnectButton></ConnectButton>
                </div>
            </div>
        </div>
    )
}