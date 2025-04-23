# Task: Date Handling and Sorting for Kanban Tasks

## Objective
Implement comprehensive date handling for tasks in the Kanban plugin, including multiple date types and sorting functionality.

## Requirements
1. Date Format Implementation
   - Support date format: [<description>:: YYYY-MM-DD]
   - Required date types:
     - Due date: [due:: YYYY-MM-DD]
     - Status changed date: [statusChanged:: YYYY-MM-DD]
     - Created date: [created:: YYYY-MM-DD]

2. Status Change Tracking
   - Automatically update [statusChanged:: YYYY-MM-DD] when task moves between columns or when task is created
   - Record initial [created:: YYYY-MM-DD] when task is first created

3. Task Sorting Logic
   - Primary sort by priority
   - Secondary sort by due date
   - Tertiary sort by statusChanged date
   - Tasks without dates should appear at bottom of column

4. Task Parsing
   - Parse date information during task construction in Kanban
   - Extract and store date metadata separately from task content
   - Ensure dates are properly maintained when tasks are edited
   - Show only due date

## Implementation Plan
1. Data Structure Updates
   - Define date format constants and validation rules
   - Create DateType enum with DUE, STATUS_CHANGED, CREATED types
   - Implement DateParser class/utility for extracting dates from task text
     - Parse [due:: YYYY-MM-DD] format
     - Parse [statusChanged:: YYYY-MM-DD] format
     - Parse [created:: YYYY-MM-DD] format
   - Add date metadata storage to Task class/interface
   - Create DateFormatter utility for consistent date string handling

2. Task Creation and Editing
   - Implement automatic date assignment on task creation
     - Set [created:: YYYY-MM-DD] with current date
     - Set initial [statusChanged:: YYYY-MM-DD] same as created date
   - Add date validation during task text parsing
   - Create date preservation logic during task edits
   - Implement date metadata extraction and storage separate from task content

3. Status Change Tracking
   - Add status change detection in column movement logic
   - Implement automatic [statusChanged:: YYYY-MM-DD] updates
   - Create status change history tracking (if needed for future features)
   - Add validation to ensure statusChanged is always updated correctly

4. Sorting Implementation
   - Create TaskSorter utility class/function
   - Implement priority-based comparison as primary sort
   - Add date-based comparison logic:
     - Secondary sort by due date
     - Tertiary sort by statusChanged date
   - Handle null/undefined date cases
     - Tasks without dates should be placed at bottom
     - Maintain consistent ordering for tasks without dates

5. UI Integration
   - Update task rendering to display due date
   - Implement sort order application in column views
   - Add date-related UI indicators/formatting
   - Ensure proper UI updates when dates change

6. Testing and Validation
   - Unit tests:
     - Date parsing and validation
     - Sorting logic for all combinations
     - Status change tracking
     - Task creation and editing with dates
   - Integration tests:
     - Complete task lifecycle with dates
     - Column movement with status updates
     - Sort order application
     - UI update verification

7. Documentation
   - Update technical documentation with date handling details
   - Add code comments for complex date logic
   - Document date format requirements for users

## Technical Considerations
- Implement efficient date parsing and comparison

## Current Status
- Implementation completed for core date functionality
- Completed:
  - Date parsing and extraction functionality
  - Date formatting utilities
  - Support for multiple date types (due, statusChanged, created)
  - Automatic status change date updates when column changes
  - Date preservation during task content updates
  - Comprehensive test coverage including:
    - Date parsing and validation
    - Status change tracking
    - Task creation with default dates
    - Date preservation during edits
    - Column movement date updates
- Remaining:
  - UI integration for date display
  - Visual indicators for dates
  - Migration for existing tasks

## Next Steps
1. Update UI components to display dates
2. Add visual indicators for date states (e.g., overdue tasks)
3. Implement migration strategy for existing tasks
4. Add integration tests for UI components 