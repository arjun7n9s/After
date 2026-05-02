/**
 * Bob Slash Commands Registry
 * 
 * This file exports all available slash commands for Bob Narrator Mode.
 * The actual implementation logic resides in the @after/server package.
 */

import type { CommandDefinition, CommandRegistry } from "./types";

// Command stubs - actual implementation in server package
export const commands: Record<string, Omit<CommandDefinition, "handler">> = {
  narrate: {
    name: "narrate",
    description: "Activate Bob Narrator Mode and start observing",
    usage: "/narrate",
    examples: ["/narrate"],
    requiresBrain: true,
    requiresProject: true,
  },

  snapshot: {
    name: "snapshot",
    description: "Capture a moment (screenshot, terminal, decision, milestone)",
    usage: "/snapshot [type]",
    examples: ["/snapshot screenshot", "/snapshot decision"],
    requiresBrain: true,
    requiresProject: true,
  },

  status: {
    name: "status",
    description: "Search the Project Brain or show project status",
    usage: "/status [query]",
    examples: ["/status", "/status authentication"],
    requiresBrain: true,
    requiresProject: true,
  },

  readme: {
    name: "readme",
    description: "Generate README.md from Project Brain",
    usage: "/readme",
    examples: ["/readme"],
    requiresBrain: true,
    requiresProject: true,
  },

  changelog: {
    name: "changelog",
    description: "Generate CHANGELOG.md from captured changes",
    usage: "/changelog",
    examples: ["/changelog"],
    requiresBrain: true,
    requiresProject: true,
  },

  journey: {
    name: "journey",
    description: "Generate development journey report",
    usage: "/journey",
    examples: ["/journey"],
    requiresBrain: true,
    requiresProject: true,
  },

  abstract: {
    name: "abstract",
    description: "Generate HTML abstract/summary of the project",
    usage: "/abstract",
    examples: ["/abstract"],
    requiresBrain: true,
    requiresProject: true,
  },

  demo: {
    name: "demo",
    description: "Manage demo video generation",
    usage: "/demo [plan|generate|preview|export]",
    examples: ["/demo plan", "/demo generate"],
    requiresBrain: true,
    requiresProject: true,
  },

  video: {
    name: "video",
    description: "Advanced video operations",
    usage: "/video [scenes|captions|thumbnail|composite]",
    examples: ["/video scenes", "/video captions"],
    requiresBrain: true,
    requiresProject: true,
  },

  "privacy-scan": {
    name: "privacy-scan",
    description: "Scan project for potential privacy issues",
    usage: "/privacy-scan",
    examples: ["/privacy-scan"],
    requiresProject: true,
  },

  "verify-brain": {
    name: "verify-brain",
    description: "Verify Project Brain integrity",
    usage: "/verify-brain",
    examples: ["/verify-brain"],
    requiresBrain: true,
    requiresProject: true,
  },
};

/**
 * Get command help text
 */
export function getCommandHelp(commandName?: string): string {
  if (!commandName) {
    const commandList = Object.values(commands)
      .map((cmd) => `  ${cmd.usage.padEnd(40)} ${cmd.description}`)
      .join("\n");

    return `Available Bob Narrator Commands:\n\n${commandList}\n\nUse /help [command] for detailed help on a specific command.`;
  }

  const cmd = commands[commandName];
  if (!cmd) {
    return `Unknown command: ${commandName}`;
  }

  return `${cmd.name} - ${cmd.description}

Usage: ${cmd.usage}

Examples:
${cmd.examples.map((ex) => `  ${ex}`).join("\n")}`;
}

export type { CommandDefinition, CommandContext, CommandResult, CommandRegistry } from "./types";

// Made with Bob
