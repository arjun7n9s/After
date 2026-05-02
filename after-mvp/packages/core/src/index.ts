// Memory exports
export * from "./memory/brain-files";
export * from "./memory/brain-reader";
export * from "./memory/brain-writer";
export * from "./memory/schemas";

// Privacy exports
export { IgnoreParser } from "./privacy/ignore-parser";
export { Redactor } from "./privacy/redactor";
export { PrivacyFilter } from "./privacy/filter";
export { TrustLogger } from "./privacy/trust-logger";
export type { Secret, RedactionResult } from "./privacy/redactor";
export type { FilterResult } from "./privacy/filter";
export type {
  AuditEntry,
  AuditEventType,
  CaptureEvent as AuditCaptureEvent,
  BlockEvent,
  RedactionEvent,
} from "./privacy/trust-logger";

// Capture exports
export { EventBus } from "./capture/event-bus";
export { FileWatcher } from "./capture/file-watcher";
export { GitScanner } from "./capture/git-scanner";
export { CaptureManager } from "./capture/capture-manager";
export type {
  CaptureEvent,
  CaptureEventType,
  FileChangeEvent,
  GitEvent,
  EventHandler,
} from "./capture/event-bus";
export type { FileWatcherOptions } from "./capture/file-watcher";
export type { GitScannerOptions } from "./capture/git-scanner";
export type { CaptureManagerOptions } from "./capture/capture-manager";

// Made with Bob
