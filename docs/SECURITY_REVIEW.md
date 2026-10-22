# Security Review — aether-ai-queue

**Status:** Design checklist only; no audit or certification claimed.

## Assets and threats
Tenant data, identifiers, credentials, configuration, audit records and service interfaces may be exposed through cross-tenant access, forged/stale context, malformed payloads, replay, resource exhaustion, unsafe dependencies or log leaks.

## Required controls
Queue messages are untrusted input even when delivered by internal infrastructure. Authenticate producers, validate schema/version, apply tenant scoping, bound message size and retries, prevent replay where relevant, and ensure duplicate delivery cannot repeat non-idempotent side effects.

- Validate all trust-boundary payloads.
- Use least-privilege identities and runtime-only secrets.
- Enforce authorization at resource ownership boundaries.
- Define retention, deletion and telemetry redaction.
- Review dependency licenses, provenance, vulnerabilities and CI permissions.

## Verification
Test duplicate/out-of-order messages, invalid schema versions, oversized messages, retry exhaustion, dead-letter behavior, tenant mismatch, replay, and crash recovery.

Before release, add unit tests, contract tests for direct dependencies, negative authorization/input tests, and failure/recovery tests for the behavior this component owns. Use synthetic or sanitized data only.
- [ ] Positive/negative contract fixtures run in CI.
- [ ] Tenant isolation and denial paths tested.
- [ ] Secret and dependency scans recorded.
- [ ] Failure/retry/recovery behavior tested.
