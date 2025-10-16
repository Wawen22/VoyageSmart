## Why
Current expense cards on mobile stack multiple info blocks vertically, consuming excessive vertical space and limiting how many expenses are visible without scrolling. The user wants to view more items per screen and a refined layout that feels lighter on small devices.

## What Changes
- Refine the mobile-first layout of expense cards to present key information (description, amount, date, payer, split type) in a more compact arrangement.
- Introduce responsive styling tokens/utilities so cards expand gracefully on larger breakpoints while staying dense on mobile.
- Review spacing, typography, and button placement to ensure actions remain obvious without inflating card height.

## Impact
- Improves usability of the `/trips/[id]/expenses` section on small screens.
- Touch targets and action visibility must remain compliant with accessibility guidance.
- Implementation focused on frontend components (`ExpenseCard`, `ExpenseList`) without backend changes.
