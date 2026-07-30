/**
 * Tests for host-header hardening in the landing-page server.
 * Run with: node --test server/serve.test.js
 */
const test = require("node:test");
const assert = require("node:assert");

const {
  buildAllowedHosts,
  sanitizeHost,
  defaultHost,
  resolveRequestHost,
} = require("./serve");

const allowed = buildAllowedHosts({
  ALLOWED_HOSTS: "myapp.replit.app, Example.COM:443",
  REPLIT_DEV_DOMAIN: "dev.replit.dev",
});

test("buildAllowedHosts normalizes hostnames and strips ports", () => {
  assert.ok(allowed.has("myapp.replit.app"));
  assert.ok(allowed.has("example.com"));
  assert.ok(allowed.has("dev.replit.dev"));
  assert.ok(allowed.has("localhost"));
});

test("accepts allowlisted hosts, with or without port", () => {
  assert.strictEqual(sanitizeHost("myapp.replit.app", allowed), "myapp.replit.app");
  assert.strictEqual(sanitizeHost("myapp.replit.app:443", allowed), "myapp.replit.app:443");
  assert.strictEqual(sanitizeHost("EXAMPLE.com", allowed), "EXAMPLE.com");
});

test("rejects non-allowlisted but syntactically valid hosts", () => {
  assert.strictEqual(sanitizeHost("evil.attacker.com", allowed), null);
  assert.strictEqual(sanitizeHost("myapp.replit.app.evil.com", allowed), null);
});

test("rejects hosts with injection payloads or invalid characters", () => {
  assert.strictEqual(sanitizeHost('";alert(document.cookie)//', allowed), null);
  assert.strictEqual(sanitizeHost("a<b>.com", allowed), null);
  assert.strictEqual(sanitizeHost("host/path", allowed), null);
  assert.strictEqual(sanitizeHost(["array.com"], allowed), null);
  assert.strictEqual(sanitizeHost(undefined, allowed), null);
});

test("spoofed x-forwarded-host falls back to Host, then default", () => {
  assert.strictEqual(
    resolveRequestHost(
      { "x-forwarded-host": "evil.com", host: "myapp.replit.app" },
      allowed,
    ),
    "myapp.replit.app",
  );
  assert.strictEqual(
    resolveRequestHost({ "x-forwarded-host": "evil.com", host: "evil2.com" }, allowed),
    defaultHost(allowed),
  );
});

test("allowlisted x-forwarded-host is honored over Host", () => {
  assert.strictEqual(
    resolveRequestHost(
      { "x-forwarded-host": "myapp.replit.app", host: "localhost:3000" },
      allowed,
    ),
    "myapp.replit.app",
  );
});

test("defaultHost prefers a non-localhost allowlisted host", () => {
  assert.strictEqual(defaultHost(allowed), "myapp.replit.app");
  assert.strictEqual(defaultHost(buildAllowedHosts({})), "localhost");
});
