export interface Member {
  key: string;
  id: number;
  sNo: number;
  memberName: string | null;
  relationName: string | null;
  relationType: string | null;
  gender: string | null;
  dateOfBirth: string | null; // Format: "YYYY-MM-DD"
  age: number | null;
  occupation: string | null;
  education: string | null;
  fullAddress: string | null;
  mobileNumber: string | null;
  memberSinceYear: number | null;
  membershipNo: string | null;
  epicNumber: string | null;

  // Location fields
  stateNameEn: string | null;
  stateNameL1: string | null;
  stateNameL2: string | null;
  districtCode: string | null;
  districtNameEn: string | null;
  districtNameL1: string | null;
  districtNameL2: string | null;
  pcNo: string | null;
  pcNameEn: string | null;
  pcNameL1: string | null;
  pcNameL2: string | null;
  acNo: string | null;
  acNameEn: string | null;
  acNameL1: string | null;
  acNameL2: string | null;
  urbanNo: string | null;
  urbanNameEn: string | null;
  urbanNameL1: string | null;
  urbanWardNo: string | null;
  rurDistrictUnionNo: string | null;
  rurDistrictUnionNameEn: string | null;
  rurDistrictUnionNameL1: string | null;
  rurDistrictUnionNameL2: string | null;
  rurDistrictUnionWardNo: string | null;
  panUnionNo: string | null;
  panUnionNameEn: string | null;
  panUnionNameL1: string | null;
  panUnionNameL2: string | null;
  panUnionWardNo: string | null;
  villPanNo: string | null;
  villPanNameEn: string | null;
  villPanNameL1: string | null;
  villPanWardNo: string | null;
}