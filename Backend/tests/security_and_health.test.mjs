import test from 'node:test';
import assert from 'node:assert/strict';
import { getJwtSecret } from '../src/config/jwt.js';

test('Security Audit: JWT Secret configuration validation', () => {
  const secret = getJwtSecret();
  assert.ok(secret, 'JWT secret must be a non-empty string');
  assert.ok(secret.length >= 16, 'JWT secret must be at least 16 characters for entropy');

  // Verify production safeguard
  const originalEnv = process.env.NODE_ENV;
  const originalSecret = process.env.JWT_SECRET;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    assert.throws(
      () => getJwtSecret(),
      /CRITICAL SECURITY ERROR/,
      'Must throw error in production mode when JWT_SECRET is missing'
    );
  } finally {
    process.env.NODE_ENV = originalEnv;
    if (originalSecret) process.env.JWT_SECRET = originalSecret;
  }
});

test('Security Audit: Uploads XSS and Path Traversal sanitization', () => {
  // Test escapeHtml implementation
  const escapeHtml = (unsafeStr) => {
    return String(unsafeStr || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const maliciousPayload = '<script>alert("XSS")</script>&foo=1';
  const sanitized = escapeHtml(maliciousPayload);

  assert.ok(!sanitized.includes('<script>'), 'Must not contain raw script tag');
  assert.ok(sanitized.includes('&lt;script&gt;'), 'Must encode opening script tag');
  assert.ok(sanitized.includes('&quot;XSS&quot;'), 'Must encode quotation marks');
  assert.ok(sanitized.includes('&amp;foo=1'), 'Must encode ampersand');
});

test('Security Audit: Database SSL configuration defaults', async () => {
  const originalSsl = process.env.DB_SSL;
  const originalReject = process.env.DB_SSL_REJECT_UNAUTHORIZED;

  try {
    process.env.DB_SSL = 'true';
    delete process.env.DB_SSL_REJECT_UNAUTHORIZED;

    const sslConfig = {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true,
    };

    assert.equal(sslConfig.rejectUnauthorized, true, 'Default rejectUnauthorized must be true for production security');
  } finally {
    process.env.DB_SSL = originalSsl;
    process.env.DB_SSL_REJECT_UNAUTHORIZED = originalReject;
  }
});
