import Handlebars from "handlebars";

export type OutputTemplateName = "readme" | "changelog" | "journey";

const templates: Record<OutputTemplateName, string> = {
  readme: `# {{projectName}}

{{summary}}

**Status:** {{status}}

{{#if problem}}
## Problem

{{problem}}
{{/if}}

{{#if goals}}
## Goals

{{{goals}}}
{{/if}}

{{#if architecture}}
## Architecture

{{architecture}}
{{/if}}

{{#if components}}
### Components

{{{components}}}
{{/if}}

{{#if techStack}}
## Tech Stack

{{{techStack}}}
{{/if}}

{{#if successCriteria}}
## Success Criteria

{{{successCriteria}}}
{{/if}}
`,
  changelog: `# Changelog

All notable changes to {{projectName}} are documented here.

{{{entries}}}
`,
  journey: `# Development Journey: {{projectName}}

{{summary}}

## Timeline

This document chronicles the development journey of {{projectName}}, capturing key moments, decisions, and milestones.

{{{entries}}}

{{#if summaryStats}}
## Summary

{{{summaryStats}}}
{{/if}}
`,
};

export class OutputTemplateEngine {
  render(templateName: OutputTemplateName, data: Record<string, unknown>): string {
    return Handlebars.compile(templates[templateName], {
      noEscape: true,
      strict: false,
    })(data).replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
  }
}

export const renderBulletList = (items: string[]): string =>
  items.map((item) => `- ${item}`).join("\n");
