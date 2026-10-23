import test from "node:test";
import assert from "node:assert/strict";
import { createEnvelope, QUEUE_ENVELOPE_VERSION, validateEnvelope } from "../src/index.js";

const valid = {
  version: QUEUE_ENVELOPE_VERSION,
  id: "evt-test-1",
  type: "workflow.run.requested",
  source: "aether-ai-api",
  occurredAt: "2026-10-23T08:00:00.000Z",
  correlationId: "corr-test-1",
  tenantId: "tenant-test-1",
  payload: { runId: "run-test-1" },
};

test("accepts a valid neutral envelope", () => {
  assert.deepEqual(validateEnvelope(valid), { valid: true, errors: [] });
});

test("requires stable version, type, timestamp and correlation ID", () => {
  assert.equal(validateEnvelope({ ...valid, version: "2.0" }).valid, false);
  assert.equal(validateEnvelope({ ...valid, type: "UPPER EVENT" }).valid, false);
  assert.equal(validateEnvelope({ ...valid, occurredAt: "yesterday" }).valid, false);
  assert.equal(validateEnvelope({ ...valid, correlationId: "" }).valid, false);
});

test("rejects non-object envelopes and payloads", () => {
  assert.equal(validateEnvelope(null).valid, false);
  assert.equal(validateEnvelope({ ...valid, payload: [] }).valid, false);
});

test("rejects payloads larger than 1 MiB", () => {
  assert.equal(validateEnvelope({ ...valid, payload: { data: "x".repeat(1_050_000) } }).valid, false);
});

test("factory throws structured validation error", () => {
  assert.throws(() => createEnvelope({ ...valid, id: "" }), error => {
    assert.equal(error.code, "INVALID_QUEUE_ENVELOPE");
    assert.ok(Array.isArray(error.details));
    return true;
  });
});

test("factory creates a versioned envelope without inventing transport behavior", () => {
  const envelope = createEnvelope(valid);
  assert.equal(envelope.version, "1.0");
  assert.equal(envelope.type, valid.type);
  assert.equal(envelope.payload.runId, "run-test-1");
});
