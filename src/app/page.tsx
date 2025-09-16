import React from 'react'

import Image from 'next/image'

import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div>
      <div className='relative'>
        {/* <div className='flex flex-col gap-3 absolute top-25 right-40'>
          <Button className='px-10'>Start  Reading</Button>
          <Button className='px-10'>Start  Writing</Button>
        </div> */}
        <Image
          src="/home_big_title.png"
          alt="New Generation Global Creative Community"
          width={1920}
          height={1080}
          className="mx-auto bg-amber-50"/>
      </div>
      <video id="video" src="/CreatorsProgram_IlloAnim_forweb.mp4" controls autoPlay loop></video>
        <div className='relative'>
          {/* <div className='flex flex-col gap-3 absolute top-20 right-40'>
            <Button variant={"outline"} className='px-10'>Documentation</Button>
            <Button variant={"outline"} className='px-10'>Whitepaper</Button>
          </div> */}
          <Image
            src="/home_big_feature.png"
            alt="New Generation Global Creative Community"
            width={1920}
            height={1080}
            className="mx-auto bg-blue-50"/>
        </div>
      <video id="video" src="/CreatorsProgram_Reel_forweb.mp4" controls autoPlay loop></video>
    </div>
  )
}
