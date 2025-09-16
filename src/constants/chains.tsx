// constants/chains.ts
import { Chain } from 'wagmi/chains'

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://redmansion.io/srpc/'
const explorer = process.env.NEXT_PUBLIC_EXPLORER || 'https://redmansion.io/'

export const redmansionChain: Chain = {
  id: 192,
  name: 'Redmansion',
  nativeCurrency: {
    name: 'Redmansion',
    symbol: 'RMC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [rpcUrl],
    },
    public: {
      http: [rpcUrl],
    },
  },
  blockExplorers: {
    default: { name: 'RedmansionExplorer', url: explorer },
  },
  testnet: false,
}
