import type { CommandDefinition } from "./types";

/**
 * /narrate command
 * 
 * Activates Bob Narrator Mode and begins observing the development session.
 */
export const narrateCommand: CommandDefinition = {
  name: "narrate",
  description: "Activate Bob Narrator Mode and start observing the development session",
  usage: "/narrate",
  examples: ["/narrate"],
  requiresBrain: true,
  requiresProject: true,

  handler: async (args, context) => {
    try {
      // In a real implementation, this would:
      // 1. Switch Bob to Narrator Mode
      // 2. Start file watchers
      // 3. Begin monitoring git activity
      // 4. Initialize session tracking
      
      const { BrainReader } = await import("@after/core");
      const reader = new BrainReader(context.projectPath);
      
      // Read current project state
      const overview = await reader.readOverview();
      const recentJourney = await reader.readJourney();
      const lastEntry = recentJourney[recentJourney.length - 1];
      
      return {
        success: true,
        message: `Narrator Mode activated. I'm now observing your development session.

Current project: ${overview.projectName} (status: ${overview.status})
Last activity: ${lastEntry ? new Date(lastEntry.timestamp).toLocaleString() : "No previous activity"}

What are you working on today?`,
        data: {
          projectName: overview.projectName,
          status: overview.status,
          lastActivity: lastEntry?.timestamp,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to activate Narrator Mode",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

// Made with Bob
