export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
}

export function retryDelayMs(failedAttempt: number, policy: RetryPolicy): number {
  if (!Number.isInteger(policy.maxAttempts) || policy.maxAttempts < 1 || policy.maxAttempts > 20) {
    throw new RangeError("maxAttempts must be an integer between 1 and 20.");
  }
  if (!Number.isInteger(policy.baseDelayMs) || policy.baseDelayMs < 0 || policy.baseDelayMs > 60_000) {
    throw new RangeError("baseDelayMs must be an integer between 0 and 60000.");
  }
  if (!Number.isInteger(policy.maxDelayMs) || policy.maxDelayMs < policy.baseDelayMs || policy.maxDelayMs > 3_600_000) {
    throw new RangeError("maxDelayMs must be an integer from baseDelayMs to 3600000.");
  }
  if (!Number.isInteger(failedAttempt) || failedAttempt < 1 || failedAttempt >= policy.maxAttempts) {
    throw new RangeError("failedAttempt must be between 1 and maxAttempts - 1.");
  }
  return Math.min(policy.maxDelayMs, policy.baseDelayMs * (2 ** (failedAttempt - 1)));
}
