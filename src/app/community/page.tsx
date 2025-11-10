import React from 'react'

import Image from 'next/image'
import Link from 'next/link'


// mock data 用于生成社群常用资料链接
const data = [{
  id: 1,
  title: '作家&艺术家',
  remark: '一起探讨创作技巧，包括AI写作与艺术品创作，如何利用各种工具辅助自己更好地进行创作。以及如何将自己的作品进行数字化与NFT化，进入Web3时代。如何通过社交工具进行分享与传播。',
  links: [
    { name: 'YouTube', description:"在油管有更丰富的创作交流资源，丰富到超出你的想象。", logo:"/community/logo_youtube_icon.svg", cover:"", url: 'https://www.youtube.com/results?search_query=ai%E5%86%99%E5%B0%8F%E8%AF%B4' },
    { name: 'B站', description:"在B站有众多关于如何利用AI进行文学与艺术创作的课程。", logo:"/community/logo_bilibili_filled.svg", cover:"", url: 'https://search.bilibili.com/all?keyword=AI%E5%86%99%E5%B0%8F%E8%AF%B4' },
    { name: '知乎', description:"知乎在文字分享方面比较活跃，方便喜欢图文探讨的创作者。", logo:"/community/logo_zhihu.svg", cover:"", url: 'https://www.zhihu.com/search?type=content&q=AI%E5%86%99%E5%B0%8F%E8%AF%B4' }
  ]
},{
  id: 2,
  title: '读者与创作者',
  remark: '真正精彩作品，不但值得一起分享，还经得起大众的评论。',
  links: [
    { name: 'Twitter', description:"一个极其独特和重要的社交平台，最核心的特征是“快。<br/>经典的推文限制在280个字符（中文140字）以内。<br/>它像是一个“全球版的微博；又像是一个公开对话的微信。", logo:"/community/logo_twitter.svg", cover:"", url: 'https://x.com/redmansionorg' },
    { name: 'Instagram', description:"“视觉版的微博”+“小红书” 的结合体。<br/>它的所有功能都围绕“分享与发现美好视觉内容”展开。<br/>我们在这里不是为了联系熟人，而是为了像一个艺术家的样子“塑造个人形象”和“发现感兴趣的美好事物”。", logo:"/community/logo_instagram.svg", cover:"", url: 'https://www.instagram.com/xeyesu' },
    { name: 'Facebook', description:"“微信朋友圈+公众号+大众点评+58同城” 的超级集合体。", logo:"/community/logo_facebook.svg", cover:"", url: 'https://www.facebook.com/redmansionorg' },
    // { name: '原生APP', description:"学习与交流的场学习与交流的场学习与交流的场学习与交流的场学习与交流的场学习与交流的场", logo:"", cover:"", url: 'https://example.com/forum' },
  ]
},{
  id: 3,
  title: '服务与支持',
  remark: '遇到各种问题就请到这里来看看。包括在火星上找不到水源，或者在天狼星上找不到哈利波特。老实说系统使用或者账号登录问题都不在话下。当然投资者与运营问题也是轻而易举的事情。',
  links: [
    { name: 'Telegram', description:"一个畅所欲言的地方，你不必担心会被留下记录或者被监控。<br/>入群请加：@redmansionorg，或者加志愿者电报号：@redmansion", logo:"/community/logo_telegram.svg", cover:"", url: 'https://t.me/redmansionorg' },
    { name: 'Discord', description:"一个机器活跃的地方，适合进行实时交流和讨论。", logo:"/community/logo_discord.svg", cover:"", url: 'https://discord.gg/CaQxrdn5BC' },
    { name: '微信', description:"由于微信加群非常不方便，不建议使用，如确实有需要，请加入志愿者微信号：9764254", logo:"/community/logo_wechat.svg", cover:"", url: '' },
  ]
},{
  id: 4,
  title: '产品与技术对接',
  remark: '这里有项目相关的开源代码，以及产品运营资料。欢迎优秀的志愿者加入我们，一起把红楼院建设得更好。',
  links: [
    { name: 'Github', description:"区块链节点底层代码；智能合约协议层代码；Web3创作者以及App代码一应俱全。", logo:"/community/logo_github.svg", cover:"", url: 'https://github.com/redmansionorg' },
    { name: 'Figma', description:"暂时存放产品运营资料的地方。", logo:"/community/logo_figma.svg", cover:"", url: 'https://www.figma.com/slides/t2zIh2ypYQjUWSbq5BV799/Untitled?node-id=1-48&t=4FUuJoNCmE9UO9dt-1' },
    { name: 'QQ', description:"在这里讨论技术与产品改善方案，为人类进步贡献一丝微薄之力。<br/>请加入QQ群：912427138 或者加入志愿者QQ号：9764254", logo:"/community/logo_qq.svg", cover:"", url: '' },
  ]
}]

export default function Page() {
  return (
    <div>
      <div id="activity_banner_bg" className='flex flex-row justify-end w-full h-[300px]'
        style={{
          backgroundImage: 'url("/activity_banner_bg.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        {/* <Image src="/activity_banner_bg.jpg" fill alt=""></Image> */}
        <div className='m-5 font-bold text-orange-700 text-xl'>红楼院</div>
      </div>

      {/* <div>APP单列显示推广</div> */}

      <div id="activity_results" className='m-1 mt-15 flex justify-center'>
        <div className='flex flex-col items-center'>
          {data.map(section => (
            <div key={section.id} className='mb-12 w-full md:w-3xl lg:w-5xl'>
              <h2 className='text-xl font-bold ml-5 mb-2'>{section.title}</h2>
              <p className='text-gray-500 pb-2 border-b-1 border-gray-200'>&nbsp;&nbsp;&nbsp;&nbsp;{section.remark}</p>
              <div className='flex flex-col'>
                {section.links.map((link, index) => (
                  <Link key={index} href={link.url} target="_blank" rel="noopener noreferrer"
                    className='block my-2 p-4  hover:shadow-md'>
                    <div className='flex flex-row items-center text-lg font-semibold text-blue-600'>
                      <img alt="" width="30" height="30" src={link.logo}/>&nbsp;&nbsp;{link.name}
                    </div>
                    {link.description && <p className='text-sm text-gray-500 mt-1'>
                        {/* <pre>{link.description}</pre> */}
                        <span dangerouslySetInnerHTML={{ __html: link.description }} />
                      </p>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-sm md:w-3xl lg:w-5xl'>
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className='flex flex-col border border-gray-200 bg-white shadow-md overflow-hidden'>
              <div className='w-[388px] h-[296px] relative'>
                <Image src={`/activity_item_${index + 1}.jpeg`} fill alt={`Activity ${index + 1}`} className='object-cover'/>
              </div>
              <div className='p-4 h-[178px]'>
                <h3 className='text-lg font-semibold'>Activity Title {index + 1}</h3>
                <p className='text-sm text-gray-600 mt-5'>Activity description goes here.Activity description goes here.Activity description goes here.Activity description goes here.</p>
              </div>
            </div>
          ))}
        </div> */}

      </div>
    </div>
  )
}
