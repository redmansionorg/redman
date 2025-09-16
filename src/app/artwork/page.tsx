'use client'

import React from 'react'

import Image from 'next/image'
import Link from 'next/link'

import {useAllArts } from '@/hooks/useAllArts'

import { Skeleton } from "@/components/ui/skeleton"

import { Progress } from "@/components/ui/progress"

export default function Page() {

    const {arts,loading,percent,error} = useAllArts()


  return (
    <div className="container w-5xl min-h-5/6 mx-auto px-4">

      <Progress value={percent} className="bg-gray-100 w-full h-[1px] mt-5" indicatorClassName="bg-rose-200"/>
      <main id="content-container" className='shadow-md p-5 mb-4 min-h-[calc(100vh-56px-186px)]'>
        <article id="collection-results" className='w-full'>
          {loading?(<Skeleton className="h-[518px] w-full"/>):
          (<>
            {arts.map((collect)=> (
            <Link href={`${collect.marketUrl}`} target="_blank" rel="noopener noreferrer" key={collect.id}>
              <div id={`collection-${collect.id}`} className='grid grid-cols-1 md:grid-cols-2 gap-2 mb-3'>
                <div className='flex flex-col justify-center items-center'>
                  <div><span className='text-lg font-bold'>{collect.title} </span><span className='ml-6'>({`${collect.items.length}  ITEMS`})</span></div>
                    <div key={collect.id} className='m-5 flex rounded-lghover:shadow-lg hover:border-gray-500 transition-shadow duration-200'>
                      <div className='flex flex-col shadow-2xl'>
                        <Image
                          src={collect.coverUrl}
                          alt={`Collection Item ${collect.title}`}
                          width={386}
                          height={386}
                          className='object-cover rounded-lg'
                          unoptimized
                        />
                        <div className='w-full h-[96px] flex flex-col gap-3'>
                          <h3 className='mt-3 ml-3 text-lg font-semibold'>{collect.symbol}</h3>
                          <p className='mt-3 ml-3 text-sm text-gray-600'>{collect.items.length} items</p>
                        </div>
                      </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 md:grid-cols-2 gap-2">
                  {collect.items.slice(0,4).map((item) => (
                    <div key={item.token} className='flex rounded-lg border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-shadow duration-200'>
                      <div className='flex flex-col relative'>
                        <Image
                          src={item.image}
                          alt={`Collection Item ${item.token}`}
                          width={286}
                          height={286}
                          className='object-cover rounded-lg'
                          unoptimized
                        />
                        <div className='w-full h-[96px] flex flex-col'>
                          <h3 className='mt-3 ml-3 text-lg font-semibold'>#{item.token}</h3>
                          <p className='mt-3 ml-3 text-sm text-gray-600'>0.0{item.price} ETH</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='border-1 border-gray-100 mt-10 mb-10'></div>
            </Link>
            ))}
          </>)}
        </article>
      </main>
    </div>
  )
}
