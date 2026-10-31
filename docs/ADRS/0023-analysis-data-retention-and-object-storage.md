# Analysis data retention and object storage

## 1. Status and scope

**Status: ACCEPTED analysis retention and file-storage direction.** MyStacks retains useful analysis data for explanations and follow-ups, using private Google Cloud Storage (GCS) for retained datasets and workspace files and PostgreSQL for application records, small structured results, metadata, and file references. Automatic pruning is deferred. Provider-specific permitted retention and data rights still apply; the overall architecture remains tentative.

This decision owns retained analysis data and file storage. The [PostgreSQL decision](0013-shared-postgresql-storage.md) owns application and Mastra record storage, the [execution decision](0003-sandboxed-code-execution.md) owns ephemeral E2B runs, and the [current-evidence decision](0019-current-portfolio-evidence.md) owns freshness for financial claims.

## 2. Decision

### 2.1 Retain useful inputs, calculations, results, and evidence

Retain useful provider inputs actually used, reusable intermediate calculations, final results, and supporting evidence. Examples include provider-supplied transaction or trade history, price or position datasets, and cleaned or joined analysis files. Be conservative about discarding data that can explain a result or support a follow-up, within the provider's permitted data rights.

Automatic pruning is deferred. Retained data must carry enough metadata for later identification and cleanup:

- **Ownership:** account, originating channel, and run.
- **Data identity:** data type and provider/connection where applicable.
- **Times:** saved time, retrieval time, and source as-of time, allowing an explicit unknown source time.
- **Storage:** size and storage reference, including the object reference for a retained file.

The exact schema remains an implementation choice. These storage metadata supplement the financial evidence contract; native values, units, coverage, gaps, assumptions, and calculation basis remain associated with the evidence where needed to explain the result.

### 2.2 Store records and files by purpose

**PostgreSQL owns normal application and Mastra records, small structured results, retained-data metadata, and file references. Private GCS owns retained datasets and workspace files.** Tools may return small structured responses directly; file storage serves retained files rather than a mandatory size threshold for every response. GCS stores file data together with object metadata. [Cloud Storage objects](https://docs.cloud.google.com/storage/docs/objects)

Trusted backend code controls access and resolves the current account and applicable channel/run authority before exporting or restoring files. Account-owned financial evidence may support authorized follow-ups from linked channels; retained files do not grant access to another channel's conversations, jobs, scheduled tasks, or results. Agents and sandboxes must not receive broad cloud-storage credentials or unrestricted bucket access. Public-exposure controls do not establish application account/channel authorization. [Cloud Storage public access prevention](https://docs.cloud.google.com/storage/docs/public-access-prevention)

### 2.3 Save files across ephemeral runs

Before destroying an E2B sandbox, save useful retained files outside it and persist required results, metadata, and file references. A later authorized run may restore selected files into a fresh sandbox. Each invocation or job attempt that needs execution still owns one ephemeral sandbox; the Mastra agent loop stays in the backend.

Prefer native GCS and E2B SDK capabilities when they meet the access and lifecycle requirements. The exact backend-controlled, run-scoped transfer mechanism remains open. Raw provider credentials stay outside sandbox code and files under the [credential decision](0002-backend-owned-financial-credentials.md); saved data does not carry credential authority into later runs.

### 2.4 Preserve freshness and scope

Saved data supports explanations and follow-ups only while its evidence and permitted use support the claim. Saving, retrieving, or restoring a file does not change its source as-of time or make old holdings current. Current financial claims still require suitable current evidence under the current-evidence decision.

Retaining useful data does not establish exact process replay, durable reasoning checkpoints, or a requirement to save every scratch file or log. Phase 1 does not add an indexer or continuous portfolio-history archive; future portfolio-history tables still begin as Tiger Cloud hypertables when that deferred infrastructure is built.

## 3. Rationale and alternatives

**Retained data makes follow-ups useful.** Saving only a prose answer can lose the provider inputs, transformations, or supporting evidence needed to explain or extend it. Keeping useful data allows a fresh authorized run to continue analysis without keeping an idle VM or interpreter alive.

**Storage by purpose keeps each owner clear.** PostgreSQL remains the record store for the application and Mastra, while GCS holds retained files. Requiring every tool response to become an object would add file handling to ordinary structured reads; keeping datasets and workspace files in PostgreSQL would mix file storage with record ownership. GCS fits the existing GCP application infrastructure, with file references resolved by the backend.

**Deferred pruning accepts storage growth while usefulness is understood.** An arbitrary retention period could discard useful inputs before a follow-up. Retaining useful data requires ownership, source, time, size, and reference metadata so later cleanup can make informed choices. The trade-off is storage cost and a future pruning policy; provider data rights continue to constrain what may be retained.

## 4. Consequences and open choices

- **Implementation:** settle metadata schemas, object organization, bucket and IAM configuration, and the trusted run-scoped transfer mechanism without granting broad storage access to generated code.
- **Provider terms:** validate permitted retention and reuse for each provider and evidence type before retaining that data.
- **Operations:** settle storage configuration and backup/recovery responsibilities. Automatic pruning, numeric retention periods, and cleanup mechanisms remain deferred.
- **Acceptance evidence:** save useful inputs, intermediate files, and final evidence before sandbox destruction; restore selected files in a later authorized fresh sandbox; reject unauthorized account/channel access; preserve unknown source times and distinguish saved or retrieved time from financial freshness.
