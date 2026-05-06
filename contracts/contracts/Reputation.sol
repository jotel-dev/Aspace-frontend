// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Reputation
 * @notice On-chain reputation scoring system for AI agents
 */
contract Reputation is Ownable, ReentrancyGuard {
    // Reputation score structure
    struct ReputationScore {
        uint256 score; // 0-1000 scale
        uint256 totalTasks;
        uint256 successfulTasks;
        uint256 failedTasks;
        uint256 lastUpdated;
        uint256[] taskHistory;
    }

    // Score adjustment structure
    struct ScoreAdjustment {
        uint256 taskId;
        int256 adjustment; // Positive for increase, negative for decrease
        string reason;
        uint256 timestamp;
        address adjustedBy;
    }

    // State variables
    mapping(address => ReputationScore) public scores;
    mapping(uint256 => ScoreAdjustment[]) public taskAdjustments;
    address public agentRegistry;
    address public taskEscrow;
    
    uint256 public baseScore = 100; // Starting score (100/1000 = 10%)
    uint256 public maxScore = 1000;
    uint256 public minScore = 0;
    
    // Score adjustment parameters
    uint256 public successBonus = 25;
    uint256 public failurePenalty = 50;
    uint256 public completionBonus = 5;
    uint256 public verificationBonus = 10;

    // Events
    event ScoreUpdated(address indexed agent, uint256 newScore, string reason);
    event AgentRegistered(address indexed agent);
    event ParametersUpdated(
        uint256 successBonus,
        uint256 failurePenalty,
        uint256 completionBonus,
        uint256 verificationBonus
    );
    event AgentRegistryUpdated(address newRegistry);
    event TaskEscrowUpdated(address newEscrow);

    // Errors
    error AgentNotFound();
    error InvalidScore();
    error InvalidAdjustment();
    error AgentAlreadyRegistered();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Set the AgentRegistry contract address
     * @param _agentRegistry Address of the AgentRegistry contract
     */
    function setAgentRegistry(address _agentRegistry) external onlyOwner {
        if (_agentRegistry == address(0)) revert InvalidScore();
        agentRegistry = _agentRegistry;
        emit AgentRegistryUpdated(_agentRegistry);
    }

    /**
     * @notice Set the TaskEscrow contract address
     * @param _taskEscrow Address of the TaskEscrow contract
     */
    function setTaskEscrow(address _taskEscrow) external onlyOwner {
        if (_taskEscrow == address(0)) revert InvalidScore();
        taskEscrow = _taskEscrow;
        emit TaskEscrowUpdated(_taskEscrow);
    }

    /**
     * @notice Register a new agent with base reputation score
     * @param agent The agent address
     */
    function registerAgent(address agent) external {
        if (msg.sender != agentRegistry) revert InvalidAdjustment();
        if (scores[agent].score != 0) revert AgentAlreadyRegistered();

        scores[agent] = ReputationScore({
            score: baseScore,
            totalTasks: 0,
            successfulTasks: 0,
            failedTasks: 0,
            lastUpdated: block.timestamp,
            taskHistory: new uint256[](0)
        });

        emit AgentRegistered(agent);
    }

    /**
     * @notice Adjust reputation score after task completion
     * @param agent The agent address
     * @param taskId The task ID
     * @param success Whether the task was successful
     */
    function adjustForTaskCompletion(
        address agent,
        uint256 taskId,
        bool success
    ) external {
        if (msg.sender != taskEscrow) revert InvalidAdjustment();
        
        ReputationScore storage agentScore = scores[agent];
        if (agentScore.score == 0) revert AgentNotFound();

        int256 adjustment = success ? int256(successBonus) : -int256(failurePenalty);
        _adjustScore(agent, taskId, adjustment, success ? "Task completed successfully" : "Task failed");

        agentScore.totalTasks++;
        if (success) {
            agentScore.successfulTasks++;
        } else {
            agentScore.failedTasks++;
        }

        agentScore.taskHistory.push(taskId);
    }

    /**
     * @notice Add bonus for task verification
     * @param agent The agent address
     * @param taskId The task ID
     */
    function addVerificationBonus(address agent, uint256 taskId) external {
        if (msg.sender != taskEscrow) revert InvalidAdjustment();
        
        ReputationScore storage agentScore = scores[agent];
        if (agentScore.score == 0) revert AgentNotFound();

        _adjustScore(agent, taskId, int256(verificationBonus), "Task verified successfully");
    }

    /**
     * @notice Add completion bonus (for consistent performance)
     * @param agent The agent address
     * @param taskId The task ID
     */
    function addCompletionBonus(address agent, uint256 taskId) external {
        if (msg.sender != taskEscrow) revert InvalidAdjustment();
        
        ReputationScore storage agentScore = scores[agent];
        if (agentScore.score == 0) revert AgentNotFound();

        _adjustScore(agent, taskId, int256(completionBonus), "Task completion bonus");
    }

    /**
     * @notice Manual score adjustment by owner
     * @param agent The agent address
     * @param taskId The task ID (0 for manual adjustment without task)
     * @param adjustment Score adjustment (positive or negative)
     * @param reason Reason for adjustment
     */
    function manualAdjust(
        address agent,
        uint256 taskId,
        int256 adjustment,
        string memory reason
    ) external onlyOwner {
        ReputationScore storage agentScore = scores[agent];
        if (agentScore.score == 0) revert AgentNotFound();
        if (adjustment == 0) revert InvalidAdjustment();

        _adjustScore(agent, taskId, adjustment, reason);
    }

    /**
     * @notice Get reputation score for an agent
     * @param agent The agent address
     */
    function getScore(address agent) external view returns (ReputationScore memory) {
        ReputationScore storage agentScore = scores[agent];
        if (agentScore.score == 0 && agentScore.lastUpdated == 0) revert AgentNotFound();
        return agentScore;
    }

    /**
     * @notice Get score history for a task
     * @param taskId The task ID
     */
    function getTaskAdjustments(uint256 taskId) external view returns (ScoreAdjustment[] memory) {
        return taskAdjustments[taskId];
    }

    /**
     * @notice Get top agents by reputation score
     * @param limit Number of agents to return
     * @param agentAddresses Array of agent addresses to rank
     */
    function getTopAgents(uint256 limit, address[] memory agentAddresses) external view returns (address[] memory) {
        address[] memory topAgents = new address[](limit);
        uint256[] memory agentScores = new uint256[](limit);
        
        // Initialize with first agents
        for (uint256 i = 0; i < limit && i < agentAddresses.length; i++) {
            topAgents[i] = agentAddresses[i];
            agentScores[i] = scores[agentAddresses[i]].score;
        }

        // Sort by score (descending)
        for (uint256 i = 0; i < limit - 1; i++) {
            for (uint256 j = 0; j < limit - i - 1; j++) {
                if (agentScores[j] < agentScores[j + 1]) {
                    // Swap
                    (agentScores[j], agentScores[j + 1]) = (agentScores[j + 1], agentScores[j]);
                    (topAgents[j], topAgents[j + 1]) = (topAgents[j + 1], topAgents[j]);
                }
            }
        }

        return topAgents;
    }

    /**
     * @notice Calculate success rate for an agent
     * @param agent The agent address
     */
    function getSuccessRate(address agent) external view returns (uint256) {
        ReputationScore memory agentScore = scores[agent];
        if (agentScore.score == 0) revert AgentNotFound();
        if (agentScore.totalTasks == 0) return 0;

        return (agentScore.successfulTasks * 100) / agentScore.totalTasks;
    }

    /**
     * @notice Update score adjustment parameters
     * @param _successBonus Bonus for successful task
     * @param _failurePenalty Penalty for failed task
     * @param _completionBonus Bonus for task completion
     * @param _verificationBonus Bonus for verification
     */
    function updateParameters(
        uint256 _successBonus,
        uint256 _failurePenalty,
        uint256 _completionBonus,
        uint256 _verificationBonus
    ) external onlyOwner {
        successBonus = _successBonus;
        failurePenalty = _failurePenalty;
        completionBonus = _completionBonus;
        verificationBonus = _verificationBonus;

        emit ParametersUpdated(_successBonus, _failurePenalty, _completionBonus, _verificationBonus);
    }

    // Internal function to adjust score
    function _adjustScore(
        address agent,
        uint256 taskId,
        int256 adjustment,
        string memory reason
    ) internal {
        ReputationScore storage agentScore = scores[agent];
        
        int256 newScore = int256(agentScore.score) + adjustment;
        if (newScore > int256(maxScore)) newScore = int256(maxScore);
        if (newScore < int256(minScore)) newScore = int256(minScore);
        
        agentScore.score = uint256(newScore);
        agentScore.lastUpdated = block.timestamp;

        taskAdjustments[taskId].push(ScoreAdjustment({
            taskId: taskId,
            adjustment: adjustment,
            reason: reason,
            timestamp: block.timestamp,
            adjustedBy: msg.sender
        }));

        emit ScoreUpdated(agent, agentScore.score, reason);
    }
}
