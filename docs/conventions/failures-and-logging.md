# Failure and logging conventions

This topic owns returned outcomes, error boundaries, safe diagnostics, and log responsibility.

## 1. Outcomes and errors

Return a documented outcome when the caller acts on it. Throw when a failure aborts work; do not add a result member that every caller merely forwards. Absence, refusal, dependency failure, and a broken stored invariant remain distinct. Do not report a failed read as empty data or a failed persistence operation as successful completion.

Catch where code can recover, settle owned work, or translate a response. Otherwise propagate unchanged. Keep deterministic transformations outside catches for provider calls. Do not add catch-and-rethrow blocks, swallow errors, or retry without an owning contract.

Use typed facts and stable closed reasons for classification, preserving useful causes. Never classify errors by matching message text or expose arbitrary dependency errors to clients. Keep known failure conditions in the owning declaration's [TSDoc](comments.md#12-production-failure-contracts).

## 2. Log ownership

Log a handled failure once at its owner. An adapter records transport facts; the request or job owner records the outcome and meaning. Do not log the same propagated error at every layer. Keep successful lifecycle events, expected refusals, dependency failures, and invariant violations distinguishable through appropriate levels and event names.

Process composition roots build the logger. Only an owner that writes lines receives or captures it; do not pass it through a function or dependency object merely for a deeper caller. Business functions do not read a global logger. Adapters retain a logger for their own outbound-call facts. Stores and pure folders never log; they return fields for the caller to log.

Use structured Pino fields with request, run, job, account, and deployment identifiers only where the line's scope needs them. Use stable dotted event names and `snake_case` fields; include explicit units such as `duration_ms` and a one-based `attempt`. A provider's HTTP status is distinct from this API's response status. Preserve existing event consumers when changing names.

## 3. Safe evidence

Redact credentials and authorization headers. Do not log raw request bodies, prompts, complete private inputs, sandbox environment values, signed authority, or provider secrets. Select useful typed facts rather than serializing arbitrary errors, SDK objects, or config.

Expose safe error responses and public health details. Logs and health must identify the deployed source/revision and outcome without claiming feature success from liveness alone. Report partial deployment, persistence failure, and cleanup failure with enough safe context for the operator to act.

Tests must exercise classification, redaction, response mapping, and the owner of a handled failure when those contracts change. A log check can enforce known field rules; reviewers still assess privacy and meaning.
