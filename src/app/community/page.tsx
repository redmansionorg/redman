import React from 'react'

import Image from 'next/image'

export default function Page() {
  return (
    <div>
      <div id="activity_banner_bg" className='relative w-full h-96'>
        <Image src="/activity_banner_bg.webp" fill alt=""></Image>
        <div className='absolute p-20 l-4 text-white text-3xl md:text-5xl lg:text-blue-7xl '> 全面内测<br/><br/> 欢迎参与 <br/><br/> 丰厚空投等你拿</div>
      </div>
      <div id="activity_results" className='mt-12 flex justify-center'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-sm md:w-3xl lg:w-5xl'>
          {/* 模拟活动数据 */}
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className='flex flex-col border border-gray-200 bg-white shadow-md overflow-hidden'>
              <div className='w-[388px] h-[296px] relative'>
                <Image src={`/activity_item_${index + 1}.jpeg`} fill alt={`Activity ${index + 1}`} className='object-cover'/>
              </div>
              {/* <div className='p-4 h-[178px]'>
                <h3 className='text-lg font-semibold'>Activity Title {index + 1}</h3>
                <p className='text-sm text-gray-600 mt-5'>Activity description goes here.Activity description goes here.Activity description goes here.Activity description goes here.</p>
              </div> */}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
