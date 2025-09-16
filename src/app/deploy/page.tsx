'use client'

import { useState } from 'react'
import { ethers } from 'ethers'

export default function DeployPage() {
    const [bytecode, setBytecode] = useState('0x60806040526040518060400160405280600581526020017f68656c6c6f0000000000000000000000000000000000000000000000000000008152505f90816100479190610293565b50348015610053575f80fd5b50610362565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f60028204905060018216806100d457607f821691505b6020821081036100e7576100e6610090565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026101497fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8261010e565b610153868361010e565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f61019761019261018d8461016b565b610174565b61016b565b9050919050565b5f819050919050565b6101b08361017d565b6101c46101bc8261019e565b84845461011a565b825550505050565b5f90565b6101d86101cc565b6101e38184846101a7565b505050565b5b81811015610206576101fb5f826101d0565b6001810190506101e9565b5050565b601f82111561024b5761021c816100ed565b610225846100ff565b81016020851015610234578190505b610248610240856100ff565b8301826101e8565b50505b505050565b5f82821c905092915050565b5f61026b5f1984600802610250565b1980831691505092915050565b5f610283838361025c565b9150826002028217905092915050565b61029c82610059565b67ffffffffffffffff8111156102b5576102b4610063565b5b6102bf82546100bd565b6102ca82828561020a565b5f60209050601f8311600181146102fb575f84156102e9578287015190505b6102f38582610278565b86555061035a565b601f198416610309866100ed565b5f5b828110156103305784890151825560018201915060208501945060208101905061030b565b8683101561034d5784890151610349601f89168261025c565b8355505b6001600288020188555050505b505050505050565b6102138061036f5f395ff3fe608060405234801561000f575f80fd5b5060043610610029575f3560e01c8063cfae32171461002d575b5f80fd5b61003561004b565b6040516100429190610160565b60405180910390f35b5f8054610057906101ad565b80601f0160208091040260200160405190810160405280929190818152602001828054610083906101ad565b80156100ce5780601f106100a5576101008083540402835291602001916100ce565b820191905f5260205f20905b8154815290600101906020018083116100b157829003601f168201915b505050505081565b5f81519050919050565b5f82825260208201905092915050565b5f5b8381101561010d5780820151818401526020810190506100f2565b5f8484015250505050565b5f601f19601f8301169050919050565b5f610132826100d6565b61013c81856100e0565b935061014c8185602086016100f0565b61015581610118565b840191505092915050565b5f6020820190508181035f8301526101788184610128565b905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f60028204905060018216806101c457607f821691505b6020821081036101d7576101d6610180565b5b5091905056fea2646970667358221220e7af54e039dba254551463b41a8d9f84acf78e17733aa7cf2c0d621de2c751d464736f6c63430008140033')
    const [rpcUrl, setRpcUrl] = useState('https://redmansion.io/srpc/')
    const [walletAddress, setWalletAddress] = useState('0x413dF5c1e23768Ab90e5790411dDcafDc2A1Fc3b')
    const [privateKey, setPrivateKey] = useState('involve bonus cannon viable nation glass purpose range favorite hard stable prosper')
    const [logs, setLogs] = useState<string[]>([])
    const [deploying, setDeploying] = useState(false)

    const log = (msg: string) => {
        setLogs((prev) => [...prev, msg])
    }

    const handleDeploy = async () => {
        if (!bytecode || !rpcUrl || !privateKey) {
            log('❗请填写所有必要字段')
            return
        }

        setDeploying(true)
        setLogs([])

        try {
            log('🚀 初始化钱包与提供者...')
            const provider = new ethers.JsonRpcProvider(rpcUrl)
            //const wallet = new ethers.Wallet(privateKey, provider)
            console.log("Input mnemonic:", `"${privateKey}"`, "Length:", privateKey.trim().split(' ').length)
            let wallet
            if (privateKey.trim().split(' ').length >= 12) {
                log('🔐 检测到助记词，正在生成钱包...')
                wallet = ethers.Wallet.fromPhrase(privateKey, provider)
            } else {
                wallet = new ethers.Wallet(privateKey, provider)
            }

            if (wallet.address.toLowerCase() !== walletAddress.toLowerCase()) {
                log('⚠️ 警告：输入的钱包地址与私钥不匹配。将继续部署。')
            }

            log('📦 准备部署交易...')
            const tx = {
                nonce: 12,
                data: bytecode,
                gasLimit: 3_000_000,
                gasPrice: ethers.parseUnits('40', 'gwei') // 5 Gwei 更为合理
                // 你可以按需设置 gasPrice 或使用 provider.getFeeData()
            }

            log('⏳ 发送交易...')
            const sentTx = await wallet.sendTransaction(tx)

            log(`📨 交易已发送，Hash: ${sentTx.hash}`)
            log('⏱ 等待区块确认...')

            const receipt = await sentTx.wait()
            log('✅ 合约已部署')
            if (receipt && receipt.contractAddress) {
                log(`📍 合约地址: ${receipt.contractAddress}`)
            } else {
                log('📍 合约地址不可用')
            }
            if (receipt && receipt.gasUsed) {
                log(`⛽ Gas 使用: ${receipt.gasUsed.toString()}`)
            }
        } catch (err: any) {
            log(`❌ 部署失败: ${err.message || String(err)}`)
        }

        setDeploying(false)
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-4">
            <h1 className="text-xl font-bold">🚧 手动部署智能合约</h1>

            <label className="block text-sm font-medium">合约 Bytecode（0x 开头）</label>
            <textarea
                className="w-full h-32 border rounded p-2"
                value={bytecode}
                onChange={(e) => setBytecode(e.target.value)}
                placeholder="0x60806040..."
            />

            <label className="block text-sm font-medium">RPC URL</label>
            <input
                className="w-full border rounded p-2"
                type="text"
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
                placeholder="https://redmansion.io/srpc/"
            />

            <label className="block text-sm font-medium">钱包地址</label>
            <input
                className="w-full border rounded p-2"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
            />

            <label className="block text-sm font-medium">私钥</label>
            <input
                className="w-full border rounded p-2"
                type="text"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="0x..."
            />

            <button
                className={`w-full py-2 px-4 rounded text-white ${deploying ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                onClick={handleDeploy}
                disabled={deploying}
            >
                {deploying ? '部署中...' : '部署合约'}
            </button>

            <div className="mt-6 bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">
                <h2 className="font-bold mb-2">📝 部署日志：</h2>
                {logs.length === 0 ? (
                    <p className="text-gray-500">尚无日志</p>
                ) : (
                    logs.map((line, i) => <div key={i}>{line}</div>)
                )}
            </div>
        </div>
    )
}
