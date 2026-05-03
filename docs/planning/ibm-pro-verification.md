# Testing IBM Pro Mode Setup

## Quick Test Guide

### Step 1: Start the Server

You need to start the server with the `start` command, not `dev`:

```bash
cd after-mvp

# First, make sure it's built
npm run build

# Then start the server with the start command
node packages/server/dist/index.js start .
```

Or use the `after` CLI directly:

```bash
cd after-mvp
npm run build
npx after start .
```

You should see:
```
After API listening on http://localhost:3000
After WebSocket listening on ws://localhost:3000/ws
Project: .
```

### Step 2: Test IBM Pro Status

In a **new terminal** (keep the server running):

```bash
curl http://localhost:3000/api/bob/ibm/status
```

Expected response if IBM Pro is enabled:
```json
{
  "enabled": true,
  "services": {
    "watsonx": {
      "available": true,
      "model": "ibm/granite-13b-chat-v2",
      "url": "https://us-south.ml.cloud.ibm.com"
    },
    "tts": {
      "available": true,
      "voice": "en-US_MichaelV3Voice",
      "url": "https://api.us-south.text-to-speech.watson.cloud.ibm.com"
    },
    "cloudant": {
      "available": false
    },
    "nlu": {
      "available": false
    }
  }
}
```

### Step 3: Test Enhanced Chat

```bash
curl -X POST http://localhost:3000/api/bob/ibm/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Hello, what can you help me with?\", \"brainPath\": \"$(pwd)/.after\"}"
```

### Step 4: Test TTS Voices

```bash
curl http://localhost:3000/api/bob/ibm/voices
```

Expected response:
```json
{
  "voices": [
    {
      "name": "en-US_MichaelV3Voice",
      "language": "en-US",
      "gender": "male",
      "description": "Michael: American English male voice"
    },
    ...
  ]
}
```

### Step 5: Test TTS Narration

```bash
curl -X POST http://localhost:3000/api/bob/ibm/narration \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Welcome to After MVP. This is a test of the text to speech system.\", \"outputPath\": \"./test-narration.wav\"}"
```

Expected response:
```json
{
  "success": true,
  "outputPath": "./test-narration.wav",
  "duration": 5.2,
  "voice": "en-US_MichaelV3Voice",
  "chunks": 1
}
```

## Troubleshooting

### Server won't start

**Issue**: `npm run dev` doesn't start the HTTP server

**Solution**: Use the `start` command instead:
```bash
npm run build
node packages/server/dist/index.js start .
```

### "Cannot find module" errors

**Issue**: TypeScript files not compiled

**Solution**: Build first:
```bash
npm run build
```

### "Authentication failed"

**Issue**: Invalid API keys in `.env`

**Solution**:
1. Check your `.env` file in `after-mvp` directory
2. Verify API keys are correct (no extra spaces)
3. Make sure you have TWO different keys (watsonx and TTS)
4. Check keys are still active in IBM Cloud

### "Service unavailable"

**Issue**: IBM services not accessible

**Solution**:
1. Check IBM Cloud status: https://cloud.ibm.com/status
2. Verify your services are created and active
3. Check service URLs match your region
4. Test API keys directly with curl to IBM endpoints

### Port already in use

**Issue**: Port 3000 is already taken

**Solution**: Use a different port:
```bash
node packages/server/dist/index.js start . --port 3001
```

## Windows PowerShell Commands

If you're on Windows, use these commands instead:

### Start Server
```powershell
cd after-mvp
npm run build
node packages/server/dist/index.js start .
```

### Test Status
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/bob/ibm/status | Select-Object -Expand Content
```

### Test Chat
```powershell
$body = @{
    message = "Hello, what can you help me with?"
    brainPath = "$PWD\.after"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/api/bob/ibm/chat `
    -Method POST `
    -ContentType "application/json" `
    -Body $body | Select-Object -Expand Content
```

### Test Voices
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/bob/ibm/voices | Select-Object -Expand Content
```

## Success Indicators

✅ Server starts without errors
✅ IBM Pro status shows `"enabled": true`
✅ Both watsonx and TTS show `"available": true`
✅ Chat endpoint returns AI-generated responses
✅ Voices endpoint lists available TTS voices
✅ Narration endpoint creates WAV files

## Next Steps

Once all tests pass:
1. ✅ IBM Pro Mode is fully configured
2. ✅ You can use enhanced AI features
3. ✅ Video narration will use IBM TTS
4. ✅ Chat will use IBM watsonx.ai

Congratulations! 🎉