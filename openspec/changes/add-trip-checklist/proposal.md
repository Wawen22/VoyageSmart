## Why
Users need a way to create and manage checklists for their trips to stay organized. This feature will allow them to create personal and group checklists, ensuring they don't forget important items or tasks.

## What Changes
- Add a new checklist system for each trip.
- Introduce personal and group checklists.
- Checklists will be displayed in a modal.
- Users can add, edit, delete, and reorder checklist items via drag-and-drop.
- A "Checklist" button will be added next to the "Saved Suggestions" button.

## Impact
- **Affected specs:** A new `checklist` capability will be created.
- **Affected code:**
  - New database tables for checklists and checklist items.
  - New API endpoints for managing checklists.
  - New frontend components for the checklist modal and button.
