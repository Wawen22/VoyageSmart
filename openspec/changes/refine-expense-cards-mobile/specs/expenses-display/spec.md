## ADDED Requirements
### Requirement: Dense Mobile Expense Cards
Expense cards in the trip expenses view MUST use a compact layout on mobile breakpoints to expose more list items at once without sacrificing clarity.

#### Scenario: Mobile viewport shows condensed card
- **GIVEN** a user opens `/trips/[id]/expenses` on a screen ≤640px wide
- **WHEN** the expenses list renders
- **THEN** each card displays description, amount, date, payer, and split type within a single compact block (≤ two stacked sections) and avoids large empty padding regions
- **AND** primary actions (edit/delete) remain visible without requiring additional taps.

### Requirement: Responsive Expansion On Larger Screens
Expense cards MUST expand their layout for larger breakpoints while keeping the mobile compact structure intact.

#### Scenario: Tablet or desktop viewport
- **GIVEN** a user opens `/trips/[id]/expenses` on a screen ≥768px wide
- **WHEN** the expenses list renders
- **THEN** the card expands spacing and alignment to match desktop styling without reintroducing excessive vertical whitespace
- **AND** important metadata remains grouped logically with clear hierarchy.
