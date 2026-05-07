export const CONTRACT_ADDRESSES = {
  hardhat: {
    agentRegistry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    taskEscrow: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    verifier: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    reputation: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    usdc: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  } as const,
  sepolia: {
    // TODO: Replace with actual deployed addresses on Sepolia testnet
    agentRegistry: '',
    taskEscrow: '',
    verifier: '',
    reputation: '',
    usdc: '',
  },
} as const

export function getContractAddresses(chainId: number) {
  const isHardhat = chainId === 31337
  const isSepolia = chainId === 11155111

  if (isHardhat) {
    return CONTRACT_ADDRESSES.hardhat
  }

  if (isSepolia) {
    const cfg = CONTRACT_ADDRESSES.sepolia
    // If sepolia addresses are not set yet, fall back to hardhat for local development safety
    if (cfg.agentRegistry && cfg.taskEscrow && cfg.verifier && cfg.reputation && cfg.usdc) {
      return cfg
    }
    console.warn('Sepolia contract addresses are not configured. Falling back to hardhat addresses.')
    return CONTRACT_ADDRESSES.hardhat
  }

  // For any other network, return hardhat as fallback
  return CONTRACT_ADDRESSES.hardhat
}
