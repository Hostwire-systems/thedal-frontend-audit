// Family Captain TypeScript interfaces

export interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface FamilyOption {
  family_id: string;
  family_sequence_number: number;
  family_head_name: string;
  family_head_epic: string;
  family_count: number;
  part_number: number;
  family_no: number;
  head_name: string;
  display_text: string;
}

export interface AssignedFamilyDetail {
  family_id: string;
  family_sequence_number: number;
  family_head_name: string;
  family_head_epic: string;
  family_count: number;
  part_number: number;
}

export interface FamilyCaptain {
  id: number;
  user_id: number;
  userId?: number; // For compatibility with existing interfaces
  volunteerId?: number; // For compatibility with table components
  first_name: string;
  last_name: string;
  firstName?: string; // For compatibility
  lastName?: string; // For compatibility
  email: string;
  mobile_number: string;
  mobileNumber?: string; // For compatibility
  address: Address;
  assigned_families: string[];
  assignedFamilies?: string[]; // For compatibility
  status: string;
  photo_url?: string;
  photoUrl?: string; // For compatibility
  remarks?: string;
  whats_app_number?: string;
  whatsAppNumber?: string; // For compatibility
  gender: string;
  created_time?: string;
  createdTime?: string; // For compatibility
  modified_time?: string;
  modifiedTime?: string; // For compatibility
  election_id?: number;
  electionId?: number; // For compatibility
  account_id?: number;
  accountId?: number; // For compatibility
  key?: string; // For table component
}

export interface FamilyCaptainDetails extends FamilyCaptain {
  assigned_family_details: AssignedFamilyDetail[];
  assignedFamilyDetails?: AssignedFamilyDetail[]; // For compatibility
}

export interface FamilyCaptainsResponse {
  message: string;
  success: boolean;
  data: {
    content: FamilyCaptain[];
    pageable: {
      sort: {
        sorted: boolean;
        unsorted: boolean;
      };
      pageNumber: number;
      pageSize: number;
    };
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
    numberOfElements: number;
  };
}

export interface FamilyCaptainDetailsResponse {
  message: string;
  success: boolean;
  data: FamilyCaptainDetails;
}

export interface FamilyOptionsResponse {
  message: string;
  success: boolean;
  data: {
    content: FamilyOption[];
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  };
}

export interface CreateFamilyCaptainPayload {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  password?: string;
  whats_app_number?: string;
  address: Address;
  assigned_families: string[];
  status: string;
  photo_url?: string;
  remarks?: string;
  gender: string;
}

export interface UpdateFamilyCaptainPayload {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  address: Address;
  status: string;
  photo_url?: string;
  remarks?: string;
  whats_app_number?: string;
  gender: string;
}

export interface FamilyCaptainFilters {
  assignedFamilies?: string[];
  mobileNumber?: string;
  searchTerm?: string;
  status?: string;
}

export interface FamilyCaptainSortOptions {
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

// Location interface for map functionality
export interface FamilyCaptainLocation {
  latitude: number;
  longitude: number;
}

export interface FamilyCaptainWithLocation extends FamilyCaptain {
  location?: FamilyCaptainLocation;
}

// Activity tracking interface
export interface FamilyCaptainActivity {
  id: number;
  userId: number;
  activity: string;
  timestamp: string;
  location?: FamilyCaptainLocation;
}

// Bulk operation interfaces
export interface BulkUploadResponse {
  message: string;
  success: boolean;
  data: {
    total_rows: number;
    successful_uploads: number;
    failed_uploads: number;
    duplicate_entries: number;
    validation_errors: number;
    upload_summary: string;
    errors: Array<{
      row: number;
      error: string;
    }>;
  };
}

export interface BulkDeleteResponse {
  message: string;
  success: boolean;
  data: null;
}

// Export interfaces
export interface FamilyCaptainExportData extends FamilyCaptain {
  assignedFamiliesDisplay?: string;
  createdAt?: string;
  updatedAt?: string;
}
