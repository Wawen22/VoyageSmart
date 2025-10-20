---
mode: agent
---
---
description: Return to a previous project state by force-resetting to a chosen checkpoint on the checkpoints branch, safely overwriting all local changes.
argument-hint: commit-hash
---

$ARGUMENTS
<!-- GIT:START -->
**Guardrails**
- Always operate only on the "checkpoints" branch to keep main safe.
- Warn the user that all current changes—including unstaged work—will be permanently lost.
- Show available checkpoints first and confirm selection.

**Steps**
1. If not already on "checkpoints", switch to it: `git checkout checkpoints`
2. Display the list of checkpoints (`git log --grep=checkpoint --oneline`).
3. Ask the user which checkpoint hash to use for rollback.
4. If unstaged or uncommitted changes exist:
    - Auto-commit them with a message: `git add . && git commit -m "AUTO-SAVE before rollback"`
    - Notify the user that an automatic backup checkpoint was created.
5. Confirm with the user:  
   "This will force reset the project to checkpoint <commit_hash>, erasing all local changes. Continue?"
6. If confirmed, execute:
    - `git reset --hard <commit_hash>`
    - (This overwrites code with the chosen checkpoint’s contents)
7. Remind the user they can safely switch back main for production work any time.

**Reference**
- Suggest backing up local changes elsewhere if user does not want them auto-committed.
- For more details on any checkpoint: `git show <commit_hash>`
<!-- GIT:END -->
