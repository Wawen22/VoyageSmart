# checklist Specification

## Purpose
TBD - created by archiving change add-trip-checklist. Update Purpose after archive.
## Requirements
### Requirement: View Checklist
The system SHALL allow users to view their personal and group checklists for a trip.

#### Scenario: View personal checklist
- **GIVEN** a user is viewing a trip
- **WHEN** the user clicks the "Checklist" button
- **THEN** the checklist modal SHALL open and display the user's personal checklist for that trip.

#### Scenario: View group checklist
- **GIVEN** a user is viewing a trip
- **WHEN** the user clicks the "Checklist" button
- **AND** selects the group checklist
- **THEN** the checklist modal SHALL display the group checklist for that trip.

### Requirement: Add Checklist Item
The system SHALL allow users to add new items to their checklists.

#### Scenario: Add item to personal checklist
- **GIVEN** a user is viewing their personal checklist
- **WHEN** the user enters a new item and clicks "Add"
- **THEN** the new item SHALL be added to the bottom of the personal checklist.

### Requirement: Edit Checklist Item
The system SHALL allow users to edit existing items in their checklists.

#### Scenario: Edit item in personal checklist
- **GIVEN** a user is viewing their personal checklist
- **WHEN** the user clicks the "Edit" button for an item
- **AND** changes the content of the item
- **AND** clicks "Save"
- **THEN** the item SHALL be updated in the personal checklist.

### Requirement: Delete Checklist Item
The system SHALL allow users to delete items from their checklists.

#### Scenario: Delete item from personal checklist
- **GIVEN** a user is viewing their personal checklist
- **WHEN** the user clicks the "Delete" button for an item
- **THEN** the item SHALL be removed from the personal checklist.

### Requirement: Reorder Checklist Items
The system SHALL allow users to reorder items in their checklists using drag-and-drop.

#### Scenario: Reorder items in personal checklist
- **GIVEN** a user is viewing their personal checklist
- **WHEN** the user drags an item to a new position in the list
- **THEN** the item SHALL be moved to the new position and the order of the other items SHALL be updated accordingly.

### Requirement: Check/Uncheck Checklist Item
The system SHALL allow users to check and uncheck items in their checklists.

#### Scenario: Check an item
- **GIVEN** a user is viewing a checklist
- **WHEN** the user clicks the checkbox next to an item
- **THEN** the item SHALL be marked as checked.

#### Scenario: Uncheck an item
- **GIVEN** a user is viewing a checklist
- **WHEN** the user clicks the checkbox next to a checked item
- **THEN** the item SHALL be marked as unchecked.

