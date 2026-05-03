# Manual .env File Setup

Follow these steps to create your `.env` file manually:

### Step 1: Copy the Template

```bash
cd after-mvp
cp .env.example .env
```

### Step 2: Edit the .env File

Open `after-mvp/.env` in your text editor and fill in your credentials:

```bash
# ============================================================================
# After MVP - Environment Configuration
# ============================================================================

# Server Configuration
PORT=3000

# IBM Pro Mode Configuration
IBM_PRO_ENABLED=true

# IBM watsonx.ai Configuration
# Get from: https://cloud.ibm.com/iam/apikeys
IBM_WATSONX_API_KEY=your_ibm_cloud_api_key_here
IBM_WATSONX_PROJECT_ID=your_project_id_here
IBM_WATSONX_MODEL=ibm/granite-13b-chat-v2
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com

# IBM Watson Text-to-Speech Configuration
# Get from: TTS Service → Manage → Credentials
IBM_TTS_API_KEY=your_tts_api_key_here
IBM_TTS_URL=https://api.us-south.text-to-speech.watson.cloud.ibm.com
IBM_TTS_VOICE=en-US_MichaelV3Voice

# Optional services (leave disabled for now)
IBM_CLOUDANT_ENABLED=false
IBM_CLOUDANT_URL=
IBM_CLOUDANT_API_KEY=
IBM_CLOUDANT_DATABASE=after-brain

IBM_NLU_ENABLED=false
IBM_NLU_API_KEY=
IBM_NLU_URL=https://api.us-south.natural-language-understanding.watson.cloud.ibm.com
```

### Step 3: Replace Placeholders

Replace these placeholders with your actual values:

1. **`your_ibm_cloud_api_key_here`**
   - Get from: https://cloud.ibm.com/iam/apikeys
   - Click "Create an IBM Cloud API key"
   - Copy the key immediately

2. **`your_project_id_here`**
   - Get from: https://dataplatform.cloud.ibm.com/wx/home
   - Select your project → Manage → General → Copy Project ID

3. **`your_tts_api_key_here`**
   - Get from: https://cloud.ibm.com/catalog/services/text-to-speech
   - Create service → Manage → Credentials → Copy API Key

4. **`your_tts_url_here`** (if different from default)
   - Usually: `https://api.us-south.text-to-speech.watson.cloud.ibm.com`
   - Or your region's URL from TTS service credentials

### Step 4: Save and Verify

1. Save the `.env` file
2. Make sure it's in the `after-mvp` directory
3. Verify it's not committed to Git (it's already in `.gitignore`)

## Example of a Completed .env File

**⚠️ This is just an example with fake keys! Use your real keys!**

```bash
PORT=3000

IBM_PRO_ENABLED=true

# watsonx.ai
IBM_WATSONX_API_KEY=AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
IBM_WATSONX_PROJECT_ID=12345678-abcd-1234-abcd-123456789abc
IBM_WATSONX_MODEL=ibm/granite-13b-chat-v2
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com

# Text-to-Speech
IBM_TTS_API_KEY=XyZ789GhIjKlMnOpQrStUvWxYz0987654321
IBM_TTS_URL=https://api.us-south.text-to-speech.watson.cloud.ibm.com
IBM_TTS_VOICE=en-US_MichaelV3Voice

# Optional (disabled)
IBM_CLOUDANT_ENABLED=false
IBM_CLOUDANT_URL=
IBM_CLOUDANT_API_KEY=
IBM_CLOUDANT_DATABASE=after-brain

IBM_NLU_ENABLED=false
IBM_NLU_API_KEY=
IBM_NLU_URL=https://api.us-south.natural-language-understanding.watson.cloud.ibm.com
```

## Verify Your Setup

### 1. Start the Server

```bash
cd after-mvp
npm run dev
```

### 2. Test IBM Pro Status

In another terminal:

```bash
curl http://localhost:3000/api/bob/ibm/status
```

Expected response:
```json
{
  "enabled": true,
  "services": {
    "watsonx": {
      "available": true,
      "model": "ibm/granite-13b-chat-v2"
    },
    "tts": {
      "available": true,
      "voice": "en-US_MichaelV3Voice"
    }
  }
}
```

### 3. Test Enhanced Chat

```bash
curl -X POST http://localhost:3000/api/bob/ibm/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, what can you help me with?",
    "brainPath": "/path/to/your/project/.after"
  }'
```

## Troubleshooting

### "Authentication failed"
- Check your API keys are copied correctly (no extra spaces)
- Verify keys are still active in IBM Cloud
- Make sure you're using the right key for each service

### "Service unavailable"
- Check your service URLs match your region
- Verify services are created and active in IBM Cloud
- Check IBM Cloud status: https://cloud.ibm.com/status

### ".env file not found"
- Make sure the file is named exactly `.env` (with the dot)
- Make sure it's in the `after-mvp` directory
- On Windows, make sure it's not named `.env.txt`

## Security Checklist

- [ ] `.env` file is in the `after-mvp` directory
- [ ] `.env` file contains your real API keys
- [ ] `.env` file is NOT committed to Git (check with `git status`)
- [ ] You have NOT shared your API keys with anyone
- [ ] You have set up billing alerts in IBM Cloud
- [ ] You have noted the date for 90-day key rotation

## Need Help?

- See `.env.example` for the current environment variable reference
- See `README.md` for the workspace overview
- See `../README.md` for the repository overview
