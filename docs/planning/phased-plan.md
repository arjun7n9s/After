# After MVP - Phased Implementation Plan

## Overview

This document breaks down the After MVP implementation into 5 achievable phases over 10 weeks. Each phase builds on the previous one, delivering incremental value while maintaining focus on the flagship demo video feature.

## Phase Breakdown

### Phase 1: Foundation (Week 1-2) ✓ READY TO START
**Goal:** Establish core infrastructure, capture pipeline, and basic UI

**Duration:** 10-12 days

**Key Deliverables:**
- Working monorepo with all packages
- Project Brain file system operational
- Bob Narrator Mode integrated
- Privacy-filtered capture working
- Basic dashboard and timeline UI

---

## PHASE 1 DETAILED BREAKDOWN

### Task 1: Project Scaffold and TypeScript Setup (1-2 days)

**Objective:** Set up monorepo infrastructure with proper tooling

**Subtasks:**
1. Initialize Turborepo monorepo
   - Run `npx create-turbo@latest`
   - Configure turbo.json for build pipeline
   - Set up workspace dependencies

2. Create package structure
   ```
   packages/
   ├── core/          # Capture, memory, privacy, intelligence
   ├── outputs/       # Output generators and templates
   ├── video/         # Video pipeline and rendering
   ├── server/        # Express API and services
   └── ui/            # React frontend
   ```

3. Configure TypeScript
   - Root tsconfig.json with shared settings
   - Package-specific tsconfig.json files
   - Path aliases for clean imports
   - Strict mode enabled

4. Set up linting and formatting
   - ESLint with TypeScript rules
   - Prettier configuration
   - Pre-commit hooks with husky
   - Lint-staged for staged files

5. Configure testing infrastructure
   - Jest for unit tests
   - React Testing Library for UI tests
   - Coverage thresholds (90% for core)
   - Test scripts in package.json

6. Set up build scripts
   - Turborepo build pipeline
   - Watch mode for development
   - Clean and rebuild scripts
   - Type checking scripts

7. Configure Vite for UI package
   - Vite config with React plugin
   - Dev server with HMR
   - Build optimization
   - Environment variable handling

**Success Criteria:**
- ✅ All packages build without errors
- ✅ Tests run successfully
- ✅ Dev server starts on localhost
- ✅ TypeScript strict mode passes
- ✅ Linting passes on all files

**Files to Create:**
- `turbo.json`
- `package.json` (root)
- `packages/*/package.json`
- `packages/*/tsconfig.json`
- `.eslintrc.js`
- `.prettierrc`
- `jest.config.js`

---

### Task 2: Project Brain Schemas, Init Flow, Reader/Writer (2-3 days)

**Objective:** Implement Project Brain file system with validation

**Subtasks:**
1. Define Zod schemas
   - `schemas/overview.schema.ts` - Project metadata
   - `schemas/intent.schema.ts` - Goals and requirements
   - `schemas/architecture.schema.ts` - Technical decisions
   - `schemas/decisions.schema.ts` - Decision log entries
   - `schemas/changelog.schema.ts` - Change entries
   - `schemas/journey.schema.ts` - Development timeline
   - `schemas/entities.schema.ts` - Extracted entities
   - `schemas/media.schema.ts` - Media references

2. Implement brain-writer.ts
   ```typescript
   class BrainWriter {
     async writeOverview(data: Overview): Promise<void>
     async appendDecision(decision: Decision): Promise<void>
     async appendChange(change: ChangeEntry): Promise<void>
     async appendJourneyEntry(entry: JourneyEntry): Promise<void>
     async updateEntities(entities: Entity[]): Promise<void>
     async addMedia(media: MediaItem): Promise<void>
   }
   ```

3. Implement brain-reader.ts
   ```typescript
   class BrainReader {
     async readOverview(): Promise<Overview>
     async readIntent(): Promise<Intent>
     async readArchitecture(): Promise<Architecture>
     async readDecisions(): Promise<Decision[]>
     async readChangelog(): Promise<ChangeEntry[]>
     async readJourney(): Promise<JourneyEntry[]>
     async readEntities(): Promise<Entity[]>
     async readMedia(): Promise<MediaItem[]>
     async search(query: string): Promise<SearchResult[]>
   }
   ```

4. Create initialization templates
   - `templates/overview.md.hbs`
   - `templates/intent.md.hbs`
   - `templates/architecture.md.hbs`
   - `templates/decisions.md.hbs`
   - `templates/changelog.md.hbs`
   - `templates/journey.md.hbs`
   - `templates/entities.json.hbs`
   - `templates/media.json.hbs`

5. Implement `after init` CLI command
   ```typescript
   // packages/server/src/cli/init.ts
   async function initProject(projectPath: string) {
     // Create brain/ directory
     // Copy templates
     // Initialize brain files
     // Create .afterignore
     // Start file watcher
   }
   ```

6. Add schema validation
   - Validate on read
   - Validate on write
   - Provide helpful error messages
   - Handle migration if schema changes

7. Write comprehensive unit tests
   - Test each schema
   - Test reader methods
   - Test writer methods
   - Test validation
   - Test error handling
   - Aim for 90%+ coverage

**Success Criteria:**
- ✅ `after init` creates brain/ directory
- ✅ All brain files validate against schemas
- ✅ Reader can parse all brain files
- ✅ Writer can update all brain files
- ✅ 90%+ test coverage
- ✅ No TypeScript errors

**Files to Create:**
- `packages/core/src/schemas/*.schema.ts` (8 files)
- `packages/core/src/memory/brain-writer.ts`
- `packages/core/src/memory/brain-reader.ts`
- `packages/core/src/templates/*.hbs` (8 files)
- `packages/server/src/cli/init.ts`
- `packages/core/src/memory/__tests__/*.test.ts`

---

### Task 3: Bob Narrator Mode and Slash Commands (2-3 days)

**Objective:** Create Bob integration with slash commands

**Subtasks:**
1. Write narrator-instructions.md
   ```markdown
   # Bob Narrator Mode
   
   You are Bob in Narrator Mode, helping developers capture their development journey.
   
   ## Your Role
   - Monitor development context
   - Ask clarifying questions about decisions
   - Capture key moments and milestones
   - Suggest when to take snapshots
   
   ## Available Commands
   /narrate - Activate narrator mode
   /snapshot [type] - Capture a moment
   /status [query] - Search project brain
   ...
   ```

2. Create narrator.mode.json
   ```json
   {
     "slug": "narrator",
     "name": "🎬 Narrator",
     "description": "Capture your development journey",
     "instructions_file": "narrator-instructions.md",
     "allowed_file_patterns": ["brain/**/*"],
     "tools": ["read_file", "write_to_file", "execute_command"]
   }
   ```

3. Implement Bob slash command definitions
   ```typescript
   // .bob/commands/narrate.ts
   export const narrateCommand = {
     name: 'narrate',
     description: 'Activate Bob Narrator Mode',
     handler: async () => {
       // Switch to narrator mode
       // Start capturing context
     }
   }
   ```

4. Create command handlers
   - `/narrate` - Activate narrator mode
   - `/snapshot [type]` - Capture screenshot/terminal/decision/milestone
   - `/status [query]` - Search Project Brain
   - `/readme` - Generate README
   - `/changelog` - Generate CHANGELOG
   - `/journey` - Generate journey report
   - `/abstract` - Generate HTML abstract
   - `/demo [action]` - Demo video actions
   - `/video [action]` - Video actions
   - `/privacy-scan` - Scan for privacy issues
   - `/verify-brain` - Verify brain integrity

5. Set up API endpoints
   ```typescript
   // packages/server/src/routes/bob.ts
   router.post('/api/bob/narrate', narrateHandler)
   router.post('/api/bob/snapshot', snapshotHandler)
   router.get('/api/bob/status', statusHandler)
   router.post('/api/bob/readme', readmeHandler)
   // ... etc
   ```

6. Test Bob mode integration
   - Test each slash command
   - Test API endpoints
   - Test error handling
   - Test with actual Bob IDE

7. Document Bob slash command usage
   - Create usage examples
   - Document expected behavior
   - Add troubleshooting guide

**Success Criteria:**
- ✅ Bob Narrator Mode activates successfully
- ✅ All slash commands work
- ✅ API endpoints respond correctly
- ✅ Commands write to Project Brain
- ✅ Documentation complete

**Files to Create:**
- `.bob/modes/narrator/narrator-instructions.md`
- `.bob/modes/narrator/narrator.mode.json`
- `.bob/commands/*.ts` (11 command files)
- `packages/server/src/routes/bob.ts`
- `packages/server/src/handlers/bob/*.ts`
- `docs/BOB_INTEGRATION.md`

---

### Task 4: Capture Engine with Privacy Filter (3-4 days)

**Objective:** Implement privacy-first capture pipeline

**Subtasks:**
1. Implement ignore-parser.ts
   ```typescript
   class IgnoreParser {
     parseGitignore(path: string): string[]
     parseAfterignore(path: string): string[]
     isIgnored(filePath: string): boolean
   }
   ```

2. Implement filter.ts
   ```typescript
   class PrivacyFilter {
     shouldCapture(filePath: string): FilterResult
     shouldBlock(content: string): FilterResult
     getBlockReason(filePath: string): string
   }
   ```

3. Implement redactor.ts
   ```typescript
   class Redactor {
     detectSecrets(content: string): Secret[]
     redactSecrets(content: string): string
     redactApiKeys(content: string): string
     redactTokens(content: string): string
     redactPasswords(content: string): string
   }
   ```

4. Implement trust-logger.ts
   ```typescript
   class TrustLogger {
     logCapture(event: CaptureEvent): void
     logBlock(event: BlockEvent): void
     logRedaction(event: RedactionEvent): void
     getAuditLog(): AuditEntry[]
     exportLog(format: 'json' | 'csv'): string
   }
   ```

5. Create event-bus.ts
   ```typescript
   class EventBus {
     emit(event: CaptureEvent): void
     on(eventType: string, handler: EventHandler): void
     off(eventType: string, handler: EventHandler): void
   }
   ```

6. Implement file-watcher.ts
   ```typescript
   class FileWatcher {
     start(projectPath: string): void
     stop(): void
     on(event: 'change' | 'add' | 'unlink', handler: FileEventHandler): void
   }
   ```

7. Implement git-scanner.ts
   ```typescript
   class GitScanner {
     scanCommits(since?: Date): Commit[]
     getCommitDiff(commitHash: string): Diff
     getCurrentBranch(): string
     getRecentCommits(count: number): Commit[]
   }
   ```

8. Connect watchers to event bus
   - File watcher emits file events
   - Git scanner emits commit events
   - Event bus routes to handlers

9. Apply privacy filter to all captures
   - Check ignore rules
   - Detect secrets
   - Redact sensitive content
   - Log all actions

10. Write captured data to Project Brain
    - Route events to brain writer
    - Update appropriate brain files
    - Maintain data integrity

11. Write comprehensive tests
    - Test ignore parsing
    - Test secret detection
    - Test redaction
    - Test trust logging
    - Test event bus
    - Test file watcher
    - Test git scanner
    - Aim for 90%+ coverage

**Success Criteria:**
- ✅ File changes captured automatically
- ✅ Git commits tracked
- ✅ Secrets detected and redacted
- ✅ .gitignore and .afterignore respected
- ✅ Trust Center logs all actions
- ✅ Captured data written to brain
- ✅ 90%+ test coverage

**Files to Create:**
- `packages/core/src/privacy/ignore-parser.ts`
- `packages/core/src/privacy/filter.ts`
- `packages/core/src/privacy/redactor.ts`
- `packages/core/src/privacy/trust-logger.ts`
- `packages/core/src/capture/event-bus.ts`
- `packages/core/src/capture/file-watcher.ts`
- `packages/core/src/capture/git-scanner.ts`
- `packages/core/src/capture/__tests__/*.test.ts`
- `packages/core/src/privacy/__tests__/*.test.ts`

---

### Task 5: Local Dashboard and Timeline Slice (3-4 days)

**Objective:** Create functional UI with real-time updates

**Subtasks:**
1. Set up React app with Vite
   - Initialize React + TypeScript
   - Configure Vite
   - Set up routing with React Router
   - Configure environment variables

2. Configure Tailwind CSS and Radix UI
   - Install and configure Tailwind
   - Set up Radix UI components
   - Create design tokens
   - Set up dark mode support

3. Set up Zustand for state management
   ```typescript
   // stores/app-store.ts
   interface AppState {
     project: Project | null
     events: CaptureEvent[]
     isConnected: boolean
     setProject: (project: Project) => void
     addEvent: (event: CaptureEvent) => void
   }
   ```

4. Create Layout, Sidebar, Header components
   ```
   components/
   ├── Layout.tsx
   ├── Sidebar.tsx
   ├── Header.tsx
   ├── Navigation.tsx
   └── StatusIndicator.tsx
   ```

5. Implement Dashboard screen
   ```typescript
   // screens/Dashboard.tsx
   - Project overview card
   - Recent activity feed
   - Quick stats (files captured, commits, etc.)
   - Quick actions (generate README, etc.)
   ```

6. Implement Timeline screen
   ```typescript
   // screens/Timeline.tsx
   - Chronological event list
   - Event type filters
   - Event detail view
   - Search functionality
   ```

7. Create API service
   ```typescript
   // services/api.ts
   class ApiService {
     async getProject(): Promise<Project>
     async getEvents(): Promise<CaptureEvent[]>
     async getEvent(id: string): Promise<CaptureEvent>
     async searchBrain(query: string): Promise<SearchResult[]>
   }
   ```

8. Set up WebSocket for real-time updates
   ```typescript
   // services/websocket.ts
   class WebSocketService {
     connect(): void
     disconnect(): void
     on(event: string, handler: MessageHandler): void
     emit(event: string, data: any): void
   }
   ```

9. Add loading states and error handling
   - Loading skeletons
   - Error boundaries
   - Toast notifications
   - Retry logic

10. Write component tests
    - Test Dashboard rendering
    - Test Timeline rendering
    - Test WebSocket updates
    - Test error states
    - Aim for 75%+ coverage

**Success Criteria:**
- ✅ React app runs on localhost:5173
- ✅ Dashboard shows project overview
- ✅ Timeline shows captured events
- ✅ Real-time updates work via WebSocket
- ✅ Responsive design works on mobile
- ✅ 75%+ test coverage

**Files to Create:**
- `packages/ui/src/App.tsx`
- `packages/ui/src/components/*.tsx` (5+ files)
- `packages/ui/src/screens/Dashboard.tsx`
- `packages/ui/src/screens/Timeline.tsx`
- `packages/ui/src/stores/app-store.ts`
- `packages/ui/src/services/api.ts`
- `packages/ui/src/services/websocket.ts`
- `packages/ui/src/__tests__/*.test.tsx`
- `packages/ui/tailwind.config.js`

---

## Phase 1 Summary

**Total Duration:** 10-12 days

**Total Files to Create:** ~80-100 files

**Key Milestones:**
1. ✅ Monorepo builds successfully
2. ✅ Project Brain operational
3. ✅ Bob integration working
4. ✅ Capture pipeline functional
5. ✅ Basic UI accessible

**Phase 1 Completion Criteria:**
- Developer can run `after init` to initialize a project
- File watcher captures changes automatically
- Git scanner tracks commits
- Privacy filter blocks/redacts sensitive data
- Bob slash commands work in IDE
- Dashboard shows project overview
- Timeline shows captured events
- Real-time updates work

**Ready for Phase 2:** ✅ YES - Once Phase 1 complete

---

## PHASE 2: Intelligence and Outputs (Week 3-4)

**Goal:** Add local intelligence and output generation

**Duration:** 8-10 days

**Key Features:**
- Local retrieval system for Project Brain search
- Bob Shell adapter for enhanced chat
- Output generators (README, changelog, journey, abstract)
- Template system with Handlebars
- Citation builder for provenance
- Chat interface in UI

**Major Tasks:**
1. Implement local retrieval with ranking
2. Create Bob Shell adapter
3. Build output generators
4. Create Handlebars templates
5. Implement citation system
6. Build chat UI with citations

**Deliverables:**
- Working chat with local intelligence
- README generator functional
- Changelog generator functional
- Journey report generator functional
- Abstract generator functional
- All outputs cite sources

---

## PHASE 3: Video Pipeline (Week 5-6)

**Goal:** Implement flagship demo video feature

**Duration:** 10-12 days

**Key Features:**
- Storyboard generator from Project Brain
- Remotion scene components
- Video rendering pipeline
- Caption generation (SRT format)
- FFmpeg compositor
- Video Studio UI

**Major Tasks:**
1. Build storyboard generator
2. Create Remotion scene components
3. Implement video rendering
4. Generate captions
5. Composite with FFmpeg
6. Build Video Studio UI

**Deliverables:**
- Demo video renders successfully
- Captions burned into video
- Thumbnail generated
- Video Studio UI functional
- All video outputs created

---

## PHASE 4: IBM Pro Mode (Week 7-8)

**Goal:** Add optional IBM service enhancements

**Duration:** 8-10 days

**Key Features:**
- watsonx.ai integration for chat
- watsonx.ai for output generation
- IBM TTS for video narration
- Configuration UI
- Graceful fallbacks

**Major Tasks:**
1. Implement watsonx.ai client
2. Enhance chat with watsonx.ai
3. Enhance outputs with watsonx.ai
4. Implement IBM TTS client
5. Add narration to video
6. Build configuration UI

**Deliverables:**
- watsonx.ai enhances chat
- watsonx.ai improves outputs
- IBM TTS adds voiceover
- Configuration UI works
- Fallbacks tested

---

## PHASE 5: Polish and Testing (Week 9-10)

**Goal:** Finalize for demo and submission

**Duration:** 8-10 days

**Key Activities:**
- E2E testing with Playwright
- Performance optimization
- Documentation completion
- Demo preparation
- Bug fixes and refinement
- Hackathon submission prep

**Major Tasks:**
1. Write E2E tests
2. Optimize performance
3. Complete documentation
4. Create demo project
5. Record demo video
6. Prepare submission

**Deliverables:**
- E2E tests passing
- Performance optimized
- Documentation complete
- Demo video ready
- Submission package ready

---

## Success Metrics

### Phase 1 Success
- ✅ All 5 tasks complete
- ✅ 90%+ test coverage on core
- ✅ 75%+ test coverage on UI
- ✅ Zero TypeScript errors
- ✅ All linting passes

### Overall MVP Success
- ✅ Demo video renders in <5 minutes
- ✅ Privacy filter blocks 100% of secrets
- ✅ Bob integration seamless
- ✅ UI responsive and fast
- ✅ Documentation complete
- ✅ Ready for hackathon submission

---

## Risk Mitigation

### Technical Risks
1. **Video rendering performance**
   - Mitigation: Use Remotion's optimization features
   - Fallback: Reduce video quality/length

2. **Privacy filter accuracy**
   - Mitigation: Comprehensive test suite
   - Fallback: Conservative blocking

3. **Bob integration complexity**
   - Mitigation: Start simple, iterate
   - Fallback: Standalone mode works fully

### Schedule Risks
1. **Phase overruns**
   - Mitigation: Daily progress tracking
   - Fallback: Reduce scope of later phases

2. **Dependency issues**
   - Mitigation: Lock versions early
   - Fallback: Alternative libraries ready

---

## Next Steps

1. **Review this plan** - Confirm approach and timeline
2. **Approve Phase 1** - Get sign-off to proceed
3. **Begin Task 1.1** - Initialize Turborepo
4. **Daily standups** - Track progress
5. **Weekly reviews** - Adjust as needed

---

## Questions for Stakeholders

1. Is the 10-week timeline acceptable?
2. Are the Phase 1 deliverables sufficient for a checkpoint?
3. Should we prioritize any specific features?
4. Are there any additional requirements?
5. What is the hackathon submission deadline?

---

**Status:** ✅ READY FOR REVIEW AND APPROVAL

**Next Action:** Await stakeholder approval to begin Phase 1, Task 1.1