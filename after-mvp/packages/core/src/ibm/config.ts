/**
 * IBM Pro Mode Configuration
 *
 * Optional integration with IBM Cloud services for enhanced functionality.
 */

export interface WatsonxConfig {
  apiKey: string;
  projectId: string;
  model: string;
  url?: string;
}

export interface TTSConfig {
  apiKey: string;
  url: string;
  voice: string;
}

export interface CloudantConfig {
  enabled: boolean;
  url: string;
  apiKey: string;
  database?: string;
}

export interface NLUConfig {
  enabled: boolean;
  apiKey: string;
  url: string;
}

export interface IBMProConfig {
  enabled: boolean;
  watsonx?: WatsonxConfig;
  tts?: TTSConfig;
  cloudant?: CloudantConfig;
  nlu?: NLUConfig;
}

/**
 * Load IBM Pro configuration from environment variables
 */
export function loadIBMProConfig(): IBMProConfig {
  const enabled = process.env.IBM_PRO_ENABLED === "true";

  if (!enabled) {
    return { enabled: false };
  }

  const config: IBMProConfig = {
    enabled: true,
  };

  // Watsonx.ai configuration
  if (process.env.IBM_WATSONX_API_KEY && process.env.IBM_WATSONX_PROJECT_ID) {
    config.watsonx = {
      apiKey: process.env.IBM_WATSONX_API_KEY,
      projectId: process.env.IBM_WATSONX_PROJECT_ID,
      model: process.env.IBM_WATSONX_MODEL || "ibm/granite-3-8b-instruct",
      url: process.env.IBM_WATSONX_URL || "https://us-south.ml.cloud.ibm.com",
    };
  }

  // Text-to-Speech configuration
  if (process.env.IBM_TTS_API_KEY && process.env.IBM_TTS_URL) {
    config.tts = {
      apiKey: process.env.IBM_TTS_API_KEY,
      url: process.env.IBM_TTS_URL,
      voice: process.env.IBM_TTS_VOICE || "en-US_AllisonV3Voice",
    };
  }

  // Cloudant configuration
  if (process.env.IBM_CLOUDANT_URL && process.env.IBM_CLOUDANT_API_KEY) {
    config.cloudant = {
      enabled: process.env.IBM_CLOUDANT_ENABLED === "true",
      url: process.env.IBM_CLOUDANT_URL,
      apiKey: process.env.IBM_CLOUDANT_API_KEY,
      database: process.env.IBM_CLOUDANT_DATABASE || "after-projects",
    };
  }

  // Natural Language Understanding configuration
  if (process.env.IBM_NLU_API_KEY && process.env.IBM_NLU_URL) {
    config.nlu = {
      enabled: process.env.IBM_NLU_ENABLED === "true",
      apiKey: process.env.IBM_NLU_API_KEY,
      url: process.env.IBM_NLU_URL,
    };
  }

  return config;
}

/**
 * Validate IBM Pro configuration
 */
export function validateIBMProConfig(config: IBMProConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.enabled) {
    return { valid: true, errors: [] };
  }

  // Validate Watsonx config if provided
  if (config.watsonx) {
    if (!config.watsonx.apiKey) {
      errors.push("Watsonx API key is required");
    }
    if (!config.watsonx.projectId) {
      errors.push("Watsonx project ID is required");
    }
    if (!config.watsonx.model) {
      errors.push("Watsonx model is required");
    }
  }

  // Validate TTS config if provided
  if (config.tts) {
    if (!config.tts.apiKey) {
      errors.push("TTS API key is required");
    }
    if (!config.tts.url) {
      errors.push("TTS URL is required");
    }
    if (!config.tts.voice) {
      errors.push("TTS voice is required");
    }
  }

  // Validate Cloudant config if enabled
  if (config.cloudant?.enabled) {
    if (!config.cloudant.url) {
      errors.push("Cloudant URL is required");
    }
    if (!config.cloudant.apiKey) {
      errors.push("Cloudant API key is required");
    }
  }

  // Validate NLU config if enabled
  if (config.nlu?.enabled) {
    if (!config.nlu.apiKey) {
      errors.push("NLU API key is required");
    }
    if (!config.nlu.url) {
      errors.push("NLU URL is required");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Made with Bob
