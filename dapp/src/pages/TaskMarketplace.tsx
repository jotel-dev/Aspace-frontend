import { useAccount } from 'wagmi'
import { useAllAgents } from '../hooks/useAllAgents'
import { useAllTasks, useTasks } from '../hooks/useAllTasks'
import { useState, useEffect } from 'react'

export default function TaskMarketplace() {
  const { isConnected } = useAccount()
  const { agents, isLoading: agentsLoading } = useAllAgents()
  const { nextTaskId } = useAllTasks()
  const [taskIds, setTaskIds] = useState<number[]>([])
  const [selectedCapability, setSelectedCapability] = useState<string>('all')

  // Generate task IDs to fetch
  useEffect(() => {
    if (nextTaskId) {
      const ids = []
      for (let i = 1; i < Number(nextTaskId); i++) {
        ids.push(i)
      }
      setTaskIds(ids)
    }
  }, [nextTaskId])

  // Fetch tasks in batches (limit to avoid too many requests)
  const { tasks, isLoading: tasksLoading } = useTasks(taskIds.slice(0, 20)) // Limit to first 20 tasks

  // Extract unique capabilities from agents
  const allCapabilities = agents ? 
    Array.from(new Set(agents.flatMap(agent => agent.capabilities || []))) : []

  // Filter agents by selected capability
  const filteredAgents = selectedCapability === 'all' 
    ? agents 
    : agents?.filter(agent => agent.capabilities?.includes(selectedCapability))

  // Filter tasks that are funded and not yet completed
  const availableTasks = tasks.filter(task => 
    task && (task.status === 1 || task.status === 2) // Created or Funded status
  )

  // Further filter tasks by selected capability (match provider's capabilities)
  const filteredTasks = selectedCapability === 'all'
    ? availableTasks
    : availableTasks.filter(task => {
        const providerAgent = agents?.find(agent => 
          agent.owner.toLowerCase() === task.provider.toLowerCase()
        )
        return providerAgent?.capabilities?.includes(selectedCapability)
      })

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold mb-4">Task Marketplace</h1>
        <p className="text-gray-400 mb-8">Connect your wallet to browse available tasks</p>
      </div>
    )
  }

  const isLoading = agentsLoading || tasksLoading

  if (isLoading) {
    return <div className="text-center py-20">Loading marketplace...</div>
  }

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Created'
      case 1: return 'Funded'
      case 2: return 'In Progress'
      case 3: return 'Completed'
      case 4: return 'Verified'
      case 5: return 'Paid'
      case 6: return 'Refunded'
      case 7: return 'Cancelled'
      default: return 'Unknown'
    }
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-green/20 text-green'
      case 2: return 'bg-accent/20 text-accent'
      case 3: return 'bg-blue/20 text-blue'
      case 4: return 'bg-purple/20 text-purple'
      case 5: return 'bg-emerald/20 text-emerald'
      default: return 'bg-gray/20 text-gray'
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">Task Marketplace</h1>
      <p className="text-gray-400 mb-8">Browse and complete available tasks</p>

      {/* Capability Filter */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm font-medium text-gray-300">Filter by capability:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCapability('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedCapability === 'all'
                  ? 'bg-accent text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All Capabilities
            </button>
            {allCapabilities.map(capability => (
              <button
                key={capability}
                onClick={() => setSelectedCapability(capability)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCapability === capability
                    ? 'bg-accent text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {capability}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <p className="text-sm text-gray-400">
          Registered Agents: {filteredAgents?.length || 0} / {agents?.length || 0}
        </p>
        <p className="text-sm text-gray-400">
          Available Tasks: {filteredTasks.length} / {availableTasks.length}
        </p>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">
            {selectedCapability === 'all' 
              ? 'No available tasks found' 
              : `No available tasks found for "${selectedCapability}" capability`
            }
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {selectedCapability !== 'all' && 'Try selecting "All Capabilities" or create a new task'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <div key={task.taskId.toString()} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-accent transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-gray-400">Task #{task.taskId.toString()}</span>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}>
                  {getStatusText(task.status)}
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-white text-sm mb-2 line-clamp-2">{task.taskData}</p>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Client: {task.client.slice(0, 6)}...{task.client.slice(-4)}</span>
                  <span>Provider: {task.provider.slice(0, 6)}...{task.provider.slice(-4)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-accent font-semibold">
                  ${(Number(task.amount) / 1_000_000).toFixed(2)} USDC
                </span>
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm">
                  Accept Task
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
