---
mode: agent
---
---
description: Push Git to desired branches (e.g., main, or custom branches).
argument-hint: branch
---

$ARGUMENTS
<!-- GIT:START -->
**Guardrails**
- Always ask the user to confirm the destination branches.
- Never push to main by default—confirm with the user first.
- Remind to test and verify before pushing to main branches.
- Ensure local changes from the checkpoints branch are merged correctly before push.

**Steps**
1. Ask if the user is ready to push changes to production branches (main).
2. Allow the user to select any branch for push (main, other).
3. For each branch indicated, execute:
    - `git push origin <branch>`
4. Confirm the operation for each branch.
5. Remind the user about possible protection policies on main/master.
6. Before pushing, suggest merging or rebasing from checkpoints branch if needed.

**Reference**
- To view available branches: `git branch -a`
<!-- GIT:END -->
