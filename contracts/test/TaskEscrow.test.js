const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TaskEscrow", function () {
  let taskEscrow;
  let usdcToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy mock USDC token
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdcToken = await MockUSDC.deploy("USD Coin", "USDC");
    await usdcToken.waitForDeployment();

    // Deploy TaskEscrow
    const TaskEscrow = await ethers.getContractFactory("TaskEscrow");
    taskEscrow = await TaskEscrow.deploy(
      await usdcToken.getAddress(),
      owner.address,
      200, // 2% platform fee
      owner.address
    );
    await taskEscrow.waitForDeployment();

    // Mint USDC to test accounts
    await usdcToken.mint(addr1.address, ethers.parseUnits("1000", 6));
    await usdcToken.mint(addr2.address, ethers.parseUnits("1000", 6));

    // Approve TaskEscrow to spend USDC
    await usdcToken.connect(addr1).approve(await taskEscrow.getAddress(), ethers.parseUnits("1000", 6));
    await usdcToken.connect(addr2).approve(await taskEscrow.getAddress(), ethers.parseUnits("1000", 6));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await taskEscrow.owner()).to.equal(owner.address);
    });

    it("Should set correct USDC token", async function () {
      expect(await taskEscrow.usdcToken()).to.equal(await usdcToken.getAddress());
    });

    it("Should set correct platform fee", async function () {
      expect(await taskEscrow.platformFeePercentage()).to.equal(200);
    });
  });

  describe("Task Creation", function () {
    it("Should create a new task", async function () {
      const taskId = await taskEscrow.connect(addr1).createTask(
        addr2.address,
        ethers.parseUnits("100", 6),
        "Test task data"
      );

      expect(await taskEscrow.totalTasks()).to.equal(1);
      
      const task = await taskEscrow.getTask(1);
      expect(task.client).to.equal(addr1.address);
      expect(task.provider).to.equal(addr2.address);
      expect(task.amount).to.equal(ethers.parseUnits("100", 6));
      expect(task.status).to.equal(0); // Created
    });

    it("Should not create task with zero amount", async function () {
      await expect(
        taskEscrow.connect(addr1).createTask(
          addr2.address,
          0,
          "Test task data"
        )
      ).to.be.revertedWithCustomError(taskEscrow, "InvalidAmount");
    });
  });

  describe("Task Funding", function () {
    beforeEach(async function () {
      await taskEscrow.connect(addr1).createTask(
        addr2.address,
        ethers.parseUnits("100", 6),
        "Test task data"
      );
    });

    it("Should fund a task", async function () {
      await taskEscrow.connect(addr1).fundTask(1, ethers.parseUnits("100", 6));
      
      const task = await taskEscrow.getTask(1);
      expect(task.status).to.equal(1); // Funded
      expect(await usdcToken.balanceOf(await taskEscrow.getAddress())).to.equal(ethers.parseUnits("100", 6));
    });

    it("Should not allow non-client to fund task", async function () {
      await expect(
        taskEscrow.connect(addr2).fundTask(1, ethers.parseUnits("100", 6))
      ).to.be.revertedWithCustomError(taskEscrow, "NotClient");
    });

    it("Should allow partial funding", async function () {
      await taskEscrow.connect(addr1).fundTask(1, ethers.parseUnits("50", 6));
      
      const task = await taskEscrow.getTask(1);
      expect(task.status).to.equal(1); // Funded
    });
  });

  describe("Task Execution", function () {
    beforeEach(async function () {
      await taskEscrow.connect(addr1).createTask(
        addr2.address,
        ethers.parseUnits("100", 6),
        "Test task data"
      );
      await taskEscrow.connect(addr1).fundTask(1, ethers.parseUnits("100", 6));
    });

    it("Should allow provider to start task", async function () {
      await taskEscrow.connect(addr2).startTask(1);
      
      const task = await taskEscrow.getTask(1);
      expect(task.status).to.equal(2); // InProgress
    });

    it("Should allow provider to complete task", async function () {
      await taskEscrow.connect(addr2).startTask(1);
      await taskEscrow.connect(addr2).completeTask(1, "Task output result");
      
      const task = await taskEscrow.getTask(1);
      expect(task.status).to.equal(3); // Completed
      expect(task.taskOutput).to.equal("Task output result");
    });

    it("Should not allow non-provider to start task", async function () {
      await expect(
        taskEscrow.connect(addr1).startTask(1)
      ).to.be.revertedWithCustomError(taskEscrow, "NotProvider");
    });
  });

  describe("Task Verification", function () {
    beforeEach(async function () {
      await taskEscrow.connect(addr1).createTask(
        addr2.address,
        ethers.parseUnits("100", 6),
        "Test task data"
      );
      await taskEscrow.connect(addr1).fundTask(1, ethers.parseUnits("100", 6));
      await taskEscrow.connect(addr2).startTask(1);
      await taskEscrow.connect(addr2).completeTask(1, "Task output result");
      
      // Set verifier contract to owner for testing
      await taskEscrow.setVerifierContract(owner.address);
    });

    it("Should verify task successfully", async function () {
      await taskEscrow.verifyTask(1, true);
      
      const task = await taskEscrow.getTask(1);
      expect(task.status).to.equal(4); // Verified
    });

    it("Should not verify non-existent task", async function () {
      await expect(
        taskEscrow.verifyTask(999, true)
      ).to.be.revertedWithCustomError(taskEscrow, "TaskNotFound");
    });
  });

  describe("Payment Release", function () {
    beforeEach(async function () {
      await taskEscrow.connect(addr1).createTask(
        addr2.address,
        ethers.parseUnits("100", 6),
        "Test task data"
      );
      await taskEscrow.connect(addr1).fundTask(1, ethers.parseUnits("100", 6));
      await taskEscrow.connect(addr2).startTask(1);
      await taskEscrow.connect(addr2).completeTask(1, "Task output result");
      await taskEscrow.setVerifierContract(owner.address);
      await taskEscrow.verifyTask(1, true);
    });

    it("Should release payment to provider", async function () {
      const balanceBefore = await usdcToken.balanceOf(addr2.address);
      
      await taskEscrow.releasePayment(1);
      
      const balanceAfter = await usdcToken.balanceOf(addr2.address);
      const expectedPayment = ethers.parseUnits("100", 6) - ethers.parseUnits("2", 6); // Minus 2% fee
      
      expect(balanceAfter - balanceBefore).to.equal(expectedPayment);
      
      const task = await taskEscrow.getTask(1);
      expect(task.status).to.equal(5); // Paid
    });

    it("Should deduct platform fee", async function () {
      const feeRecipientBalanceBefore = await usdcToken.balanceOf(owner.address);
      
      await taskEscrow.releasePayment(1);
      
      const feeRecipientBalanceAfter = await usdcToken.balanceOf(owner.address);
      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(ethers.parseUnits("2", 6)); // 2% of 100
    });
  });

  describe("Task Cancellation and Refund", function () {
    it("Should cancel unfunded task", async function () {
      await taskEscrow.connect(addr1).createTask(
        addr2.address,
        ethers.parseUnits("100", 6),
        "Test task data"
      );
      
      await taskEscrow.connect(addr1).cancelTask(1);
      
      const task = await taskEscrow.getTask(1);
      expect(task.status).to.equal(7); // Cancelled
    });

    it("Should refund funded task", async function () {
      await taskEscrow.connect(addr1).createTask(
        addr2.address,
        ethers.parseUnits("100", 6),
        "Test task data"
      );
      await taskEscrow.connect(addr1).fundTask(1, ethers.parseUnits("100", 6));
      
      const balanceBefore = await usdcToken.balanceOf(addr1.address);
      await taskEscrow.connect(addr1).refundTask(1);
      const balanceAfter = await usdcToken.balanceOf(addr1.address);
      
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("100", 6));
      
      const task = await taskEscrow.getTask(1);
      expect(task.status).to.equal(6); // Refunded
    });

    it("Should not cancel funded task", async function () {
      await taskEscrow.connect(addr1).createTask(
        addr2.address,
        ethers.parseUnits("100", 6),
        "Test task data"
      );
      await taskEscrow.connect(addr1).fundTask(1, ethers.parseUnits("100", 6));
      
      await expect(
        taskEscrow.connect(addr1).cancelTask(1)
      ).to.be.revertedWithCustomError(taskEscrow, "TaskCannotBeCancelled");
    });
  });
});
