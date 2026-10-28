# MyStacks agent backend

## 1. Purpose

`ms-agentic-be` is the repository for the MyStacks personal investing agent backend. Phase 1 focuses on concise financial answers and reports in chat, supported by provider data, calculations, and background tasks. It contains the product requirements and architecture documents; application implementation has not started.

## 2. Documentation

- [Context](CONTEXT.md): project status, document ownership, and decision boundaries.
- [Requirements](docs/requirements.md): product behavior, financial authority, and scale assumptions.
- [Architecture](docs/architecture.md): tentative overall design using the selected Mastra shared runtime and E2B sandbox, with account, channel, and background-execution responsibilities.
- [Architecture diagram](docs/architecture.html): browser-viewable conversation flow and trusted backend boundaries.
- [Architecture decision records](docs/ADRS/): decisions, alternatives, and trade-offs, including [channel-scoped work and shared memory](docs/ADRS/0008-channel-scoped-work-and-shared-memory.md).
- [User stories](docs/user-stories/README.md): the complete Phase 1 experience, observable outcomes, and open product decisions.
- [Technical designs](docs/design/README.md): tentative responsibilities and flows supporting those stories, to be finalized together in the architecture design round.
