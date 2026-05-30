import { RcFile } from "antd/es/upload";

export interface SignupFormValues {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  password: string;
  roleID: number;
  profilePhoto: RcFile;
  fullName: string;
  emailid: string;
  organizationName: string;
  billingAddress: string;
  country: string;
  state: string;
  pincode: string;
  gst: string;
  subscription: string;
  mobileNumber: string;
}

export interface UserData {
  userId: number;
  fullName: string;
  email: string;
  alternateEmailId: string;
  mobileNumber: string;
  alternateMobileNumber:string;
  role: string;
  roleId: number;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  jwt: null;
  onBoardStatus: number;
}

export interface ProfileFormValues {
  age: number;
  gender: "male" | "female" | "other";
  address: string;
  mobileNumber: string;
  isWhatsAppNumber: boolean;
  religion: string;
  caste: string;
  subCaste: string;
}

export interface ProfileDetails {
  profilePic: string;
  firstName: string;
  lastName: string;
  emailid: string;
  mobile: string;
  organizationName: string;
  billingAddress: string;
  country: string;
  state: string;
  pincode: string;
  gst: string;
  subscription: string;
}

export interface Role {
  rolename: string;
  responsibility: string;
}

export interface CampaignSettings {
  smsKey: string;
  rcs: string;
  whatsapp: string;
  voiceCall: string;
}

export interface UserState {
  profileDetails: ProfileDetails;
  roles: Role[];
  campaignSettings: CampaignSettings;
}

export const initialState: UserState = {
  profileDetails: {
    profilePic: '',
    fullName: '',
    emailid: '',
    mobile: '',
    organizationName: '',
    billingAddress: '',
    country: '',
    state: '',
    pincode: '',
    gst: '',
    subscription: '',
  },
  roles: [],
  campaignSettings: {
    smsKey: '',
    rcs: '',
    whatsapp: '',
    voiceCall: '',
  },
};
