---
mode: agent
---
---
description: Create a Git checkpoint (commit) for the current project state on the checkpoints branch.
argument-hint: description
---

$ARGUMENTS
<!-- GIT:START -->
**Guardrails**
- Always operate by default on the "checkpoints" branch for checkpoint actions.
- Favor simple and clear solutions: a commit with "checkpoint" message.
- Don't add unnecessary complexity.
- Each checkpoint must be briefly described by the user.
- If not already on "checkpoints", switch to it first.

**Steps**
1. Check if you are on the "checkpoints" branch; if not, run:
    - `git checkout checkpoints`
    - If the branch doesn't exist, create it: `git checkout -b checkpoints`
2. Request a brief checkpoint description from the user.
3. Execute in sequence:
    - `git add .`
    - `git commit -m "checkpoint: <provided description>"`
4. Confirm the checkpoint creation.
5. Remind that checkpoints allow easy rollbacks and keep main clean.

**Reference**
- Show `git log --grep=checkpoint --oneline` to view checkpoints if needed.
<!-- GIT:END -->
