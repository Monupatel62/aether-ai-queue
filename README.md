# aether-ai-queue

**Status:** Transport-neutral queue envelope and retry-policy primitives implemented on a feature branch. No queue transport is selected or deployed.

## Implemented

- [Queue contract source](src/index.js): versioned message envelope, tenant/correlation/idempotency context, bounded payload size, retry-policy validation, and bounded exponential retry delay.
- [Unit tests](test/queue.test.js): envelope shape, invalid/oversized payloads, retry bounds, and delay behavior.
- Dependency-free Node.js package with Node 20/22 CI.

## Limitations

This is a contract layer only. It does not provide durable queue delivery, deduplication storage, consumer leases, dead-letter queues, event ordering, outbox/inbox transactions, or crash recovery. A selected transport adapter must enforce these guarantees and must treat the envelope payload as untrusted.

## Documentation

- [Repository specification](docs/REPOSITORY_SPECIFICATION.md)
- [Project specification](docs/PROJECT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Dependencies and contracts](docs/DEPENDENCIES_AND_CONTRACTS.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Security review](docs/SECURITY_REVIEW.md)
- [Master catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md)
