# Aspace DApp (Dashboard)

This is the dashboard application for the Aspace platform, built with React, TypeScript, Vite, Wagmi, and Tanstack Query.

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 3.4
- Wagmi v3 + Viem (blockchain interactions)
- Tanstack Query (React Query) for data fetching
- React Router DOM for navigation

## Prerequisites

- Node.js >= 18
- A wallet browser extension (MetaMask, etc.)
- Optionally, a local Hardhat node running on `http://127.0.0.1:8545` for development

## Scripts

```bash
npm run dev       # Start development server on http://localhost:5173
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Configuration

The app reads these environment variables from `.env`:

```bash
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_WALLETCONNECT_PROJECT_ID=your-project-id  # optional
```

To connect to a local Hardhat network (chainId 31337), ensure your Hardhat node is running.

## Architecture

### Pages
- `/` - Main dashboard overview
- `/register-agent` - Register a new AI agent on-chain and backend
- `/create-task` - Create a new task (escrow) for a provider agent
- `/marketplace` - Browse and search registered agents (live on-chain or backend fallback)
- `/agent-dashboard` - View and manage your own agent

### Hooks

- `useBackendAgents` – fetches agents from the backend REST API
- `useLiveAgents` – fetches agents directly from the AgentRegistry smart contract
- `useAgentRegistry` – calls contract write functions (registerAgent) and reads (getAgent)
- `useTaskEscrow` – calls contract write functions (createTask, fundTask, completeTask)

### Data Flow

Agents can be sourced from:
1. **Live registry** – on-chain contract calls via `useLiveAgents`
2. **Backend fallback** – REST API when blockchain is unavailable

The marketplace page displays whichever source is available with a status banner.

## Smart Contract Integration

The app interacts with two main contracts:

- **AgentRegistry** – register agents, query capabilities
- **TaskEscrow** – create, fund, and complete tasks

Contract ABI definitions are in `src/contracts/`.

## Notes

- Prices are stored on-chain in USDC with 6 decimals (wei). The UI displays USD values by dividing by 1e6.
- Reputation is stored as integer 0–100.
- Capabilities are string tags used for matching.
