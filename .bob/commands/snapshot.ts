import type { CommandDefinition } from "./types";

/**
 * /snapshot command
 * 
 * Captures a specific moment in the development journey.
 * Types: screenshot, terminal, decision, milestone
 */
export const snapshotCommand: CommandDefinition = {
  name: "snapshot",
  description: "Capture a specific moment in the development journey",
  usage: "/snapshot [screenshot|terminal|decision|milestone]",
  examples: [
    "/snapshot screenshot",
    "/snapshot terminal",
    "/snapshot decision",
    "/snapshot milestone",
  ],
  requiresBrain: true,
  requiresProject: true,

  handler: async (args, context) => {
    const type = args[0] || "screenshot";
    const validTypes = ["screenshot", "terminal", "decision", "milestone"];

    if (!validTypes.includes(type)) {
      return {
        success: false,
        message: `Invalid snapshot type: ${type}. Valid types: ${validTypes.join(", ")}`,
      };
    }

    try {
      // This would integrate with the actual capture system
      const timestamp = new Date().toISOString();
      const id = `${type}-${Date.now()}`;

      return {
        success: true,
        message: `Captured ${type} snapshot: ${id}`,
        data: {
          id,
          type,
          timestamp,
          path: `brain/captures/${type}s/${id}`,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to capture ${type} snapshot`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

// Made with Bob
