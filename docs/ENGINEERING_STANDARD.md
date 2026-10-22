# Engineering Standard — aether-ai-queue

Applies when implementation is explicitly authorized:
- Validate message schema and version at ingress.
- Treat broker delivery as at-least-once unless a selected broker proves otherwise; handlers must be idempotent.
- Bound payload size, visibility/lease timeouts, retries, backoff and concurrency.
- Define dead-letter, replay, ordering and poison-message handling before production use.
- Do not put raw prompts, secrets or large customer payloads in queue messages; prefer opaque identifiers.
- Preserve correlation IDs; redact sensitive data in telemetry.
- Use least-privilege producer/consumer identities and runtime-only secrets.
- Add duplicate, out-of-order, replay, tenant mismatch and crash-recovery tests.

[Master catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md)
