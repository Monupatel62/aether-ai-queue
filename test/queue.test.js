import test from "node:test";
import assert from "node:assert/strict";
import { createEnvelope, QueueContractError, retryDelayMs, validateRetryPolicy } from "../src/index.js";

const policy = { maxAttempts: 4, initialDelayMs: 100, maxDelayMs: 1000, multiplier: 2 };

test("creates a versioned envelope with tenant and idempotency context", () => {
  const envelope = createEnvelope({ type: "run.created", tenantId: "tenant-a", idempotencyKey: "key-1", correlationId: "trace-1", payload: { runId: "run-1" }, now: 123 });
  assert.equal(envelope.type, "run.created");
  assert.equal(envelope.schemaVersion, 1);
  assert.equal(envelope.tenantId, "tenant-a");
  assert.equal(envelope.createdAt, 123);
  assert.equal(Object.isFrozen(envelope.payload), true);
});

test("rejects malformed or oversized messages", () => {
  assert.throws(() => createEnvelope({ type: "Bad Type", tenantId: "tenant-a", idempotencyKey: "key", payload: {} }), QueueContractError);
  assert.throws(() => createEnvelope({ type: "run.created", tenantId: "tenant-a", idempotencyKey: "key", payload: [] }), QueueContractError);
  assert.throws(() => createEnvelope({ type: "run.created", tenantId: "tenant-a", idempotencyKey: "key", payload: { data: "x".repeat(300000) } }), QueueContractError);
  assert.throws(() => createEnvelope({ type: "run.created", tenantId: "tenant-a", idempotencyKey: "", payload: {} }), QueueContractError);
});

test("validates retry policy bounds", () => {
  assert.deepEqual(validateRetryPolicy(policy), policy);
  assert.throws(() => validateRetryPolicy({ ...policy, maxAttempts: 100 }), QueueContractError);
  assert.throws(() => validateRetryPolicy({ ...policy, multiplier: 0 }), QueueContractError);
});

test("calculates bounded retry delays and stops at max attempts", () => {
  assert.equal(retryDelayMs(policy, 1, 0), 100);
  assert.equal(retryDelayMs(policy, 2, 0), 200);
  assert.equal(retryDelayMs(policy, 4, 0), null);
  assert.equal(retryDelayMs({ ...policy, initialDelayMs: 1000, maxDelayMs: 1000 }, 3, 0), 1000);
});

test("rejects invalid jitter and attempt numbers", () => {
  assert.throws(() => retryDelayMs(policy, 1, 2), QueueContractError);
  assert.equal(retryDelayMs(policy, 0), null);
});
