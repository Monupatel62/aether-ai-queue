# aether-ai-queue

Queue abstraction, versioned message envelopes, retry/dead-letter semantics, and worker delivery guarantees.

**Status:** Initial queue envelope and retry-policy utilities are in review; no broker adapter or worker runtime is implemented.

## Docs

- [Project specification](docs/PROJECT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Dependencies and contracts](docs/DEPENDENCIES_AND_CONTRACTS.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Technical design](docs/TECHNICAL_DESIGN.md)
- [Security review](docs/SECURITY_REVIEW.md)
- [Research and licenses](docs/RESEARCH_AND_LICENSES.md)
- [Engineering standard](docs/ENGINEERING_STANDARD.md)
- [Work log](docs/WORKLOG.md)
- Initial implementation: bounded versioned envelope validation and deterministic exponential retry delay helper.

- [Master catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md)
- [Master architecture](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/MASTER_ARCHITECTURE.md)
- [Security threat model](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/SECURITY_THREAT_MODEL.md)
- [Repository specification](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/repositories/aether-ai-queue.md)
