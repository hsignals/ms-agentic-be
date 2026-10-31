# Native channel context compaction

## 1. Status and scope

**Status: ACCEPTED Phase 1 context and compaction direction.** Each channel uses the account-shared structured personal profile, recent same-channel raw history, a compact summary of older same-channel history, and relevant request or job inputs. Mastra's native Observational Memory supplies channel compaction. Overall architecture, exact budgets, models, and runtime integration remain tentative.

The [runtime design](../design/runtime.md) owns execution details and verification. The [channel-scope decision](0008-channel-scoped-work-and-shared-memory.md) owns account-wide personal memory and channel-scoped conversations and work. This record owns the compaction choice and its trade-offs.

## 2. Decision

Use native per-thread Observational Memory, with its Observer and Reflector, to compact older channel history while retaining recent raw context. Compaction uses token thresholds during agent execution and may buffer observations in the background. It is not a user-scheduled financial task or a separate application scheduler. Native observations are appended and periodically condensed; raw stored conversation history remains retained. See [Mastra Observational Memory](https://mastra.ai/docs/memory/observational-memory) and its [configuration reference](https://mastra.ai/reference/memory/observational-memory).

Keep history and observations within their channel's authorized thread. The shared profile supplies account-wide personal context; it does not make channel transcripts shared. Phase 1 does not select vector recall or cross-channel history search.

Observer and Reflector summary writing does not authorize shared-profile updates or nested research subagents. Main-agent turns retain native personal-profile updates; research and background agents retain read-only profile access under the [delegation decision](0009-channel-turns-and-background-subagents.md).

## 3. Rationale and alternatives

**Native compaction keeps long conversations usable within a bounded model context.** Recent raw messages preserve current detail; compact older observations preserve useful continuity. A fixed message count ignores differences in message size. Keeping the full raw history in every prompt would consume increasing context; discarding all older history would lose useful same-channel context.

**Use the framework's existing memory lifecycle.** A custom summarizer, separate scheduler, or application-owned memory agents would duplicate threshold checks, observation updates, and condensation already supplied by Mastra. Native background buffering remains part of context management and does not expand the product's delegation authority.

**Retaining raw transcripts preserves the stored conversation independently of prompt size.** Compaction can omit detail or misrepresent it; it is not a complete replacement for the raw record. This also means compaction does not provide deletion, and profile-only forgetting leaves transcripts and summaries intact under the [forgetting decision](0011-profile-only-forgetting.md).

## 4. Consequences and open choices

- **Isolation:** context uses only the current channel's raw history and observations alongside the shared profile and authorized request inputs.
- **Budgets:** raw-history, summary, and total model-context token budgets and Observer and Reflector model choices remain open. Vendor defaults are illustrative rather than selected MyStacks caps; the runtime design records their current shape.
- **Authority:** native compaction does not gain personal-profile write permission or change the one-level research-subagent boundary.
- **Retention:** raw transcripts survive compaction. History and summary retention periods remain open, separate from profile-only forgetting.
