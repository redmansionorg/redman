import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { type ReactNode } from 'react'
import { cookieToInitialState } from 'wagmi'

import { getConfig } from '../wagmi'
import { Providers } from './providers'

import Header from '@/components/header'
import Footer from '@/components/footer'

const inter = Inter({ subsets: ['latin'] })

// 新世代全球创作社群
// New Generation Global Creative Community
// 新世代全球华人原创文学
// New Generation Global Chinese Original Literature
// RedMansion 是一个全球华人原创文学平台，致力于为读者提供丰富多样的原创小说和文学作品。我们汇集了来自世界各地的华人作者，展示他们的才华和创意。无论你是喜欢玄幻、科幻、言情还是历史小说，这里都有你喜欢的作品。加入我们，一起探索新世代的华文文学世界。  
export const metadata: Metadata = {
  title: 'RedMansion - New Generation Global Creative Community',
  description: 'RedMansion is a global Chinese original literature platform dedicated to providing readers with a diverse range of original novels and literary works. We have gathered Chinese authors from around the world to showcase their talents and creativity. Whether you enjoy fantasy, science fiction, romance, or historical novels, there are works you love here. Join us and explore the world of Chinese literature for the new generation together.',
}

export default function RootLayout(props: { children: ReactNode }) {
  const initialState = cookieToInitialState(
    getConfig(),
    headers().get('cookie'),
  )
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers initialState={initialState}>
          <Header/>
          <div id="main-container"className="min-h-[calc(100vh-56px-186px)]">
            <div id="app-container" className='mt-14 flex justify-center'>
              {props.children}
            </div>
          </div>
          <Footer/>
        </Providers>
      </body>
    </html>
  )
}
