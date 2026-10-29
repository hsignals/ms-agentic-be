# Product and delivery TODOs

## 1. Apple messaging

### 1.1 Service and proactive delivery scope

- [ ] Confirm the Apple service/provider and permitted notification scope before committing to Apple proactive delivery.
- [ ] Confirm how the selected provider's delivery eligibility and permissions apply to the product's default channel selection.

### 1.2 Minimum required controls

**TBD:** Apple-specific notification and preference controls. Meet the applicable requirements with the minimum necessary channel-specific behavior; Apple's policies must not guide the general product UX. Select the exact controls after confirming the service and provider.

- [ ] Identify and document the minimum required Apple controls and their acceptance evidence.

The [task stories](user-stories/tasks.md) own proactive channel selection and user control. This TODO does not establish an Apple integration or notification permission.

## 2. Human support

### 2.1 Availability and staffing

The accepted [human-support story](user-stories/assistant.md#27-us-chat-07--reach-human-support-during-support-hours) requires access to a real person during published support hours.

- [ ] Assign the support team and publish working days, hours, and timezone.
- [ ] Define response expectations and how requests received outside support hours are handled.

### 2.2 Staff tooling and handoff

- [ ] Choose the staff-side support tool; Slack is a proposed option. Users must receive support in their originating messaging channel.
- [ ] Define how staff receive the request and necessary context, reply to the correct conversation, and return control to the assistant without conflicting replies.
- [ ] Define staff access and retained support records within the existing account and channel privacy boundaries.

The [runtime design](design/runtime.md) owns the handoff integration once these choices are settled.
