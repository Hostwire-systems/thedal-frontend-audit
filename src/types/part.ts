export interface BoothCommitteeMember {
  name: string;
  designation: string;
  mobileNumber?: string;
}

export interface Part {
  id: number;
  partNo: string|number;
  partNameEnglish: string;
  partNameL1: string;
  schoolName: string;
  partLat: number;
  partLong: number;
  pincode: string;
  boothCommitteeMembers?: BoothCommitteeMember[];
}
