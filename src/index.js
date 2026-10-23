export const QUEUE_ENVELOPE_VERSION = "1.0";
const MAX_ID_LENGTH = 200;
const MAX_TYPE_LENGTH = 160;
const MAX_PAYLOAD_BYTES = 1_048_576;

const isText = (value, max = MAX_ID_LENGTH) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

const isIsoDate = (value) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;

function utf8Size(value) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

/**
 * Validate the transport-neutral message envelope. This validates shape only;
 * it does not authenticate publishers, authorize consumers, or guarantee delivery.
 */
export function validateEnvelope(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { valid: false, errors: ["envelope must be an object"] };
  }
  if (value.version !== QUEUE_ENVELOPE_VERSION) errors.push("version must be 1.0");
  if (!isText(value.id)) errors.push("id must be a non-empty string of at most 200 characters");
  if (!isText(value.type, MAX_TYPE_LENGTH) || !/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/.test(value.type ?? "")) {
    errors.push("type must be a stable lowercase event name");
  }
  if (!isText(value.source, MAX_TYPE_LENGTH)) errors.push("source must be a non-empty string");
  if (!isIsoDate(value.occurredAt)) errors.push("occurredAt must be an ISO 8601 UTC timestamp");
  if (!isText(value.correlationId)) errors.push("correlationId is required");
  if (value.causationId !== undefined && !isText(value.causationId)) errors.push("causationId must be a non-empty string when supplied");
  if (value.tenantId !== undefined && !isText(value.tenantId)) errors.push("tenantId must be a non-empty string when supplied");
  if (!value.payload || typeof value.payload !== "object" || Array.isArray(value.payload)) {
    errors.push("payload must be a JSON object");
  } else {
    try {
      if (utf8Size(value.payload) > MAX_PAYLOAD_BYTES) errors.push("payload exceeds 1 MiB");
    } catch {
      errors.push("payload must be JSON serializable");
    }
  }
  if (value.metadata !== undefined && (!value.metadata || typeof value.metadata !== "object" || Array.isArray(value.metadata))) {
    errors.push("metadata must be an object when supplied");
  }
  return { valid: errors.length === 0, errors };
}

export function createEnvelope(input) {
  const envelope = {
    version: QUEUE_ENVELOPE_VERSION,
    id: input?.id,
    type: input?.type,
    source: input?.source,
    occurredAt: input?.occurredAt,
    correlationId: input?.correlationId,
    ...(input?.causationId === undefined ? {} : { causationId: input.causationId }),
    ...(input?.tenantId === undefined ? {} : { tenantId: input.tenantId }),
    payload: input?.payload,
    ...(input?.metadata === undefined ? {} : { metadata: input.metadata }),
  };
  const result = validateEnvelope(envelope);
  if (!result.valid) {
    const error = new TypeError("Invalid queue envelope: " + result.errors.join("; "));
    error.code = "INVALID_QUEUE_ENVELOPE";
    error.details = result.errors;
    throw error;
  }
  return Object.freeze(envelope);
}
