import React from 'react'

import Image from 'next/image'
import Link from 'next/link'

export default function Page() {
  //模拟收藏品的数据
  const collects = [
    {
      id: 1,
      title: "Ancient Chinese Classic...",
      author: "John Doe",
      description: "A fascinating tale of adventure and discovery.",
      marketUrl: "https://opensea.io/collection/art-lace-collection",
      items: [
        {token:1,metaUrl:"/art_collect1_item1.avif",price:652},
        {token:2,metaUrl:"/art_collect1_item2.avif",price:362},
        {token:3,metaUrl:"/art_collect1_item3.avif",price:292},
        {token:4,metaUrl:"/art_collect1_item4.avif",price:382},
        {token:5,metaUrl:"/art_collect1_item5.avif",price:572}
      ]
    },
    {
      id: 2,
      title: "Bored Ape Yacht...",
      author: "Jane Smith",
      description: "Unravel the secrets of the past in this thrilling mystery.",
      marketUrl: "https://opensea.io/collection/boredapeyachtclub",
      items: [
        {token:1,metaUrl:"/art_collect2_item1.avif",price:32},
        {token:2,metaUrl:"/art_collect2_item2.avif",price:72},
        {token:3,metaUrl:"/art_collect2_item3.avif",price:92},
        {token:4,metaUrl:"/art_collect2_item4.avif",price:102},
        {token:5,metaUrl:"/art_collect2_item5.avif",price:332}
      ]
    },
    {
      id: 3,
      title: "Aiartwork..io",
      author: "Alice Johnson",
      description: "An epic journey through uncharted territories.",
      marketUrl: "https://opensea.io/collection/aiartworkioo",
      items: [
        {token:1,metaUrl:"/art_collect3_item1.avif",price:252},
        {token:2,metaUrl:"/art_collect3_item2.avif",price:242},
        {token:3,metaUrl:"/art_collect3_item3.avif",price:172},
        {token:4,metaUrl:"/art_collect3_item4.avif",price:192},
        {token:5,metaUrl:"/art_collect3_item5.avif",price:102}
      ]
    },
    {
      id: 4,
      title: "Yakuza pups",
      author: "Bob Brown",
      description: "A gripping tale of power, betrayal, and redemption.",
      marketUrl: "https://opensea.io/collection/yakuza-pups-1",
      items: [
        {token:1,metaUrl:"/art_collect4_item1.avif",price:122},
        {token:2,metaUrl:"/art_collect4_item2.avif",price:162},
        {token:3,metaUrl:"/art_collect4_item3.avif",price:152},
        {token:4,metaUrl:"/art_collect4_item4.avif",price:142},
        {token:5,metaUrl:"/art_collect4_item5.avif",price:132}
      ]
    },
    {
      id: 5,
      title: "Dream of Red Mansions",
      author: "Charlie Davis",
      description: "A unique twist on the isekai genre.",
      marketUrl: "https://opensea.io/collection/the-dream-of-red-mansions",
      items: [
        {token:1,metaUrl:"/art_collect5_item1.avif",price:112},
        {token:2,metaUrl:"/art_collect5_item2.avif",price:222},
        {token:3,metaUrl:"/art_collect5_item3.avif",price:332},
        {token:4,metaUrl:"/art_collect5_item4.avif",price:232},
        {token:5,metaUrl:"/art_collect5_item5.avif",price:132}
      ]
    },
    {
      id: 6,
      title: "Axie Ronin",
      author: "Diana Evans",
      description: "A story of rebirth and new beginnings.",
      marketUrl: "https://opensea.io/collection/axie-ronin",
      items: [
        {token:1,metaUrl:"/art_collect6_item1.avif",price:42},
        {token:2,metaUrl:"/art_collect6_item2.avif",price:22},
        {token:3,metaUrl:"/art_collect6_item3.avif",price:52},
        {token:4,metaUrl:"/art_collect6_item4.avif",price:12},
        {token:5,metaUrl:"/art_collect6_item5.avif",price:2}
      ]
    },
    {
      id: 7,
      title: "Another Life by Violetta",
      author: "Edgar Allan Poe",
      description: "A classic tale of horror and suspense.",
      marketUrl: "https://opensea.io/collection/another-life-by-violetta-zironi",
      items: [
        {token:1,metaUrl:"/art_collect7_item1.avif",price:2},
        {token:2,metaUrl:"/art_collect7_item2.avif",price:3},
        {token:3,metaUrl:"/art_collect7_item3.avif",price:2},
        {token:4,metaUrl:"/art_collect7_item4.avif",price:32},
        {token:5,metaUrl:"/art_collect7_item5.avif",price:2}
      ]
    }
  ];


  return (
    <div className="container w-5xl min-h-5/6 mx-auto px-4">

      <main id="content-container" className='shadow-md p-5 mt-5 mb-4 h-max'>
        <article id="collection-results" className='w-full'>
            {collects.map((collect)=> (
            <Link href={`${collect.marketUrl}`} target="_blank" rel="noopener noreferrer" key={collect.id}>
              <div id={`collection-${collect.id}`} className='flex flex-col gap-1 rounded-lg mb-6'>
                <div><span className='text-lg font-bold'>{collect.title}</span><span className='ml-6'>({`${collect.items.length}00  ITEMS`})</span></div>
                <div className="grid grid-cols-5 md:grid-cols-5 gap-2">
                  {collect.items.map((item) => (
                    <div key={item.token} className='flex rounded-lg bg-gray-50 border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-shadow duration-200'>
                      <div className='flex flex-col relative'>
                        <Image
                          src={item.metaUrl}
                          alt={`Collection Item ${item.token}`}
                          width={186}
                          height={186}
                          className='object-cover rounded-lg'
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
            </Link>
            ))}
        </article>
      </main>
    </div>
  )
}
