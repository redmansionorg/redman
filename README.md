This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-wagmi`](https://github.com/wevm/wagmi/tree/main/packages/create-wagmi).


1. pnpm create wagmi
    输入项目名称、选择react、选择nextjs
    src/app/providers.tsx 提供连接钱包的组件
    src/wagmi.ts 配置支持的区块链网络
    .env.local 环境变量配置，从https://cloud.reown.com/获得key来配置NEXT_PUBLIC_WC_PROJECT_ID

    cd redmansion
    pnpm install
    pnpm run dev

2. pnpm add tailwindcss @tailwindcss/postcss postcss
    安装tailwind，网址如下：注意修改命令为 pnpm add
    https://tailwindcss.com/docs/installation/using-postcss

    创建postcss.config.mjs
    export default {
        plugins: {
            "@tailwindcss/postcss": {},
        }
    }

    在globals.css中导入样式
    @import "tailwindcss";

3. 开始编辑app目录内的文件
    globals.css 全局样式
    layout.tsx RootLayout全局UI布局
    page.tsx 默认首页
    每个子目录自动成为路由，默认访问该目录的page.tsx，
    如果里面有layout，则嵌套到RootLayout中再加该目录page.tsx

4. 首先创建一个Header，包括Logo、Nav、WalletConnect
    安装彩虹钱包插件：https://rainbowkit.com/zh-CN/docs/installation
    ***其实项目最开始就可以直接用：pnpm create @rainbow-me/rainbowkit@latest创建一个新的RainbowKit+ wagmi + Next.js应用
    pnpm add @rainbow-me/rainbowkit

    providers.tsx中导入rainbowkit
    import '@rainbow-me/rainbowkit/styles.css';
    import {
    getDefaultConfig,
    RainbowKitProvider,
    } from '@rainbow-me/rainbowkit';
    --把children圈起来
    <RainbowKitProvider>
        {props.children}
    </RainbowKitProvider>

    在wagmi.ts配置区块链信息
    xxxxxxxxxxxxxxxxxxxxxxxxx这块不太清楚

    在相关的布局或者页面文件开发connectButton
    import { ConnectButton } from '@rainbow-me/rainbowkit'

5. 增加小图标
    

pnpm add react-icons
pnpm add react-dropzone
pnpm add aws-sdk


更换shadcn的整体样式：https://www.bilibili.com/video/BV1iQq3YtEhu   8:35的地方开始看

hardhat开发智能合约：https://www.bilibili.com/video/BV1RFsfe5Ek5?spm_id_from=333.788.videopod.episodes&vd_source=e02efef471bcdc36ccf4378cdf09180f&p=4
48:20 开始安装hardhat
52:03 开始创建hardhat项目
1:03:56 开始安装智能合约依赖，例如标准ERC721等
1:06:19 编译合约npx hardhat compile
1:10:46 开始讲解使用ethers.js

4小时Web3游戏开发手把手：Wagmi，rainbow钱包，AWS，预言机
https://www.bilibili.com/video/BV1wFLQzuEVc/?spm_id_from=333.1391.0.0&vd_source=e02efef471bcdc36ccf4378cdf09180f
1:56:46 开始讲钱包连接
3:08:56 开始讲NFT智能合约及其构建发布（Chainlink相关）


pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add form
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add textarea

pnpm add md5
pnpm add -D @types/md5

npm 命令	pnpm 等效命令	说明
npm install --save ethers	pnpm add ethers	默认会将包添加到 dependencies
npm install ethers	pnpm add ethers	pnpm 的 add 命令默认就包含保存到 dependencies 的行为

pnpm add ethers/lib/utils



# 注意所有ipfs的图片都需要禁止后端优化，需要手动加入 unoptimized // ✅ 关闭服务端优化
<div className='relative w-[80px] h-[125px] mr-4'>
    <Image 
    src={book.coverUrl} 
    alt={book.title}
    fill
    className='object-cover rounded'
    sizes="100px"
    unoptimized // ✅ 关闭服务端优化
    />


# 时间戳问题
pnpm add dayjs


