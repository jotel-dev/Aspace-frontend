// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Verifier
 * @notice Verification system for validating AI agent task outputs
 */
contract Verifier is Ownable, ReentrancyGuard {
    // Verification method enum
    enum VerificationMethod {
        HashMatch,
        SchemaValidation,
        LLMEvaluation,
        Custom
    }

    // Verification result structure
    struct VerificationResult {
        uint256 taskId;
        bool success;
        VerificationMethod method;
        string reason;
        uint256 verifiedAt;
        address verifier;
    }

    // State variables
    mapping(uint256 => VerificationResult) public verifications;
    address public taskEscrowContract;
    mapping(address => bool) public authorizedVerifiers;
    uint256 public totalVerifications;

    // Events
    event VerificationAdded(uint256 indexed taskId, bool success, VerificationMethod method);
    event VerifierAuthorized(address indexed verifier);
    event VerifierRevoked(address indexed verifier);
    event TaskEscrowContractUpdated(address newContract);

    // Errors
    error VerificationAlreadyExists();
    error NotAuthorizedVerifier();
    error InvalidVerificationMethod();
    error TaskEscrowNotSet();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Set the TaskEscrow contract address
     * @param _taskEscrowContract Address of the TaskEscrow contract
     */
    function setTaskEscrowContract(address _taskEscrowContract) external onlyOwner {
        if (_taskEscrowContract == address(0)) revert TaskEscrowNotSet();
        taskEscrowContract = _taskEscrowContract;
        emit TaskEscrowContractUpdated(_taskEscrowContract);
    }

    /**
     * @notice Authorize a verifier address
     * @param verifier Address to authorize
     */
    function authorizeVerifier(address verifier) external onlyOwner {
        if (verifier == address(0)) revert InvalidVerificationMethod();
        authorizedVerifiers[verifier] = true;
        emit VerifierAuthorized(verifier);
    }

    /**
     * @notice Revoke verifier authorization
     * @param verifier Address to revoke
     */
    function revokeVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[verifier] = false;
        emit VerifierRevoked(verifier);
    }

    /**
     * @notice Verify task by hash matching
     * @param taskId Task ID
     * @param expectedHash Expected output hash
     * @param actualHash Actual output hash
     * @param reason Verification reason
     */
    function verifyByHash(
        uint256 taskId,
        string memory expectedHash,
        string memory actualHash,
        string memory reason
    ) external nonReentrant {
        if (!authorizedVerifiers[msg.sender]) revert NotAuthorizedVerifier();
        if (verifications[taskId].taskId != 0) revert VerificationAlreadyExists();

        bool success = keccak256(abi.encodePacked(expectedHash)) == keccak256(abi.encodePacked(actualHash));

        _addVerification(taskId, success, VerificationMethod.HashMatch, reason);
    }

    /**
     * @notice Verify task by schema validation
     * @param taskId Task ID
     * @param schema Schema to validate against
     * @param output Output to validate
     * @param reason Verification reason
     */
    function verifyBySchema(
        uint256 taskId,
        string memory schema,
        string memory output,
        string memory reason
    ) external nonReentrant {
        if (!authorizedVerifiers[msg.sender]) revert NotAuthorizedVerifier();
        if (verifications[taskId].taskId != 0) revert VerificationAlreadyExists();

        // In a real implementation, this would validate the output against the schema
        // For now, we'll do a simple check
        bool success = bytes(output).length > 0;

        _addVerification(taskId, success, VerificationMethod.SchemaValidation, reason);
    }

    /**
     * @notice Verify task by LLM evaluation
     * @param taskId Task ID
     * @param evaluationResult LLM evaluation result (JSON string)
     * @param reason Verification reason
     */
    function verifyByLLM(
        uint256 taskId,
        string memory evaluationResult,
        string memory reason
    ) external nonReentrant {
        if (!authorizedVerifiers[msg.sender]) revert NotAuthorizedVerifier();
        if (verifications[taskId].taskId != 0) revert VerificationAlreadyExists();

        // Parse evaluation result to determine success
        // In a real implementation, this would call an LLM oracle
        // For now, we'll check if result contains "success":true
        bool success = _parseLLMResult(evaluationResult);

        _addVerification(taskId, success, VerificationMethod.LLMEvaluation, reason);
    }

    /**
     * @notice Verify task with custom method
     * @param taskId Task ID
     * @param success Verification result
     * @param reason Verification reason
     */
    function verifyCustom(
        uint256 taskId,
        bool success,
        string memory reason
    ) external nonReentrant {
        if (!authorizedVerifiers[msg.sender]) revert NotAuthorizedVerifier();
        if (verifications[taskId].taskId != 0) revert VerificationAlreadyExists();

        _addVerification(taskId, success, VerificationMethod.Custom, reason);
    }

    /**
     * @notice Get verification result for a task
     * @param taskId Task ID
     */
    function getVerification(uint256 taskId) external view returns (VerificationResult memory) {
        if (verifications[taskId].taskId == 0) revert VerificationAlreadyExists();
        return verifications[taskId];
    }

    /**
     * @notice Check if a task has been verified
     * @param taskId Task ID
     */
    function isVerified(uint256 taskId) external view returns (bool) {
        return verifications[taskId].taskId != 0;
    }

    /**
     * @notice Get verification result status
     * @param taskId Task ID
     */
    function getVerificationStatus(uint256 taskId) external view returns (bool) {
        if (verifications[taskId].taskId == 0) return false;
        return verifications[taskId].success;
    }

    // Internal function to add verification
    function _addVerification(
        uint256 taskId,
        bool success,
        VerificationMethod method,
        string memory reason
    ) internal {
        verifications[taskId] = VerificationResult({
            taskId: taskId,
            success: success,
            method: method,
            reason: reason,
            verifiedAt: block.timestamp,
            verifier: msg.sender
        });

        totalVerifications++;

        emit VerificationAdded(taskId, success, method);
    }

    // Internal function to parse LLM result (simplified)
    function _parseLLMResult(string memory evaluationResult) internal pure returns (bool) {
        // Simple check for "success":true in the JSON
        bytes memory resultBytes = bytes(evaluationResult);
        bytes memory successPattern = bytes('"success":true');
        
        for (uint256 i = 0; i <= resultBytes.length - successPattern.length; i++) {
            bool isMatch = true;
            for (uint256 j = 0; j < successPattern.length; j++) {
                if (resultBytes[i + j] != successPattern[j]) {
                    isMatch = false;
                    break;
                }
            }
            if (isMatch) return true;
        }
        
        return false;
    }
}
