import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Header() {
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

                    <div id="profile-dropdown" className="button-group dropdown open">
                    <button data-toggle="dropdown" role="button" aria-label="User">
                        <div className="avatar avatar-sm">
                            <span className="notification-badge"></span>
                                <img src="https://img.wattpad.com/useravatar/b.48.jpg" width="25" height="25" alt="xeyesu"/>
                        </div>
                        <span className="username hidden-xs  hidden-sm hidden-md ">
                        xeyesu
                        </span>
                        <span className="caret"></span>
                    </button>
                    {/* Dropdown menu */}
                    <div className="triangle"></div>
                    <div className="dropdown-menu dropdown-menu-right large" role="menu" aria-labelledby="profile-dropdown">
                        <ul aria-label="Profile" className="header-list">
                            <li><a className="on-navigate" href="/user/xeyesu">My Profile</a></li>
                            <li role="presentation" className="divider"></li>
                            <li><a href="/inbox">Inbox
                            </a></li>
                            <li><a href="/notifications">Notifications
                                <span id="notifications-menu-badge" className="badge">3</span>
                            </a></li>
                            <li><a href="/library">Library</a></li>
                            <li role="presentation" className="divider"></li>
                            <li><a href="/settings/language?jq=true" className="on-language" data-ignore="true">Language: English</a></li>
                            <li><a href="//support.wattpad.com">Help</a></li>
                            <li>
                                <a className="on-navigate" href="/settings">Settings</a>
                            </li>
                            <li><a href="/logout" className="on-logout">Log Out</a></li>
                        </ul>
                    </div>
                    </div>
                </nav>
                
                <div className='flex items-center mr-5'>
                    <ConnectButton></ConnectButton>
                </div>
            </div>
        </div>
    )
}



                    
                    // <div className="relative hidden md:block">
                    //     <button className="group/account-btn flex h-14 items-center justify-between gap-1 rounded-full bg-gray-1000 p-1 outline-none ring-1 ring-transparent transition-all hover:ring-gray-900 focus:ring-gray-900 focus-visible:ring-gray-900 md:h-14 md:p-3">
                    //         <div className="flex items-center justify-center"><div className="relative size-10 overflow-hidden rounded-full bg-gray-700 md:size-10">
                    //             <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    //                 <img className="aspect-square h-full w-full" alt="0x413d...Fc3b" src="https://res.cloudinary.com/dq3gpgeib/image/upload/v1747834298/hub/avatar/envjdmvfhwu9xmqsrnt1.jpg"/>
                    //             </span>
                    //         </div>
                    //             <div className="flex flex-col px-2">
                    //                 <span className="text-sm tracking-wide font-semibold text-left mb-0.5 leading-none capitalize">xieyueshu
                    //                 </span>
                    //                 <span className="text-gray-300 tracking-normal font-mono text-left text-2xs md:text-xs">0x413d...Fc3b</span>
                    //             </div>
                    //         </div>
                    //     </button>
                    //     <div className="absolute right-0 top-18 flex justify-center">
                    //     </div>
                    // </div>
