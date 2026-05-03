# After - System Architecture

## Overview

After is a hybrid, local-first developer tool that captures meaningful development moments, stores them in a local Project Brain, and generates outputs including a polished demo video.

**Core Principle:** Local-first by default. IBM services enhance but do not enable core functionality.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Environment                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   IDE    │  │ Terminal │  │ Browser  │  │   Git    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Capture Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ File Watcher │  │  Git Scanner │  │   Terminal   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Browser    │  │  Event Bus   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Privacy Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Filter    │  │   Redactor   │  │ Trust Logger │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Project Brain                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  overview.md  │  intent.md  │  architecture.md       │  │
│  │  decisions.md │  changelog.md │  journey.md          │  │
│  │  entities.json │  media.json                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Intelligence Layer                         │
│                                                               │
│  LOCAL MODE (default):                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Retrieval   │  │  Templates   │  │  Citations   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
│  BOB MODE (when available):                                  │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Bob Shell   │  │  Narrator    │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                               │
│  IBM PRO MODE (optional):                                    │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  watsonx.ai  │  │   IBM TTS    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Output Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    README    │  │  Changelog   │  │ Explanation  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Journey    │  │   Abstract   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Video Pipeline                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Storyboard  │  │   Remotion   │  │    FFmpeg    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Captions   │  │  Thumbnail   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │   Timeline   │  │     Chat     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Outputs    │  │Video Studio  │  │Trust Center  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Hybrid Integration Model

After works as both a standalone app and integrates with Bob:

### Standalone Mode
- Local web app (React + Express)
- File watcher runs in background
- UI accessible via browser
- All features work independently

### Bob Integration
- **Bob Narrator Mode**: Custom mode for capturing context
- **Bob Slash Commands**: `/narrate`, `/snapshot`, `/readme`, `/demo`, etc.
- **Bob Shell Adapter**: Enhances local chat with Bob's code understanding

### Integration Flow
```
Developer → Bob IDE → Bob slash command → After API → Project Brain
                                    ↓
Developer → After UI → Action → After API → Project Brain
                                    ↓
After Chat → Bob Shell (optional) → Enhanced Response
```

## Capture Flow

```
Event Triggered
    │
    ├─ File Change → File Watcher
    ├─ Git Commit → Git Scanner
    ├─ Terminal → Terminal Capture
    ├─ Screenshot → Browser Capture
    └─ Manual → Manual Capture
    │
    ▼
Privacy Filter
    │
    ├─ Check .gitignore
    ├─ Check .afterignore
    ├─ Detect secrets
    └─ Validate content
    │
    ├─ BLOCKED → Trust Logger → Trust Center
    ├─ REDACTED → Trust Logger → Trust Center
    └─ PASSED → Event Bus
    │
    ▼
Memory Writer
    │
    ▼
Project Brain
    │
    ├─ overview.md
    ├─ intent.md
    ├─ architecture.md
    ├─ decisions.md
    ├─ changelog.md
    ├─ journey.md
    ├─ entities.json
    └─ media.json
    │
    ▼
UI Update (WebSocket)
```

## Chat Architecture

### Local Mode (Default)
```
User Query
    │
    ▼
Local Retrieval
    │
    ├─ Search Project Brain
    ├─ Rank results
    └─ Extract context
    │
    ▼
Template Engine
    │
    ├─ Apply prompt template
    ├─ Insert context
    └─ Format response
    │
    ▼
Citation Builder
    │
    └─ Link to sources
    │
    ▼
Response to User
```

### Bob Mode (When Available)
```
User Query
    │
    ▼
Local Retrieval
    │
    ├─ Search Project Brain
    └─ Extract context
    │
    ▼
Bob Shell Adapter
    │
    ├─ Format for Bob
    ├─ Send to Bob Shell
    └─ Receive response
    │
    ▼
Citation Builder
    │
    └─ Link to sources
    │
    ▼
Enhanced Response to User
```

### IBM Pro Mode (Optional)
```
User Query
    │
    ▼
Local Retrieval
    │
    ├─ Search Project Brain
    └─ Extract context
    │
    ▼
watsonx.ai Client
    │
    ├─ Format for watsonx
    ├─ Send to IBM Cloud
    └─ Receive response
    │
    ▼
Citation Builder
    │
    └─ Link to sources
    │
    ▼
Enhanced Response to User
```

## Video Pipeline

```
Project Brain
    │
    ▼
Storyboard Generator
    │
    ├─ Analyze memory
    ├─ Extract key moments
    ├─ Structure narrative
    ├─ Generate scenes
    └─ Write script
    │
    ▼
Scene Preparation
    │
    ├─ Load screenshots
    ├─ Format terminal clips
    ├─ Prepare code snippets
    └─ Calculate timing
    │
    ▼
Caption Generation
    │
    ├─ Parse script
    ├─ Generate SRT
    └─ Calculate timing
    │
    ▼
Remotion Renderer
    │
    ├─ Render scenes
    ├─ Apply transitions
    └─ Export frames
    │
    ▼
FFmpeg Compositor
    │
    ├─ Composite video
    ├─ Burn captions
    ├─ Add silent audio (if no TTS)
    └─ Generate thumbnail
    │
    ▼
Output Files
    │
    ├─ demo_video.mp4
    ├─ demo_script.md
    ├─ demo_storyboard.json
    ├─ demo_captions.srt
    ├─ demo_thumbnail.png
    └─ demo_sources.json
```

### With IBM TTS (Optional)
```
Script
    │
    ▼
IBM TTS Client
    │
    ├─ Send to IBM Cloud
    ├─ Download audio
    └─ Save demo_voiceover.wav
    │
    ▼
FFmpeg Compositor
    │
    └─ Add voiceover to video
```

## Privacy Architecture

```
Input
    │
    ▼
.gitignore Check
    │
    ├─ Match → BLOCK
    └─ No match → Continue
    │
    ▼
.afterignore Check
    │
    ├─ Match → BLOCK
    └─ No match → Continue
    │
    ▼
Secret Detection
    │
    ├─ .env files → BLOCK
    ├─ API keys → REDACT
    ├─ Tokens → REDACT
    ├─ Certificates → BLOCK
    └─ Passwords → REDACT
    │
    ▼
Terminal Redaction
    │
    ├─ Detect secrets
    └─ Redact before save
    │
    ▼
Browser URL Check
    │
    ├─ Approved URLs → CAPTURE
    └─ Other URLs → BLOCK
    │
    ▼
Trust Logger
    │
    ├─ Log action
    ├─ Log reason
    └─ Log timestamp
    │
    ▼
Trust Center UI
```

## Bob Integration Architecture

### Bob Narrator Mode
```
Developer working in Bob
    │
    ▼
Narrator Mode Active
    │
    ├─ Monitors context
    ├─ Asks clarifying questions
    ├─ Captures decisions
    └─ Suggests milestones
    │
    ▼
After API
    │
    └─ Write to Project Brain
```

### Bob Slash Commands

```
/narrate
    │
    └─ Activate Bob Narrator Mode to capture context

/snapshot [type]
    │
    ├─ screenshot
    ├─ terminal
    ├─ decision
    └─ milestone

/status [query]
    │
    └─ Search Project Brain and display results

/readme
    │
    └─ Generate README from Project Brain

/changelog
    │
    └─ Generate CHANGELOG from Project Brain

/journey
    │
    └─ Generate journey report from Project Brain

/abstract
    │
    └─ Generate HTML abstract from Project Brain

/demo [action]
    │
    ├─ storyboard - Generate demo storyboard
    ├─ preview - Preview demo scenes
    └─ render - Render demo video

/video [action]
    │
    ├─ storyboard - Generate video storyboard
    ├─ preview - Preview video scenes
    └─ render - Render video

/privacy-scan
    │
    └─ Scan for privacy issues and show Trust Center log

/verify-brain
    │
    └─ Verify Project Brain integrity and completeness
```

### Backend CLI Commands

```
after init
    │
    ├─ Create brain/ directory
    ├─ Create .afterignore
    ├─ Initialize brain files
    └─ Start file watcher

after start
    │
    └─ Start After server and file watcher

after stop
    │
    └─ Stop After server and file watcher
```
### Bob Shell Adapter
```
After Chat Query
    │
    ▼
Check Bob Shell Available
    │
    ├─ Yes → Use Bob Shell
    └─ No → Use Local Templates
    │
    ▼
Format Context
    │
    ├─ Add Project Brain context
    ├─ Add file references
    └─ Add code snippets
    │
    ▼
Send to Bob Shell
    │
    ▼
Receive Enhanced Response
    │
    ▼
Add Citations
    │
    ▼
Return to User
```

## IBM Pro Mode Boundary

IBM Pro Mode is **optional** and **enhances** core functionality:

### Without IBM Pro Mode
- Local retrieval works
- Template-based responses work
- Bob Shell integration works (if available)
- Output generation works
- Video renders with captions (no voiceover)

### With IBM Pro Mode
- watsonx.ai enhances chat responses
- watsonx.ai improves output generation
- watsonx.ai enhances storyboard generation
- IBM TTS adds professional narration
- IBM Cloudant enables cloud sync (optional)
- IBM NLU enriches entity extraction (optional)

### Configuration
```json
{
  "ibm": {
    "enabled": false,
    "watsonx": {
      "apiKey": "",
      "projectId": "",
      "model": "ibm/granite-13b-chat-v2"
    },
    "tts": {
      "apiKey": "",
      "url": "",
      "voice": "en-US_AllisonV3Voice"
    }
  }
}
```

## Data Flow

### Capture to Memory
```
File Change → Watcher → Privacy Filter → Event Bus → Memory Writer → Brain
```

### Memory to Chat
```
Query → Retrieval → Context → Template/Bob/watsonx → Citations → Response
```

### Memory to Output
```
Brain → Generator → Template → Output File
```

### Memory to Video
```
Brain → Storyboard → Scenes → Remotion → FFmpeg → Video
```

## Component Responsibilities

### Core Package
- **Capture**: File watcher, git scanner, terminal capture, browser capture
- **Memory**: Brain reader/writer, schemas, retrieval
- **Privacy**: Filter, redactor, trust logger
- **Intelligence**: Local chat, Bob adapter, templates, citations

### Outputs Package
- **Generators**: README, changelog, explanation, journey, abstract
- **Templates**: Handlebars templates for each output type

### Video Package
- **Storyboard**: Scene generator, script writer
- **Renderer**: Remotion scenes, FFmpeg compositor
- **Narration**: Caption generator, TTS client (optional)

### Server Package
- **API**: Express routes for memory, chat, outputs, video, trust
- **Services**: Business logic layer
- **Integrations**: Bob Shell adapter, IBM clients (optional)

### UI Package
- **Dashboard**: Project overview, stats, recent activity
- **Timeline**: Visual journey, event details
- **Chat**: Message interface, citations, sources
- **Outputs**: Output list, preview, regenerate
- **Video Studio**: Storyboard editor, preview, render controls
- **Trust Center**: Capture log, privacy settings, audit

## Key Architectural Principles

1. **Local-First**: Core functionality works offline without cloud credentials
2. **Privacy by Default**: Strict filtering, redaction, and user control
3. **Progressive Enhancement**: Local → Bob → IBM Pro Mode
4. **Memory-Grounded**: All outputs cite Project Brain sources
5. **Modular Design**: Independent packages, clear boundaries
6. **Event-Driven**: Central event bus for loose coupling
7. **Hybrid Integration**: Standalone app + Bob integration

## Technology Stack

### Backend
- Node.js + TypeScript
- Express.js for API
- WebSocket for real-time updates
- Chokidar for file watching
- simple-git for git operations
- node-pty for terminal capture
- Playwright for browser capture

### Frontend
- React 18 + TypeScript
- Vite for build
- Zustand for state management
- Tailwind CSS for styling
- Radix UI for components

### Video
- Remotion for scene rendering
- FFmpeg for video composition
- SRT for captions

### Storage
- Local file system
- Markdown for human-readable memory
- JSON for structured data

### Optional Integrations
- Bob Shell (when available)
- watsonx.ai (IBM Pro Mode)
- IBM TTS (IBM Pro Mode)
- IBM Cloudant (IBM Cloud Mode)
- IBM NLU (IBM Cloud Mode)

## Security Considerations

### Privacy Filter
- Respect .gitignore and .afterignore
- Block .env files, keys, certificates
- Redact secrets in terminal output
- Validate browser URLs before capture

### Trust Center
- Log all capture actions
- Log all blocked actions
- Log all redacted content
- Provide audit trail
- Allow data export

### Configuration Security
- Store IBM credentials securely
- Never log credentials
- Never include credentials in outputs
- Validate credentials before use

## Extension Points

### Custom Capture Sources
- Implement capture interface
- Emit events to event bus
- Apply privacy filter
- Write to Project Brain

### Custom Output Generators
- Access Project Brain
- Use template engine
- Generate output file
- Register with output service

### Custom Video Scenes
- Create React component
- Accept props for content
- Use Remotion APIs
- Register with video pipeline

### Custom IBM Integrations
- Implement client interface
- Handle authentication
- Provide graceful fallback
- Register with integration service