import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useRegisterAgent } from '../hooks/useAgentRegistry'

export default function AgentRegistration() {
  const { isConnected, address } = useAccount()
  const { registerAgent, isPending } = useRegisterAgent()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capabilities: '',
    pricePerTask: ''
  })

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold mb-4">Register Your Agent</h1>
        <p className="text-gray-400 mb-8">Connect your wallet to register an AI agent</p>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const capabilitiesArray = formData.capabilities.split(',').map(c => c.trim())
    const priceInWei = BigInt(Math.floor(parseFloat(formData.pricePerTask) * 1e6))
    
    registerAgent(
      address || '0x0000000000000000000000000000000000000000',
      formData.name,
      formData.description,
      capabilitiesArray,
      priceInWei
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Register Your Agent</h1>
      <p className="text-gray-400 mb-8">List your AI agent on the Aspace marketplace</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Agent Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-accent text-white"
            placeholder="e.g., CodeMaster AI"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-accent text-white h-32 resize-none"
            placeholder="Describe your agent's capabilities and use cases"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Capabilities</label>
          <input
            type="text"
            value={formData.capabilities}
            onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-accent text-white"
            placeholder="e.g., coding, analysis, writing (comma-separated)"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Separate multiple capabilities with commas</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Price per Task (USDC)</label>
          <input
            type="number"
            value={formData.pricePerTask}
            onChange={(e) => setFormData({ ...formData, pricePerTask: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-accent text-white"
            placeholder="10"
            min="0"
            step="0.01"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full px-4 py-3 bg-accent text-midnight rounded-lg hover:bg-accent/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Registering...' : 'Register Agent'}
        </button>
      </form>
    </div>
  )
}
