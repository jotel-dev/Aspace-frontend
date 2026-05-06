const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Reputation", function () {
  let reputation;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Reputation = await ethers.getContractFactory("Reputation");
    reputation = await Reputation.deploy(owner.address);
    await reputation.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await reputation.owner()).to.equal(owner.address);
    });

    it("Should set correct base score", async function () {
      expect(await reputation.baseScore()).to.equal(100);
    });

    it("Should set correct max and min scores", async function () {
      expect(await reputation.maxScore()).to.equal(1000);
      expect(await reputation.minScore()).to.equal(0);
    });
  });

  describe("Agent Registration", function () {
    beforeEach(async function () {
      await reputation.setAgentRegistry(owner.address);
    });

    it("Should register a new agent", async function () {
      await reputation.registerAgent(addr1.address);
      
      const score = await reputation.getScore(addr1.address);
      expect(score.score).to.equal(100);
      expect(score.totalTasks).to.equal(0);
      expect(score.successfulTasks).to.equal(0);
    });

    it("Should not allow duplicate registration", async function () {
      await reputation.registerAgent(addr1.address);
      
      await expect(
        reputation.registerAgent(addr1.address)
      ).to.be.revertedWithCustomError(reputation, "AgentAlreadyRegistered");
    });

    it("Should only allow registry to register agents", async function () {
      await expect(
        reputation.connect(addr1).registerAgent(addr1.address)
      ).to.be.revertedWithCustomError(reputation, "InvalidAdjustment");
    });
  });

  describe("Score Adjustments", function () {
    beforeEach(async function () {
      await reputation.setAgentRegistry(owner.address);
      await reputation.registerAgent(addr1.address);
      await reputation.setTaskEscrow(owner.address);
    });

    it("Should increase score for successful task", async function () {
      await reputation.adjustForTaskCompletion(addr1.address, 1, true);
      
      const score = await reputation.getScore(addr1.address);
      expect(score.score).to.equal(125); // 100 + 25 bonus
      expect(score.successfulTasks).to.equal(1);
      expect(score.totalTasks).to.equal(1);
    });

    it("Should decrease score for failed task", async function () {
      await reputation.adjustForTaskCompletion(addr1.address, 1, false);
      
      const score = await reputation.getScore(addr1.address);
      expect(score.score).to.equal(50); // 100 - 50 penalty
      expect(score.failedTasks).to.equal(1);
      expect(score.totalTasks).to.equal(1);
    });

    it("Should not decrease score below minimum", async function () {
      await reputation.adjustForTaskCompletion(addr1.address, 1, false);
      await reputation.adjustForTaskCompletion(addr1.address, 2, false);
      
      const score = await reputation.getScore(addr1.address);
      expect(score.score).to.equal(0); // Should not go below 0
    });

    it("Should not increase score above maximum", async function () {
      // Set to near max (975)
      await reputation.manualAdjust(addr1.address, 0, 875, "Test adjustment");
      
      await reputation.adjustForTaskCompletion(addr1.address, 1, true);
      
      const score = await reputation.getScore(addr1.address);
      expect(score.score).to.equal(1000); // Should not exceed 1000
    });

    it("Should add verification bonus", async function () {
      await reputation.addVerificationBonus(addr1.address, 1);
      
      const score = await reputation.getScore(addr1.address);
      expect(score.score).to.equal(110); // 100 + 10 bonus
    });

    it("Should add completion bonus", async function () {
      await reputation.addCompletionBonus(addr1.address, 1);
      
      const score = await reputation.getScore(addr1.address);
      expect(score.score).to.equal(105); // 100 + 5 bonus
    });
  });

  describe("Manual Adjustments", function () {
    beforeEach(async function () {
      await reputation.setAgentRegistry(owner.address);
      await reputation.registerAgent(addr1.address);
    });

    it("Should allow owner to manually adjust score", async function () {
      await reputation.manualAdjust(addr1.address, 0, 50, "Manual bonus");
      
      const score = await reputation.getScore(addr1.address);
      expect(score.score).to.equal(150);
    });

    it("Should allow negative manual adjustments", async function () {
      await reputation.manualAdjust(addr1.address, 0, -30, "Manual penalty");
      
      const score = await reputation.getScore(addr1.address);
      expect(score.score).to.equal(70);
    });

    it("Should not allow zero adjustment", async function () {
      await expect(
        reputation.manualAdjust(addr1.address, 0, 0, "Zero adjustment")
      ).to.be.revertedWithCustomError(reputation, "InvalidAdjustment");
    });

    it("Should not allow adjustment for non-existent agent", async function () {
      await expect(
        reputation.manualAdjust(addr2.address, 0, 50, "Test")
      ).to.be.revertedWithCustomError(reputation, "AgentNotFound");
    });
  });

  describe("Success Rate Calculation", function () {
    beforeEach(async function () {
      await reputation.setAgentRegistry(owner.address);
      await reputation.registerAgent(addr1.address);
      await reputation.setTaskEscrow(owner.address);
    });

    it("Should calculate success rate correctly", async function () {
      await reputation.adjustForTaskCompletion(addr1.address, 1, true);
      await reputation.adjustForTaskCompletion(addr1.address, 2, true);
      await reputation.adjustForTaskCompletion(addr1.address, 3, false);
      
      const successRate = await reputation.getSuccessRate(addr1.address);
      expect(successRate).to.equal(66); // 2/3 = 66.66% -> 66
    });

    it("Should return 0 for agent with no tasks", async function () {
      const successRate = await reputation.getSuccessRate(addr1.address);
      expect(successRate).to.equal(0);
    });
  });

  describe("Top Agents Ranking", function () {
    beforeEach(async function () {
      await reputation.setAgentRegistry(owner.address);
      await reputation.registerAgent(addr1.address);
      await reputation.registerAgent(addr2.address);
      await reputation.setTaskEscrow(owner.address);
    });

    it("Should return top agents by score", async function () {
      await reputation.manualAdjust(addr1.address, 0, 50, "Bonus");
      await reputation.manualAdjust(addr2.address, 0, 30, "Bonus");
      
      const addresses = [addr1.address, addr2.address];
      const topAgents = await reputation.getTopAgents(2, addresses);
      
      expect(topAgents[0]).to.equal(addr1.address); // Higher score first
      expect(topAgents[1]).to.equal(addr2.address);
    });
  });

  describe("Parameter Updates", function () {
    it("Should update score adjustment parameters", async function () {
      await reputation.updateParameters(30, 60, 10, 15);
      
      expect(await reputation.successBonus()).to.equal(30);
      expect(await reputation.failurePenalty()).to.equal(60);
      expect(await reputation.completionBonus()).to.equal(10);
      expect(await reputation.verificationBonus()).to.equal(15);
    });

    it("Should set agent registry address", async function () {
      await reputation.setAgentRegistry(addr1.address);
      expect(await reputation.agentRegistry()).to.equal(addr1.address);
    });

    it("Should set task escrow address", async function () {
      await reputation.setTaskEscrow(addr1.address);
      expect(await reputation.taskEscrow()).to.equal(addr1.address);
    });

    it("Should not set zero address for agent registry", async function () {
      await expect(
        reputation.setAgentRegistry(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(reputation, "InvalidScore");
    });
  });

  describe("Task History", function () {
    beforeEach(async function () {
      await reputation.setAgentRegistry(owner.address);
      await reputation.registerAgent(addr1.address);
      await reputation.setTaskEscrow(owner.address);
    });

    it("Should track task history", async function () {
      await reputation.adjustForTaskCompletion(addr1.address, 1, true);
      await reputation.adjustForTaskCompletion(addr1.address, 2, false);
      
      const score = await reputation.getScore(addr1.address);
      expect(score.taskHistory.length).to.equal(2);
      expect(score.taskHistory[0]).to.equal(1);
      expect(score.taskHistory[1]).to.equal(2);
    });

    it("Should track adjustment history for task", async function () {
      await reputation.adjustForTaskCompletion(addr1.address, 1, true);
      
      const adjustments = await reputation.getTaskAdjustments(1);
      expect(adjustments.length).to.equal(1);
      expect(adjustments[0].taskId).to.equal(1);
      expect(adjustments[0].adjustment).to.equal(25);
    });
  });
});
