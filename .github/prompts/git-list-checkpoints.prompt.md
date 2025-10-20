---
mode: agent
---
---
description: Show the list of all available Git checkpoints on the checkpoints branch.
argument-hint: none
---

$ARGUMENTS
<!-- GIT:START -->
**Guardrails**
- List only commits containing "checkpoint:" in the message on the "checkpoints" branch.
- Display the short hash and description.
- Always operate on the "checkpoints" branch.

**Steps**
1. If not already on "checkpoints", switch to it: `git checkout checkpoints`
2. Execute:
    - `git log --grep=checkpoint --oneline`
3. Explain how to use the hash for rollback or checkout.

**Reference**
- Provide more details with `git show <commit_hash>` if requested.
<!-- GIT:END -->
