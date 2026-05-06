const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentRegistry", function () {
  let agentRegistry;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    agentRegistry = await AgentRegistry.deploy(owner.address);
    await agentRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await agentRegistry.owner()).to.equal(owner.address);
    });

    it("Should start with zero agents", async function () {
      expect(await agentRegistry.totalAgents()).to.equal(0);
    });
  });

  describe("Agent Registration", function () {
    it("Should register a new agent", async function () {
      await agentRegistry.connect(addr1).registerAgent(
        addr1.address,
        "Test Agent",
        "A test AI agent",
        ["coding", "analysis"],
        ethers.parseUnits("10", 6) // 10 USDC
      );

      expect(await agentRegistry.totalAgents()).to.equal(1);
      
      const agent = await agentRegistry.getAgent(addr1.address);
      expect(agent.name).to.equal("Test Agent");
      expect(agent.owner).to.equal(addr1.address);
      expect(agent.reputationScore).to.equal(100);
      expect(agent.isActive).to.equal(true);
    });

    it("Should not allow duplicate registration", async function () {
      await agentRegistry.connect(addr1).registerAgent(
        addr1.address,
        "Test Agent",
        "A test AI agent",
        ["coding"],
        ethers.parseUnits("10", 6)
      );

      await expect(
        agentRegistry.connect(addr1).registerAgent(
          addr1.address,
          "Test Agent 2",
          "Another test agent",
          ["coding"],
          ethers.parseUnits("10", 6)
        )
      ).to.be.revertedWithCustomError(agentRegistry, "AgentAlreadyRegistered");
    });

    it("Should require at least one capability", async function () {
      await expect(
        agentRegistry.connect(addr1).registerAgent(
          addr1.address,
          "Test Agent",
          "A test AI agent",
          [],
          ethers.parseUnits("10", 6)
        )
      ).to.be.revertedWithCustomError(agentRegistry, "InvalidCapability");
    });
  });

  describe("Agent Updates", function () {
    beforeEach(async function () {
      await agentRegistry.connect(addr1).registerAgent(
        addr1.address,
        "Test Agent",
        "A test AI agent",
        ["coding", "analysis"],
        ethers.parseUnits("10", 6)
      );
    });

    it("Should allow owner to update agent", async function () {
      await agentRegistry.connect(addr1).updateAgent(
        addr1.address,
        "Updated Agent",
        "Updated description",
        ["coding", "analysis", "writing"],
        ethers.parseUnits("15", 6)
      );

      const agent = await agentRegistry.getAgent(addr1.address);
      expect(agent.name).to.equal("Updated Agent");
      expect(agent.pricePerTask).to.equal(ethers.parseUnits("15", 6));
    });

    it("Should not allow non-owner to update agent", async function () {
      await expect(
        agentRegistry.connect(addr2).updateAgent(
          addr1.address,
          "Updated Agent",
          "Updated description",
          ["coding"],
          ethers.parseUnits("15", 6)
        )
      ).to.be.revertedWithCustomError(agentRegistry, "NotAgentOwner");
    });

    it("Should allow owner to deactivate agent", async function () {
      const agentBefore = await agentRegistry.getAgent(addr1.address);
      expect(agentBefore.isActive).to.equal(true);
      
      await agentRegistry.connect(addr1).deactivateAgent(addr1.address);
      
      // Check that the agent is now inactive by trying to get it (should revert)
      await expect(
        agentRegistry.getAgent(addr1.address)
      ).to.be.revertedWithCustomError(agentRegistry, "AgentNotRegistered");
    });
  });

  describe("Capability Search", function () {
    beforeEach(async function () {
      await agentRegistry.connect(addr1).registerAgent(
        addr1.address,
        "Agent 1",
        "Test agent 1",
        ["coding", "analysis"],
        ethers.parseUnits("10", 6)
      );

      await agentRegistry.connect(addr2).registerAgent(
        addr2.address,
        "Agent 2",
        "Test agent 2",
        ["writing", "analysis"],
        ethers.parseUnits("15", 6)
      );
    });

    it("Should find agents by capability", async function () {
      const codingAgents = await agentRegistry.getAgentsByCapability("coding");
      expect(codingAgents.length).to.equal(1);
      expect(codingAgents[0]).to.equal(addr1.address);

      const analysisAgents = await agentRegistry.getAgentsByCapability("analysis");
      expect(analysisAgents.length).to.equal(2);
    });
  });

  describe("Reputation Management", function () {
    beforeEach(async function () {
      await agentRegistry.connect(addr1).registerAgent(
        addr1.address,
        "Test Agent",
        "A test AI agent",
        ["coding"],
        ethers.parseUnits("10", 6)
      );
    });

    it("Should allow owner to update reputation", async function () {
      await agentRegistry.updateReputation(addr1.address, 150);
      
      const agent = await agentRegistry.getAgent(addr1.address);
      expect(agent.reputationScore).to.equal(150);
    });

    it("Should increment task completion count", async function () {
      await agentRegistry.incrementTaskCompletion(addr1.address);
      
      const agent = await agentRegistry.getAgent(addr1.address);
      expect(agent.totalTasksCompleted).to.equal(1);
    });
  });
});
