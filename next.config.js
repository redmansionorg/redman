/** @type {import('next').NextConfig} */
const nextConfig = {

    // output: 'export', // 关键配置

    //Next.js 默认不会允许外部未声明的图像来源域名。
    images: {
        domains: ['www.redmansion.io', 'ipfs.io', 'gateway.pinata.cloud', 'cloudflare-ipfs.com', 'eligible-blush-lungfish.myfilebase.com'], // ✅ 允许加载 IPFS 图像
    },
}

module.exports = nextConfig
