# Quick Start: IBM Pro Mode (5 Minutes)

This is the fastest way to get IBM Pro Mode running. For detailed information, see [ibm-pro-setup.md](./ibm-pro-setup.md).

## 🎯 What You'll Get

- **Enhanced AI Chat**: Better responses using IBM watsonx.ai
- **AI Narration**: Professional voiceovers for demo videos
- **100% Optional**: App works great without it!

## ⚡ Quick Setup

### 1. Create IBM Cloud Account (2 min)

1. Go to: https://cloud.ibm.com/registration
2. Sign up (no credit card needed for free tier)
3. Verify your email

### 2. Get watsonx.ai Credentials (2 min)

**Get IBM Cloud API Key (for watsonx.ai):**
1. Go to: https://cloud.ibm.com/iam/apikeys
2. Click "Create an IBM Cloud API key"
3. Name it: `after-watsonx-dev`
4. **Copy the key immediately!** (You can't see it again)
5. Save it somewhere safe - you'll use this for `IBM_WATSONX_API_KEY`

**Get Project ID:**
1. Go to: https://dataplatform.cloud.ibm.com/wx/home
2. Create a project (name it "After MVP")
3. Go to "Manage" → "General" → Copy "Project ID"

### 3. Get Text-to-Speech Credentials (1 min)

**IMPORTANT: This is a DIFFERENT API key!**

1. Go to: https://cloud.ibm.com/catalog/services/text-to-speech
2. Select region: **Dallas** (us-south)
3. Choose plan: **Lite** (FREE)
4. Click "Create"
5. After creation, go to "Manage" tab
6. Under "Credentials", copy the **API Key** and **URL**
   - This TTS API key is different from your IBM Cloud API key!
   - Use this for `IBM_TTS_API_KEY`

### 4. Configure Environment

```bash
# In the after-mvp directory
cd after-mvp
cp .env.example .env
```

Edit `.env` file:

```bash
# Enable IBM Pro Mode
IBM_PRO_ENABLED=true

# watsonx.ai (paste your values)
IBM_WATSONX_API_KEY=paste_your_ibm_cloud_api_key_here
IBM_WATSONX_PROJECT_ID=paste_your_project_id_here
IBM_WATSONX_MODEL=ibm/granite-13b-chat-v2
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com

# Text-to-Speech (paste your values)
IBM_TTS_API_KEY=paste_your_tts_api_key_here
IBM_TTS_URL=https://api.us-south.text-to-speech.watson.cloud.ibm.com
IBM_TTS_VOICE=en-US_MichaelV3Voice
```

### 5. Test It!

```bash
# Start the server
npm run dev

# In another terminal, test the status
curl http://localhost:3000/api/bob/ibm/status
```

You should see:
```json
{
  "enabled": true,
  "services": {
    "watsonx": { "available": true },
    "tts": { "available": true }
  }
}
```

## ✅ You're Done!

IBM Pro Mode is now active. The app will automatically use:
- IBM watsonx.ai for enhanced chat responses
- IBM Watson TTS for video narration

## 🆘 Troubleshooting

**"Authentication failed"**
- Check your API keys are copied correctly (no extra spaces)
- Make sure you copied the entire key

**"Project not found"**
- Verify your Project ID from watsonx.ai dashboard
- Make sure the project is created and active

**"Service unavailable"**
- Check your TTS URL matches your region
- Verify the TTS service is created and active

## 💰 Free Tier Limits

- **watsonx.ai**: Check limits in your IBM Cloud account
- **Text-to-Speech**: 10,000 characters/month FREE

Set up billing alerts: https://cloud.ibm.com/billing/usage

## 🔐 Security Reminder

- ✅ `.env` is already in `.gitignore` (safe)
- ❌ NEVER commit API keys to Git
- ❌ NEVER share API keys in screenshots
- ✅ Rotate keys every 90 days

## 📚 Need More Help?

See the full guide: [ibm-pro-setup.md](./ibm-pro-setup.md)

---

**Want to run without IBM Pro?** Just set `IBM_PRO_ENABLED=false` or leave it empty. The app works perfectly in local-only mode!
