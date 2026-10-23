export type QueueJsonPrimitive = string | number | boolean | null;
export type QueueJsonValue = QueueJsonPrimitive | QueueJsonValue[] | { [key: string]: QueueJsonValue };

export interface QueueEnvelopeV1 {
  readonly schemaVersion: "1";
  readonly messageId: string;
  readonly eventType: string;
  readonly occurredAt: string;
  readonly producer: string;
  readonly correlationId: string;
  readonly tenantRef?: string;
  readonly payload: { readonly [key: string]: QueueJsonValue };
}

export interface QueueEnvelopeLimits {
  readonly maxPayloadBytes?: number;
  readonly maxEnvelopeBytes?: number;
}

export type QueueEnvelopeIssueCode =
  | "invalid_shape"
  | "unsupported_schema"
  | "invalid_identifier"
  | "invalid_timestamp"
  | "invalid_payload"
  | "payload_too_large"
  | "envelope_too_large"
  | "forbidden_payload_field";

export interface QueueEnvelopeIssue {
  readonly code: QueueEnvelopeIssueCode;
  readonly path: string;
}

const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const LABEL = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/;
const FORBIDDEN_KEYS = /^(?:prompt|completion|messages|document|content|authorization|cookie|secret|token|api[_-]?key|password|rawbody)$/i;

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function payloadContainsForbiddenKey(value: unknown, depth = 0): boolean {
  if (depth > 20 || value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(item => payloadContainsForbiddenKey(item, depth + 1));
  return Object.entries(value as Record<string, unknown>).some(([key, item]) =>
    FORBIDDEN_KEYS.test(key) || payloadContainsForbiddenKey(item, depth + 1)
  );
}

/** Schema validation only. It does not authenticate the producer or authorize tenant/resource access. */
export function validateQueueEnvelope(
  value: unknown,
  limits: QueueEnvelopeLimits = {}
): readonly QueueEnvelopeIssue[] {
  if (!isJsonObject(value)) return [{ code: "invalid_shape", path: "/" }];
  const issues: QueueEnvelopeIssue[] = [];
  const maxPayloadBytes = limits.maxPayloadBytes ?? 256 * 1024;
  const maxEnvelopeBytes = limits.maxEnvelopeBytes ?? 300 * 1024;
  if (!Number.isInteger(maxPayloadBytes) || maxPayloadBytes < 1 || maxPayloadBytes > 10 * 1024 * 1024) {
    throw new RangeError("maxPayloadBytes must be an integer between 1 and 10485760.");
  }
  if (!Number.isInteger(maxEnvelopeBytes) || maxEnvelopeBytes < 1 || maxEnvelopeBytes > 12 * 1024 * 1024) {
    throw new RangeError("maxEnvelopeBytes must be an integer between 1 and 12582912.");
  }

  if (value.schemaVersion !== "1") issues.push({ code: "unsupported_schema", path: "/schemaVersion" });
  if (typeof value.messageId !== "string" || !ID.test(value.messageId)) issues.push({ code: "invalid_identifier", path: "/messageId" });
  if (typeof value.eventType !== "string" || !LABEL.test(value.eventType)) issues.push({ code: "invalid_identifier", path: "/eventType" });
  if (typeof value.producer !== "string" || !LABEL.test(value.producer)) issues.push({ code: "invalid_identifier", path: "/producer" });
  if (typeof value.correlationId !== "string" || !ID.test(value.correlationId)) issues.push({ code: "invalid_identifier", path: "/correlationId" });
  if (value.tenantRef !== undefined && (typeof value.tenantRef !== "string" || !ID.test(value.tenantRef))) {
    issues.push({ code: "invalid_identifier", path: "/tenantRef" });
  }
  if (typeof value.occurredAt !== "string" || !Number.isFinite(Date.parse(value.occurredAt))) {
    issues.push({ code: "invalid_timestamp", path: "/occurredAt" });
  }
  if (!isJsonObject(value.payload)) {
    issues.push({ code: "invalid_payload", path: "/payload" });
  } else {
    const payloadBytes = new TextEncoder().encode(JSON.stringify(value.payload)).byteLength;
    if (payloadBytes > maxPayloadBytes) issues.push({ code: "payload_too_large", path: "/payload" });
    if (payloadContainsForbiddenKey(value.payload)) issues.push({ code: "forbidden_payload_field", path: "/payload" });
  }
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > maxEnvelopeBytes) {
    issues.push({ code: "envelope_too_large", path: "/" });
  }
  return issues;
}

export function parseQueueEnvelope(value: unknown, limits: QueueEnvelopeLimits = {}): QueueEnvelopeV1 {
  const issues = validateQueueEnvelope(value, limits);
  if (issues.length > 0) throw new TypeError(`Invalid queue envelope: ${issues.map(issue => issue.code).join(", ")}`);
  return Object.freeze({ ...(value as QueueEnvelopeV1), payload: Object.freeze({ ...(value as QueueEnvelopeV1).payload }) });
}
