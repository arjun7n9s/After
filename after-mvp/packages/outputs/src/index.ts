export type OutputKind =
  | "readme"
  | "changelog"
  | "explanation"
  | "journey"
  | "abstract";

export type GeneratedOutput = {
  kind: OutputKind;
  fileName: string;
  content: string;
};

export const outputFileNames: Record<OutputKind, string> = {
  readme: "README_generated.md",
  changelog: "CHANGELOG_generated.md",
  explanation: "project_explanation.md",
  journey: "journey_report.md",
  abstract: "abstract.html",
};
