import { describe, expect, it } from "vitest";
import { parseQueueEnvelope, retryDelayMs, validateQueueEnvelope } from "../src/index.js";
import type { QueueEnvelopeV1 } from "../src/index.js";

const valid: QueueEnvelopeV1 = {
  schemaVersion: "1",
  messageId: "msg-123",
  eventType: "run.status.changed",
  occurredAt: "2026-10-23T12:00:00.000Z",
  producer: "orchestration",
  correlationId: "corr-123",
  tenantRef: "tenant-abc",
  payload: { runRef: "run-123", state: "queued" }
};

describe("queue envelope contract", () => {
  it("accepts bounded metadata-only event envelopes", () => {
    expect(validateQueueEnvelope(valid)).toEqual([]);
    expect(parseQueueEnvelope(valid).messageId).toBe("msg-123");
  });

  it("rejects raw prompt/content/credential fields from payloads", () => {
    const invalid = { ...valid, payload: { runRef: "run-123", prompt: "private text", token: "synthetic-secret" } };
    const codes = validateQueueEnvelope(invalid).map(issue => issue.code);
    expect(codes).toContain("forbidden_payload_field");
  });

  it("rejects malformed IDs, timestamps, schema versions, and oversized payloads", () => {
    const invalid = { ...valid, schemaVersion: "2", messageId: "../bad", occurredAt: "not-a-date", payload: { note: "x".repeat(1000) } };
    const codes = validateQueueEnvelope(invalid, { maxPayloadBytes: 100 }).map(issue => issue.code);
    expect(codes).toContain("unsupported_schema");
    expect(codes).toContain("invalid_identifier");
    expect(codes).toContain("invalid_timestamp");
    expect(codes).toContain("payload_too_large");
  });

  it("computes deterministic bounded exponential retry delays", () => {
    const policy = { maxAttempts: 5, baseDelayMs: 100, maxDelayMs: 500 };
    expect([1, 2, 3, 4].map(attempt => retryDelayMs(attempt, policy))).toEqual([100, 200, 400, 500]);
    expect(() => retryDelayMs(5, policy)).toThrow();
  });
});
