/**
 * Redactor
 * 
 * Detects and redacts sensitive information from content before capture.
 * Includes detection for API keys, tokens, passwords, and other secrets.
 */

export type Secret = {
  type: "api_key" | "token" | "password" | "private_key" | "credential" | "email" | "phone" | "ssn" | "credit_card";
  value: string;
  start: number;
  end: number;
  confidence: "high" | "medium" | "low";
};

export type RedactionResult = {
  redacted: string;
  secrets: Secret[];
  redactionCount: number;
};

export class Redactor {
  private patterns: Map<Secret["type"], RegExp[]>;

  constructor() {
    this.patterns = new Map([
      // API Keys
      ["api_key", [
        /\b[A-Za-z0-9_-]{32,}\b/g, // Generic long alphanumeric strings
        /\b(?:api[_-]?key|apikey)[:\s=]+['"]?([A-Za-z0-9_-]{20,})['"]?/gi,
        /\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{24,}/g, // Stripe-style keys
        /\bAKIA[0-9A-Z]{16}\b/g, // AWS Access Key
        /\bghp_[A-Za-z0-9]{36}\b/g, // GitHub Personal Access Token
        /\bgho_[A-Za-z0-9]{36}\b/g, // GitHub OAuth Token
      ]],
      
      // Tokens
      ["token", [
        /\b(?:bearer|token)[:\s=]+['"]?([A-Za-z0-9_.-]{20,})['"]?/gi,
        /\b(?:jwt|access[_-]?token)[:\s=]+['"]?([A-Za-z0-9_.-]{20,})['"]?/gi,
        /\beyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g, // JWT tokens
      ]],
      
      // Passwords
      ["password", [
        /\b(?:password|passwd|pwd)[:\s=]+['"]?([^\s'"]{8,})['"]?/gi,
        /\b(?:pass|secret)[:\s=]+['"]?([^\s'"]{8,})['"]?/gi,
      ]],
      
      // Private Keys
      ["private_key", [
        /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
        /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g,
      ]],
      
      // Generic Credentials
      ["credential", [
        /\b(?:client[_-]?secret|consumer[_-]?secret)[:\s=]+['"]?([A-Za-z0-9_-]{20,})['"]?/gi,
        /\b(?:auth|authorization)[:\s=]+['"]?([A-Za-z0-9_.-]{20,})['"]?/gi,
      ]],
      
      // Email addresses
      ["email", [
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      ]],
      
      // Phone numbers (US format)
      ["phone", [
        /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
      ]],
      
      // SSN (US Social Security Number)
      ["ssn", [
        /\b\d{3}-\d{2}-\d{4}\b/g,
      ]],
      
      // Credit Card Numbers
      ["credit_card", [
        /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      ]],
    ]);
  }

  /**
   * Detect secrets in content without redacting
   */
  detectSecrets(content: string): Secret[] {
    const secrets: Secret[] = [];

    for (const [type, patterns] of this.patterns.entries()) {
      for (const pattern of patterns) {
        const matches = content.matchAll(pattern);
        
        for (const match of matches) {
          if (match.index !== undefined) {
            secrets.push({
              type,
              value: match[0],
              start: match.index,
              end: match.index + match[0].length,
              confidence: this.getConfidence(type, match[0]),
            });
          }
        }
      }
    }

    // Sort by position and remove overlaps
    return this.deduplicateSecrets(secrets);
  }

  /**
   * Redact all detected secrets from content
   */
  redactSecrets(content: string): RedactionResult {
    const secrets = this.detectSecrets(content);
    let redacted = content;

    // Sort secrets by position (reverse order to maintain indices)
    const sortedSecrets = [...secrets].sort((a, b) => b.start - a.start);

    for (const secret of sortedSecrets) {
      const replacement = this.getRedactionReplacement(secret.type);
      const before = redacted.slice(0, secret.start);
      const after = redacted.slice(secret.end);
      redacted = before + replacement + after;
    }

    return {
      redacted,
      secrets,
      redactionCount: secrets.length,
    };
  }

  /**
   * Redact only API keys
   */
  redactApiKeys(content: string): string {
    return this.redactByType(content, "api_key");
  }

  /**
   * Redact only tokens
   */
  redactTokens(content: string): string {
    return this.redactByType(content, "token");
  }

  /**
   * Redact only passwords
   */
  redactPasswords(content: string): string {
    return this.redactByType(content, "password");
  }

  /**
   * Check if content contains any secrets
   */
  containsSecrets(content: string): boolean {
    return this.detectSecrets(content).length > 0;
  }

  /**
   * Get redaction statistics
   */
  getStats(content: string): Record<Secret["type"], number> {
    const secrets = this.detectSecrets(content);
    const stats: Record<string, number> = {};

    for (const secret of secrets) {
      stats[secret.type] = (stats[secret.type] || 0) + 1;
    }

    return stats as Record<Secret["type"], number>;
  }

  /**
   * Redact secrets of a specific type
   */
  private redactByType(content: string, type: Secret["type"]): string {
    const patterns = this.patterns.get(type) || [];
    let redacted = content;

    for (const pattern of patterns) {
      const replacement = this.getRedactionReplacement(type);
      redacted = redacted.replace(pattern, replacement);
    }

    return redacted;
  }

  /**
   * Get replacement text for redacted secret
   */
  private getRedactionReplacement(type: Secret["type"]): string {
    const replacements: Record<Secret["type"], string> = {
      api_key: "[REDACTED_API_KEY]",
      token: "[REDACTED_TOKEN]",
      password: "[REDACTED_PASSWORD]",
      private_key: "[REDACTED_PRIVATE_KEY]",
      credential: "[REDACTED_CREDENTIAL]",
      email: "[REDACTED_EMAIL]",
      phone: "[REDACTED_PHONE]",
      ssn: "[REDACTED_SSN]",
      credit_card: "[REDACTED_CREDIT_CARD]",
    };

    return replacements[type];
  }

  /**
   * Determine confidence level for detected secret
   */
  private getConfidence(type: Secret["type"], value: string): Secret["confidence"] {
    // High confidence for well-known patterns
    if (type === "private_key" || type === "ssn" || type === "credit_card") {
      return "high";
    }

    // Medium confidence for structured patterns
    if (type === "email" || type === "phone") {
      return "medium";
    }

    // Check value characteristics for API keys and tokens
    if (type === "api_key" || type === "token") {
      // High entropy suggests real secret
      const entropy = this.calculateEntropy(value);
      if (entropy > 4.5) return "high";
      if (entropy > 3.5) return "medium";
      return "low";
    }

    return "medium";
  }

  /**
   * Calculate Shannon entropy of a string
   */
  private calculateEntropy(str: string): number {
    const len = str.length;
    const frequencies: Record<string, number> = {};

    for (const char of str) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const freq of Object.values(frequencies)) {
      const p = freq / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Remove overlapping secrets, keeping highest confidence
   */
  private deduplicateSecrets(secrets: Secret[]): Secret[] {
    if (secrets.length === 0) return [];

    // Sort by start position
    const sorted = [...secrets].sort((a, b) => a.start - b.start);
    const first = sorted[0];
    if (!first) return [];
    
    const deduplicated: Secret[] = [first];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = deduplicated[deduplicated.length - 1];

      if (!current || !last) continue;

      // Check for overlap
      if (current.start < last.end) {
        // Keep the one with higher confidence
        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        if (confidenceOrder[current.confidence] > confidenceOrder[last.confidence]) {
          deduplicated[deduplicated.length - 1] = current;
        }
      } else {
        deduplicated.push(current);
      }
    }

    return deduplicated;
  }
}

// Made with Bob
