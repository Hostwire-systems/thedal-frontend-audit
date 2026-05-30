// Family API Types
export interface FamilySummaryMember {
  name: string;
  epicNumber?:string;
  epic_number: string;
  familySequenceNumber:number|null;
  age: number;
  mobileNo:number|null;
  memberVerified: boolean;
  gender: string;
  rlnFnameEn: string;
  rlnFnameL1: string | null;
  rlnLnameEn: string | null;
  rlnLnameL1: string | null;
  voterFnameEn: string;
  voterLnameEn: string | null;
  voterFnameL1: string | null;
  voterLnameL1: string | null;
  aadhaarVerified: boolean;
  partNo: number;
  serialNo:number|null;
  votingHistory?: string | null | VotingHistoryItem[];
  photoUrl?: string | null;
  rlnType?: string | null;
}

export interface FamilySummaryItem {
  familyId: string;
  familySequenceNumber: number | null;
  memberCount: number;
  firstMember: FamilySummaryMember;
}

export interface GenderStats {
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  totalCount: number;
}

export interface FamilyMappingStats {
  unmappedVoterCount: number;
  singleVoterFamilyCount: number;
  totalCount: number;
}

export interface PartFamilyStats {
  partNo: number;
  totalVoters: number;
  totalFamilies: number;
  familyVoters: number;
  percentFamilyVoters: number;
  unmappedFamilyVoters: number;
  percentUnmapped: number;
  isTotal?: boolean;
}

export interface FamilySummaryResponse {
  status: string;
  message: string;
  data: {
    families: {
      content: FamilySummaryItem[];
      numberOfElements: number;
      totalElements: number;
      totalPages: number;
      size: number;
      number: number;
      first: boolean;
      last: boolean;
      empty: boolean;
    };
    genderStats?: GenderStats;
    familyMappingStats?: FamilyMappingStats;
    totalVotersCount: number;
  };
}

export interface Religion {
  id: number;
  religionName: string;
}

export interface Caste {
  id: number;
  casteName: string;
}

export interface Party {
  id: number;
  partyName: string;
}

export interface FamilyMemberDetail {
  id: number;
  electionId: number;
  hasVoted: boolean;
  votedTimestamp: string | null;
  createdTime: string;
  modifiedTime: string;
  partNo: number;
  sectionNo: number;
  serialNo: number;
  houseNoEn: string;
  houseNoL1: string | null;
  houseNoL2: string | null;
  voterFnameEn: string;
  voterLnameEn: string | null;
  voterFnameL1: string;
  voterFnameL2: string | null;
  voterLnameL1: string | null;
  voterLnameL2: string | null;
  rlnType: string;
  rlnFnameEn: string;
  rlnLnameEn: string | null;
  rlnFnameL1: string;
  rlnFnameL2: string | null;
  rlnLnameL1: string | null;
  rlnLnameL2: string | null;
  gender: string;
  sectionNameEn: string;
  sectionNameL1: string;
  sectionNameL2: string | null;
  fullAddress: string;
  partNameEn: string;
  partNameL1: string;
  partNameL2: string | null;
  pincode: string | null;
  partLati: number;
  partLong: number;
  age: number;
  dob: string;
  mobileNo: string | null;
  whatsappNo: string | null;
  voterLati: number;
  voterLongi: number;
  acNo: string;
  acNameEn: string;
  acNameL1: string | null;
  acNameL2: string | null;
  availability: string | null;
  partyAffiliation: string | null;
  starNumber: string | null;
  aadhaarNumber: string | null;
  panNumber: string | null;
  partyRegistrationNumber: string | null;
  dynamicFields: any;
  familyId: string;
  familyCount: number;
  friendId: string | null;
  friendCount: number;
  friendsDetails: any[];
  languages: any[];
  benefitSchemes: any[];
  scheme: any | null;
  // availability1: string | null;
  party: any | null;
  pageNumber: string | null;
  remarks: string | null;
  otp: string | null;
  otpCreatedAt: string | null;
  mobileVerified: boolean;
  aadhaarVerified: boolean;
  memberVerified: boolean;
  feedbackIssues: any[];
  voterHistories: any[];

  // Voting history item structure
  // Used in some endpoints to return array of voting history objects
  // Example: [{ id: 28, name: 'History 2', image: '...', orderIndex: 1 }, ...]
  votingHistoryItems?: VotingHistoryItem[];
  availability1: {
    id: number | null;
    description: string | null;
    availabilityImage: string | null;
    availabilityName: string | null;
    categoryName: string | null;
    orderIndex: number | null;
  };

  partManager: any | null;
  email: string | null;
  religion: any | null;
  caste: any | null;
  subCaste: any | null;
  photo_url: string | null;
  epic_number: string;
  video_url: string | null;
  casteCategory: any | null;
  created_by_user_id: number | null;
}

export interface VotingHistoryItem {
  id: number;
  name: string;
  image?: string | null;
  orderIndex?: number | null;
}

export interface FamilyMembersResponse {
  status: string;
  message: string;
  data: {
    familyId: string;
    currentPage: number;
    hasNext: boolean;
    hasPrevious: boolean;
    first: boolean;
    last: boolean;
    memberCount: number;
    members: FamilyMemberDetail[];
    pageSize: number;
    totalElements: number;
    totalMemberCount: number;
    totalPages: number;
  };
}
