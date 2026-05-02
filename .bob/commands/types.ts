/**
 * Bob Slash Command Types
 * 
 * These types define the structure of slash commands that Bob can execute
 * in Narrator Mode to interact with the After MVP system.
 */

export type CommandContext = {
  projectPath: string;
  brainPath: string;
  userId?: string;
  sessionId?: string;
};

export type CommandResult = {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
};

export type CommandHandler = (
  args: string[],
  context: CommandContext
) => Promise<CommandResult>;

export type CommandDefinition = {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  handler: CommandHandler;
  requiresBrain?: boolean;
  requiresProject?: boolean;
};

export type CommandRegistry = Map<string, CommandDefinition>;

// Made with Bob
