/**
 * Voter Export Column Configuration
 * Matches the structure from Edit Voter Form for consistency
 */

export interface VoterExportColumn {
  id: string;
  label: string;
  category: string;
}

export const VOTER_EXPORT_COLUMNS: VoterExportColumn[] = [
  // Election Commission Data
  { id: "epicNumber", label: "EPIC Number", category: "Election Commission Data" },
  { id: "serialNumber", label: "Serial Number", category: "Election Commission Data" },
  { id: "partNumber", label: "Part Number", category: "Election Commission Data" },
  { id: "partNameEn", label: "Part Name (English)", category: "Election Commission Data" },
  { id: "partNameL1", label: "Part Name (Local)", category: "Election Commission Data" },
  { id: "sectionNumber", label: "Section Number", category: "Election Commission Data" },
  { id: "sectionNameEn", label: "Section Name (English)", category: "Election Commission Data" },
  { id: "sectionNameL1", label: "Section Name (Local)", category: "Election Commission Data" },
  { id: "houseNoEn", label: "House No (English)", category: "Election Commission Data" },
  { id: "houseNoL1", label: "House No (Local)", category: "Election Commission Data" },

  // Voter Personal Information
  { id: "voterFnameEn", label: "First Name (English)", category: "Voter Personal Information" },
  { id: "voterLnameEn", label: "Last Name (English)", category: "Voter Personal Information" },
  { id: "voterFnameL1", label: "First Name (Local)", category: "Voter Personal Information" },
  { id: "voterLnameL1", label: "Last Name (Local)", category: "Voter Personal Information" },
  { id: "gender", label: "Gender", category: "Voter Personal Information" },
  { id: "age", label: "Age", category: "Voter Personal Information" },
  { id: "dateOfBirth", label: "Date of Birth", category: "Voter Personal Information" },
  { id: "rlnType", label: "Relation Type", category: "Voter Personal Information" },
  { id: "rlnFnameEn", label: "Relation First Name (English)", category: "Voter Personal Information" },
  { id: "rlnLnameEn", label: "Relation Last Name (English)", category: "Voter Personal Information" },
  { id: "rlnFnameL1", label: "Relation First Name (Local)", category: "Voter Personal Information" },
  { id: "rlnLnameL1", label: "Relation Last Name (Local)", category: "Voter Personal Information" },
  { id: "mobileNo", label: "Mobile Number", category: "Voter Personal Information" },
  { id: "whatsappNo", label: "WhatsApp Number", category: "Voter Personal Information" },
  { id: "email", label: "Email", category: "Voter Personal Information" },
  { id: "aadhaarNumber", label: "Aadhaar Number", category: "Voter Personal Information" },
  { id: "aadhaarVerified", label: "Aadhaar Verified", category: "Voter Personal Information" },
  { id: "panNumber", label: "PAN Number", category: "Voter Personal Information" },
  { id: "religion", label: "Religion", category: "Voter Personal Information" },
  { id: "casteCategory", label: "Caste Category", category: "Voter Personal Information" },
  { id: "caste", label: "Caste", category: "Voter Personal Information" },
  { id: "subCaste", label: "Sub-Caste", category: "Voter Personal Information" },
  { id: "party", label: "Party Affiliation", category: "Voter Personal Information" },
  { id: "partyRegistrationNumber", label: "Party Registration Number", category: "Voter Personal Information" },
  { id: "availability", label: "Category/Availability", category: "Voter Personal Information" },
  { id: "scheme", label: "Schemes", category: "Voter Personal Information" },
  { id: "voterHistory", label: "Voting History", category: "Voter Personal Information" },
  { id: "feedback", label: "Feedback", category: "Voter Personal Information" },
  { id: "language", label: "Language", category: "Voter Personal Information" },
  { id: "remarks", label: "Remarks", category: "Voter Personal Information" },
  { id: "latitude", label: "Voter Latitude", category: "Voter Personal Information" },
  { id: "longitude", label: "Voter Longitude", category: "Voter Personal Information" },
  { id: "starNumber", label: "Star Number", category: "Voter Personal Information" },
  { id: "photoUrl", label: "Photo URL", category: "Voter Personal Information" },
  { id: "familyId", label: "Family ID", category: "Voter Personal Information" },
  { id: "familyCount", label: "Family Count", category: "Voter Personal Information" },
  { id: "friendCount", label: "Friend Count", category: "Voter Personal Information" },
  { id: "voterSlipPrintCount", label: "Voter Slip Print Count", category: "Voter Personal Information" },
  { id: "familySlipPrintCount", label: "Family Slip Print Count", category: "Voter Personal Information" },
  { id: "benefitSlipPrintCount", label: "Benefit Slip Print Count", category: "Voter Personal Information" },
  { id: "slipCount", label: "Total Slip Count", category: "Voter Personal Information" },

  // State & District Information
  { id: "stateCode", label: "State Code", category: "State & District Information" },
  { id: "stateNameEn", label: "State Name (English)", category: "State & District Information" },
  { id: "stateNameL1", label: "State Name (Local)", category: "State & District Information" },
  { id: "districtCode", label: "District Code", category: "State & District Information" },
  { id: "districtNameEn", label: "District Name (English)", category: "State & District Information" },
  { id: "districtNameL1", label: "District Name (Local)", category: "State & District Information" },
  { id: "pinCode", label: "Pin Code", category: "State & District Information" },

  // PC & AC Information
  { id: "pcNo", label: "PC Number", category: "PC & AC Information" },
  { id: "pcNameEn", label: "PC Name (English)", category: "PC & AC Information" },
  { id: "pcNameL1", label: "PC Name (Local)", category: "PC & AC Information" },
  { id: "acNo", label: "AC Number", category: "PC & AC Information" },
  { id: "acNameEn", label: "AC Name (English)", category: "PC & AC Information" },
  { id: "acNameL1", label: "AC Name (Local)", category: "PC & AC Information" },

  // Urban Local Body Information
  { id: "urbanNo", label: "Urban Body Number", category: "Urban Local Body Information" },
  { id: "urbanNameEn", label: "Urban Body Name (English)", category: "Urban Local Body Information" },
  { id: "urbanNameL1", label: "Urban Body Name (Local)", category: "Urban Local Body Information" },
  { id: "urbanWardNo", label: "Urban Ward Number", category: "Urban Local Body Information" },

  // Rural Local Body Information
  { id: "rurDistrictUnionNo", label: "Rural District Union Number", category: "Rural Local Body Information" },
  { id: "rurDistrictUnionNameEn", label: "Rural District Union Name (English)", category: "Rural Local Body Information" },
  { id: "rurDistrictUnionNameL1", label: "Rural District Union Name (Local)", category: "Rural Local Body Information" },
  { id: "rurDistrictUnionWardNo", label: "Rural District Union Ward No", category: "Rural Local Body Information" },
  { id: "panUnionNo", label: "Panchayat Union Number", category: "Rural Local Body Information" },
  { id: "panUnionNameEn", label: "Panchayat Union Name (English)", category: "Rural Local Body Information" },
  { id: "panUnionNameL1", label: "Panchayat Union Name (Local)", category: "Rural Local Body Information" },
  { id: "panUnionWardNo", label: "Panchayat Union Ward Number", category: "Rural Local Body Information" },
  { id: "villPanNo", label: "Village Panchayat Number", category: "Rural Local Body Information" },
  { id: "villPanNameEn", label: "Village Panchayat Name (English)", category: "Rural Local Body Information" },
  { id: "villPanNameL1", label: "Village Panchayat Name (Local)", category: "Rural Local Body Information" },
  { id: "villPanWardNo", label: "Village Panchayat Ward Number", category: "Rural Local Body Information" },
];

export const COLUMN_CATEGORIES = [
  "Election Commission Data",
  "Voter Personal Information",
  "State & District Information",
  "PC & AC Information",
  "Urban Local Body Information",
  "Rural Local Body Information",
];

/**
 * Get columns by category
 */
export const getColumnsByCategory = (category: string): VoterExportColumn[] => {
  return VOTER_EXPORT_COLUMNS.filter((col) => col.category === category);
};

/**
 * Get all column IDs
 */
export const getAllColumnIds = (): string[] => {
  return VOTER_EXPORT_COLUMNS.map((col) => col.id);
};

/**
 * Get default/recommended columns for export
 */
export const getDefaultColumns = (): string[] => {
  return [
    "epicNumber",
    "serialNumber",
    "partNumber",
    "sectionNumber",
    "voterFnameEn",
    "voterLnameEn",
    "gender",
    "age",
    "rlnFnameEn",
    "rlnLnameEn",
    "mobileNo",
    "religion",
    "caste",
    "party",
  ];
};
