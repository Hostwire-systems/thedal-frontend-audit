# Voter Export Column Selection Implementation

## Overview
Implemented column selection feature for voter list export, allowing users to choose which fields to export instead of exporting all columns.

## Implementation Date
November 24, 2025

## Changes Made

### 1. New File: `src/types/voterExportColumns.ts`
Created a comprehensive configuration file that defines all available voter columns organized by categories.

**Features:**
- 50+ voter fields organized into 7 categories:
  - Identity (EPIC Number, Serial Number, Part Number, Section Number)
  - Personal (Name, Age, Gender, DOB)
  - Family (Relation details, Family/Friend counts)
  - Contact (Mobile, WhatsApp, Email)
  - Demographics (Religion, Caste, Language)
  - Political (Party, Availability, History)
  - Additional (Scheme, Aadhaar, PAN, Location, etc.)

**Utility Functions:**
- `getAllColumnIds()` - Get all available column identifiers
- `getColumnsByCategory()` - Get columns filtered by category
- `getDefaultColumns()` - Get recommended default columns (14 essential fields)

### 2. Updated: `src/context/ExportContext.tsx`

**State Management:**
- `selectedColumns` - Array of selected column IDs
- `selectAllColumns` - Boolean flag for "Select All" option

**New Functions:**
- `handleSelectAllColumnsChange()` - Toggle between all columns and default selection
- `handleColumnSelection()` - Handle individual column checkbox
- `handleCategorySelection()` - Select/deselect entire category
- `isCategorySelected()` - Check if all category columns are selected
- `isCategoryIndeterminate()` - Check if some (not all) category columns are selected

**UI Changes:**
- Added collapsible panel showing column categories
- Category-level checkboxes with indeterminate state support
- Individual column checkboxes within each category
- "Select All Columns" checkbox at the top
- Column count indicator showing selected columns

**API Integration:**
- Passes `columns` parameter to export API:
  - `columns=ALL` when "Select All" is checked
  - `columns=field1,field2,field3` when specific columns selected
  - Falls back to default columns if none selected

### 3. Modal Layout Enhancement
The export modal now includes three sections:
1. **Part Number Selection** - Select which booth/part numbers to export
2. **Filter Options** - Option to include current applied filters
3. **Column Selection** (NEW) - Choose which fields to export

## API Parameter Format

The backend should accept the `columns` parameter in the export endpoint:

```
POST /api/v1/voters/{electionId}/export?columns=epicNumber,voterFnameEn,age,gender
```

**Parameter Values:**
- `columns=ALL` - Export all available columns (default behavior)
- `columns=field1,field2,field3` - Export only specified columns (comma-separated)

## Column Identifiers

The following column IDs are sent to the backend:

```
epicNumber, serialNumber, partNumber, sectionNumber,
voterFnameEn, voterLnameEn, voterFnameL1, voterLnameL1,
gender, age, dateOfBirth,
rlnType, rlnFnameEn, rlnLnameEn, rlnFnameL1, rlnLnameL1,
familyId, familyCount, friendCount,
mobileNo, whatsappNo, email,
religion, casteCategory, caste, subCaste, language,
party, availability, voterHistory, starNumber, partyRegistrationNumber,
scheme, categoryDescription, feedback, photoUrl,
aadhaarNumber, aadhaarVerified, panNumber, remarks,
latitude, longitude, pinCode, memberVerified, pollStatus
```

## User Experience

### Default Behavior
- When export modal opens, "Select All Columns" is checked by default
- Backend receives `columns=ALL` parameter
- Maintains backward compatibility with existing behavior

### Custom Selection
1. User unchecks "Select All Columns"
2. Default recommended columns are pre-selected (14 essential fields)
3. User can:
   - Select/deselect individual columns
   - Select/deselect entire categories
   - See real-time count of selected columns
4. Backend receives comma-separated list of selected column IDs

### Visual Indicators
- Category checkboxes show:
  - ✓ Checked - All columns in category selected
  - ◼ Indeterminate - Some columns in category selected
  - ☐ Unchecked - No columns in category selected
- Blue tag shows total selected columns count

## Benefits

1. **Reduced File Size** - Export only needed columns
2. **Privacy** - Exclude sensitive fields (Aadhaar, PAN)
3. **Performance** - Faster exports with fewer columns
4. **User Control** - Choose exactly what data to export
5. **Flexibility** - Different exports for different use cases

## Testing Checklist

- [ ] Modal opens with "Select All" checked by default
- [ ] Unchecking "Select All" shows default columns selected
- [ ] Category checkboxes work correctly (all/some/none states)
- [ ] Individual column checkboxes toggle properly
- [ ] Selected column count displays accurately
- [ ] API receives correct `columns` parameter
- [ ] Export works with "ALL" columns
- [ ] Export works with custom column selection
- [ ] Modal resets properly when closed/reopened

## Backend Requirements

The backend must implement:

1. **Accept `columns` query parameter** in export endpoint
2. **Parse comma-separated column IDs** or "ALL" keyword
3. **Validate column IDs** against allowed fields
4. **Generate Excel** with only selected columns
5. **Maintain column order** as specified in the parameter
6. **Handle missing parameter** - default to ALL columns (backward compatibility)

## Future Enhancements

- Save user's column preferences for next export
- Create custom column presets (e.g., "Basic Info", "Contact Only", "Full Details")
- Export column configuration across elections
- Quick search/filter within column list
- Drag-and-drop column ordering
