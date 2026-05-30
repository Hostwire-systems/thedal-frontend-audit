# Family Captain Management API Documentation

## Overview
The Family Captain Management System provides APIs for managing family captains who are responsible for specific families within elections. This system replaces the booth-based allocation with family-based allocation.

**Base URL:** `/api/v1/family-captains`

## Authentication
All endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## API Endpoints

### 1. Create Family Captain
Creates a new family captain with assigned families for the specified election.

**Endpoint:** `POST /api/v1/family-captains/election/{electionId}`

**Parameters:**
- `electionId` (path): Long - The election ID

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "mobile_number": "9876543210",
  "password": "password123",
  "address": {
    "street": "123 Main Street",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "postal_code": "600001",
    "country": "India"
  },
  "assigned_families": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ],
  "status": "active",
  "photo_url": "https://example.com/photo.jpg",
  "remarks": "Experienced captain",
  "whats_app_number": "9876543210",
  "gender": "Male"
}
```

**Validation Rules:**
- `first_name`: Required, not blank
- `mobile_number`: Required, must be 10-digit number starting with 6-9
- `password`: Required, minimum 8 characters
- `email`: Valid email format
- `address` fields: All required (street, city, state, postal_code, country)

**Response:**
```json
{
  "message": "Family Captain saved successfully",
  "success": true,
  "data": null
}
```

---

### 2. Get Family Captain Details
Retrieves family captain details by user ID and election ID.

**Endpoint:** `GET /api/v1/family-captains/election/{electionId}/user/{userId}`

**Parameters:**
- `electionId` (path): Long - The election ID
- `userId` (path): Long - The user ID

**Response:**
```json
{
  "message": "Family Captain retrieved successfully",
  "success": true,
  "data": {
    "id": 123,
    "user_id": 456,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "mobile_number": "9876543210",
    "address": {
      "street": "123 Main Street",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "postal_code": "600001",
      "country": "India"
    },
    "assigned_families": [
      "550e8400-e29b-41d4-a716-446655440000"
    ],
    "assigned_family_details": [
      {
        "family_id": "550e8400-e29b-41d4-a716-446655440000",
        "family_sequence_number": 1,
        "family_head_name": "Ram Kumar",
        "family_head_epic": "ABC1234567",
        "family_count": 4,
        "part_number": 1
      }
    ],
    "status": "active",
    "photo_url": "https://example.com/photo.jpg",
    "remarks": "Experienced captain",
    "whats_app_number": "9876543210",
    "gender": "Male",
    "created_time": "2024-01-15T10:30:00",
    "modified_time": "2024-01-15T10:30:00",
    "election_id": 789,
    "account_id": 101
  }
}
```

---

### 3. Update Family Captain Details
Updates family captain information (excluding family assignments).

**Endpoint:** `PUT /api/v1/family-captains/election/{electionId}/user/{userId}`

**Parameters:**
- `electionId` (path): Long - The election ID
- `userId` (path): Long - The user ID

**Request Body:**
```json
{
  "first_name": "John Updated",
  "last_name": "Doe Updated",
  "email": "john.updated@example.com",
  "mobile_number": "9876543211",
  "address": {
    "street": "456 Updated Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "country": "India"
  },
  "status": "inactive",
  "photo_url": "https://example.com/updated-photo.jpg",
  "remarks": "Updated remarks",
  "whats_app_number": "9876543211",
  "gender": "Male"
}
```

**Response:**
```json
{
  "message": "Family Captain updated successfully",
  "success": true,
  "data": null
}
```

---

### 4. Update Assigned Families
Updates the families assigned to a specific family captain.

**Endpoint:** `PUT /api/v1/family-captains/election/{electionId}/user/{userId}/families`

**Parameters:**
- `electionId` (path): Long - The election ID
- `userId` (path): Long - The user ID

**Request Body:**
```json
{
  "assigned_families": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Validation:**
- `assigned_families`: Required, must contain at least one family

**Response:**
```json
{
  "message": "Assigned families updated successfully",
  "success": true,
  "data": null
}
```

---

### 5. Search Family Captains with Filters
Retrieves family captains with optional filters and pagination.

**Endpoint:** `GET /api/v1/family-captains/election/{electionId}`

**Parameters:**
- `electionId` (path): Long - The election ID
- `assignedFamilies` (query, optional): List of UUID - Filter by assigned families
- `mobileNumber` (query, optional): String - Filter by mobile number
- `searchTerm` (query, optional): String - Search in names, mobile, email
- `page` (query, optional): Integer - Page number (default: 0)
- `size` (query, optional): Integer - Page size (default: 10)
- `sortBy` (query, optional): String - Sort field (default: "firstName")
- `direction` (query, optional): String - Sort direction "asc"/"desc" (default: "asc")

**Example:** 
```
GET /api/v1/family-captains/election/123?searchTerm=john&page=0&size=10&sortBy=firstName&direction=asc
```

**Response:**
```json
{
  "message": "Family Captains retrieved successfully",
  "success": true,
  "data": {
    "content": [
      {
        "id": 123,
        "user_id": 456,
        "first_name": "John",
        "last_name": "Doe",
        // ... other family captain fields
      }
    ],
    "pageable": {
      "sort": {
        "sorted": true,
        "unsorted": false
      },
      "pageNumber": 0,
      "pageSize": 10
    },
    "totalElements": 25,
    "totalPages": 3,
    "last": false,
    "first": true,
    "numberOfElements": 10
  }
}
```

---

### 6. Get Family Captains by Assigned Family
Retrieves all family captains assigned to a specific family.

**Endpoint:** `GET /api/v1/family-captains/election/{electionId}/family/{familyId}`

**Parameters:**
- `electionId` (path): Long - The election ID
- `familyId` (path): UUID - The family ID

**Response:**
```json
{
  "message": "Family Captains by family retrieved successfully",
  "success": true,
  "data": [
    {
      "id": 123,
      "user_id": 456,
      "first_name": "John",
      "last_name": "Doe",
      // ... other family captain fields
    }
  ]
}
```

---

### 7. Get Family Options for Dropdown
Retrieves available families for family captain assignment dropdown.

**Endpoint:** `GET /api/v1/family-captains/election/{electionId}/family-options`

**Parameters:**
- `electionId` (path): Long - The election ID
- `searchTerm` (query, optional): String - Search in family details
- `page` (query, optional): Integer - Page number (default: 0)
- `size` (query, optional): Integer - Page size (default: 20)

**Example:**
```
GET /api/v1/family-captains/election/123/family-options?searchTerm=ram&page=0&size=20
```

**Response:**
```json
{
  "message": "Family options retrieved successfully",
  "success": true,
  "data": {
    "content": [
      {
        "family_id": "550e8400-e29b-41d4-a716-446655440000",
        "family_sequence_number": 1,
        "family_head_name": "Ram Kumar",
        "family_head_epic": "ABC1234567",
        "family_count": 4,
        "part_number": 1,
        "family_no": 101,
        "head_name": "Ram Kumar",
        "display_text": "F-1: Ram Kumar (ABC1234567) - 4 members"
      }
    ],
    "totalElements": 50,
    "totalPages": 3,
    "first": true,
    "last": false
  }
}
```

---

### 8. Delete Family Captain
Deletes a family captain from the specified election.

**Endpoint:** `DELETE /api/v1/family-captains/election/{electionId}/user/{userId}`

**Parameters:**
- `electionId` (path): Long - The election ID
- `userId` (path): Long - The user ID

**Response:**
```json
{
  "message": "Family Captain deleted successfully",
  "success": true,
  "data": null
}
```

---

### 9. Delete Multiple Family Captains
Deletes multiple family captains from the specified election.

**Endpoint:** `DELETE /api/v1/family-captains/election/{electionId}`

**Parameters:**
- `electionId` (path): Long - The election ID
- `userIds` (query): List of Long - User IDs to delete

**Example:**
```
DELETE /api/v1/family-captains/election/123?userIds=456,789,101
```

**Response:**
```json
{
  "message": "Family Captains deleted successfully",
  "success": true,
  "data": null
}
```

---

### 10. Bulk Upload Family Captains
Uploads multiple family captains from Excel or CSV file.

**Endpoint:** `POST /api/v1/family-captains/election/{electionId}/upload`

**Parameters:**
- `electionId` (path): Long - The election ID
- `file` (form-data): MultipartFile - Excel (.xlsx) or CSV file (max 100MB)

**File Format Requirements:**
- **Supported formats:** .xlsx, .csv
- **Maximum size:** 100 MB
- **Required columns:**
  - `first_name`
  - `mobile_number`
  - `password`
  - `assigned_families` (comma-separated UUIDs)
- **Optional columns:**
  - `last_name`
  - `email`
  - `street`, `city`, `state`, `postal_code`, `country`
  - `status`
  - `remarks`
  - `whats_app_number`
  - `gender`
  - `photo_url`

**Example CSV:**
```csv
first_name,last_name,mobile_number,password,email,assigned_families,status,street,city,state,postal_code,country
John,Doe,9876543210,password123,john@example.com,"550e8400-e29b-41d4-a716-446655440000,550e8400-e29b-41d4-a716-446655440001",active,123 Street,Chennai,Tamil Nadu,600001,India
Jane,Smith,9876543211,password456,jane@example.com,550e8400-e29b-41d4-a716-446655440002,active,456 Avenue,Mumbai,Maharashtra,400001,India
```

**Response:**
```json
{
  "message": "Family Captains upload completed",
  "success": true,
  "data": {
    "total_rows": 100,
    "successful_uploads": 95,
    "failed_uploads": 5,
    "duplicate_entries": 3,
    "validation_errors": 2,
    "upload_summary": "95 family captains uploaded successfully, 5 failed",
    "errors": [
      {
        "row": 10,
        "error": "Invalid mobile number format"
      },
      {
        "row": 25,
        "error": "Duplicate mobile number"
      }
    ]
  }
}
```

---

## Data Models

### Address
```json
{
  "street": "String (required)",
  "city": "String (required)",
  "state": "String (required)", 
  "postal_code": "String (required, 5-6 characters)",
  "country": "String (required)"
}
```

### Family Details
```json
{
  "family_id": "UUID",
  "family_sequence_number": "Integer",
  "family_head_name": "String",
  "family_head_epic": "String",
  "family_count": "Integer",
  "part_number": "Integer",
  "family_no": "Long",
  "head_name": "String",
  "display_text": "String"
}
```

---

## Error Responses

### Standard Error Response
```json
{
  "message": "Error description",
  "success": false,
  "data": null
}
```

### Common Error Status Codes
- **400 Bad Request**: Invalid request parameters or validation errors
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate mobile number or email
- **500 Internal Server Error**: Server-side error

### Validation Error Examples
```json
{
  "message": "Validation failed",
  "success": false,
  "data": {
    "mobile_number": "Mobile number must be a valid 10-digit number starting with 6-9",
    "password": "Password must be at least 8 characters long",
    "assigned_families": "At least one family must be assigned"
  }
}
```

---

## Business Rules

1. **Family Assignment**: Each family captain can be assigned to multiple families
2. **Mobile Uniqueness**: Mobile numbers must be unique across the system
3. **Election Scope**: All operations are scoped to specific elections
4. **Password Security**: Passwords are encrypted using BCrypt
5. **Status Management**: Family captains can be active/inactive
6. **Family Validation**: All assigned families must exist in the election
7. **Account Isolation**: Family captains are isolated by account ID
8. **Role-based Access**: Only authorized users can manage family captains

---

## Integration Notes

- All timestamps are in ISO 8601 format
- UUIDs are used for family identification
- Pagination follows Spring Boot Page structure
- File uploads support both Excel and CSV formats
- Search functionality includes fuzzy matching
- Sorting supports multiple fields and directions
