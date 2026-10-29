# MyStacks agent backend

## 1. Purpose

`ms-agentic-be` is the repository for the MyStacks personal investing agent backend. Phase 1 focuses on concise financial answers and reports in chat, supported by provider data, calculations, and background tasks. It contains the product requirements and architecture documents; application implementation has not started.

## 2. Documentation

- [Context](CONTEXT.md): project status, document ownership, and decision boundaries.
- [Requirements](docs/requirements.md): product behavior, financial authority, and scale assumptions.
- [Architecture](docs/architecture.md): tentative overall design using the selected Mastra shared runtime, E2B sandbox, and one PostgreSQL database, with direct chat, queued background work, and main-agent continuations.
- [Architecture diagram](docs/architecture.html): browser-viewable conversation flow and trusted backend boundaries.
- [Architecture decision records](docs/ADRS/README.md): explicit decisions, alternatives, and accepted trade-offs for runtime execution, security, channels, memory, storage, and product boundaries.
- [User stories](docs/user-stories/README.md): the complete Phase 1 experience, observable outcomes, and open product decisions.
- [Technical designs](docs/design/README.md): responsibilities and flows supporting those stories, including [turn and subagent examples](docs/design/runtime.md) and [proactive investigation behavior](docs/design/tasks.md); the overall architecture remains under review.
