# After MVP - Implementation Plan

## Executive Summary

After is a hybrid, local-first developer tool that captures meaningful development moments, stores them in a local Project Brain, and generates outputs including a polished demo video.

**Tech Stack:** Full-stack TypeScript (Node.js + React)
**Integration:** Standalone app + Bob Narrator Mode + Bob Shell adapter
**Core Principle:** Local-first by default. IBM services enhance but do not enable.

---

## 1. Final Repository Structure

```
after/
├── packages/
│   ├── core/                           # Core capture and memory engine
│   │   ├── src/
│   │   │   ├── capture/
│   │   │   │   ├── file-watcher.ts
│   │   │   │   ├── git-scanner.ts
│   │   │   │   ├── terminal-capture.ts
│   │   │   │   ├── browser-capture.ts
│   │   │   │   └── event-bus.ts
│   │   │   ├── memory/
│   │   │   │   ├── brain-writer.ts
│   │   │   │   ├── brain-reader.ts
│   │   │   │   ├── retrieval.ts
│   │   │   │   └── schemas/
│   │   │   │       ├── overview.schema.ts
│   │   │   │       ├── intent.schema.ts
│   │   │   │       ├── architecture.schema.ts
│   │   │   │       ├── decisions.schema.ts
│   │   │   │       ├── changelog.schema.ts
│   │   │   │       ├── journey.schema.ts
│   │   │   │       ├── entities.schema.ts
│   │   │   │       └── media.schema.ts
│   │   │   ├── privacy/
│   │   │   │   ├── filter.ts
│   │   │   │   ├── redactor.ts
│   │   │   │   ├── ignore-parser.ts
│   │   │   │   └── trust-logger.ts
│   │   │   ├── intelligence/
│   │   │   │   ├── local-chat.ts
│   │   │   │   ├── bob-adapter.ts
│   │   │   │   ├── template-engine.ts
│   │   │   │   └── citation-builder.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── outputs/                        # Output generation
│   │   ├── src/
│   │   │   ├── generators/
│   │   │   │   ├── readme-generator.ts
│   │   │   │   ├── changelog-generator.ts
│   │   │   │   ├── explanation-generator.ts
│   │   │   │   ├── journey-generator.ts
│   │   │   │   └── abstract-generator.ts
│   │   │   ├── templates/
│   │   │   │   ├── readme.hbs
│   │   │   │   ├── changelog.hbs
│   │   │   │   ├── explanation.hbs
│   │   │   │   ├── journey.hbs
│   │   │   │   └── abstract.hbs
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── video/                          # Video generation
│   │   ├── src/
│   │   │   ├── storyboard/
│   │   │   │   ├── generator.ts
│   │   │   │   ├── scene-builder.ts
│   │   │   │   └── script-writer.ts
│   │   │   ├── renderer/
│   │   │   │   ├── remotion-config.ts
│   │   │   │   ├── scenes/
│   │   │   │   │   ├── IntroScene.tsx
│   │   │   │   │   ├── TimelineScene.tsx
│   │   │   │   │   ├── FeatureScene.tsx
│   │   │   │   │   ├── ArchitectureScene.tsx
│   │   │   │   │   ├── WalkthroughScene.tsx
│   │   │   │   │   └── OutroScene.tsx
│   │   │   │   ├── components/
│   │   │   │   │   ├── CodeBlock.tsx
│   │   │   │   │   ├── Screenshot.tsx
│   │   │   │   │   ├── Terminal.tsx
│   │   │   │   │   └── Timeline.tsx
│   │   │   │   └── Root.tsx
│   │   │   ├── narration/
│   │   │   │   ├── caption-generator.ts
│   │   │   │   └── tts-client.ts
│   │   │   ├── pipeline/
│   │   │   │   ├── video-pipeline.ts
│   │   │   │   ├── ffmpeg-wrapper.ts
│   │   │   │   └── thumbnail-generator.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── server/                         # Backend API
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── routes/
│   │   │   │   │   ├── memory.routes.ts
│   │   │   │   │   ├── chat.routes.ts
│   │   │   │   │   ├── outputs.routes.ts
│   │   │   │   │   ├── video.routes.ts
│   │   │   │   │   ├── trust.routes.ts
│   │   │   │   │   └── config.routes.ts
│   │   │   │   ├── controllers/
│   │   │   │   └── middleware/
│   │   │   ├── services/
│   │   │   │   ├── capture.service.ts
│   │   │   │   ├── memory.service.ts
│   │   │   │   ├── chat.service.ts
│   │   │   │   ├── output.service.ts
│   │   │   │   └── video.service.ts
│   │   │   ├── integrations/
│   │   │   │   ├── bob/
│   │   │   │   │   ├── bob-shell.adapter.ts
│   │   │   │   │   └── narrator-mode.ts
│   │   │   │   └── ibm/
│   │   │   │       ├── watsonx.client.ts
│   │   │   │       ├── tts.client.ts
│   │   │   │       ├── cloudant.client.ts
│   │   │   │       └── nlu.client.ts
│   │   │   ├── websocket/
│   │   │   │   └── events.ts
│   │   │   ├── config/
│   │   │   │   └── default.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui/                             # React frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── dashboard/
│       │   │   │   ├── Dashboard.tsx
│       │   │   │   ├── ProjectOverview.tsx
│       │   │   │   ├── QuickStats.tsx
│       │   │   │   └── RecentActivity.tsx
│       │   │   ├── timeline/
│       │   │   │   ├── Timeline.tsx
│       │   │   │   ├── TimelineEvent.tsx
│       │   │   │   ├── TimelineFilter.tsx
│       │   │   │   └── EventDetail.tsx
│       │   │   ├── chat/
│       │   │   │   ├── Chat.tsx
│       │   │   │   ├── MessageList.tsx
│       │   │   │   ├── MessageInput.tsx
│       │   │   │   ├── Citation.tsx
│       │   │   │   └── SourcePanel.tsx
│       │   │   ├── outputs/
│       │   │   │   ├── OutputPanel.tsx
│       │   │   │   ├── OutputList.tsx
│       │   │   │   ├── OutputPreview.tsx
│       │   │   │   └── OutputActions.tsx
│       │   │   ├── video/
│       │   │   │   ├── VideoStudio.tsx
│       │   │   │   ├── StoryboardEditor.tsx
│       │   │   │   ├── ScenePreview.tsx
│       │   │   │   └── RenderProgress.tsx
│       │   │   ├── trust/
│       │   │   │   ├── TrustCenter.tsx
│       │   │   │   ├── CaptureLog.tsx
│       │   │   │   ├── PrivacySettings.tsx
│       │   │   │   └── DataAudit.tsx
│       │   │   └── common/
│       │   │       ├── Layout.tsx
│       │   │       ├── Sidebar.tsx
│       │   │       └── Header.tsx
│       │   ├── hooks/
│       │   │   ├── useMemory.ts
│       │   │   ├── useChat.ts
│       │   │   ├── useOutputs.ts
│       │   │   └── useVideo.ts
│       │   ├── services/
│       │   │   └── api.service.ts
│       │   ├── store/
│       │   │   ├── memory.store.ts
│       │   │   ├── chat.store.ts
│       │   │   └── settings.store.ts
│       │   ├── types/
│       │   ├── App.tsx
│       │   └── index.tsx
│       ├── package.json
│       └── tsconfig.json
│
├── .bob/                               # Bob integration
│   ├── modes/
│   │   └── narrator.mode.json
│   ├── commands/
│   │   ├── init.json
│   │   ├── capture.json
│   │   ├── memory.json
│   │   ├── generate.json
│   │   ├── video.json
│   │   └── trust.json
│   └── instructions/
│       └── narrator-instructions.md
│
├── brain/                              # Project Brain (committed, sensitive files ignored)
│   ├── overview.md
│   ├── intent.md
│   ├── architecture.md
│   ├── decisions.md
│   ├── changelog.md
│   ├── journey.md
│   ├── entities.json
│   ├── media.json
│   └── captures/
│       ├── screenshots/
│       ├── terminal/
│       └── diffs/
│
├── outputs/                            # Generated outputs
│   ├── README_generated.md
│   ├── CHANGELOG_generated.md
│   ├── project_explanation.md
│   ├── journey_report.md
│   ├── abstract.html
│   ├── demo_script.md
│   ├── demo_storyboard.json
│   ├── demo_video.mp4
│   ├── demo_voiceover.wav
│   ├── demo_captions.srt
│   ├── demo_thumbnail.png
│   └── demo_sources.json
│
├── .afterignore
├── after.config.json
├── package.json
├── tsconfig.json
├── turbo.json
└── README.md
```

---

## 2. Backend Modules and Responsibilities

### Core Package (`@after/core`)

**Capture Layer**
- `file-watcher.ts`: Monitor file changes using chokidar
- `git-scanner.ts`: Scan git diffs and commits using simple-git
- `terminal-capture.ts`: Capture terminal output via node-pty
- `browser-capture.ts`: Capture approved screenshots via Playwright
- `event-bus.ts`: Central event system for all captures

**Memory Layer**
- `brain-writer.ts`: Write structured data to Project Brain files
- `brain-reader.ts`: Read and parse Project Brain files
- `retrieval.ts`: Local search using BM25 or Flexsearch
- `schemas/`: Zod schemas for all brain files

**Privacy Layer**
- `filter.ts`: Filter files based on .gitignore and .afterignore
- `redactor.ts`: Detect and redact secrets, tokens, keys
- `ignore-parser.ts`: Parse ignore files
- `trust-logger.ts`: Log all capture, block, and redaction actions

**Intelligence Layer**
- `local-chat.ts`: Local chat using retrieval + templates
- `bob-adapter.ts`: Adapter for Bob Shell integration
- `template-engine.ts`: Handlebars-based template system
- `citation-builder.ts`: Build citations from memory sources

### Outputs Package (`@after/outputs`)

**Generators**
- `readme-generator.ts`: Generate README from Project Brain
- `changelog-generator.ts`: Generate CHANGELOG from journey and commits
- `explanation-generator.ts`: Generate project explanation
- `journey-generator.ts`: Generate journey report
- `abstract-generator.ts`: Generate HTML abstract

**Templates**
- Handlebars templates for each output type
- Support for custom user templates

### Video Package (`@after/video`)

**Storyboard**
- `generator.ts`: Generate storyboard from Project Brain
- `scene-builder.ts`: Build scenes with timing and transitions
- `script-writer.ts`: Write narration script

**Renderer**
- `remotion-config.ts`: Remotion configuration
- `scenes/`: React components for each scene type
- `components/`: Reusable video components
- `Root.tsx`: Main Remotion composition

**Narration**
- `caption-generator.ts`: Generate SRT captions from script
- `tts-client.ts`: IBM Text to Speech client (optional)

**Pipeline**
- `video-pipeline.ts`: Orchestrate video generation
- `ffmpeg-wrapper.ts`: FFmpeg operations for composition
- `thumbnail-generator.ts`: Generate video thumbnail

### Server Package (`@after/server`)

**API Routes**
- `/api/memory/*`: CRUD operations on Project Brain
- `/api/chat`: Chat with memory (local/Bob/IBM Pro)
- `/api/outputs/*`: Generate and retrieve outputs
- `/api/video/*`: Video generation and status
- `/api/trust/*`: Trust Center logs and settings
- `/api/config/*`: Configuration management

**Services**
- `capture.service.ts`: Manage capture processes
- `memory.service.ts`: Memory operations
- `chat.service.ts`: Chat logic and retrieval
- `output.service.ts`: Output generation
- `video.service.ts`: Video pipeline orchestration

**Integrations**
- `bob/bob-shell.adapter.ts`: Bob Shell integration for chat
- `bob/narrator-mode.ts`: Bob Narrator Mode support
- `ibm/watsonx.client.ts`: watsonx.ai client (optional)
- `ibm/tts.client.ts`: IBM TTS client (optional)
- `ibm/cloudant.client.ts`: Cloudant sync (optional)
- `ibm/nlu.client.ts`: NLU enrichment (optional)

**WebSocket**
- `events.ts`: Real-time updates for UI

---

## 3. Frontend Screens and Components

### Dashboard Screen
- Project overview card
- Quick stats (files tracked, events captured, outputs generated)
- Recent activity feed
- Quick actions (capture, generate, chat)

### Timeline Screen
- Visual timeline of development journey
- Filter by event type (commits, features, decisions, captures)
- Event detail panel with context
- Search and navigation

### Chat Screen
- Message list with citations
- Message input with context awareness
- Source panel showing memory sources
- Mode indicator (Local/Bob/IBM Pro)

### Outputs Panel
- List of generated outputs
- Preview pane with syntax highlighting
- Regenerate and export actions
- Version history

### Video Studio
- Storyboard editor with scene list
- Scene preview
- Script editor
- Render progress and controls
- Export options

### Trust Center
- Capture log (captured, blocked, redacted)
- Privacy settings
- Data audit and export
- IBM Pro Mode configuration

---

## 4. Project Brain Schemas

### overview.md
```markdown
# Project Overview

**Name:** [project name]
**Description:** [brief description]
**Started:** [date]
**Last Updated:** [date]

## Purpose
[What problem does this solve?]

## Key Features
- [Feature 1]
- [Feature 2]

## Tech Stack
- [Technology 1]
- [Technology 2]
```

### intent.md
```markdown
# Project Intent

## Original Goal
[What was the original goal?]

## Current Status
[Where are we now?]

## Next Steps
- [ ] [Step 1]
- [ ] [Step 2]
```

### architecture.md
```markdown
# Architecture

## System Design
[High-level architecture description]

## Components
### [Component Name]
- **Purpose:** [description]
- **Dependencies:** [list]
- **Location:** [file path]

## Data Flow
[How data flows through the system]
```

### decisions.md
```markdown
# Architecture Decision Records

## [Decision Title] - [Date]
**Status:** [Proposed | Accepted | Deprecated]
**Context:** [What is the issue?]
**Decision:** [What did we decide?]
**Consequences:** [What are the implications?]

---
```

### changelog.md
```markdown
# Changelog

## [Version] - [Date]

### Added
- [New feature]

### Changed
- [Changed feature]

### Fixed
- [Bug fix]

---
```

### journey.md
```markdown
# Development Journey

## [Milestone] - [Date]
**Type:** [Feature | Bugfix | Refactor | Decision]
**Description:** [What happened?]
**Impact:** [What changed?]
**Files:** [List of affected files]
**Commits:** [Related commits]

---
```

### entities.json
```typescript
{
  "entities": [
    {
      "id": "uuid",
      "type": "file | function | class | component | api",
      "name": "entity name",
      "path": "file/path",
      "description": "what it does",
      "relationships": ["entity-id-1"],
      "firstSeen": "ISO date",
      "lastModified": "ISO date"
    }
  ]
}
```

### media.json
```typescript
{
  "media": [
    {
      "id": "uuid",
      "type": "screenshot | terminal | diagram",
      "path": "brain/captures/...",
      "timestamp": "ISO date",
      "context": "what was happening",
      "tags": ["tag1", "tag2"],
      "relatedEntities": ["entity-id"],
      "metadata": {
        "width": 1920,
        "height": 1080,
        "format": "png"
      }
    }
  ]
}
```

---

## 5. Bob Narrator Mode and Slash Commands

### Bob Narrator Mode

A custom Bob mode that monitors development and captures context.

**Mode Configuration** (`.bob/modes/narrator.mode.json`):
```json
{
  "slug": "narrator",
  "name": "📖 Narrator",
  "description": "Capture your development journey with After",
  "instructions": "narrator-instructions.md",
  "capabilities": [
    "capture_context",
    "ask_questions",
    "write_memory",
    "suggest_milestones"
  ]
}
```

**Narrator Instructions** (`.bob/instructions/narrator-instructions.md`):
- Monitor development activity
- Ask clarifying questions about decisions
- Capture context automatically
- Suggest when to capture milestones
- Help write decision records
- Generate commit messages with context

### Bob Slash Commands

**`/narrate`**
- Activate Bob Narrator Mode
- Begin capturing development context
- Monitor activity and ask clarifying questions

**`/snapshot [type]`**
- Types: `screenshot`, `terminal`, `decision`, `milestone`
- Capture specified type
- Apply privacy filter
- Write to Project Brain
- Log to Trust Center

**`/status [query]`**
- Search Project Brain using local retrieval
- Display results with context
- Show sources and citations

**`/readme`**
- Generate README from Project Brain
- Write to `outputs/README_generated.md`
- Show preview

**`/changelog`**
- Generate CHANGELOG from Project Brain
- Write to `outputs/CHANGELOG_generated.md`
- Show preview

**`/journey`**
- Generate journey report from Project Brain
- Write to `outputs/journey_report.md`
- Show preview

**`/abstract`**
- Generate HTML abstract from Project Brain
- Write to `outputs/abstract.html`
- Show preview

**`/demo [action]`**
- Actions: `storyboard`, `preview`, `render`
- `storyboard`: Generate demo storyboard from memory
- `preview`: Preview demo scenes
- `render`: Render demo video with captions

**`/video [action]`**
- Actions: `storyboard`, `preview`, `render`
- `storyboard`: Generate video storyboard
- `preview`: Preview video scenes
- `render`: Render video

**`/privacy-scan`**
- Scan for privacy issues
- Show Trust Center log
- Display blocked and redacted items

**`/verify-brain`**
- Verify Project Brain integrity
- Check for missing or corrupted files
- Validate schema compliance

### Backend CLI Commands

These are backend commands, not Bob slash commands:

**`after init`**
- Create `brain/` directory structure
- Create `.afterignore` file
- Create `after.config.json`
- Initialize Project Brain files with templates
- Start file watcher

**`after start`**
- Start After server
- Start file watcher
- Open UI in browser

**`after stop`**
- Stop After server
- Stop file watcher

---

## 6. Bob Shell Adapter for Local Chat

The Bob Shell adapter enhances local chat when Bob is available.

### Integration Flow

```typescript
// Local chat without Bob
async function localChat(query: string): Promise<Response> {
  const context = await retrieval.search(query);
  const response = templateEngine.apply('chat', { query, context });
  const citations = citationBuilder.build(context);
  return { response, citations };
}

// Enhanced chat with Bob Shell
async function bobChat(query: string): Promise<Response> {
  const context = await retrieval.search(query);
  const bobResponse = await bobShellAdapter.query({
    query,
    context,
    projectBrain: brain
  });
  const citations = citationBuilder.build(context);
  return { response: bobResponse, citations };
}
```

### Bob Shell Adapter

```typescript
class BobShellAdapter {
  async query(params: {
    query: string;
    context: MemoryContext[];
    projectBrain: ProjectBrain;
  }): Promise<string> {
    // Format context for Bob
    const formattedContext = this.formatContext(params.context);
    
    // Send to Bob Shell
    const response = await this.sendToBobShell({
      query: params.query,
      context: formattedContext,
      files: this.extractFiles(params.context)
    });
    
    return response;
  }
}
```

---

## 7. Local Output Generation

All output generators work locally without cloud credentials.

### Generator Pattern

```typescript
class ReadmeGenerator {
  async generate(brain: ProjectBrain): Promise<string> {
    // Read Project Brain
    const overview = await brain.read('overview.md');
    const architecture = await brain.read('architecture.md');
    const features = this.extractFeatures(overview);
    
    // Apply template
    const readme = templateEngine.apply('readme', {
      overview,
      architecture,
      features
    });
    
    // Add citations
    const cited = citationBuilder.addCitations(readme, [
      { source: 'overview.md', line: 1 },
      { source: 'architecture.md', line: 10 }
    ]);
    
    return cited;
  }
}
```

### Template System

Uses Handlebars for flexible, customizable templates:

```handlebars
# {{projectName}}

{{description}}

## Features

{{#each features}}
- {{this}}
{{/each}}

## Architecture

{{architecture}}

## Getting Started

{{gettingStarted}}

---

*Generated by After from Project Brain*
*Sources: {{#each sources}}{{this}}, {{/each}}*
```

---

## 8. IBM Pro Mode Integration

IBM Pro Mode is **optional** and enhances core functionality.

### Configuration

```typescript
interface IBMProConfig {
  enabled: boolean;
  watsonx?: {
    apiKey: string;
    projectId: string;
    model: string;
  };
  tts?: {
    apiKey: string;
    url: string;
    voice: string;
  };
  cloudant?: {
    enabled: boolean;
    url: string;
    apiKey: string;
  };
  nlu?: {
    enabled: boolean;
    apiKey: string;
    url: string;
  };
}
```

### Enhanced Chat with watsonx.ai

```typescript
async function ibmProChat(query: string): Promise<Response> {
  const context = await retrieval.search(query);
  
  // Send to watsonx.ai
  const watsonxResponse = await watsonxClient.chat({
    model: 'ibm/granite-13b-chat-v2',
    messages: [
      { role: 'system', content: 'You are a helpful assistant...' },
      { role: 'user', content: query }
    ],
    context: context
  });
  
  const citations = citationBuilder.build(context);
  return { response: watsonxResponse, citations };
}
```

### Enhanced Output Generation

```typescript
async function generateWithWatsonx(type: string): Promise<string> {
  const brain = await brainReader.readAll();
  const context = this.prepareContext(brain);
  
  // Use watsonx.ai for better generation
  const output = await watsonxClient.generate({
    prompt: `Generate a ${type} for this project:\n\n${context}`,
    model: 'ibm/granite-13b-chat-v2'
  });
  
  return output;
}
```

### IBM TTS for Narration

```typescript
async function generateNarration(script: string): Promise<string> {
  if (!ibmConfig.tts?.enabled) {
    // Skip narration, video will have captions only
    return null;
  }
  
  // Generate voiceover with IBM TTS
  const audio = await ttsClient.synthesize({
    text: script,
    voice: ibmConfig.tts.voice,
    accept: 'audio/wav'
  });
  
  await fs.writeFile('outputs/demo_voiceover.wav', audio);
  return 'outputs/demo_voiceover.wav';
}
```

---

## 9. Video Pipeline

The video pipeline generates a polished demo video from Project Brain.

### Pipeline Stages

1. **Storyboard Generation**
   - Analyze Project Brain
   - Identify key moments
   - Structure narrative arc
   - Generate scene list
   - Write narration script

2. **Scene Preparation**
   - Load media assets (screenshots, terminal clips)
   - Prepare code snippets
   - Format content
   - Calculate timing

3. **Caption Generation**
   - Parse script
   - Generate SRT captions
   - Calculate timing

4. **Video Rendering**
   - Render scenes with Remotion
   - Composite with FFmpeg
   - Burn in captions
   - Add silent audio track (if no TTS)
   - Generate thumbnail

5. **Optional Narration** (IBM Pro Mode)
   - Send script to IBM TTS
   - Download audio
   - Add voiceover to video

### Default Demo Video Structure

```
Scene 1: Hook (5-10s)
- Problem statement
- Why this matters

Scene 2: Introduction (10-15s)
- What is [project name]?
- Core value proposition

Scene 3: Journey Timeline (20-30s)
- Visual timeline
- Key milestones
- Development progression

Scene 4: Feature Highlights (30-45s)
- Feature 1 with screenshot
- Feature 2 with code
- Feature 3 with demo

Scene 5: Architecture (15-20s)
- System diagram
- Key components
- Data flow

Scene 6: Walkthrough (30-45s)
- Screenshots or demo
- User flow
- Key interactions

Scene 7: Generated Outputs (10-15s)
- Show README
- Show changelog
- Show documentation

Scene 8: Impact & CTA (10-15s)
- What was accomplished
- Next steps
- Call to action
```

### Output Files

```
outputs/
├── README_generated.md     # Generated README
├── CHANGELOG_generated.md  # Generated CHANGELOG
├── project_explanation.md  # Project explanation
├── journey_report.md       # Journey report
├── abstract.html           # HTML abstract
├── demo_script.md          # Narration script
├── demo_storyboard.json    # Scene definitions
├── demo_video.mp4          # Final video
├── demo_captions.srt       # Captions
├── demo_thumbnail.png      # Video thumbnail
├── demo_sources.json       # Memory sources used
└── demo_voiceover.wav      # Audio (if IBM TTS enabled)
```

---

## 10. Privacy and Trust System

### Privacy Filter Rules

1. **Respect .gitignore**
   - Parse .gitignore file
   - Block matching files

2. **Respect .afterignore**
   - Parse .afterignore file
   - Block matching files

3. **Block Sensitive Files**
   - `.env` files
   - Private keys
   - Certificates
   - Token files

4. **Redact Secrets**
   - API keys
   - Passwords
   - Tokens
   - Connection strings

5. **Terminal Redaction**
   - Detect secrets in output
   - Redact before saving

6. **Browser URL Validation**
   - Only capture approved URLs
   - Block by default

### Trust Center Logging

```typescript
interface TrustLogEntry {
  timestamp: string;
  action: 'captured' | 'blocked' | 'redacted';
  type: 'file' | 'terminal' | 'screenshot';
  path?: string;
  reason: string;
  details?: any;
}
```

All capture actions are logged for transparency and audit.

---

## 11. API Endpoints

### Memory API
```
GET    /api/memory/overview
GET    /api/memory/intent
GET    /api/memory/architecture
GET    /api/memory/decisions
GET    /api/memory/changelog
GET    /api/memory/journey
GET    /api/memory/entities
GET    /api/memory/media
POST   /api/memory/search
GET    /api/memory/timeline
POST   /api/memory/event
```

### Chat API
```
POST   /api/chat/message
GET    /api/chat/history
POST   /api/chat/clear
GET    /api/chat/sources/:messageId
```

### Outputs API
```
GET    /api/outputs
GET    /api/outputs/:type
POST   /api/outputs/generate
DELETE /api/outputs/:type
```

### Video API
```
POST   /api/video/storyboard
GET    /api/video/storyboard
PUT    /api/video/storyboard
POST   /api/video/render
GET    /api/video/status
DELETE /api/video/cancel
```

### Trust API
```
GET    /api/trust/log
GET    /api/trust/stats
GET    /api/trust/settings
PUT    /api/trust/settings
POST   /api/trust/audit
```

### Config API
```
GET    /api/config
PUT    /api/config
GET    /api/config/ibm
PUT    /api/config/ibm
POST   /api/config/ibm/test
```

---

## 12. Testing Strategy

### Unit Tests
- Core package: 90%+ coverage
- Outputs package: 85%+ coverage
- Video package: 80%+ coverage
- Server package: 85%+ coverage
- UI package: 75%+ coverage

### Integration Tests
- Capture flow end-to-end
- Memory write and retrieval
- Output generation pipeline
- Video generation pipeline
- API integration tests

### E2E Tests
- Full user workflows with Playwright
- Dashboard navigation
- Chat interactions
- Output generation
- Video studio workflow

---

## 13. First 5 Implementation Tasks

### Task 1: Project Scaffold and TypeScript Setup
**Goal:** Set up monorepo with all packages and TypeScript configuration

**Subtasks:**
1. Initialize monorepo with Turborepo
2. Create package structure (core, outputs, video, server, ui)
3. Set up TypeScript configs for all packages
4. Configure ESLint and Prettier
5. Set up testing infrastructure (Jest, React Testing Library)
6. Create package.json files with dependencies
7. Set up build scripts and dev workflows
8. Configure Vite for UI package

**Deliverables:**
- Working monorepo structure
- All packages buildable
- Tests runnable
- Dev server startable

**Estimated Time:** 1-2 days

---

### Task 2: Project Brain Schemas, Init Flow, Reader/Writer
**Goal:** Implement Project Brain file system and initialization

**Subtasks:**
1. Define Zod schemas for all brain files
2. Implement brain-writer.ts with file operations
3. Implement brain-reader.ts with parsing and validation
4. Create template files for initialization
5. Implement backend `after init` CLI command
6. Add schema validation
7. Write comprehensive unit tests

**Deliverables:**
- Working brain writer/reader
- Schema validation with Zod
- Init command functional
- Template system working
- 90%+ test coverage

**Estimated Time:** 2-3 days

---

### Task 3: Bob Narrator Mode and Slash Commands
**Goal:** Create Bob integration and command system

**Subtasks:**
1. Write narrator-instructions.md for Bob mode
2. Create narrator.mode.json configuration
3. Implement Bob slash command definitions
4. Create command handlers for /narrate, /snapshot, /status, /readme, etc.
5. Set up API endpoints for Bob commands
6. Test Bob mode integration
7. Document Bob slash command usage

**Deliverables:**
- Working Bob Narrator Mode
- Functional Bob slash commands
- /narrate, /snapshot, /status, /readme, /changelog commands working
- API endpoints tested
- Documentation complete

**Estimated Time:** 2-3 days

---

### Task 4: Capture Engine with Privacy Filter
**Goal:** Implement core capture mechanisms with privacy

**Subtasks:**
1. Implement ignore-parser.ts for .gitignore and .afterignore
2. Implement filter.ts for file filtering
3. Implement redactor.ts for secret detection and redaction
4. Implement trust-logger.ts for audit logging
5. Create event-bus.ts for capture events
6. Implement file-watcher.ts using chokidar
7. Implement git-scanner.ts using simple-git
8. Connect watchers to event bus
9. Apply privacy filter to all captures
10. Write captured data to Project Brain
11. Write comprehensive tests

**Deliverables:**
- Working privacy filter
- Secret redaction functional
- Trust logging working
- Event bus operational
- File watcher capturing changes
- Git scanner tracking commits
- Privacy-filtered captures
- Brain integration complete
- 90%+ test coverage

**Estimated Time:** 3-4 days

---

### Task 5: Local Dashboard and Timeline Slice
**Goal:** Create basic UI with dashboard and timeline

**Subtasks:**
1. Set up React app with Vite
2. Configure Tailwind CSS and Radix UI
3. Set up Zustand for state management
4. Create Layout, Sidebar, Header components
5. Implement Dashboard screen with project overview
6. Implement Timeline screen with event list
7. Create API service for backend communication
8. Set up WebSocket for real-time updates
9. Add loading states and error handling
10. Write component tests

**Deliverables:**
- Working React app
- Dashboard showing project overview
- Timeline showing captured events
- Real-time updates via WebSocket
- Responsive design
- 75%+ test coverage

**Estimated Time:** 3-4 days

---

## 14. Development Phases

### Phase 1: Foundation (Week 1-2)
- Tasks 1-5 above
- Basic capture and memory working
- Bob integration functional
- Privacy layer complete
- Basic UI operational

### Phase 2: Intelligence and Outputs (Week 3-4)
- Local retrieval system
- Bob Shell adapter for chat
- Output generators (README, changelog, etc.)
- Template system
- Citation builder
- Chat interface

### Phase 3: Video Pipeline (Week 5-6)
- Storyboard generator
- Remotion scene components
- Video rendering pipeline
- Caption generation
- FFmpeg compositor
- Video Studio UI

### Phase 4: IBM Pro Mode (Week 7-8)
- watsonx.ai integration
- IBM TTS integration
- Enhanced chat and generation
- Configuration UI
- Testing and validation

### Phase 5: Polish and Testing (Week 9-10)
- E2E testing
- Performance optimization
- Documentation
- Demo preparation
- Bug fixes and refinement

---

## 15. Success Criteria

The MVP is successful when:

1. **Capture Works**
   - File changes captured automatically
   - Git commits tracked
   - Terminal output captured
   - Screenshots taken
   - Privacy filter blocks sensitive data

2. **Memory Works**
   - Project Brain populated with structured data
   - Timeline shows development journey
   - Memory searchable and retrievable
   - Citations link to sources

3. **Outputs Work**
   - README generated from memory
   - Changelog generated from commits
   - Project explanation coherent
   - Journey report tells the story

4. **Chat Works**
   - Local chat answers questions from memory
   - Bob Shell enhances responses (when available)
   - Citations provided
   - IBM Pro Mode improves quality (when enabled)

5. **Video Works**
   - Storyboard generated from memory
   - Scenes render correctly
   - Captions generated
   - Video renders with or without narration
   - Final video is polished and professional

6. **Trust Works**
   - Capture log shows all actions
   - Privacy settings respected
   - Data auditable
   - Users feel in control

---

## 16. Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express.js
- **WebSocket:** ws
- **File Watching:** chokidar
- **Git:** simple-git
- **Terminal:** node-pty
- **Browser:** Playwright
- **Validation:** Zod

### Frontend
- **Framework:** React 18
- **Build:** Vite
- **Language:** TypeScript
- **State:** Zustand
- **Styling:** Tailwind CSS
- **Components:** Radix UI
- **Icons:** Lucide React

### Video
- **Rendering:** Remotion
- **Composition:** FFmpeg
- **Captions:** srt library

### Intelligence
- **Templates:** Handlebars
- **Search:** Flexsearch or Lunr.js

### Optional Integrations
- **Bob Shell:** When available
- **watsonx.ai:** IBM Pro Mode
- **IBM TTS:** IBM Pro Mode
- **IBM Cloudant:** IBM Cloud Mode
- **IBM NLU:** IBM Cloud Mode

---

## 17. Key Architectural Decisions

### Why Local-First?
- Works without internet
- No vendor lock-in
- Privacy by default
- Fast and responsive

### Why Hybrid Integration?
- Standalone app for flexibility
- Bob integration for seamless workflow
- Best of both worlds

### Why Remotion for Video?
- React-based (familiar)
- Programmatic generation
- Easy to customize
- Good documentation

### Why Handlebars for Templates?
- Simple and powerful
- Logic-less templates
- Easy to customize
- Good performance

### Why Optional IBM Services?
- Core works without cloud
- IBM enhances but doesn't enable
- User choice and control
- Graceful degradation

---

## Summary

This implementation plan provides a practical, MVP-focused roadmap for building After as a local-first developer tool with optional IBM enhancements. The plan prioritizes:

1. **Local-first architecture** - Core functionality works offline
2. **Hybrid integration** - Standalone app + Bob integration
3. **Privacy by default** - Strict filtering and user control
4. **Demo video as flagship** - Polished output from real memory
5. **Progressive enhancement** - Local → Bob → IBM Pro Mode

The first 5 tasks establish the foundation, and subsequent phases build out the full feature set. The MVP is successful when developers can capture their build journey, generate documentation, and create a professional demo video from real captured memory.