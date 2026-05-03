# IBM Pro Mode Setup Guide

This guide will walk you through setting up IBM Cloud services for the After MVP project's optional Pro Mode features.

## 🎯 Overview

IBM Pro Mode is **completely optional**. The After MVP works perfectly in local-only mode. IBM Pro Mode adds:

- **Enhanced AI Chat**: Powered by IBM watsonx.ai for better context understanding
- **AI Narration**: IBM Watson Text-to-Speech for professional video voiceovers
- **Cloud Sync** (Future): IBM Cloudant for Project Brain backup
- **Advanced Analysis** (Future): IBM Natural Language Understanding for code insights

## 🔐 Security First

**CRITICAL SECURITY RULES:**

1. ✅ **NEVER** commit `.env` files to Git (already in `.gitignore`)
2. ✅ **NEVER** share API keys in screenshots, logs, or messages
3. ✅ Use separate API keys for development and production
4. ✅ Rotate API keys every 90 days
5. ✅ Set up billing alerts in IBM Cloud
6. ✅ Use IBM Cloud IAM for team access control

## 📋 Prerequisites

1. **IBM Cloud Account** (Free tier available)
   - Sign up at: https://cloud.ibm.com/registration
   - No credit card required for Lite plan services

2. **Node.js Environment**
   - Already set up in this project

## 🚀 Step-by-Step Setup

### Step 1: Create Your IBM Cloud Account

1. Go to https://cloud.ibm.com/registration
2. Sign up with your email
3. Verify your email address
4. Complete the account setup

### Step 2: Set Up watsonx.ai (For Enhanced Chat)

#### 2.1 Create watsonx.ai Project

1. Go to https://dataplatform.cloud.ibm.com/wx/home
2. Click **"Create a project"** or select an existing one
3. Give it a name like "After MVP"
4. Click **"Create"**
5. Go to **"Manage"** tab → **"General"**
6. Copy the **"Project ID"** (you'll need this)

#### 2.2 Get IBM Cloud API Key

1. Go to https://cloud.ibm.com/iam/apikeys
2. Click **"Create an IBM Cloud API key"**
3. Name it: `after-watsonx-dev`
4. Click **"Create"**
5. **IMMEDIATELY COPY THE API KEY** (you can't see it again!)
6. Store it securely (password manager recommended)

#### 2.3 Verify watsonx.ai Access

1. Go to https://cloud.ibm.com/catalog/services/watsonx-ai
2. Ensure you have access (should show "Launch" button)
3. Note the service URL (usually `https://us-south.ml.cloud.ibm.com`)

### Step 3: Set Up Watson Text-to-Speech (For Video Narration)

#### 3.1 Create TTS Service Instance

1. Go to https://cloud.ibm.com/catalog/services/text-to-speech
2. Select a region:
   - **Dallas** (us-south) - Recommended for US
   - **Frankfurt** (eu-de) - Recommended for Europe
   - **Tokyo** (jp-tok) - Recommended for Asia
3. Choose **"Lite"** plan (FREE - 10,000 characters/month)
4. Name it: `after-tts-dev`
5. Click **"Create"**

#### 3.2 Get TTS Credentials

1. After creation, you'll see the service dashboard
2. Click **"Manage"** in the left sidebar
3. Under **"Credentials"**, you'll see:
   - **API Key**: Copy this
   - **URL**: Copy this (e.g., `https://api.us-south.text-to-speech.watson.cloud.ibm.com`)

#### 3.3 Choose a Voice

Available voices (US English):
- `en-US_MichaelV3Voice` - Male, professional (default)
- `en-US_AllisonV3Voice` - Female, professional
- `en-US_LisaV3Voice` - Female, conversational
- `en-US_EmilyV3Voice` - Female, young adult

See all voices: https://cloud.ibm.com/docs/text-to-speech?topic=text-to-speech-voices

### Step 4: Configure Your Environment

#### 4.1 Create .env File

```bash
cd after-mvp
cp .env.example .env
```

#### 4.2 Edit .env File

Open `after-mvp/.env` and fill in your credentials:

```bash
# Enable IBM Pro Mode
IBM_PRO_ENABLED=true

# watsonx.ai Configuration
IBM_WATSONX_API_KEY=your_ibm_cloud_api_key_here
IBM_WATSONX_PROJECT_ID=your_project_id_here
IBM_WATSONX_MODEL=ibm/granite-13b-chat-v2
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com

# Watson Text-to-Speech Configuration
IBM_TTS_API_KEY=your_tts_api_key_here
IBM_TTS_URL=https://api.us-south.text-to-speech.watson.cloud.ibm.com
IBM_TTS_VOICE=en-US_MichaelV3Voice
```

#### 4.3 Verify Configuration

```bash
# Start the server
npm run dev

# In another terminal, test IBM Pro status
curl http://localhost:3000/api/bob/ibm/status
```

Expected response:
```json
{
  "enabled": true,
  "services": {
    "watsonx": { "available": true, "model": "ibm/granite-13b-chat-v2" },
    "tts": { "available": true, "voice": "en-US_MichaelV3Voice" },
    "cloudant": { "available": false },
    "nlu": { "available": false }
  }
}
```

## 🧪 Testing Your Setup

### Test Enhanced Chat

```bash
curl -X POST http://localhost:3000/api/bob/ibm/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is this project about?",
    "brainPath": "/path/to/your/project/.after"
  }'
```

### Test Text-to-Speech

```bash
curl -X POST http://localhost:3000/api/bob/ibm/narration \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome to After MVP, a local-first developer tool.",
    "outputPath": "/tmp/test-narration.wav"
  }'
```

### List Available Voices

```bash
curl http://localhost:3000/api/bob/ibm/voices
```

## 💰 Cost Management

### Free Tier Limits

**watsonx.ai Lite Plan:**
- Free tier available with IBM Cloud account
- Check current limits: https://www.ibm.com/products/watsonx-ai/pricing

**Watson Text-to-Speech Lite Plan:**
- 10,000 characters per month FREE
- $0.02 per 1,000 characters after that
- Monitor usage: https://cloud.ibm.com/billing/usage

### Set Up Billing Alerts

1. Go to https://cloud.ibm.com/billing/usage
2. Click **"Manage"** → **"Spending notifications"**
3. Set threshold (e.g., $5, $10, $20)
4. Add your email for alerts

### Monitor Usage

1. Go to https://cloud.ibm.com/billing/usage
2. View usage by service
3. Download usage reports
4. Set up monthly reviews

## 🔧 Troubleshooting

### "Authentication failed" Error

**Cause**: Invalid or expired API key

**Solution**:
1. Verify API key is copied correctly (no extra spaces)
2. Check if API key is still active: https://cloud.ibm.com/iam/apikeys
3. Create a new API key if needed
4. Update `.env` file

### "Project not found" Error

**Cause**: Invalid watsonx.ai project ID

**Solution**:
1. Go to https://dataplatform.cloud.ibm.com/wx/home
2. Select your project
3. Go to "Manage" → "General"
4. Copy the correct Project ID
5. Update `.env` file

### "Service unavailable" Error

**Cause**: Service region mismatch or service not provisioned

**Solution**:
1. Check service URL matches your region
2. Verify service is created: https://cloud.ibm.com/resources
3. Ensure service is in "Active" state
4. Check IBM Cloud status: https://cloud.ibm.com/status

### "Rate limit exceeded" Error

**Cause**: Too many API calls

**Solution**:
1. Check your usage: https://cloud.ibm.com/billing/usage
2. Implement request throttling in your code
3. Upgrade to paid plan if needed
4. Wait for rate limit to reset (usually hourly)

## 🔄 API Key Rotation

**Recommended: Rotate every 90 days**

### Rotation Process

1. **Create new API key**:
   - Go to https://cloud.ibm.com/iam/apikeys
   - Click "Create"
   - Name it with date: `after-watsonx-2026-05`

2. **Update .env file**:
   - Replace old key with new key
   - Test the application

3. **Delete old API key**:
   - Wait 24 hours (ensure no issues)
   - Go to https://cloud.ibm.com/iam/apikeys
   - Delete the old key

4. **Update documentation**:
   - Note the rotation date
   - Set reminder for next rotation

## 🎓 Additional Resources

### IBM Cloud Documentation
- **watsonx.ai**: https://cloud.ibm.com/docs/watsonx
- **Text-to-Speech**: https://cloud.ibm.com/docs/text-to-speech
- **API Keys**: https://cloud.ibm.com/docs/account?topic=account-userapikey
- **IAM**: https://cloud.ibm.com/docs/account?topic=account-iamoverview

### Support
- **IBM Cloud Support**: https://cloud.ibm.com/unifiedsupport/supportcenter
- **Community Forums**: https://community.ibm.com/community/user/watsonai/home
- **Stack Overflow**: Tag questions with `ibm-cloud` and `watsonx`

## 🚨 Security Incident Response

**If you accidentally commit API keys:**

1. **Immediately rotate the key**:
   - Go to https://cloud.ibm.com/iam/apikeys
   - Delete the exposed key
   - Create a new one

2. **Remove from Git history**:
   ```bash
   # Use BFG Repo-Cleaner or git-filter-repo
   # Contact your team lead for assistance
   ```

3. **Notify your team**:
   - Inform team members
   - Update shared documentation
   - Review security practices

4. **Review access logs**:
   - Check IBM Cloud activity logs
   - Look for unauthorized usage
   - Report suspicious activity to IBM

## ✅ Setup Checklist

- [ ] IBM Cloud account created
- [ ] watsonx.ai project created
- [ ] IBM Cloud API key generated
- [ ] Watson TTS service provisioned
- [ ] TTS credentials obtained
- [ ] `.env` file created from `.env.example`
- [ ] All credentials added to `.env`
- [ ] `.env` file NOT committed to Git
- [ ] Server started successfully
- [ ] IBM Pro status endpoint tested
- [ ] Enhanced chat tested
- [ ] TTS narration tested
- [ ] Billing alerts configured
- [ ] API key rotation reminder set

## 🎉 You're Ready!

Once you've completed this setup, IBM Pro Mode will be active and you can use:

- Enhanced AI chat with Project Brain context
- Professional AI-generated narration for videos
- Better code understanding and suggestions

Remember: **IBM Pro Mode is optional**. The app works great in local-only mode too!

---

**Need Help?** Open an issue on GitHub or contact the team.