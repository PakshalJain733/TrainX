import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * HTTP Client to communicate securely with Career Gateway API endpoints.
 * Handles Machine-to-Machine JWT generation, exponential backoff, and timeouts.
 */
export class CareerGatewayClient {
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || process.env.CAREER_GATEWAY_API_URL || 'https://api.careergateway.edu').replace(/\/+$/, '');
    // Dedicated outbound secret agreed with Career Gateway for TrainX -> Career Gateway requests
    // SEC-02: Strict validation - no hardcoded fallback allowed
    this.serviceSecret = options.serviceSecret || process.env.TRAINX_TO_CAREER_GATEWAY_SECRET || process.env.CAREER_GATEWAY_OUTBOUND_SECRET || process.env.TRAINX_INTEGRATION_SERVICE_KEY || null;
    this.timeoutMs = options.timeoutMs || 15000;
  }

  /**
   * Generates outbound Service Token to authenticate TrainX against Career Gateway.
   * Algorithm: HS256
   * Issuer: 'trainx'
   * Audience: 'career-gateway'
   * Scope: 'training_sync'
   * Expiry: 15 minutes
   */
  async getOutboundServiceToken() {
    if (!this.serviceSecret || typeof this.serviceSecret !== 'string' || !this.serviceSecret.trim()) {
      throw new Error(
        'TRAINX_TO_CAREER_GATEWAY_SECRET is required but not configured. Outbound Career Gateway requests cannot be signed securely.'
      );
    }

    return jwt.sign(
      {
        iss: 'trainx',
        aud: 'career-gateway',
        sub: 'trainx-export-service',
        scope: 'training_sync',
        jti: crypto.randomUUID(),
      },
      this.serviceSecret,
      { algorithm: 'HS256', expiresIn: '15m' }
    );
  }

  /**
   * Dispatches training export batch to Career Gateway.
   * Target endpoint: POST /api/integrations/trainx/training-records
   */
  async sendTrainingRecords(exportPayload) {
    const token = await this.getOutboundServiceToken();
    const endpoint = `${this.baseUrl}/api/integrations/trainx/training-records`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(exportPayload),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          `Career Gateway API responded with status ${response.status}: ${data.message || response.statusText}`
        );
      }

      return data;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`Career Gateway API request timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }
}
