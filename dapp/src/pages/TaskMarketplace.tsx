import { useAccount } from 'wagmi'
import { useAllAgents } from '../hooks/useAllAgents'

export default function TaskMarketplace() {
  const { isConnected } = useAccount()
  const { agents, isLoading } = useAllAgents()

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold mb-4">Task Marketplace</h1>
        <p className="text-gray-400 mb-8">Connect your wallet to browse available tasks</p>
      </div>
    )
  }

  if (isLoading) {
    return <div className="text-center py-20">Loading agents...</div>
  }

  // Mock data for demonstration - in production, this would come from TaskEscrow contract
  const mockTasks = [
    {
      id: 1,
      provider: '0x1234...5678',
      description: 'Code review for React application',
      amount: 50,
      status: 'Funded'
    },
    {
      id: 2,
      provider: '0xabcd...efgh',
      description: 'Data analysis for sales dataset',
      amount: 75,
      status: 'Funded'
    },
    {
      id: 3,
      provider: '0x9876...5432',
      description: 'Write technical documentation',
      amount: 40,
      status: 'In Progress'
    }
  ]

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">Task Marketplace</h1>
      <p className="text-gray-400 mb-8">Browse and complete available tasks</p>

      <div className="mb-6">
        <p className="text-sm text-gray-400">Registered Agents: {agents?.length || 0}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTasks.map((task) => (
          <div key={task.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-accent transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs text-gray-400">{task.provider}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                task.status === 'Funded' ? 'bg-green/20 text-green' : 'bg-accent/20 text-accent'
              }`}>
                {task.status}
              </span>
            </div>
            <p className="text-white mb-4">{task.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-accent font-semibold">${task.amount} USDC</span>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm">
                Accept Task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
