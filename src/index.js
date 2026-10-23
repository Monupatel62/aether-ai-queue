import { randomUUID } from "node:crypto";

const ID = /^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,255}$/;
const MESSAGE_TYPES = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;

export class QueueContractError extends Error {
  constructor(code, message = "Queue message is invalid") { super(message); this.name = "QueueContractError"; this.code = code; }
}
function isRecord(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function validId(value) { return typeof value === "string" && ID.test(value) && value.trim() === value; }
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
function safeJsonSize(value) {
  try { return Buffer.byteLength(JSON.stringify(value)); }
  catch { throw new QueueContractError("invalid_payload", "Message payload must be JSON-serializable"); }
}

/** Build a versioned message envelope. Payload remains domain-owned and untrusted. */
export function createEnvelope({ type, schemaVersion = 1, tenantId, payload, idempotencyKey, correlationId, now = Date.now() }) {
  if (typeof type !== "string" || !MESSAGE_TYPES.test(type)) throw new QueueContractError("invalid_type");
  if (!Number.isSafeInteger(schemaVersion) || schemaVersion < 1) throw new QueueContractError("invalid_schema_version");
  if (!validId(tenantId)) throw new QueueContractError("invalid_tenant");
  if (!isRecord(payload)) throw new QueueContractError("invalid_payload", "Payload must be an object");
  if (safeJsonSize(payload) > 262_144) throw new QueueContractError("payload_too_large");
  if (!validId(idempotencyKey)) throw new QueueContractError("invalid_idempotency_key");
  if (correlationId !== undefined && !validId(correlationId)) throw new QueueContractError("invalid_correlation_id");
  if (!Number.isSafeInteger(now) || now < 0) throw new QueueContractError("invalid_timestamp");
  return Object.freeze({
    id: randomUUID(),
    type,
    schemaVersion,
    tenantId,
    idempotencyKey,
    correlationId: correlationId ?? null,
    createdAt: now,
    payload: deepFreeze(JSON.parse(JSON.stringify(payload))),
  });
}

/** Validate retry configuration; actual delivery semantics belong to the transport adapter. */
export function validateRetryPolicy(input) {
  if (!isRecord(input)) throw new QueueContractError("invalid_retry_policy");
  const { maxAttempts, initialDelayMs, maxDelayMs, multiplier } = input;
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) throw new QueueContractError("invalid_retry_attempts");
  if (!Number.isSafeInteger(initialDelayMs) || initialDelayMs < 0 || initialDelayMs > 300_000) throw new QueueContractError("invalid_initial_delay");
  if (!Number.isSafeInteger(maxDelayMs) || maxDelayMs < initialDelayMs || maxDelayMs > 3_600_000) throw new QueueContractError("invalid_max_delay");
  if (typeof multiplier !== "number" || !Number.isFinite(multiplier) || multiplier < 1 || multiplier > 10) throw new QueueContractError("invalid_multiplier");
  return Object.freeze({ maxAttempts, initialDelayMs, maxDelayMs, multiplier });
}

export function retryDelayMs(policyInput, failedAttempt, jitter = 0) {
  const policy = validateRetryPolicy(policyInput);
  if (!Number.isSafeInteger(failedAttempt) || failedAttempt < 1 || failedAttempt >= policy.maxAttempts) return null;
  if (typeof jitter !== "number" || !Number.isFinite(jitter) || jitter < 0 || jitter > 1) throw new QueueContractError("invalid_jitter");
  const base = Math.min(policy.maxDelayMs, policy.initialDelayMs * (policy.multiplier ** (failedAttempt - 1)));
  return Math.floor(base * (1 - jitter + Math.random() * jitter));
}
