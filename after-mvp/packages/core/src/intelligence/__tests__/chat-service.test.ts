import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { BrainWriter } from "../../memory/brain-writer";
import { ChatService } from "../chat-service";

describe("ChatService", () => {
  let testDir: string;
  let chatService: ChatService;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "after-chat-test-"));
    const writer = new BrainWriter(testDir);
    await writer.initialize("Test Project");

    // Add some test content
    await writer.writeOverview({
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: "1.0.0",
      },
      projectName: "Test Project",
      summary: "A test project for chat service",
      repositoryPath: testDir,
      frameworks: ["jest"],
      status: "active",
    });

    await writer.writeIntent({
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: "1.0.0",
      },
      problem: "Test the chat service",
      audience: ["developers"],
      goals: ["Verify chat works", "Test Bob integration"],
      nonGoals: [],
      successCriteria: ["Must handle queries", "Must provide citations"],
    });

    chatService = new ChatService(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("chat", () => {
    it("should generate local response with context", async () => {
      const response = await chatService.chat({
        query: "What is this project about?",
        mode: "local",
      });

      expect(response.success).toBe(true);
      expect(response.mode).toBe("local");
      expect(response.content).toContain("Test Project");
      expect(response.citations.length).toBeGreaterThan(0);
    });

    it("should include citations in response", async () => {
      const response = await chatService.chat({
        query: "test project",
        mode: "local",
      });

      expect(response.success).toBe(true);
      expect(response.citations.length).toBeGreaterThan(0);
      expect(response.citations[0]).toHaveProperty("file");
      expect(response.citations[0]).toHaveProperty("preview");
      expect(response.citations[0]).toHaveProperty("label");
    });

    it("should handle queries with no results", async () => {
      const response = await chatService.chat({
        query: "nonexistent topic xyz123",
        mode: "local",
      });

      expect(response.success).toBe(true);
      expect(response.content).toContain("couldn't find specific information");
      expect(response.citations.length).toBe(0);
    });

    it("should fallback to local mode when Bob is unavailable", async () => {
      const response = await chatService.chat({
        query: "test query",
        mode: "bob", // Request Bob mode
      });

      // Should fallback to local since Bob shell is not available in test
      expect(response.success).toBe(true);
      expect(response.mode).toBe("local");
    });

    it("should limit search results", async () => {
      const response = await chatService.chat({
        query: "test",
        mode: "local",
        maxResults: 2,
      });

      expect(response.success).toBe(true);
      expect(response.citations.length).toBeLessThanOrEqual(2);
    });
  });

  describe("isBobAvailable", () => {
    it("should check Bob availability", async () => {
      const available = await chatService.isBobAvailable();

      // In test environment, Bob shell should not be available
      expect(typeof available).toBe("boolean");
    });
  });
});

// Made with Bob
