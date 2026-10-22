# Dependencies and Contracts — aether-ai-queue

**Status:** Proposed; technology selections remain open unless an accepted ADR says otherwise.

## Dependencies
Selected queue adapter (TBD), versioned neutral message envelopes, and an optional low-level telemetry interface. Orchestration, workflows and billing are producers/consumers of queue contracts; the queue implementation must not import their domain packages.

## Owned contracts
Delivery semantics, idempotency, ordering assumptions, visibility/lease timeouts, dead-letter handling, message schema versioning.

## Requirements
- Version public schemas and message envelopes.
- Document limits, timeouts, retry behavior, idempotency, cancellation, and error handling where relevant.
- Preserve correlation IDs across API, agent, tool, queue, and provider operations.
- Document operational signals and failure recovery, not only the happy path.

Use versioned schemas, safe stable errors, bounded payloads/timeouts/retries, explicit idempotency and compatibility policy. Every schema change needs consumer review, migration notes and positive/negative fixtures. No repository boundary automatically requires a separate deployed service.

- [Master catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md)
- [Master architecture](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/MASTER_ARCHITECTURE.md)
- [Security threat model](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/SECURITY_THREAT_MODEL.md)
- [Repository specification](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/repositories/aether-ai-queue.md)
