import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { useAccount, useDisconnect } from 'wagmi'

import { useConnectModal } from '@rainbow-me/rainbowkit';


export default function MyDrop() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { disconnect } = useDisconnect()
    const { isConnected } = useAccount()

    const { openConnectModal } = useConnectModal();

     // Close dropdown when clicking outside
     useEffect(() => {
         const handleClickOutside = (event: MouseEvent) => {
             if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                 setIsDropdownOpen(false)
             }
         }
         document.addEventListener('mousedown', handleClickOutside)
         return () => {
             document.removeEventListener('mousedown', handleClickOutside)
         }
     }, [])
 
     return (
        <div className="relative mt-1">
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-1 focus:outline-none p-2 rounded-lg hover:bg-gray-100" aria-label="User profile">
                <div className="relative">
                    <Image src="/avatar.jpg" width={25} height={25} alt="My" className="rounded-full" />
                </div>
                <span className="hidden md:inline text-gray-900 font-bold">我的</span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
                <div ref={dropdownRef} className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <ul className="py-1">
                        <li>
                            <Link href="/my" onClick={()=>setIsDropdownOpen(false)}  className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                Profile
                            </Link>
                        </li>
                        <li className="border-t border-gray-200 my-1"></li>
                        <li>
                            <Link id="writeNovel" href={isConnected?"/creative/writebook":'#'} onClick={()=>isConnected?setIsDropdownOpen(false):openConnectModal?.()}  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                                Write a novel
                                <span className="bg-blue-600 text-white text-3xs rounded-full h-8 w-8 ml-3 flex items-center">✨🌟</span>
                            </Link>
                        </li>
                        {isConnected && (
                        <li>
                            <Link href="/creative" onClick={()=>setIsDropdownOpen(false)}  className="flex justify-between items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                                Creative Space
                                <span className="bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"></span>
                            </Link>
                        </li>
                         )}
                        {isConnected && (
                        <li className="border-t border-gray-200 my-1"></li>
                         )}
                        {/* {isConnected && (
                        <li>
                            <Link href="/settings" onClick={()=>setIsDropdownOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                Settings
                            </Link>
                        </li>
                         )} */}
                        {isConnected && (
                        <li>
                            <Link href="#" onClick={()=>disconnect()} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                Log Out
                            </Link>
                        </li>
                         )}
                    </ul>
                </div>
            )}
        </div>

    )
}
