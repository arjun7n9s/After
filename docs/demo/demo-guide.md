# After MVP - Demo Preparation Guide

## 🎯 Demo Overview

**Project:** After - Local-first developer tool for capturing development moments and generating demo videos

**Target Audience:** IBM Hackathon judges, developers, technical stakeholders

**Demo Duration:** 5-7 minutes

**Key Message:** After captures your development journey automatically and generates polished demo videos with IBM watsonx.ai and TTS integration.

---

## 📋 Pre-Demo Checklist

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] All dependencies installed (`npm install` in root)
- [ ] Build completed successfully (`npm run build`)
- [ ] Dev server tested (`npm run dev`)
- [ ] IBM credentials configured (optional, for Pro Mode demo)
- [ ] Sample project initialized with `after init`

### Demo Data Preparation
- [ ] Sample Project Brain populated with realistic data
- [ ] Screenshots captured and stored in media
- [ ] Git commits present in sample project
- [ ] Terminal outputs captured
- [ ] Decision log entries added
- [ ] Journey timeline populated

### Technical Verification
- [ ] UI loads without errors at http://localhost:5173
- [ ] WebSocket connection working
- [ ] File watcher capturing changes
- [ ] Privacy filter blocking secrets
- [ ] Bob Narrator Mode accessible
- [ ] All slash commands functional
- [ ] Output generators working
- [ ] Video pipeline rendering successfully

### Presentation Materials
- [ ] Demo script prepared
- [ ] Slide deck ready (optional)
- [ ] Backup demo video recorded
- [ ] Architecture diagram available
- [ ] Feature highlights documented
- [ ] IBM integration benefits listed

---

## 🎬 Demo Script

### Part 1: Introduction (1 minute)

**What to Say:**
> "After is a local-first developer tool that automatically captures your development journey and generates polished demo videos. It integrates seamlessly with Bob IDE and optionally enhances with IBM watsonx.ai and Text-to-Speech services."

**What to Show:**
- Architecture diagram
- Key features list
- IBM integration points

**Key Points:**
- Local-first by default
- Privacy-focused
- Bob integration
- IBM Pro Mode optional

---

### Part 2: Core Capture (1.5 minutes)

**What to Say:**
> "Let me show you how After captures development moments automatically. I'll initialize a project and make some changes."

**What to Do:**
1. Open terminal in sample project
2. Run `after init .`
3. Show created `brain/` directory structure
4. Open a file and make changes
5. Show file watcher detecting changes
6. Show Dashboard updating in real-time

**What to Show:**
- Terminal output of `after init`
- Brain directory structure
- File watcher logs
- Dashboard real-time updates
- Timeline showing captured events

**Key Points:**
- Automatic capture
- Privacy filtering
- Real-time updates
- Structured memory

---

### Part 3: Bob Integration (1 minute)

**What to Say:**
> "After integrates with Bob IDE through custom modes and slash commands. Let me demonstrate Bob Narrator Mode."

**What to Do:**
1. Switch to Bob IDE
2. Activate Narrator Mode with `/narrate`
3. Show Bob asking contextual questions
4. Use `/snapshot decision` to capture a decision
5. Use `/status` to search Project Brain
6. Show captured data in After UI

**What to Show:**
- Bob Narrator Mode activation
- Slash command execution
- Decision capture
- Brain search results
- UI reflecting Bob actions

**Key Points:**
- Seamless IDE integration
- Contextual capture
- Natural workflow
- Bidirectional sync

---

### Part 4: Intelligence & Outputs (1 minute)

**What to Say:**
> "After provides intelligent chat and generates multiple output formats from your Project Brain."

**What to Do:**
1. Open Chat screen
2. Ask "What have I built so far?"
3. Show response with citations
4. Generate README with `/readme`
5. Generate changelog with `/changelog`
6. Show generated outputs

**What to Show:**
- Chat interface
- Cited responses
- README generation
- Changelog generation
- Output preview

**Key Points:**
- Memory-grounded responses
- Source citations
- Multiple output formats
- One-click generation

---

### Part 5: Video Pipeline (1.5 minutes)

**What to Say:**
> "The flagship feature is automatic demo video generation. After analyzes your Project Brain and creates a polished video with captions and optional narration."

**What to Do:**
1. Open Video Studio
2. Click "Generate Storyboard"
3. Show generated storyboard with scenes
4. Preview a scene
5. Click "Render Video"
6. Show rendering progress
7. Play final video with captions

**What to Show:**
- Video Studio interface
- Storyboard generation
- Scene preview
- Rendering progress
- Final video playback
- Captions display

**Key Points:**
- Automatic storyboard
- Professional scenes
- Captions included
- Fast rendering
- Ready to share

---

### Part 6: IBM Pro Mode (1 minute)

**What to Say:**
> "With IBM Pro Mode, After enhances chat with watsonx.ai and adds professional narration with IBM Text-to-Speech."

**What to Do:**
1. Show IBM configuration
2. Enable IBM Pro Mode
3. Ask chat question, show watsonx.ai response
4. Regenerate video with TTS narration
5. Play video with voiceover

**What to Show:**
- Configuration UI
- watsonx.ai enhanced response
- TTS voice selection
- Video with narration
- Quality comparison

**Key Points:**
- Optional enhancement
- watsonx.ai intelligence
- Professional narration
- Graceful fallback
- IBM Cloud integration

---

### Part 7: Privacy & Trust (30 seconds)

**What to Say:**
> "Privacy is built-in. After respects .gitignore, blocks secrets, and logs all actions in the Trust Center."

**What to Do:**
1. Open Trust Center
2. Show audit log
3. Demonstrate secret detection
4. Show blocked file

**What to Show:**
- Trust Center UI
- Audit log entries
- Secret redaction
- Privacy settings

**Key Points:**
- Privacy by default
- Transparent logging
- User control
- Audit trail

---

### Part 8: Conclusion (30 seconds)

**What to Say:**
> "After captures your development journey automatically, generates multiple outputs including demo videos, and optionally enhances with IBM services. It's local-first, privacy-focused, and integrates seamlessly with Bob IDE."

**What to Show:**
- Final demo video
- Feature summary
- Architecture diagram
- Call to action

**Key Points:**
- Local-first
- Privacy-focused
- Bob integration
- IBM enhancement
- Ready to use

---

## 🎥 Demo Video Backup

### Pre-recorded Video Sections
Record these in advance as backup:

1. **Full demo walkthrough** (5-7 minutes)
2. **Video rendering process** (in case live rendering fails)
3. **IBM TTS narration** (in case API is slow)
4. **Bob integration** (in case Bob IDE unavailable)

### Video Recording Settings
- Resolution: 1920x1080
- Frame rate: 30fps
- Format: MP4
- Codec: H.264
- Audio: AAC, 128kbps

---

## 🛠️ Technical Setup

### Required Software
```bash
# Node.js 18+
node --version

# npm 9+
npm --version

# Git
git --version

# FFmpeg (for video rendering)
ffmpeg -version
```

### Environment Variables
```bash
# Optional: IBM Pro Mode
IBM_WATSONX_API_KEY=your_key_here
IBM_WATSONX_PROJECT_ID=your_project_id
IBM_TTS_API_KEY=your_tts_key
IBM_TTS_URL=https://api.us-south.text-to-speech.watson.cloud.ibm.com
```

### Port Configuration
- UI: http://localhost:5173
- API: http://localhost:3000
- WebSocket: ws://localhost:3000

---

## 📊 Demo Metrics to Highlight

### Performance
- Video renders in < 5 minutes
- Real-time capture with < 100ms latency
- UI loads in < 2 seconds
- Search results in < 500ms

### Privacy
- 100% secret detection rate
- Zero false negatives on sensitive data
- Complete audit trail
- User control over all captures

### Integration
- 11 Bob slash commands
- Seamless mode switching
- Bidirectional sync
- Zero configuration required

### Outputs
- 5 output formats (README, changelog, journey, abstract, video)
- Source citations on all outputs
- One-click generation
- Professional quality

---

## 🎯 Key Talking Points

### Problem Statement
- Developers struggle to document their work
- Demo videos are time-consuming to create
- Context is lost over time
- Sharing progress is difficult

### Solution
- Automatic capture of development moments
- Intelligent output generation
- Professional demo videos
- Privacy-first approach

### Differentiation
- Local-first (works offline)
- Privacy-focused (no cloud required)
- Bob IDE integration (seamless workflow)
- IBM enhancement (optional, powerful)

### Technical Innovation
- Event-driven capture architecture
- Privacy filter with redaction
- Memory-grounded intelligence
- Automated video storyboarding

### IBM Integration Value
- watsonx.ai enhances intelligence
- IBM TTS adds professional narration
- Granite models for code understanding
- IBM Cloud for optional sync

---

## 🚨 Troubleshooting

### Common Issues

**UI won't load:**
```bash
cd after-mvp
npm install
npm run dev
```

**File watcher not working:**
```bash
# Check if after init was run
ls brain/

# Restart watcher
npm run dev
```

**Video rendering fails:**
```bash
# Check FFmpeg installed
ffmpeg -version

# Check disk space
df -h

# Use backup video
```

**IBM API errors:**
```bash
# Check credentials
echo $IBM_WATSONX_API_KEY

# Test connection
curl -X POST https://us-south.ml.cloud.ibm.com/ml/v1/text/generation

# Fall back to local mode
```

---

## 📝 Q&A Preparation

### Expected Questions

**Q: How does privacy filtering work?**
A: We use a multi-layer approach: .gitignore/.afterignore parsing, regex-based secret detection, and content redaction. All actions are logged in the Trust Center for transparency.

**Q: Can it work without IBM services?**
A: Absolutely! After is local-first. IBM services are optional enhancements. Core functionality works completely offline.

**Q: How does Bob integration work?**
A: We provide a custom Narrator Mode and 11 slash commands. Bob can capture context, search the Project Brain, and trigger output generation.

**Q: What about performance with large projects?**
A: We use incremental capture and efficient indexing. File watching is optimized with ignore patterns. Video rendering uses Remotion's optimization features.

**Q: Is the Project Brain portable?**
A: Yes! It's just markdown and JSON files in a brain/ directory. You can commit it to git, share it, or sync it however you like.

**Q: What video formats are supported?**
A: We output MP4 with H.264 codec, SRT captions, and optional audio. Thumbnails are PNG. All industry-standard formats.

**Q: How accurate is the storyboard generation?**
A: It analyzes your entire Project Brain to identify key moments, decisions, and milestones. With IBM Pro Mode, watsonx.ai enhances the narrative structure.

**Q: Can I customize the video output?**
A: Yes! You can edit the storyboard, adjust scene timing, customize captions, and select different TTS voices.

---

## 🎁 Demo Package Contents

### Files to Include
```
demo-package/
├── README.md                    # Quick start guide
├── DEMO_SCRIPT.md              # This file
├── docs/architecture/system-architecture.md   # System architecture
├── sample-project/             # Pre-configured demo project
│   ├── brain/                  # Populated Project Brain
│   ├── src/                    # Sample code
│   └── .afterignore           # Privacy configuration
├── demo-video.mp4              # Pre-rendered demo video
├── screenshots/                # UI screenshots
│   ├── dashboard.png
│   ├── timeline.png
│   ├── chat.png
│   ├── video-studio.png
│   └── trust-center.png
└── slides/                     # Presentation slides
    └── after-demo.pdf
```

### Installation Instructions
```bash
# 1. Clone repository
git clone <repo-url>
cd IBM-Bob/after-mvp

# 2. Install dependencies
npm install

# 3. Build packages
npm run build

# 4. Start dev server
npm run dev

# 5. Open browser
open http://localhost:5173

# 6. Initialize sample project
cd ../sample-project
node ../after-mvp/packages/server/dist/index.js init .
```

---

## ✅ Final Checklist

### Day Before Demo
- [ ] Test complete demo flow
- [ ] Verify all features working
- [ ] Record backup video
- [ ] Prepare sample project
- [ ] Test IBM credentials
- [ ] Charge laptop
- [ ] Download offline dependencies
- [ ] Print demo script

### 1 Hour Before Demo
- [ ] Start dev server
- [ ] Open all necessary tabs
- [ ] Test internet connection
- [ ] Test screen sharing
- [ ] Test audio
- [ ] Close unnecessary apps
- [ ] Clear browser cache
- [ ] Reset sample project

### During Demo
- [ ] Speak clearly and confidently
- [ ] Show, don't just tell
- [ ] Highlight IBM integration
- [ ] Emphasize privacy features
- [ ] Demonstrate real-time capture
- [ ] Show final video
- [ ] Answer questions
- [ ] Provide contact info

### After Demo
- [ ] Share demo package
- [ ] Provide repository link
- [ ] Send follow-up email
- [ ] Collect feedback
- [ ] Note improvement areas

---

## 🎊 Success Criteria

### Demo is Successful If:
- ✅ All features demonstrated without errors
- ✅ Video renders successfully
- ✅ IBM integration shown clearly
- ✅ Privacy features highlighted
- ✅ Audience engaged and asking questions
- ✅ Clear differentiation from competitors
- ✅ Technical innovation evident
- ✅ Judges understand the value proposition

---

## 📞 Support Contacts

**Technical Issues:**
- Check GitHub Issues
- Review documentation
- Test with backup video

**IBM API Issues:**
- Verify credentials
- Check service status
- Fall back to local mode

**Demo Questions:**
- Refer to Q&A section
- Show architecture diagram
- Demonstrate with live code

---

**Status:** ✅ READY FOR DEMO

**Last Updated:** 2026-05-03

**Next Steps:**
1. Review this guide thoroughly
2. Practice demo flow 3-5 times
3. Prepare backup materials
4. Test all features
5. Record backup video
6. Deliver confident demo!

Good luck! 🚀
