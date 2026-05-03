# IBM API Keys Explained - Visual Guide

## 🔑 Two Different API Keys Required

```
┌─────────────────────────────────────────────────────────────┐
│                    IBM Cloud Account                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  IBM Cloud API Key (Account-Level)                 │    │
│  │  ─────────────────────────────────────────────     │    │
│  │  Get from: https://cloud.ibm.com/iam/apikeys      │    │
│  │  Used for: watsonx.ai                              │    │
│  │  Variable: IBM_WATSONX_API_KEY                     │    │
│  │                                                     │    │
│  │  Example: AbCdEf123456...                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Watson TTS Service API Key (Service-Specific)     │    │
│  │  ──────────────────────────────────────────────    │    │
│  │  Get from: Create TTS service → Manage → Creds    │    │
│  │  Used for: Text-to-Speech only                     │    │
│  │  Variable: IBM_TTS_API_KEY                         │    │
│  │                                                     │    │
│  │  Example: XyZ789GhIjKl...                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Step-by-Step: Getting Both Keys

### Step 1: Get IBM Cloud API Key (for watsonx.ai)

```
1. Login to IBM Cloud
   ↓
2. Go to: https://cloud.ibm.com/iam/apikeys
   ↓
3. Click "Create an IBM Cloud API key"
   ↓
4. Name it: "after-watsonx-dev"
   ↓
5. Click "Create"
   ↓
6. COPY THE KEY IMMEDIATELY! ← You can't see it again!
   ↓
7. Save it as: IBM_WATSONX_API_KEY
```

**This key looks like:**
```
AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEf
```

### Step 2: Get Watson TTS Service API Key (for Text-to-Speech)

```
1. Go to: https://cloud.ibm.com/catalog/services/text-to-speech
   ↓
2. Select region: Dallas (us-south)
   ↓
3. Choose plan: Lite (FREE)
   ↓
4. Click "Create"
   ↓
5. Wait for service to provision (~30 seconds)
   ↓
6. Click "Manage" in left sidebar
   ↓
7. Under "Credentials" section, you'll see:
   - API Key: XyZ789... ← Copy this!
   - URL: https://api.us-south.text-to-speech.watson.cloud.ibm.com
   ↓
8. Save API Key as: IBM_TTS_API_KEY
9. Save URL as: IBM_TTS_URL
```

**This key looks like:**
```
XyZ789GhIjKlMnOpQrStUvWxYz0987654321XyZ789
```

## ⚠️ Common Mistakes

### ❌ WRONG: Using the same key for both

```bash
# DON'T DO THIS!
IBM_WATSONX_API_KEY=AbCdEf123456...
IBM_TTS_API_KEY=AbCdEf123456...  # ❌ Same key - won't work!
```

### ✅ CORRECT: Two different keys

```bash
# DO THIS!
IBM_WATSONX_API_KEY=AbCdEf123456...  # From IAM API Keys
IBM_TTS_API_KEY=XyZ789GhIjKl...      # From TTS Service Credentials
```

## 🎯 Why Two Different Keys?

### IBM Cloud API Key (Account-Level)
- **Scope**: Your entire IBM Cloud account
- **Access**: All services you have access to
- **Use case**: watsonx.ai, Watson Studio, Cloud Functions, etc.
- **Security**: More powerful, needs careful management

### Watson TTS Service API Key (Service-Specific)
- **Scope**: Only the specific TTS service instance
- **Access**: Just that one TTS service
- **Use case**: Text-to-Speech only
- **Security**: Limited scope, safer to share with apps

## 📝 Your .env File Should Look Like This

```bash
# Enable IBM Pro Mode
IBM_PRO_ENABLED=true

# watsonx.ai - Uses IBM Cloud API Key
IBM_WATSONX_API_KEY=AbCdEf123456789...  # ← From https://cloud.ibm.com/iam/apikeys
IBM_WATSONX_PROJECT_ID=12345678-abcd-...
IBM_WATSONX_MODEL=ibm/granite-13b-chat-v2
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com

# Text-to-Speech - Uses Service-Specific API Key
IBM_TTS_API_KEY=XyZ789GhIjKl012...      # ← From TTS Service Credentials
IBM_TTS_URL=https://api.us-south.text-to-speech.watson.cloud.ibm.com
IBM_TTS_VOICE=en-US_MichaelV3Voice
```

## 🔍 How to Verify You Have the Right Keys

### Test watsonx.ai Key

```bash
# This should work if your IBM Cloud API key is correct
curl -X POST "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29" \
  -H "Authorization: Bearer YOUR_IBM_CLOUD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Hello",
    "model_id": "ibm/granite-13b-chat-v2",
    "project_id": "YOUR_PROJECT_ID"
  }'
```

### Test TTS Key

```bash
# This should work if your TTS service key is correct
curl -X POST "https://api.us-south.text-to-speech.watson.cloud.ibm.com/v1/synthesize" \
  -H "Authorization: Bearer YOUR_TTS_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: audio/wav" \
  -d '{"text":"Hello world"}' \
  --output test.wav
```

## 🆘 Troubleshooting

### "Authentication failed" for watsonx.ai
- ✅ Check you're using the IBM Cloud API key from https://cloud.ibm.com/iam/apikeys
- ✅ Verify the key has access to watsonx.ai
- ✅ Make sure you copied the entire key (no spaces)

### "Authentication failed" for TTS
- ✅ Check you're using the TTS service-specific key
- ✅ Verify the TTS service is created and active
- ✅ Make sure the URL matches your service region

### "Wrong key type" error
- ❌ You're probably using the IBM Cloud API key for TTS
- ✅ Get the service-specific key from TTS service credentials

## 📚 Quick Reference

| Service | Key Type | Where to Get | Variable Name |
|---------|----------|--------------|---------------|
| watsonx.ai | IBM Cloud API Key | https://cloud.ibm.com/iam/apikeys | `IBM_WATSONX_API_KEY` |
| Text-to-Speech | Service API Key | TTS Service → Manage → Credentials | `IBM_TTS_API_KEY` |

## ✅ Checklist

- [ ] Created IBM Cloud account
- [ ] Generated IBM Cloud API key for watsonx.ai
- [ ] Created watsonx.ai project and got Project ID
- [ ] Created Watson TTS service instance
- [ ] Got TTS service-specific API key and URL
- [ ] Added both keys to `.env` file (they should be different!)
- [ ] Tested both services work

---

**Remember**: You need TWO different API keys! Don't use the same key for both services.