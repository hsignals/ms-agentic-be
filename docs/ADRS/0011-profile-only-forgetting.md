# Profile-only forgetting

## 1. Status and scope

**Status: ACCEPTED Phase 1 forgetting scope and limits.** A chat request to forget changes only the account-shared saved personal profile. Channel transcripts and observational summaries remain unchanged. Overall architecture and retention policies remain tentative.

The [memory stories](../user-stories/memory.md) own observable controls; the [runtime design](../design/runtime.md) owns native tool use and verification. This record owns the removal boundary and its accepted trade-offs.

## 2. Decision

Use the same native personal-profile update tool for remembering, correction, and forgetting. The main agent infers the relevant field deletion or text edit from the user's request and resolves material ambiguity before removing the wrong content. Forgetting a specific detail preserves unrelated saved facts; “forget everything” clears the saved personal profile across the account.

Report whether the profile change saved successfully and explain its scope. Forgetting does not delete channel transcripts or summaries and is separate from account deletion, financial-data deletion, and artifact, backup, or provider retention controls.

**Accepted limit:** a removed fact can remain in context, influence an answer, and be learned into the profile again. Instruct the model not to recreate removed profile content solely from older history; that instruction is best effort rather than an enforced guarantee. An older in-flight same-field update can also restore removed content under the [last-successful-save decision](0012-last-save-wins-profile-updates.md).

## 3. Rationale and alternatives

**A profile-only control has a clear, narrow result.** It lets a user edit the saved account-wide personal context through the existing native update flow, including flexible text, without making transcript deletion part of a profile edit.

**Erasing every occurrence would require a broader deletion contract.** Removing source messages, redacting summaries and other retained records, and coordinating active contexts would add a separate data-deletion workflow. Phase 1 accepts retained-context influence and possible relearning instead of promising that broader outcome.

**A prompt instruction fits the accepted limit.** Enforced suppression would need additional state or checks to stop retained history or later saves from restoring content. That stronger guarantee is not selected; the explanation to the user must make the chosen scope clear.

## 4. Consequences and open choices

- **Account scope:** a successful removal changes the shared profile used by every linked channel; unrelated saved facts remain.
- **Continued context:** transcripts, observations, and already-loaded context can still contain the fact. Successful profile removal does not prove that the fact can no longer influence answers.
- **Save ordering:** a later successful same-field save can recreate removed content, including from a slower older turn.
- **Open details:** user-facing wording, retention periods, backup and provider limits, and any separate retained-data deletion controls remain open.
