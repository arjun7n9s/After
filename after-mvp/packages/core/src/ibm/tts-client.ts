import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { TTSConfig } from "./config";

/**
 * IBM Text-to-Speech Synthesis Request
 */
export interface TTSSynthesisRequest {
  text: string;
  voice: string;
  accept?: string;
  rate?: string;
  pitch?: string;
}

/**
 * IBM Text-to-Speech Client
 *
 * Integrates with IBM Watson Text-to-Speech for video narration.
 */
export class TTSClient {
  private config: TTSConfig;

  constructor(config: TTSConfig) {
    this.config = config;
  }

  /**
   * Synthesize speech from text
   */
  async synthesize(request: TTSSynthesisRequest): Promise<Buffer> {
    const url = `${this.config.url}/v1/synthesize`;

    const params = new URLSearchParams({
      voice: request.voice,
    });

    const response = await fetch(`${url}?${params}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: request.accept || "audio/wav",
        Authorization: `Basic ${Buffer.from(`apikey:${this.config.apiKey}`).toString("base64")}`,
      },
      body: JSON.stringify({
        text: request.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`IBM TTS synthesis failed: ${response.status} ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Generate narration audio file from script
   */
  async generateNarration(script: string, outputPath: string): Promise<string> {
    const audio = await this.synthesize({
      text: script,
      voice: this.config.voice,
      accept: "audio/wav",
    });

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, audio);
    return outputPath;
  }

  /**
   * Split long text into chunks for TTS (max 5000 characters per request)
   */
  splitTextForTTS(text: string, maxLength = 5000): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+\s+/);
    let currentChunk = "";

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = "";
        }
        // If single sentence is too long, split by words
        if (sentence.length > maxLength) {
          const words = sentence.split(" ");
          for (const word of words) {
            if ((currentChunk + " " + word).length > maxLength) {
              chunks.push(currentChunk.trim());
              currentChunk = word;
            } else {
              currentChunk += (currentChunk ? " " : "") + word;
            }
          }
        } else {
          currentChunk = sentence;
        }
      } else {
        currentChunk += (currentChunk ? ". " : "") + sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Generate narration for multiple chunks and combine
   */
  async generateNarrationChunks(
    script: string,
    outputDir: string
  ): Promise<string[]> {
    const chunks = this.splitTextForTTS(script);
    const audioPaths: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk) continue;
      const chunkPath = `${outputDir}/narration_chunk_${i + 1}.wav`;
      await this.generateNarration(chunk, chunkPath);
      audioPaths.push(chunkPath);
    }

    return audioPaths;
  }

  /**
   * List available voices
   */
  async listVoices(): Promise<Array<{ name: string; language: string; gender: string }>> {
    const url = `${this.config.url}/v1/voices`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`apikey:${this.config.apiKey}`).toString("base64")}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`IBM TTS list voices failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.voices.map((v: { name: string; language: string; gender: string }) => ({
      name: v.name,
      language: v.language,
      gender: v.gender,
    }));
  }
}

// Made with Bob
