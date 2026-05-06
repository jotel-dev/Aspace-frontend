const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Verifier", function () {
  let verifier;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Verifier = await ethers.getContractFactory("Verifier");
    verifier = await Verifier.deploy(owner.address);
    await verifier.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await verifier.owner()).to.equal(owner.address);
    });

    it("Should start with zero verifications", async function () {
      expect(await verifier.totalVerifications()).to.equal(0);
    });
  });

  describe("Verifier Authorization", function () {
    it("Should authorize a verifier", async function () {
      await verifier.authorizeVerifier(addr1.address);
      expect(await verifier.authorizedVerifiers(addr1.address)).to.equal(true);
    });

    it("Should revoke verifier authorization", async function () {
      await verifier.authorizeVerifier(addr1.address);
      await verifier.revokeVerifier(addr1.address);
      expect(await verifier.authorizedVerifiers(addr1.address)).to.equal(false);
    });

    it("Should not authorize zero address", async function () {
      await expect(
        verifier.authorizeVerifier(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(verifier, "InvalidVerificationMethod");
    });
  });

  describe("Hash Verification", function () {
    beforeEach(async function () {
      await verifier.authorizeVerifier(addr1.address);
    });

    it("Should verify matching hashes", async function () {
      await verifier.connect(addr1).verifyByHash(
        1,
        "expected_hash_123",
        "expected_hash_123",
        "Hashes match"
      );

      const verification = await verifier.getVerification(1);
      expect(verification.success).to.equal(true);
      expect(await verifier.getVerificationStatus(1)).to.equal(true);
    });

    it("Should fail non-matching hashes", async function () {
      await verifier.connect(addr1).verifyByHash(
        1,
        "expected_hash_123",
        "different_hash_456",
        "Hashes do not match"
      );

      const verification = await verifier.getVerification(1);
      expect(verification.success).to.equal(false);
      expect(await verifier.getVerificationStatus(1)).to.equal(false);
    });

    it("Should not allow unauthorized verifier", async function () {
      await expect(
        verifier.connect(addr2).verifyByHash(1, "hash1", "hash2", "reason")
      ).to.be.revertedWithCustomError(verifier, "NotAuthorizedVerifier");
    });

    it("Should not allow duplicate verification", async function () {
      await verifier.connect(addr1).verifyByHash(1, "hash1", "hash1", "reason");
      
      await expect(
        verifier.connect(addr1).verifyByHash(1, "hash1", "hash1", "reason")
      ).to.be.revertedWithCustomError(verifier, "VerificationAlreadyExists");
    });
  });

  describe("Schema Verification", function () {
    beforeEach(async function () {
      await verifier.authorizeVerifier(addr1.address);
    });

    it("Should verify by schema with valid output", async function () {
      await verifier.connect(addr1).verifyBySchema(
        1,
        '{"type":"object"}',
        '{"result":"success"}',
        "Schema valid"
      );

      const verification = await verifier.getVerification(1);
      expect(verification.success).to.equal(true);
    });

    it("Should fail schema verification with empty output", async function () {
      await verifier.connect(addr1).verifyBySchema(1, '{"type":"object"}', "", "Empty output");

      const verification = await verifier.getVerification(1);
      expect(verification.success).to.equal(false);
    });
  });

  describe("LLM Verification", function () {
    beforeEach(async function () {
      await verifier.authorizeVerifier(addr1.address);
    });

    it("Should verify LLM evaluation with success", async function () {
      await verifier.connect(addr1).verifyByLLM(
        1,
        '{"success":true,"reason":"Good output"}',
        "LLM evaluation passed"
      );

      const verification = await verifier.getVerification(1);
      expect(verification.success).to.equal(true);
    });

    it("Should fail LLM evaluation with failure", async function () {
      await verifier.connect(addr1).verifyByLLM(
        1,
        '{"success":false,"reason":"Poor output"}',
        "LLM evaluation failed"
      );

      const verification = await verifier.getVerification(1);
      expect(verification.success).to.equal(false);
    });

    it("Should fail LLM evaluation with malformed result", async function () {
      await verifier.connect(addr1).verifyByLLM(
        1,
        '{"result":"failed"}',
        "Malformed result"
      );

      const verification = await verifier.getVerification(1);
      expect(verification.success).to.equal(false);
    });
  });

  describe("Custom Verification", function () {
    beforeEach(async function () {
      await verifier.authorizeVerifier(addr1.address);
    });

    it("Should verify with custom method - success", async function () {
      await verifier.connect(addr1).verifyCustom(1, true, "Manual verification passed");

      const verification = await verifier.getVerification(1);
      expect(verification.success).to.equal(true);
      expect(verification.method).to.equal(3); // Custom
    });

    it("Should verify with custom method - failure", async function () {
      await verifier.connect(addr1).verifyCustom(1, false, "Manual verification failed");

      const verification = await verifier.getVerification(1);
      expect(verification.success).to.equal(false);
    });
  });

  describe("Task Escrow Integration", function () {
    it("Should set task escrow contract", async function () {
      await verifier.setTaskEscrowContract(addr1.address);
      expect(await verifier.taskEscrowContract()).to.equal(addr1.address);
    });

    it("Should not set zero address as task escrow", async function () {
      await expect(
        verifier.setTaskEscrowContract(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(verifier, "TaskEscrowNotSet");
    });
  });
});
